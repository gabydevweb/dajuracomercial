# Dajura Comercial

Tienda y administración en español, con React, TypeScript, Vite y Supabase, preparada para Vercel. Identidad azul y blanca basada en el logo proporcionado.

## Estado de la conexión

El proyecto Supabase **dajuracomercial** (`rkrzmgdsgiakqopyqpoy`) ya tiene aplicado el esquema, las políticas de seguridad, las funciones de venta y los buckets `product-images` y `receipts`. **No vuelvas a ejecutar la migración inicial en ese proyecto.**

- `.env.local` contiene la URL y la clave pública necesarias para el desarrollo local. Se excluye de Git.
- Dominio previsto: `https://dajuracomercial.com`; los enlaces de autenticación también permiten `www` y el entorno local.
- Existe una cuenta administradora con el correo empresarial proporcionado. Las credenciales iniciales se entregan únicamente en `.local/ACCESO-ADMIN.txt`, excluido de Git. Permite cambiar la contraseña desde Mi cuenta.
- Se verificaron contra Supabase real las fotos de productos, el alta y edición de artículos, precios, stock, visibilidad, privacidad de comprobantes y transición de pedidos. Todos los datos temporales se eliminaron.
- El catálogo real y la cuenta bancaria están vacíos a propósito: configúralos desde `/admin` antes de recibir ventas.
- Supabase conserva la confirmación de correo activada. **Falta un servicio SMTP propio** para enviar confirmaciones y recuperaciones a todos los clientes; no se ha simulado el envío de correos. El administrador inicial puede entrar y cambiar su contraseña sin depender del correo.
- La publicación web sigue pendiente de importar el repositorio en Vercel, añadir las dos variables públicas y asociar el dominio. Los enlaces del dominio ya están contemplados en Supabase.

El token de administración Supabase no se guarda en el proyecto ni se envía al navegador. Solo se necesita temporalmente para tareas de instalación. Las claves de servicio tampoco se guardan.

## Ver el proyecto

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. La tienda está en `/` y el panel en `/admin`.

Sin variables de Supabase se muestra una **demostración explícita**. El carrito, búsqueda, filtros y navegación funcionan; registro, pedidos y escrituras no simulan transacciones reales. El panel de muestra es público únicamente en este modo. Al configurar Supabase, el catálogo empieza vacío y el panel requiere una cuenta administradora.

## Activar Supabase

1. Crea un proyecto Supabase. Ejecuta **una sola vez**, en un proyecto nuevo, todo el archivo `supabase/migrations/001_store.sql` desde SQL Editor. Crea tablas, funciones de ventas, permisos, auditoría y dos buckets de archivos.
2. Copia `.env.example` a `.env.local`. Configura la URL del proyecto y su clave pública `anon` o publishable:

   ```dotenv
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICA
   ```

   **No uses una clave `service_role` ni una clave secreta en variables `VITE_`.** La aplicación no necesita esas claves.

3. En Supabase Authentication > URL Configuration, configura Site URL y Redirect URLs. Durante desarrollo permite `http://localhost:5173/cuenta`; en producción, `https://TU-DOMINIO/cuenta`. Activa confirmación de correo y configura SMTP propio para los mensajes de registro y recuperación.
4. Reinicia el servidor local. Crea tu cuenta en `/cuenta` y confirma el correo.
5. Asigna el primer administrador con SQL Editor, sustituyendo el correo:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (
     select id from auth.users
     where lower(email) = lower('CORREO-DEL-ADMINISTRADOR')
   );
   ```

   Cierra sesión y vuelve a entrar. No existe una contraseña predeterminada ni acceso oculto.

6. En `/admin` > Configuración, introduce banco, cuenta, titular, tipo de cuenta e instrucciones. El checkout permanece bloqueado hasta que exista una cuenta bancaria. El retiro en tienda no tiene costo; la entrega a domicilio es opcional y usa una tarifa fija configurable.
7. En Productos, carga fotografías reales, descripción, precios, stock y SKU. Marca los productos de portada como destacados. Para retirarlos de venta, desactiva «Visible en la tienda»: se conservan los pedidos históricos.
8. Los demás usuarios se registran en la tienda. Desde Usuarios, un administrador puede dar o retirar acceso administrativo a otras cuentas. No puede cambiar su propio rol desde el panel.

## Publicar en Vercel

1. Importa este proyecto desde tu repositorio en Vercel, o ejecuta `npx vercel` desde esta carpeta con tu cuenta autenticada.
2. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
3. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a las variables de entorno de Production y, si lo necesitas, Preview. Al cambiar variables vuelve a desplegar, ya que Vite las incorpora durante la compilación.
4. Publica y actualiza Site URL / Redirect URLs de Supabase con el dominio final. El archivo `vercel.json` incluye las rutas de la SPA y cabeceras básicas.
5. Verifica en el proyecto remoto un registro con confirmación de correo, creación de pedido, transferencia de prueba, carga de comprobante, aprobación administrativa y entrega.

Supabase ya está conectado. El despliegue web requiere acceso a la cuenta de Vercel. Para copiar las dos variables públicas a Vercel consulta `.env.local` en este equipo; no pegues el token `sbp_...` como variable del navegador.

## Flujo de venta

```text
Pendiente de pago → Pago en revisión → Pago confirmado → Enviado → Entregado
        └──────────────────────────→ Pago confirmado → Retirado en tienda
