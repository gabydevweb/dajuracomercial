// Explicitly run against the configured Supabase project. All fixtures are removed in finally.
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const token=process.env.SUPABASE_ACCESS_TOKEN, ref=process.env.SUPABASE_PROJECT_REF;
if(!token||!ref)throw new Error('Faltan las variables privadas de administración.');
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
const response=await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`,{headers});
if(!response.ok)throw new Error(`Management HTTP ${response.status}`);
const keys=await response.json(),url=`https://${ref}.supabase.co`;
const options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(url,keys.find(k=>k.name==='service_role').api_key,options);
const publicKey=keys.find(k=>k.name==='anon').api_key;
const admin=createClient(url,publicKey,options),customer=createClient(url,publicKey,options),other=createClient(url,publicKey,options),anonymous=createClient(url,publicKey,options);
const access=await readFile('.local/ACCESO-ADMIN.txt','utf8');
const email=access.match(/^Correo: (.+)$/m)?.[1],password=access.match(/^Contraseña inicial: (.+)$/m)?.[1];
const check=(result)=>{if(result.error)throw new Error(result.error.message);return result.data;};
const tag=randomUUID(),userIds=[],storageFiles=[];let productId,orderId;
try {
 check(await admin.auth.signInWithPassword({email,password}));
 assert.equal(check(await admin.from('profiles').select('role').eq('id',(await admin.auth.getUser()).data.user.id).single()).role,'admin');
 for(const client of [customer,other]){
  const mail=`dajura-check-${randomUUID()}@example.com`,pass=randomBytes(24).toString('base64url')+'!7aA';
  const created=check(await service.auth.admin.createUser({email:mail,password:pass,email_confirm:true,user_metadata:{full_name:'Verificación temporal'}}));
  userIds.push(created.user.id);check(await client.auth.signInWithPassword({email:mail,password:pass}));
 }
 const photo=`verification/${tag}.jpeg`;
 check(await admin.storage.from('product-images').upload(photo,await readFile('public/logo.jpeg'),{contentType:'image/jpeg'}));storageFiles.push(['product-images',photo]);
 const photoUrl=admin.storage.from('product-images').getPublicUrl(photo).data.publicUrl;
 assert.equal((await fetch(photoUrl)).status,200);
 productId=check(await admin.from('products').insert({name:'Verificación temporal — no comprar',sku:`VERIFY-${tag}`,category:'Hogar',description:'Prueba técnica que se elimina al terminar.',price:2000,stock:5,image_url:photoUrl,active:false,featured:false}).select('id').single()).id;
 check(await admin.from('products').update({price:1999,stock:4}).eq('id',productId));
 assert.equal(check(await anonymous.from('products').select('id').eq('id',productId)).length,0);
 check(await admin.from('products').update({active:true}).eq('id',productId));
 assert.equal(check(await anonymous.from('products').select('price,stock').eq('id',productId).single()).stock,4);
 await customer.from('products').update({price:1}).eq('id',productId);
 assert.equal(check(await admin.from('products').select('price').eq('id',productId).single()).price,1999);
 assert.ok((await customer.rpc('set_user_role',{p_user_id:userIds[0],p_role:'admin'})).error);
 console.log('PASS: acceso administrador, crear artículo, subir foto, modificar precio/stock, publicar/ocultar y permisos.');

 // Test create_order and stock against real PostgreSQL without committing fictional bank data.
 const query=`begin;
 update public.store_settings set bank_name='VERIFICACION NO PUBLICA',bank_account='TEST' where id=1;
 select set_config('request.jwt.claim.sub','${userIds[0]}',true);
 select public.create_order('[{"product_id":"${productId}","quantity":1}]'::jsonb,'Cliente de prueba','8095550000','Retiro en tienda','','pickup',1999,'${randomUUID()}'::uuid);
 do $$ begin if (select stock from public.products where id='${productId}')<>3 then raise exception 'Stock incorrecto'; end if; end $$;
 rollback;`;
 const sqlResponse=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers,body:JSON.stringify({query})});
 if(!sqlResponse.ok)throw new Error(`SQL verificación: ${await sqlResponse.text()}`);
 assert.equal(check(await admin.from('products').select('stock').eq('id',productId).single()).stock,4);
 console.log('PASS: creación de pedido y reserva de stock en PostgreSQL real; transacción revertida.');

 orderId=check(await service.from('orders').insert({user_id:userIds[0],customer_name:'Verificación temporal',phone:'8095550000',address:'Prueba técnica',notes:'Registro temporal eliminado al finalizar',delivery_method:'delivery',total:1999,shipping_fee:0,items:[{product_id:productId,name:'Verificación temporal',price:1999,quantity:1,image_url:photoUrl}],request_id:randomUUID()}).select('id').single()).id;
 assert.equal(check(await other.from('orders').select('id').eq('id',orderId)).length,0);
 const receipt=`${userIds[0]}/${orderId}/${tag}.jpeg`;
 check(await customer.storage.from('receipts').upload(receipt,await readFile('public/logo.jpeg'),{contentType:'image/jpeg'}));storageFiles.push(['receipts',receipt]);
 assert.ok((await other.storage.from('receipts').download(receipt)).error);
 assert.ok((await anonymous.storage.from('receipts').download(receipt)).error);
 check(await customer.rpc('submit_receipt',{p_order_id:orderId,p_receipt_path:receipt}));
 assert.ok((await customer.rpc('transition_order',{p_order_id:orderId,p_status:'confirmed',p_note:''})).error);
 assert.ok((await admin.rpc('transition_order',{p_order_id:orderId,p_status:'shipped',p_note:'Envío sin pago'})).error);
 const signed=check(await admin.storage.from('receipts').createSignedUrl(receipt,60));
 assert.equal((await fetch(signed.signedUrl)).status,200);
 check(await admin.rpc('transition_order',{p_order_id:orderId,p_status:'confirmed',p_note:'Verificación técnica'}));
 check(await admin.rpc('transition_order',{p_order_id:orderId,p_status:'shipped',p_note:'Prueba técnica de envío'}));
 check(await admin.rpc('transition_order',{p_order_id:orderId,p_status:'delivered',p_note:'Prueba técnica de entrega'}));
 assert.equal(check(await customer.from('orders').select('status').eq('id',orderId).single()).status,'delivered');
 console.log('PASS: comprobante privado, aislamiento entre clientes, revisión, confirmación, envío y entrega.');
} finally {
 for(const [bucket,path] of storageFiles)check(await service.storage.from(bucket).remove([path]));
 if(orderId){check(await service.from('order_events').delete().eq('order_id',orderId));check(await service.from('orders').delete().eq('id',orderId));}
 if(productId)check(await service.from('products').delete().eq('id',productId));
 for(const id of userIds)check(await service.auth.admin.deleteUser(id));
 await Promise.all([admin.auth.signOut(),customer.auth.signOut(),other.auth.signOut()]);
 console.log('Limpieza completada: no quedan artículos, pedidos, archivos ni clientes de prueba.');
}
