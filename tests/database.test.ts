import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  describe,
  it,
  expect,
} from "vitest";
const admin = "00000000-0000-4000-8000-000000000001",
  customer = "00000000-0000-4000-8000-000000000002",
  other = "00000000-0000-4000-8000-000000000003",
  product = "00000000-0000-4000-8000-000000000010";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,delete on storage.objects to authenticated;
 `);
  await db.exec(readFileSync("supabase/migrations/001_store.sql", "utf8"));
  await db.exec(
    `insert into auth.users(id) values('${admin}'),('${customer}'),('${other}');update public.profiles set role='admin' where id='${admin}';update public.store_settings set bank_name='Banco prueba',bank_account='123456',delivery_enabled=true,shipping_fee=100;insert into public.products(id,name,sku,category,price,stock,image_url) values('${product}','Nevera de prueba','TEST','Electrodomésticos',1000,5,'/products/fridge.svg');`,
  );
});
beforeEach(async () => {
  await db.exec("begin");
  await asUser(customer);
});
afterEach(async () => {
  await db.exec("rollback; reset role;");
});
afterAll(async () => {
  await db.close();
});
async function asUser(id: string, role = "authenticated") {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false)`,
  );
}
async function order(
  opts: {
    qty?: number;
    total?: number;
    method?: string;
    request?: string;
  } = {},
) {
  const { rows } = await db.query<{ id: string }>(
    `select public.create_order($1::jsonb,'Cliente de prueba','8095550000','Dirección de prueba','',$2,$3,$4::uuid) as id`,
    [
      JSON.stringify([{ product_id: product, quantity: opts.qty ?? 2 }]),
      opts.method ?? "pickup",
      opts.total ?? 2000,
      opts.request ?? crypto.randomUUID(),
    ],
  );
  return rows[0].id;
}
async function rejectSQL(fn: () => Promise<unknown>, pattern: RegExp) {
  await db.exec("savepoint failure");
  let error: unknown;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  await db.exec("rollback to savepoint failure");
  expect(String(error)).toMatch(pattern);
}
async function stock() {
  return (
    await db.query<{ stock: number }>(
      "select stock from public.products where id=$1",
      [product],
    )
  ).rows[0].stock;
}
describe("Pedidos, permisos e inventario", () => {
  it("calcula precios en servidor y reserva stock", async () => {
    const id = await order();
    expect(await stock()).toBe(3);
    const row = (
      await db.query<any>("select * from public.orders where id=$1", [id])
    ).rows[0];
    expect(Number(row.total)).toBe(2000);
    expect(row.status).toBe("pending_payment");
    expect(row.items[0].price).toBe(1000);
  });
  it("rechaza totales manipulados y revierte la reserva", async () => {
    await rejectSQL(() => order({ total: 1 }), /precio o la entrega cambió/);
    expect(await stock()).toBe(5);
  });
  it("impide vender más unidades de las disponibles", async () => {
    await rejectSQL(() => order({ qty: 6, total: 6000 }), /Stock insuficiente/);
    expect(await stock()).toBe(5);
  });
  it("repetir la misma solicitud no duplica el pedido ni el descuento", async () => {
    const request = crypto.randomUUID();
    expect(await order({ request })).toBe(await order({ request }));
    expect(await stock()).toBe(3);
  });
  it("añade la entrega desde configuración del servidor", async () => {
    const id = await order({ method: "delivery", total: 2100 });
    const row = (
      await db.query<any>(
        "select total,shipping_fee from public.orders where id=$1",
        [id],
      )
    ).rows[0];
    expect(Number(row.total)).toBe(2100);
    expect(Number(row.shipping_fee)).toBe(100);
  });
  it("un cliente no puede aprobar su pago o elevar su rol", async () => {
    const id = await order();
    await rejectSQL(
      () => db.query("select public.transition_order($1,'confirmed','')", [id]),
      /Solo administradores/,
    );
    await rejectSQL(
      () => db.query("select public.set_user_role($1,'admin')", [customer]),
      /Solo administradores/,
    );
    await rejectSQL(
      () => db.exec("update public.profiles set role='admin'"),
      /permission denied/,
    );
    await rejectSQL(
      () => db.exec("update public.orders set status='confirmed'"),
      /permission denied/,
    );
  });
  it("aísla los pedidos y perfiles de otros clientes con RLS", async () => {
    await order();
    await asUser(other);
    expect((await db.query("select * from public.orders")).rows).toHaveLength(
      0,
    );
    const rows = (await db.query<any>("select * from public.profiles")).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(other);
  });
  it("prohíbe el envío antes de confirmar el dinero", async () => {
    const id = await order();
    await asUser(admin);
    await rejectSQL(
      () =>
        db.query(
          "select public.transition_order($1,'shipped','Mensajero local')",
          [id],
        ),
      /Cambio de estado no permitido/,
    );
  });
  it("permite confirmar, enviar y entregar con auditoría", async () => {
    const id = await order({ method: "delivery", total: 2100 });
    await asUser(admin);
    await db.query(
      "select public.transition_order($1,'confirmed','Abono verificado')",
      [id],
    );
    await db.query(
      "select public.transition_order($1,'shipped','Mensajería ABC 123')",
      [id],
    );
    await db.query(
      "select public.transition_order($1,'delivered','Recibido por cliente')",
      [id],
    );
    const row = (
      await db.query<any>("select * from public.orders where id=$1", [id])
    ).rows[0];
    expect(row.status).toBe("delivered");
    expect(row.payment_confirmed_at).toBeTruthy();
    expect(row.payment_confirmed_by).toBe(admin);
    expect(
      (await db.query("select * from public.order_events")).rows,
    ).toHaveLength(4);
  });
  it("restaura inventario una sola vez al cancelar", async () => {
    const id = await order();
    await asUser(admin);
    await db.query(
      "select public.transition_order($1,'cancelled','Solicitado por cliente')",
      [id],
    );
    expect(await stock()).toBe(5);
    await rejectSQL(
      () =>
        db.query("select public.transition_order($1,'cancelled','Otra vez')", [
          id,
        ]),
      /Cambio de estado no permitido/,
    );
    expect(await stock()).toBe(5);
  });
  it("solo permite retirar en tienda después de confirmar", async () => {
    const id = await order();
    await asUser(admin);
    await db.query("select public.transition_order($1,'confirmed','')", [id]);
    await db.query(
      "select public.transition_order($1,'delivered','Retirado')",
      [id],
    );
    expect(
      (
        await db.query<any>("select status from public.orders where id=$1", [
          id,
        ])
      ).rows[0].status,
    ).toBe("delivered");
  });
  it("valida ruta y existencia del comprobante y bloquea su borrado posterior", async () => {
    const id = await order(),
      path = customer + "/" + id + "/prueba.pdf";
    await rejectSQL(
      () =>
        db.query("select public.submit_receipt($1,$2)", [
          id,
          other + "/" + id + "/otro.pdf",
        ]),
      /Comprobante no válido/,
    );
    await rejectSQL(
      () => db.query("select public.submit_receipt($1,$2)", [id, path]),
      /No encontramos/,
    );
    await db.query(
      "insert into storage.objects(bucket_id,name) values('receipts',$1)",
      [path],
    );
    await db.query("select public.submit_receipt($1,$2)", [id, path]);
    expect(
      (
        await db.query<any>("select status from public.orders where id=$1", [
          id,
        ])
      ).rows[0].status,
    ).toBe("payment_review");
    await db.query("delete from storage.objects where name=$1", [path]);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      1,
    );
    await asUser(other);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      0,
    );
  });
  it("el público no puede ejecutar funciones de compra", async () => {
    await asUser("", "anon");
    await rejectSQL(() => order(), /permission denied/);
  });
  it("rechaza cantidades negativas y métodos de entrega desconocidos", async () => {
    await rejectSQL(
      () => order({ qty: -1, total: -1000 }),
      /Cantidad no válida/,
    );
    await rejectSQL(
      () => order({ method: "hack" }),
      /Método de entrega no válido/,
    );
    expect(await stock()).toBe(5);
  });
  it("un cliente no puede cambiar productos", async () => {
    await db.exec("update public.products set price=1");
    expect(
      Number(
        (await db.query<any>("select price from public.products")).rows[0]
          .price,
      ),
    ).toBe(1000);
  });
});
