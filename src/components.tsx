import {
  ArrowRight,
  ShoppingBag,
  Search,
  UserRound,
  Menu,
  X,
  MapPin,
  Phone,
  ChevronRight,
  MessageCircle,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useStore } from "./store";
import type { Product } from "./types";
import { money, whatsapp } from "./data";
import { isDemo } from "./lib";
export function Header() {
  const { cart, user, profile } = useStore();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>
            <MapPin size={13} /> Tu tienda de confianza en Bajos de Haina
          </span>
          <a href="tel:+18299533756">
            <Phone size={12} /> 829-953-3756{" "}
            <span className="top-separator">|</span>{" "}
            <span>Hablemos de lo que necesitas</span>
          </a>
        </div>
      </div>
      <header className="header">
        <div className="container header-main">
          <Link to="/" aria-label="Dajura Comercial, inicio" className="brand">
            <img src="/logo.jpeg" alt="Dajura Comercial" />
          </Link>
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/tienda?q=" + encodeURIComponent(search));
              setOpen(false);
            }}
          >
            <Search size={19} />
            <input
              aria-label="Buscar productos"
              placeholder="¿Qué necesitas para tu hogar?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span>Buscar</span>
          </form>
          <div className="header-actions">
            <Link to="/cuenta" className="account-link">
              <UserRound size={22} />
              <span>
                <small>
                  {user
                    ? "Hola, " +
                      (profile?.full_name?.split(" ")[0] || "bienvenido")
                    : "Bienvenido"}
                </small>
                Mi cuenta
              </span>
            </Link>
            <span className="vertical-rule" />
            <Link
              to="/carrito"
              className="cart-link"
              aria-label={
                "Carrito, " +
                cart.reduce((n, x) => n + x.quantity, 0) +
                " artículos"
              }
            >
              <ShoppingBag size={23} />
              <b>{cart.reduce((n, x) => n + x.quantity, 0)}</b>
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <nav className={"nav-row " + (open ? "nav-open" : "")}>
          <div className="container">
            <div className="nav-links" onClick={() => setOpen(false)}>
              <NavLink to="/" end>
                Inicio
              </NavLink>
              <NavLink to="/tienda">Todos los productos</NavLink>
              <Link to="/tienda?categoria=Electrodomésticos">
                Electrodomésticos
              </Link>
              <Link to="/tienda?categoria=Hogar">Hogar & cocina</Link>
              <Link to="/nosotros">Nosotros</Link>
              <Link to="/contacto">Contacto</Link>
            </div>
            <a
              className="nav-help"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> ¿Te ayudamos?
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <>
      <section className="contact-ribbon container">
        <div>
          <span className="eyebrow">ESTAMOS CERCA DE TI</span>
          <h2>¿Lo necesitas? Hablemos.</h2>
          <p>Te ayudamos a encontrar eso que hace falta en tu hogar.</p>
        </div>
        <a
          className="button white"
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={19} /> Escríbenos por WhatsApp{" "}
          <ArrowRight size={18} />
        </a>
      </section>
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <img src="/logo.jpeg" alt="Dajura Comercial" />
            <p>
              Lo que tu hogar necesita.
              <br />
              La confianza que tú mereces.
            </p>
            <span className="local-tag">
              <MapPin size={14} /> Hecho para nuestra gente.
            </span>
          </div>
          <div>
            <h4>Explora Dajura</h4>
            <Link to="/tienda">Todos los productos</Link>
            <Link to="/nosotros">Sobre nosotros</Link>
            <Link to="/cuenta">Mi cuenta y pedidos</Link>
            <Link to="/admin">Administración</Link>
          </div>
          <div>
            <h4>Compra con confianza</h4>
            <Link to="/como-comprar">Cómo comprar</Link>
            <Link to="/politicas">Compras y entregas</Link>
            <Link to="/privacidad">Privacidad</Link>
            <a href={whatsapp} target="_blank" rel="noreferrer">
              Atención por WhatsApp
            </a>
          </div>
          <div>
            <h4>Visítanos o escríbenos</h4>
            <p>
              Calle Gaston F. Deligne No. 21,
              <br />
              Villa Penca, Bajos de Haina,
              <br />
              San Cristóbal, República Dominicana.
            </p>
            <a href="tel:+18299533756">829-953-3756</a>
            <a href="mailto:DAnilocruzsierra@hotmail.com">
              DAnilocruzsierra@hotmail.com
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} Dajura Comercial S.R.L. · RNC 132157682
          </span>
          <span>
            <CreditCard size={15} /> Pago seguro por transferencia bancaria
          </span>
        </div>
        {isDemo && (
          <div className="demo-note">
            Vista de demostración · Productos y precios ilustrativos. Las
            compras se activan al conectar la tienda.
          </div>
        )}
      </footer>
    </>
  );
}
export function ProductCard({ product: p }: { product: Product }) {
  const { add } = useStore();
  return (
    <article className="product-card">
      <Link className="product-visual" to={"/producto/" + p.id}>
        <span className={"product-badge " + (p.old_price ? "discount" : "")}>
          {p.old_price
            ? "-" + Math.round((1 - p.price / p.old_price) * 100) + "%"
            : p.badge || "Dajura"}
        </span>
        <img
          src={p.image_url || "/products/fridge.svg"}
          alt={p.name}
          loading="lazy"
        />
      </Link>
      <div className="product-info">
        <small>{p.category}</small>
        <Link to={"/producto/" + p.id}>
          <h3>{p.name}</h3>
        </Link>
        <div className="price">
          <strong>{money(p.price)}</strong>
          {p.old_price && <del>{money(p.old_price)}</del>}
        </div>
        <div className="product-bottom">
          <span className={p.stock ? "stock" : "out-stock"}>
            {p.stock ? (
              <>
                <span /> Disponible
              </>
            ) : (
              "Agotado"
            )}
          </span>
          <button
            className="add-button"
            disabled={!p.stock}
            aria-label={"Agregar " + p.name}
            onClick={() => add(p)}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="breadcrumb">
      <Link to="/">Inicio</Link>
      {items.map((x, i) => (
        <span key={i}>
          <ChevronRight size={13} />
          {x}
        </span>
      ))}
    </div>
  );
}
export function Quantity({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Disminuir cantidad"
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button
        aria-label="Aumentar cantidad"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function TrustStrip() {
  return (
    <section className="trust-strip container">
      <div>
        <Truck />
        <span>
          <strong>Tu compra, a tu manera</strong>
          <small>Retiro en tienda o entrega coordinada</small>
        </span>
      </div>
      <div>
        <ShieldCheck />
        <span>
          <strong>Atención de confianza</strong>
          <small>Estamos contigo en cada paso</small>
        </span>
      </div>
      <div>
        <CreditCard />
        <span>
          <strong>Pago por transferencia</strong>
          <small>Simple, directo y verificado</small>
        </span>
      </div>
      <div>
        <MessageCircle />
        <span>
          <strong>Hablemos por WhatsApp</strong>
          <small>Una persona real para ayudarte</small>
        </span>
      </div>
    </section>
  );
}
export function Toast() {
  const { notice } = useStore();
  return notice ? (
    <div className="toast" role="status">
      <Check size={19} />
      {notice}
    </div>
  ) : null;
}
export function Empty({
  title,
  description,
  link = "/tienda",
  label = "Explorar productos",
}: {
  title: string;
  description: string;
  link?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={44} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button primary" to={link}>
        {label}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
