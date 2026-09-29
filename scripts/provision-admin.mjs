import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const email = process.env.DAJURA_ADMIN_EMAIL;
if (!token || !ref || !email) throw new Error('Faltan SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF o DAJURA_ADMIN_EMAIL.');
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, {headers:{Authorization:`Bearer ${token}`}});
if (!response.ok) throw new Error(`Management API HTTP ${response.status}`);
const keys = await response.json();
const serviceKey = keys.find(k=>k.name==='service_role')?.api_key;
if (!serviceKey) throw new Error('No se encontró una clave de servicio.');
const client = createClient(`https://${ref}.supabase.co`,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:existing,error:listError} = await client.auth.admin.listUsers({page:1,perPage:1000});
if (listError) throw listError;
let user = existing.users.find(u=>u.email?.toLowerCase()===email.toLowerCase());
if (user) {
  // Do not silently elevate or reset an existing account.
  const {data:profile,error}=await client.from('profiles').select('role').eq('id',user.id).single();
  if(error) throw error;
  if(profile.role!=='admin')throw new Error('La cuenta ya existe sin rol administrativo; requiere revisión.');
  console.log('La cuenta administradora ya existe. No se cambió su contraseña.');
} else {
  const password = randomBytes(24).toString('base64url')+'!7aA';
  const {data,error}=await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Administración Dajura',phone:'8299533756'}});
  if(error)throw error;
  user=data.user;
  const {error:roleError}=await client.from('profiles').update({role:'admin'}).eq('id',user.id);
  if(roleError)throw roleError;
  await mkdir('.local',{recursive:true});
  await writeFile('.local/ACCESO-ADMIN.txt',`DAJURA COMERCIAL — ACCESO PRIVADO\n\nURL local: http://localhost:5173/cuenta\nURL producción (cuando se publique): https://dajuracomercial.com/cuenta\nCorreo: ${email}\nContraseña inicial: ${password}\n\nDespués de entrar, usa «Cambiar mi contraseña» en Mi cuenta.\nPanel: /admin\nEste archivo se excluye de Git. No lo compartas ni lo subas al repositorio.\n`,'utf8');
  console.log('Cuenta administradora creada. Credenciales guardadas únicamente en .local/ACCESO-ADMIN.txt.');
}