Pendiente / En revisión / Confirmado → Cancelado (devuelve inventario)
```

- Crear un pedido reserva stock en una transacción. El precio y envío se recalculan en PostgreSQL y se comparan con el total visto por el cliente.
- Las solicitudes repetidas con el mismo identificador no duplican el pedido.
- Subir un comprobante **no confirma el pago**. Solo un administrador, tras verificar el abono bancario, puede confirmarlo.
- No se permite enviar o entregar un pedido sin pago confirmado. Para entregar directamente desde «Confirmado», debe tratarse de un retiro en tienda.
- Los comprobantes son privados, admiten JPG/PNG/PDF hasta 5 MB y solo los consulta su propietario o un administrador. El administrador recibe un enlace que expira en 120 segundos.
- Toda transición genera un registro en `order_events`. Las cancelaciones devuelven stock una sola vez. Los reembolsos bancarios se coordinan manualmente; la aplicación no inicia transferencias.
- Los pedidos sin pagar no vencen automáticamente. El administrador debe revisarlos y cancelarlos cuando corresponda para liberar unidades.
- El panel incluye productos, stock, usuarios y roles, filtros de pedidos, exportación CSV, configuración bancaria y entrega.

## Pruebas y mantenimiento

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

- 15 pruebas de PostgreSQL mediante PGlite: precios, reservas, idempotencia, roles, RLS, comprobantes, cancelaciones y estados.
- Pruebas de navegador Chromium para carrito persistente, filtros, búsqueda, formularios, navegación, dashboard y móvil.
- PGlite usa esquemas `auth` y `storage` de prueba. No sustituye una verificación final contra Auth, Storage, SMTP y las políticas del proyecto Supabase remoto.
- `npm run format` mantiene el formato del código.
- Capturas de revisión visual en `screenshots/`.
- Las pruebas de navegador usan un servidor separado en el puerto 5174 con modo demo, de modo que no alteran la base real.
- `.github/workflows/verify.yml` ejecuta compilación, pruebas de PostgreSQL y navegador en GitHub.
- `scripts/verify-live.mjs` y `scripts/verify-admin-browser.mjs` son comprobaciones explícitas del proyecto remoto. Requieren variables de proceso `SUPABASE_ACCESS_TOKEN` y `SUPABASE_PROJECT_REF`, además del archivo privado de acceso. Crean recursos temporales y los eliminan al terminar. No se ejecutan automáticamente en CI.

## Decisiones y datos pendientes

- La carpeta original contenía únicamente el logo. Se eligió una presentación inicial para **hogar, cocina, electrodomésticos y tecnología**; las seis fichas, precios e ilustraciones SVG son ejemplos propios, sin marcas ni afirmaciones de inventario real. No se insertan en la base de datos de producción.
- Sustituir los ejemplos por el catálogo, fotografías y precios reales; configurar la cuenta bancaria y confirmar cobertura, garantía, condiciones y horarios operativos. No se inventaron datos bancarios ni horarios.
- Las páginas de privacidad y compras describen el funcionamiento implementado. El resumen del pedido no sustituye una factura fiscal; no se implementa emisión de NCF/e-CF ni integración fiscal.
- La entrega es coordinada manualmente. No hay integración con transportistas ni comprobación bancaria automática.
- La atención por WhatsApp abre una conversación; no envía mensajes automáticamente. Supabase gestiona los correos de autenticación; no se han añadido correos automáticos de pedidos.

## Estructura

- `src/Shop.tsx`: portada, catálogo y fichas.
- `src/Checkout.tsx`: carrito y creación de pedidos.
- `src/Account.tsx`: registro, acceso, recuperación y seguimiento.
- `src/Admin.tsx`: dashboard administrativo.
- `src/store.tsx`: sesión, catálogo y carrito.
- `src/Info.tsx`: contacto, nosotros e información de compra.
- `supabase/migrations/001_store.sql`: esquema, seguridad y lógica transaccional.
- `public/products/`: ilustraciones locales de demostración.

Documentación oficial utilizada: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control) y [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite).
