// Explicit integration audit. Only named temporary fixtures are changed/removed.
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
const baseURL = process.env.DAJURA_BASE_URL || 'http://127.0.0.1:5173';
if (!ref || !token || !process.env.DAJURA_ADMIN_PASSWORD) throw new Error('Faltan las variables privadas de auditoría.');
const headers = {Authorization: `Bearer ${token}`};
const authResponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {headers});
if (!authResponse.ok || !(await authResponse.json()).mailer_autoconfirm) throw new Error('Esta prueba de registro requiere autoconfirmación para no enviar correos de prueba.');
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {headers});
if (!response.ok) throw new Error(`Management HTTP ${response.status}`);
const keys = await response.json();
const options = {auth:{persistSession:false,autoRefreshToken:false}};
const service = createClient(`https://${ref}.supabase.co`, keys.find(k=>k.name==='service_role').api_key, options);
const customer = createClient(`https://${ref}.supabase.co`, keys.find(k=>k.name==='anon').api_key, options);
const check = result => { if (result.error) throw result.error; return result.data; };
const tag = randomUUID(), email = `audit-${tag}@example.com`, password = randomBytes(24).toString('base64url')+'!1aA';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let userId, orderId, receiptPath, productId;
try {
  await page.goto(baseURL+'/cuenta');
  await page.getByRole('button',{name:'Regístrate',exact:true}).click();
  await page.getByLabel('Nombre completo').fill('Auditoría temporal');
  await page.getByLabel('Teléfono',{exact:true}).fill('8095550000');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña',{exact:true}).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Crear mi cuenta'}).click();
  await page.getByRole('button',{name:'Cerrar sesión'}).waitFor();
  userId=check(await customer.auth.signInWithPassword({email,password})).user.id;
  const profile=check(await customer.from('profiles').select('role,full_name').eq('id',userId).single());
  assert.equal(profile.role,'customer');assert.equal(profile.full_name,'Auditoría temporal');
  await page.goto(baseURL+'/admin');
  await page.getByRole('heading',{name:'Este espacio es del equipo Dajura'}).waitFor();
  await page.goto(baseURL+'/cuenta');
  await page.getByRole('button',{name:'Cambiar mi contraseña'}).click();
  await page.getByLabel('Contraseña',{exact:true}).fill(password+'2');
  await page.getByRole('button',{name:'Guardar contraseña'}).click();
  await page.getByRole('button',{name:'Cerrar sesión'}).waitFor();
  check(await customer.auth.signInWithPassword({email,password:password+'2'}));
  console.log('PASS: registro real desde móvil, perfil de cliente, bloqueo de /admin y cambio de contraseña.');

  productId=check(await service.from('products').insert({name:'AUDITORÍA TEMPORAL — no comprar',sku:'AUDIT-'+tag,category:'Hogar',description:'Se elimina al terminar la auditoría.',price:10.1,stock:4,image_url:'/logo.jpeg',active:true,featured:false}).select('id').single()).id;
  await page.goto(baseURL+'/producto/'+productId);
  await page.getByRole('button',{name:'Aumentar cantidad'}).click();
  await page.getByRole('button',{name:'Aumentar cantidad'}).click();
  await page.getByRole('button',{name:'Agregar al carrito',exact:true}).click();
  await page.getByRole('link',{name:'Carrito, 3 artículos'}).click();
  assert.ok((await page.locator('.summary-total').innerText()).includes('30.30'));
  await page.reload();
  await page.getByRole('link',{name:'Continuar con mi pedido'}).click();
  await page.getByRole('heading',{name:'Estamos preparando las compras online'}).waitFor();
  check(await service.from('products').update({active:false}).eq('id',productId));
  console.log('PASS: producto real, carrito persistente con cantidades y centavos, bloqueo de checkout sin cuenta bancaria.');

  // Isolated order fixture: no real payment and no invented public bank settings.
  const order=check(await service.from('orders').insert({user_id:userId,customer_name:'Auditoría temporal',phone:'8095550000',address:'Retiro en tienda',notes:'AUDITORÍA TEMPORAL: no procesar',delivery_method:'pickup',total:30.3,shipping_fee:0,items:[{product_id:randomUUID(),name:'Prueba temporal',price:10.1,quantity:3,image_url:'/logo.jpeg'}],request_id:randomUUID()}).select('id,number').single());
  orderId=order.id;
  await page.goto(baseURL+'/pedidos/'+orderId);
  await page.getByRole('heading',{name:'Pedido #'+order.number,exact:true}).waitFor();
  await page.getByLabel('Sube tu comprobante').setInputFiles('public/logo.jpeg');
  await page.getByRole('button',{name:'Enviar comprobante',exact:true}).click();
  await page.getByText('Comprobante enviado para revisión.',{exact:true}).waitFor();
  const stored=check(await service.from('orders').select('status,receipt_path').eq('id',orderId).single());
  receiptPath=stored.receipt_path;assert.equal(stored.status,'payment_review');
  assert.ok((await page.locator('.summary-total').innerText()).includes('30.30'));
  console.log('PASS: detalle con centavos exactos y carga de comprobante real desde móvil.');

  const admin=await browser.newPage({viewport:{width:1440,height:1000}});
  admin.on('pageerror',e=>errors.push(e.message));
  await admin.goto(baseURL+'/cuenta');
  await admin.getByLabel('Correo electrónico').fill(process.env.DAJURA_ADMIN_EMAIL);
  await admin.getByLabel('Contraseña',{exact:true}).fill(process.env.DAJURA_ADMIN_PASSWORD);
  await admin.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
  await admin.getByRole('link',{name:'Abrir dashboard'}).click();
  await admin.getByRole('button',{name:'Pedidos',exact:true}).click();
  await admin.getByRole('button',{name:'Ver pedido '+order.number}).click();
  const popupPromise=admin.waitForEvent('popup');
  await admin.getByRole('button',{name:'Ver comprobante privado'}).click();
  const popup=await popupPromise;
  await popup.waitForURL(/\/storage\/v1\/object\/sign\/receipts\//);
  await popup.close();
  await admin.getByRole('button',{name:'Confirmar abono recibido'}).click();
  await admin.getByRole('checkbox').check();
  await admin.getByRole('button',{name:'Confirmar cambio'}).click();
  await admin.getByRole('dialog').waitFor({state:'hidden'});
  await admin.getByRole('button',{name:'Ver pedido '+order.number}).click();
  await admin.getByRole('button',{name:'Registrar retiro'}).click();
  await admin.getByRole('button',{name:'Confirmar cambio'}).click();
  await admin.getByRole('dialog').waitFor({state:'hidden'});
  await page.reload();
  await page.locator('.status.delivered').waitFor();
  assert.equal(check(await customer.from('orders').select('status').eq('id',orderId).single()).status,'delivered');
  const downloadPromise=admin.waitForEvent('download');
  await admin.getByRole('button',{name:'Exportar',exact:true}).click();
  const download=await downloadPromise;
  assert.ok((await readFile(await download.path(),'utf8')).includes('30.3'));
  for(const width of [320,390,768,1440]) {
    await admin.setViewportSize({width,height:900});
    for(const tab of ['Vista general','Pedidos','Productos','Usuarios','Configuración']) {
      await admin.getByRole('button',{name:tab,exact:true}).click();
      assert.ok(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Admin overflow ${tab} at ${width}`);
    }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: comprobante visible para admin, confirmación de prueba, retiro y seguimiento del cliente; sin errores JavaScript.');
  console.log('PASS: exportación CSV y cinco secciones administrativas en cuatro anchos de pantalla.');
} finally {
  // Capture fixture IDs even if the browser failed immediately after a write.
  if (!userId) {
    const users=check(await service.auth.admin.listUsers({perPage:1000})).users;
    userId=users.find(u=>u.email===email)?.id;
  }
  if (orderId) {
    const data=check(await service.from('orders').select('receipt_path').eq('id',orderId).single());
    receiptPath ||= data.receipt_path;
    if(receiptPath)check(await service.storage.from('receipts').remove([receiptPath]));
    check(await service.from('order_events').delete().eq('order_id',orderId));
    check(await service.from('orders').delete().eq('id',orderId));
  }
  if(userId)check(await service.auth.admin.deleteUser(userId));
  if(productId)check(await service.from('products').delete().eq('id',productId));
  await customer.auth.signOut();
  await browser.close();
  console.log('Limpieza completada: cuenta, producto, pedido y comprobante temporales eliminados.');
}
