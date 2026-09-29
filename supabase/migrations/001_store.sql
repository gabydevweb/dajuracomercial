-- Dajura Comercial: ejecutar una vez en el SQL Editor de un proyecto Supabase nuevo.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text not null default '',
 role text not null default 'customer' check(role in ('customer','admin')),
 created_at timestamptz not null default now()
);
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,phone) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),120),left(coalesce(new.raw_user_meta_data->>'phone',''),25));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 160),
 sku text not null unique, category text not null check(category in ('Electrodomésticos','Cocina','Hogar','Tecnología')),
 description text not null default '', price numeric(12,2) not null check(price>0),
 old_price numeric(12,2) check(old_price>=price), stock integer not null default 0 check(stock>=0),
 image_url text not null check(image_url ~ '^(https://|/)'), badge text not null default '',
 active boolean not null default true, featured boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.store_settings (
 id integer primary key check(id=1), bank_name text not null default '', bank_account text not null default '',
 bank_holder text not null default 'Dajura Comercial', account_type text not null default 'Corriente',
 shipping_fee numeric(12,2) not null default 0 check(shipping_fee>=0), delivery_enabled boolean not null default false,
 payment_instructions text not null default 'Incluye el número del pedido en la referencia. Verificaremos el abono antes de preparar tu compra.'
);
insert into public.store_settings(id) values(1);
create table public.orders (
 id uuid primary key default gen_random_uuid(), number bigint generated always as identity(start with 1001) unique,
 user_id uuid not null references public.profiles(id), customer_name text not null, phone text not null,
 address text not null, notes text not null default '', delivery_method text not null check(delivery_method in ('pickup','delivery')),
 total numeric(12,2) not null check(total>0), shipping_fee numeric(12,2) not null default 0,
 status text not null default 'pending_payment' check(status in ('pending_payment','payment_review','confirmed','shipped','delivered','cancelled')),
 items jsonb not null, receipt_path text, payment_confirmed_at timestamptz, payment_confirmed_by uuid references public.profiles(id),
 tracking text, cancellation_reason text, request_id uuid not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,request_id)
);
create index orders_user_created on public.orders(user_id,created_at desc);
create index orders_status on public.orders(status);
create table public.order_events (
 id bigint generated always as identity primary key, order_id uuid not null references public.orders(id),
 actor_id uuid not null references public.profiles(id), status text not null, note text not null default '', created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy product_read on public.products for select to anon,authenticated using(active or public.is_admin());
create policy product_admin on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy settings_read on public.store_settings for select to anon,authenticated using(true);
create policy settings_admin on public.store_settings for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy order_read on public.orders for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy event_read on public.order_events for select to authenticated using(public.is_admin() or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
-- No escritura directa de pedidos, roles o eventos desde el navegador.
revoke all on public.profiles, public.products, public.store_settings, public.orders, public.order_events from anon,authenticated;
grant select on public.products,public.store_settings to anon,authenticated;
grant select on public.profiles,public.orders,public.order_events to authenticated;
grant insert,update on public.products to authenticated;
grant update on public.store_settings to authenticated;

create function public.create_order(p_items jsonb,p_customer_name text,p_phone text,p_address text,p_notes text,p_delivery_method text,p_expected_total numeric,p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_settings public.store_settings; v_product public.products; v_item record; v_items jsonb='[]'; v_total numeric=0; v_shipping numeric=0; v_id uuid; v_count int;
begin
 if auth.uid() is null then raise exception 'Inicia sesión para crear un pedido.'; end if;
 if p_request_id is null then raise exception 'Falta la referencia de solicitud.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_request_id::text,0));
 select id into v_id from public.orders where user_id=auth.uid() and request_id=p_request_id;
 if v_id is not null then return v_id; end if;
 if p_customer_name is null or length(trim(p_customer_name)) not between 3 and 120 or p_phone is null or length(p_phone) not between 10 and 25 then raise exception 'Revisa tu nombre y teléfono.'; end if;
 if p_address is null or length(trim(p_address)) not between 5 and 500 or length(coalesce(p_notes,''))>1000 then raise exception 'Revisa la dirección y las notas.'; end if;
 if p_delivery_method is null or p_delivery_method not in ('pickup','delivery') then raise exception 'Método de entrega no válido.'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'El carrito no es válido.'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'El carrito debe tener entre 1 y 100 productos.'; end if;
 if exists(select 1 from jsonb_array_elements(p_items) x where (x->>'quantity') is null or (x->>'quantity') !~ '^[1-9][0-9]{0,2}$' or (x->>'product_id') is null) then raise exception 'Cantidad no válida.'; end if;
 select count(distinct x->>'product_id') into v_count from jsonb_array_elements(p_items) x;
 if v_count<>jsonb_array_length(p_items) then raise exception 'Productos duplicados en el carrito.'; end if;
 select * into v_settings from public.store_settings where id=1;
 if coalesce(v_settings.bank_account,'')='' or coalesce(v_settings.bank_name,'')='' then raise exception 'La tienda todavía no ha configurado las transferencias.'; end if;
 if p_delivery_method='delivery' then
  if not v_settings.delivery_enabled then raise exception 'La entrega a domicilio no está disponible.'; end if;
  v_shipping=v_settings.shipping_fee;
 end if;
 -- Orden fijo de bloqueos para evitar deadlocks en compras concurrentes.
 for v_item in select (x->>'product_id')::uuid as product_id,(x->>'quantity')::int as quantity from jsonb_array_elements(p_items) x order by (x->>'product_id')::uuid loop
  select * into v_product from public.products where id=v_item.product_id for update;
  if not found or not v_product.active then raise exception 'Uno de los productos ya no está disponible.'; end if;
  if v_product.stock<v_item.quantity then raise exception 'Stock insuficiente para %. Actualiza tu carrito.',v_product.name; end if;
  v_total=v_total+v_product.price*v_item.quantity;
  v_items=v_items||jsonb_build_array(jsonb_build_object('product_id',v_product.id,'name',v_product.name,'price',v_product.price,'quantity',v_item.quantity,'image_url',v_product.image_url));
  update public.products set stock=stock-v_item.quantity where id=v_product.id;
 end loop;
 v_total=v_total+v_shipping;
 if p_expected_total is null or v_total<>p_expected_total then raise exception 'El precio o la entrega cambió. Actualiza el carrito antes de continuar.'; end if;
 insert into public.orders(user_id,customer_name,phone,address,notes,delivery_method,total,shipping_fee,items,request_id)
 values(auth.uid(),trim(p_customer_name),p_phone,p_address,coalesce(p_notes,''),p_delivery_method,v_total,v_shipping,v_items,p_request_id) returning id into v_id;
 insert into public.order_events(order_id,actor_id,status,note) values(v_id,auth.uid(),'pending_payment','Pedido creado; stock reservado.');
 return v_id;
end; $$;

create function public.submit_receipt(p_order_id uuid,p_receipt_path text) returns void language plpgsql security definer set search_path='' as $$
declare v_order public.orders;
begin
 select * into v_order from public.orders where id=p_order_id for update;
 if auth.uid() is null or v_order.user_id is distinct from auth.uid() then raise exception 'Pedido no disponible.'; end if;
 if v_order.status<>'pending_payment' then raise exception 'Este pedido ya no acepta comprobantes.'; end if;
 if p_receipt_path is null or split_part(p_receipt_path,'/',1)<>auth.uid()::text or split_part(p_receipt_path,'/',2)<>p_order_id::text then raise exception 'Comprobante no válido.'; end if;
 if not exists(select 1 from storage.objects where bucket_id='receipts' and name=p_receipt_path) then raise exception 'No encontramos el comprobante.'; end if;
 update public.orders set receipt_path=p_receipt_path,status='payment_review',updated_at=now() where id=p_order_id;
 insert into public.order_events(order_id,actor_id,status,note) values(p_order_id,auth.uid(),'payment_review','Comprobante recibido.');
end; $$;

create function public.transition_order(p_order_id uuid,p_status text,p_note text default '') returns void language plpgsql security definer set search_path='' as $$
declare v_order public.orders; v_item record;
begin
 if not public.is_admin() then raise exception 'Solo administradores.'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 if p_status is null or not (
 (v_order.status in ('pending_payment','payment_review') and p_status in ('confirmed','cancelled')) or
 (v_order.status='confirmed' and (p_status in ('shipped','cancelled') or (p_status='delivered' and v_order.delivery_method='pickup'))) or
 (v_order.status='shipped' and p_status='delivered')
 ) then raise exception 'Cambio de estado no permitido.'; end if;
 if p_status in ('shipped','delivered') and v_order.payment_confirmed_at is null then raise exception 'Primero verifica y confirma el pago recibido.'; end if;
 if p_status in ('shipped','cancelled') and length(trim(coalesce(p_note,'')))<3 then raise exception 'Incluye los datos de envío o el motivo de cancelación.'; end if;
 if length(coalesce(p_note,''))>1000 then raise exception 'La nota es demasiado larga.'; end if;
 if p_status='cancelled' then
  for v_item in select (x->>'product_id')::uuid as product_id,(x->>'quantity')::int as quantity from jsonb_array_elements(v_order.items) x order by (x->>'product_id')::uuid loop
   update public.products set stock=stock+v_item.quantity where id=v_item.product_id;
  end loop;
 end if;
 update public.orders set status=p_status,updated_at=now(),
 payment_confirmed_at=case when p_status='confirmed' then now() else payment_confirmed_at end,
 payment_confirmed_by=case when p_status='confirmed' then auth.uid() else payment_confirmed_by end,
 tracking=case when p_status='shipped' then p_note else tracking end,
 cancellation_reason=case when p_status='cancelled' then p_note else cancellation_reason end where id=p_order_id;
 insert into public.order_events(order_id,actor_id,status,note) values(p_order_id,auth.uid(),p_status,coalesce(p_note,''));
end; $$;

create function public.set_user_role(p_user_id uuid,p_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Solo administradores.'; end if;
 if p_user_id=auth.uid() then raise exception 'No puedes cambiar tus propios permisos.'; end if;
 if p_role is null or p_role not in ('admin','customer') then raise exception 'Rol no válido.'; end if;
 update public.profiles set role=p_role where id=p_user_id;
 if not found then raise exception 'Usuario no encontrado.'; end if;
end; $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('receipts','receipts',false,5242880,array['image/jpeg','image/png','application/pdf']),
 ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy receipt_upload on storage.objects for insert to authenticated with check(
 bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text and exists(
 select 1 from public.orders where id::text=(storage.foldername(name))[2] and user_id=auth.uid() and status='pending_payment'));
create policy receipt_read on storage.objects for select to authenticated using(bucket_id='receipts' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy receipt_cleanup on storage.objects for delete to authenticated using(bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text and not exists(select 1 from public.orders where receipt_path=name));
create policy product_image_read on storage.objects for select to anon,authenticated using(bucket_id='product-images');
create policy product_image_admin on storage.objects for all to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());

-- PostgreSQL concede EXECUTE a PUBLIC por defecto: retirarlo explícitamente.
revoke execute on function public.handle_new_user() from public,anon,authenticated;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
revoke execute on function public.create_order(jsonb,text,text,text,text,text,numeric,uuid) from public,anon;
revoke execute on function public.submit_receipt(uuid,text) from public,anon;
revoke execute on function public.transition_order(uuid,text,text) from public,anon;
revoke execute on function public.set_user_role(uuid,text) from public,anon;
grant execute on function public.create_order(jsonb,text,text,text,text,text,numeric,uuid),public.submit_receipt(uuid,text),public.transition_order(uuid,text,text),public.set_user_role(uuid,text) to authenticated;
commit;
