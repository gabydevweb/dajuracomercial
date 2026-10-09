# Auditoría de entrega — Dajura Comercial

Fecha de revisión: 9 de octubre de 2026. Dominio: https://dajuracomercial.com.

## Dictamen

**Aún no está lista para empezar a vender.** En el proyecto de producción hay **0 productos**, la cuenta bancaria está vacía y no hay SMTP propio. Tampoco está activada la confirmación del correo al registrarse. Las correcciones hechas durante esta auditoría están en el proyecto local, pero **no se han publicado** porque la sesión actual de Vercel solo tiene acceso al equipo BancaDG y no al proyecto Dajura. La tienda pública sigue funcionando con la versión publicada anteriormente.

## Recorridos verificados

- Compilación de producción, 19 pruebas de lógica y base de datos, 7 pruebas de navegador y auditoría de 12 rutas a 320, 390, 768, 1024 y 1440 px. Chromium y WebKit se usaron en las comprobaciones visuales. No hubo desbordamiento horizontal, imágenes rotas ni errores de JavaScript en los recorridos registrados.
- Sobre Supabase real se verificaron alta de cliente, acceso, cambio de contraseña, bloqueo del panel a clientes, creación y edición administrativa de un producto con foto, carrito persistente, subtotal con centavos, carga y privacidad del comprobante, revisión del pago, confirmación, retiro, seguimiento y exportación CSV. Se eliminaron las cuentas, productos, pedidos, comprobantes y eventos temporales al terminar.
- La función de pedido reserva stock, calcula precios y rechaza pedidos sin cuenta bancaria. El flujo de creación de un pedido real desde el checkout público sigue sin poder completarse hasta que el cliente configure banco y catálogo. Tampoco se realizó una transferencia bancaria de dinero ni se verificó la recepción de correos externos.
- `npm audit` no encontró vulnerabilidades conocidas en las dependencias al momento de la revisión. La compilación entregada al navegador contiene solo la clave pública de Supabase; no se detectaron claves de servicio ni el token privado.

## Correcciones preparadas

- El botón Buscar ahora funciona con clic; se corrigieron las categorías de la navegación y un solapamiento en tabletas.
- Los importes conservan centavos y el total del checkout se calcula sin errores de coma flotante.
- Una edición administrativa desactualizada no puede sobrescribir stock reservado después de abrir el formulario.
- El panel actualiza el pedido antes de permitir reabrirlo. La vista de comprobante abre una ventana de forma compatible con el bloqueo de ventanas emergentes.
- Se muestran fallos de conexión con opción de reintentar. El panel indica cuándo faltan productos y datos bancarios.
- La carga del catálogo y de los pedidos ya no se limita silenciosamente a las primeras 1.000 filas.
- Se prepararon `robots.txt`, `sitemap.xml`, cabeceras para no indexar cuenta y panel, y exclusiones de archivos privados en Vercel.
- Se separó el código del panel administrativo para reducir la descarga inicial de los compradores.

## Condiciones para entregar al cliente

1. Recuperar el acceso al proyecto Dajura en Vercel, publicar este proyecto y comprobar `https://dajuracomercial.com` tras el despliegue. Revisar además la conexión Git de Vercel, actualmente asociada a un repositorio distinto del remoto local.
2. Cargar los productos reales con fotos, SKU, precio, disponibilidad y descripción. Revisar en móvil y escritorio las fichas y el carrito con ese catálogo.
3. Configurar y confirmar con el cliente banco, titular, tipo y número de cuenta en **Administración → Configuración**. Definir cobertura y tarifa de entrega si habrá domicilio.
4. Configurar SMTP propio en Supabase, activar la confirmación de correo y probar registro y recuperación desde una dirección externa. El SMTP integrado de Supabase está destinado a pruebas y, según [su documentación](https://supabase.com/docs/guides/auth/auth-smtp), no entrega mensajes a direcciones fuera del equipo del proyecto.
5. Cambiar las contraseñas iniciales de las dos cuentas administradoras y sustituir el token de gestión de Supabase compartido durante el desarrollo antes de entregar el control al cliente.
6. Ejecutar un pedido controlado con los datos bancarios reales: pago, comprobante, conciliación manual del abono, entrega y gestión de una cancelación. Acordar con el cliente horarios, garantías, devoluciones y documentación fiscal correspondiente.

La prueba de un pedido real, el correo transaccional y la publicación final requieren los datos y accesos indicados. No se puede certificar que una web esté libre de todo error; este dictamen describe lo que se probó y lo que sigue pendiente.
