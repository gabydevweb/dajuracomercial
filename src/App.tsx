import { Component, useEffect, type ReactNode } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Header, Footer, Toast, Empty } from "./components";
import { Home, Shop, ProductDetail } from "./Shop";
import { Cart, Checkout } from "./Checkout";
import { Account, OrderDetail } from "./Account";
import { Contact, About, HowTo, Policies } from "./Info";
import Admin from "./Admin";
import { whatsapp } from "./data";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty-state">
        <h1>Algo no salió como esperábamos.</h1>
        <p>Recarga la página para volver a intentarlo.</p>
        <a className="button primary" href="/">
          Volver al inicio
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const names: Record<string, string> = {
      "/": "Todo para tu próximo comienzo",
      "/tienda": "Tienda",
      "/carrito": "Tu carrito",
      "/checkout": "Finalizar pedido",
      "/cuenta": "Mi cuenta",
      "/admin": "Administración",
      "/contacto": "Contacto",
      "/nosotros": "Nosotros",
    };
    document.title =
      (names[pathname] || "Tu tienda de confianza") + " · Dajura Comercial";
  }, [pathname]);
  return null;
}
export default function App() {
  const admin = useLocation().pathname === "/admin";
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      {!admin && <Header />}
      <div id="contenido">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Shop />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/pedidos/:id" element={<OrderDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/como-comprar" element={<HowTo />} />
          <Route path="/politicas" element={<Policies />} />
          <Route path="/privacidad" element={<Policies />} />
          <Route
            path="*"
            element={
              <Empty
                title="Por aquí no era…"
                description="La página que buscas no está disponible. Tu próximo favorito sigue en nuestra tienda."
                link="/"
                label="Volver al inicio"
              />
            }
          />
        </Routes>
      </div>
      {!admin && (
        <>
          <Footer />
          <a
            className="whatsapp-float"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            aria-label="Contactar por WhatsApp"
          >
            <MessageCircle size={25} />
          </a>
        </>
      )}
      <Toast />
      {admin && (
        <Link className="mobile-back-store" to="/">
          Volver a la tienda
        </Link>
      )}
    </ErrorBoundary>
  );
}
