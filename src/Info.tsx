import { Link, useLocation } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  HeartHandshake,
  Store,
  CreditCard,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { Breadcrumb } from "./components";
import { whatsapp } from "./data";
export function Contact() {
  return (
    <main className="container page">
      <Breadcrumb items={["Contacto"]} />
      <div className="page-heading">
        <span className="eyebrow">SIEMPRE ES BUENO CONVERSAR</span>
        <h1>Estamos aquí, cerca de ti.</h1>
        <p>Una pregunta, una idea o tu próxima compra. Hablemos.</p>
      </div>
      <div className="contact-grid">
        <div className="contact-card">
          <MessageCircle />
          <h2>Conversemos</h2>
          <p>
            Atención directa para ayudarte a elegir y dar seguimiento a tus
            pedidos.
          </p>
          <a
            className="button primary"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            849-628-4599 <ArrowRight size={17} />
          </a>
        </div>
        <div className="contact-card">
          <Phone />
          <h2>Llámanos</h2>
          <p>Estamos a una llamada de distancia.</p>
          <a className="text-link" href="tel:+18299533756">
            829-953-3756
          </a>
          <Mail />
          <a href="mailto:DAnilocruzsierra@hotmail.com">
            DAnilocruzsierra@hotmail.com
          </a>
        </div>
        <div className="contact-card">
          <MapPin />
          <h2>Ven a Dajura</h2>
          <p>
            Calle Gaston F. Deligne No. 21,
            <br />
            Villa Penca, Bajos de Haina,
            <br />
            San Cristóbal, República Dominicana.
          </p>
          <a
            className="text-link"
            href="https://www.google.com/maps/search/?api=1&query=Calle+Gaston+F.+Deligne+21+Villa+Penca+Bajos+de+Haina+San+Cristobal"
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <div className="visit-banner">
        <MapPin size={40} />
        <div>
          <span className="eyebrow">TU TIENDA EN BAJOS DE HAINA</span>
          <h2>De aquí. Para tu hogar.</h2>
          <p>
            Consulta por teléfono o WhatsApp nuestro horario antes de
            visitarnos.
          </p>
        </div>
      </div>
    </main>
  );
}
export function About() {
  return (
    <main className="container page">
      <Breadcrumb items={["Nosotros"]} />
      <section className="about-hero">
        <span className="eyebrow">CONOCE DAJURA COMERCIAL</span>
        <h1>
          Las cosas buenas
          <br />
          empiezan <em>con confianza.</em>
        </h1>
        <p>
          Somos Dajura Comercial S.R.L., tu comercio en Villa Penca, Bajos de
          Haina. Creemos en una atención cercana y en ayudarte a encontrar lo
          que necesitas para tus espacios y tu día a día.
        </p>
        <Link className="button primary" to="/tienda">
          Conoce nuestra tienda <ArrowRight size={18} />
        </Link>
      </section>
      <div className="values-grid">
        {[
          [
            HeartHandshake,
            "Atención de persona a persona",
            "Queremos escucharte, resolver tus dudas y acompañarte antes y después de tu compra.",
          ],
          [
            Store,
            "Un comercio cerca de ti",
            "Puedes encontrarnos en Villa Penca y coordinar tu compra directamente con nuestro equipo.",
          ],
          [
            PackageCheck,
            "Cada pedido importa",
            "Confirmamos los pagos y coordinamos cada entrega para mantenerte informado.",
          ],
        ].map(([Icon, title, description]) => {
          const I = Icon as typeof Store;
          return (
            <div className="contact-card" key={String(title)}>
              <I />
              <h2>{String(title)}</h2>
              <p>{String(description)}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
export function HowTo() {
  return (
    <main className="container page narrow">
      <Breadcrumb items={["Cómo comprar"]} />
      <div className="page-heading">
        <span className="eyebrow">CLARO DESDE EL PRIMER PASO</span>
        <h1>Comprar en Dajura es sencillo.</h1>
      </div>
      {[
        [
          ShoppingBag,
          "01. Elige lo que necesitas",
          "Explora el catálogo, revisa la ficha del producto y agrega tus favoritos al carrito. Crea tu cuenta o inicia sesión para continuar.",
        ],
        [
          MapPin,
          "02. Confirma tus datos",
          "Completa tu nombre y teléfono. Elige retiro en tienda o entrega a domicilio cuando esté disponible. Revisa el total antes de crear el pedido.",
        ],
        [
          CreditCard,
          "03. Realiza tu transferencia",
          "En el detalle de tu pedido encontrarás el banco, titular y número de cuenta. Transfiere el importe exacto e incluye el número de pedido como referencia. Sube un comprobante JPG, PNG o PDF de hasta 5 MB.",
        ],
        [
          PackageCheck,
          "04. Nosotros verificamos y coordinamos",
          "El administrador confirma que el dinero se recibió en la cuenta de Dajura. Luego prepara el pedido y registra el envío o retiro. Puedes seguir el estado desde Mi cuenta.",
        ],
      ].map(([Icon, title, body]) => {
        const I = Icon as typeof Store;
        return (
          <div className="how-card" key={String(title)}>
            <I />
            <div>
              <h2>{String(title)}</h2>
              <p>{String(body)}</p>
            </div>
          </div>
        );
      })}
      <Link className="button primary" to="/tienda">
        Vamos a la tienda <ArrowRight size={17} />
      </Link>
    </main>
  );
}
export function Policies() {
  const privacy = useLocation().pathname === "/privacidad";
  return (
    <main className="container page narrow prose">
      <Breadcrumb items={[privacy ? "Privacidad" : "Compras y entregas"]} />
      <span className="eyebrow">DAJURA COMERCIAL S.R.L. · RNC 132157682</span>
      <h1>
        {privacy
          ? "Tu información, con cuidado."
          : "Información para tu compra."}
      </h1>
      {privacy ? (
        <>
          <h2>Los datos que utilizamos</h2>
          <p>
            Al registrarte y comprar guardamos tu nombre, correo, teléfono,
            datos de entrega, pedidos y comprobantes de transferencia.
            Utilizamos estos datos para gestionar tu cuenta, verificar pagos,
            coordinar entregas y responder consultas.
          </p>
          <h2>Acceso a tu información</h2>
          <p>
            Puedes consultar tus propios pedidos desde tu cuenta. El equipo
            autorizado de Dajura puede gestionar las ventas y revisar los
            comprobantes. Los comprobantes se almacenan de forma privada y se
            consultan mediante enlaces temporales.
          </p>
          <h2>Servicios utilizados</h2>
          <p>
            La tienda utiliza Supabase para autenticación, base de datos y
            almacenamiento, y está preparada para alojarse en Vercel. Estos
            proveedores procesan los datos necesarios para prestar sus
            servicios. Si eliges contactar por WhatsApp o abrir un mapa, accedes
            a un servicio externo con sus propias condiciones.
          </p>
          <h2>Almacenamiento en tu navegador</h2>
          <p>
            Guardamos tu carrito y la sesión de acceso en tu navegador para
            mantener la continuidad de tu compra. No incorporamos herramientas
            publicitarias ni de seguimiento de terceros.
          </p>
          <h2>Consultas y solicitudes</h2>
          <p>
            Para consultar, corregir o solicitar la eliminación de tus datos,
            escríbenos a{" "}
            <a href="mailto:DAnilocruzsierra@hotmail.com">
              DAnilocruzsierra@hotmail.com
            </a>
            . La información necesaria para pedidos, obligaciones contables o
            reclamaciones puede conservarse cuando corresponda.
          </p>
        </>
      ) : (
        <>
          <h2>Productos y precios</h2>
          <p>
            Los precios de la tienda se expresan en pesos dominicanos (DOP). El
            importe final del pedido incluye los productos y, cuando
            corresponda, la tarifa de entrega mostrada antes de confirmar. Los
            productos identificados como demostración son ilustrativos y no se
            pueden comprar.
          </p>
          <h2>Pago por transferencia</h2>
          <p>
            El pago se realiza únicamente a la cuenta bancaria que aparece en el
            detalle de tu pedido. Crear el pedido o subir un comprobante no
            implica la confirmación del pago. Dajura revisa la recepción del
            importe completo antes de aceptar y preparar la compra.
          </p>
          <h2>Disponibilidad y pedidos pendientes</h2>
          <p>
            El sistema reserva las unidades al crear un pedido. Si no has
            realizado el pago, contacta al equipo para coordinarlo o solicitar
            la cancelación. Las cancelaciones liberan las unidades reservadas.
          </p>
          <h2>Retiro y entrega</h2>
          <p>
            El retiro se coordina en Calle Gaston F. Deligne No. 21, Villa
            Penca, Bajos de Haina, San Cristóbal. Espera nuestra confirmación
            antes de acudir. Cuando esté habilitada la entrega a domicilio, el
            costo se mostrará durante la compra; confirma la cobertura y el
            plazo con nuestro equipo antes de transferir.
          </p>
          <h2>Cambios, incidencias y cancelaciones</h2>
          <p>
            Si necesitas cambiar o cancelar un pedido, o recibes un producto con
            alguna incidencia, comunícate por WhatsApp al 849-628-4599 e indica
            tu número de pedido. Revisaremos el caso contigo. Una cancelación en
            el sistema no ejecuta un reembolso bancario automático; cualquier
            devolución de dinero se coordina directamente.
          </p>
          <h2>Garantía y documentación</h2>
          <p>
            Consulta con nuestro equipo la garantía aplicable a cada producto y
            la documentación de tu compra antes de realizar el pago. El resumen
            del pedido es una constancia de la solicitud y no sustituye un
            comprobante fiscal.
          </p>
        </>
      )}
      <p className="policy-contact">
        Responsable: Dajura Comercial S.R.L. · RNC 132157682
        <br />
        Teléfono: 829-953-3756 · WhatsApp: 849-628-4599
      </p>
    </main>
  );
}
