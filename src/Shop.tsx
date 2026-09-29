import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Refrigerator,
  CookingPot,
  Armchair,
  Monitor,
  SlidersHorizontal,
  ShieldCheck,
  MapPin,
  ShoppingBag,
  CreditCard,
  Check,
  PackageCheck,
  MessageCircle,
} from "lucide-react";
import { useStore } from "./store";
import {
  Breadcrumb,
  Empty,
  ProductCard,
  Quantity,
  TrustStrip,
} from "./components";
import { categories, money, whatsapp } from "./data";
import { isDemo } from "./lib";
const categoryIcons = [Refrigerator, CookingPot, Armchair, Monitor];
export function Home() {
  const { products, loading } = useStore();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span /> TU HOGAR. TUS PLANES. TU DAJURA.
          </span>
          <h1>
            Los buenos
            <br />
            comienzos
            <br />
            empiezan <em>en casa.</em>
          </h1>
          <p>
            Renueva tus espacios con lo que necesitas.
            <br />
            En Dajura, te ayudamos a hacerlo realidad.
          </p>
          <div className="hero-buttons">
            <Link to="/tienda" className="button primary">
              Encuentra lo tuyo <ArrowRight size={19} />
            </Link>
            <a
              href={whatsapp}
              className="hero-secondary"
              target="_blank"
              rel="noreferrer"
            >
              Conversemos <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-local">
            <span className="local-icon">
              <MapPin size={17} />
            </span>
            <span>
              Desde Bajos de Haina,
              <br />
              <strong>con confianza y cercanía.</strong>
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <span className="hero-art-label">UN NUEVO AIRE PARA TU HOGAR</span>
          <div className="hero-pedestal" />
          <img
            className="hero-fridge"
            src="/products/fridge.svg"
            alt="Nevera de puertas francesas"
          />
          <img
            className="hero-washer"
            src="/products/washer.svg"
            alt="Lavadora automática"
          />
          <img
            className="hero-blender"
            src="/products/blender.svg"
            alt="Licuadora de cocina"
          />
          <div className="hero-float">
            <span>
              <ShieldCheck size={22} />
            </span>
            <div>
              Compra tranquilo.<strong>Estamos aquí para ti.</strong>
            </div>
          </div>
          <div className="hero-art-bottom">
            <span>HOGAR QUE SE SIENTE BIEN.</span>
            <span>01 — 03</span>
          </div>
        </div>
      </section>
      <TrustStrip />
      <section className="container section categories-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CADA ESPACIO TIENE SU ESENCIAL</span>
            <h2>¿Qué quieres renovar hoy?</h2>
          </div>
          <Link to="/tienda" className="text-link">
            Explorar todo <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.slice(1).map((c, i) => {
            const Icon = categoryIcons[i];
            return (
              <Link
                to={"/tienda?categoria=" + encodeURIComponent(c)}
                className="category-card"
                key={c}
              >
                <span className="category-icon">
                  <Icon size={27} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>{c}</h3>
                  <small>
                    {
                      [
                        "Más tiempo para ti",
                        "Dale sabor a tus días",
                        "Tu espacio, a tu estilo",
                        "Conecta con lo que amas",
                      ][i]
                    }
                  </small>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="container section featured">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BUENAS ELECCIONES, GRANDES CAMBIOS</span>
            <h2>
              Favoritos para tu hogar<span className="heading-dot">.</span>
            </h2>
          </div>
          <Link to="/tienda" className="text-link">
            Ver todos los productos <ArrowRight size={17} />
          </Link>
        </div>
        {isDemo && (
          <p className="catalog-demo">
            Catálogo de muestra · Precios ilustrativos
          </p>
        )}
        <div className="product-grid">
          {products
            .filter((p) => p.featured)
            .slice(0, 4)
            .map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
        </div>
        {loading && <p className="loading">Cargando productos…</p>}
        {!loading && !products.length && (
          <Empty
            title="Estamos preparando algo bueno"
            description="Nuestro catálogo estará disponible pronto. Escríbenos para conocer los productos disponibles."
          />
        )}
      </section>
      <section className="container editorial">
        <div className="editorial-art">
          <span className="editorial-number">DAJURA / EN CASA</span>
          <img src="/products/stove.svg" alt="Estufa para renovar tu cocina" />
          <div className="editorial-caption">
            El mejor ingrediente
            <br />
            es estar juntos.
          </div>
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">MÁS QUE UNA COMPRA</span>
          <h2>
            Pequeños cambios.
            <br />
            Una casa más tuya.
          </h2>
          <p>
            Ese desayuno en familia. La ropa lista para mañana. Tu película
            favorita al terminar el día. Hay cosas que hacen la vida en casa
            mucho mejor.
          </p>
          <p>Encuéntralas aquí, con la atención cercana de Dajura Comercial.</p>
          <Link className="button primary" to="/tienda?categoria=Cocina">
            Dale vida a tu cocina <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="container section how-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ASÍ DE FÁCIL, ASÍ DE DAJURA</span>
            <h2>De nuestra tienda a tu hogar.</h2>
          </div>
          <Link className="text-link" to="/como-comprar">
            Cómo funciona <ArrowRight size={17} />
          </Link>
        </div>
        <div className="steps-grid">
          {[
            [
              ShoppingBag,
              "01",
              "Elige tus favoritos",
              "Explora, compara y agrega lo que necesitas a tu carrito.",
            ],
            [
              CreditCard,
              "02",
              "Transfiere con tranquilidad",
              "Crea tu pedido y paga a nuestra cuenta bancaria.",
            ],
            [
              PackageCheck,
              "03",
              "Nosotros nos encargamos",
              "Confirmamos tu pago y coordinamos la entrega contigo.",
            ],
          ].map(([Icon, n, title, description]) => {
            const I = Icon as typeof ShoppingBag;
            return (
              <div className="step" key={String(n)}>
                <div>
                  <I size={25} />
                  <span>{String(n)}</span>
                </div>
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
export function Shop() {
  const { products, loading } = useStore();
  const [params, setParams] = useSearchParams();
  const category = params.get("categoria") || "Todos",
    q = params.get("q") || "";
  const [sort, setSort] = useState("featured"),
    [available, setAvailable] = useState(false);
  const filtered = products
    .filter(
      (p) =>
        (category === "Todos" || p.category === category) &&
        (!available || p.stock > 0) &&
        (p.name + " " + p.description).toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : Number(b.featured) - Number(a.featured),
    );
  return (
    <main className="container page">
      <Breadcrumb items={["Tienda"]} />
      <div className="page-heading">
        <span className="eyebrow">ENCUENTRA TU PRÓXIMO FAVORITO</span>
        <h1>Todo para vivir mejor.</h1>
        <p>Buenos productos. Atención cercana. Eso es Dajura.</p>
      </div>
      {isDemo && (
        <div className="info-banner">
          Catálogo de demostración: imágenes, disponibilidad y precios
          ilustrativos.
        </div>
      )}
      <div className="shop-layout">
        <aside className="shop-sidebar">
          <h3>
            <SlidersHorizontal size={17} /> Explora por categoría
          </h3>
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("categoria", c);
                setParams(next);
              }}
            >
              {c}
              <span>
                {
                  products.filter((p) => c === "Todos" || p.category === c)
                    .length
                }
              </span>
            </button>
          ))}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />{" "}
            Solo disponibles
          </label>
          <div className="sidebar-help">
            <MessageCircle />
            <h3>¿No sabes cuál elegir?</h3>
            <p>Te ayudamos a encontrar lo que necesitas.</p>
            <a
              className="text-link"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Hablemos <ArrowUpRight size={16} />
            </a>
          </div>
        </aside>
        <div>
          <div className="catalog-toolbar">
            <span>
              {filtered.length} productos
              {q && (
                <>
                  {" "}
                  para “{q}”{" "}
                  <button
                    className="text-button"
                    onClick={() => {
                      params.delete("q");
                      setParams(params);
                    }}
                  >
                    Limpiar
                  </button>
                </>
              )}
            </span>
            <select
              aria-label="Ordenar productos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Destacados primero</option>
              <option value="low">Precio: menor a mayor</option>
              <option value="high">Precio: mayor a menor</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </div>
          {loading ? (
            <p className="loading">Cargando catálogo…</p>
          ) : filtered.length ? (
            <div className="product-grid shop-products">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="No encontramos productos"
              description="Prueba otra categoría o una búsqueda diferente."
            />
          )}
        </div>
      </div>
    </main>
  );
}
export function ProductDetail() {
  const { id } = useParams();
  const { products, add, loading } = useStore();
  const [quantity, setQuantity] = useState(1);
  const p = products.find((x) => x.id === id);
  if (loading) return <p className="loading">Cargando producto…</p>;
  if (!p)
    return (
      <Empty
        title="Producto no disponible"
        description="Explora otros productos de nuestra tienda."
      />
    );
  return (
    <main className="container page">
      <Breadcrumb items={["Tienda", p.name]} />
      <div className="product-detail">
        <div className="detail-image">
          <img src={p.image_url} alt={p.name} />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <span className="sku">Referencia {p.sku}</span>
          <div className="price detail-price">
            <strong>{money(p.price)}</strong>
            {p.old_price && <del>{money(p.old_price)}</del>}
          </div>
          <p>{p.description}</p>
          <div className="stock">
            <Check size={16} />
            {p.stock ? `${p.stock} unidades disponibles` : "Agotado"}
          </div>
          <div className="detail-add">
            <Quantity
              value={quantity}
              onChange={(n) => setQuantity(Math.max(1, n))}
              max={p.stock}
            />
            <button
              className="button primary"
              disabled={!p.stock}
              onClick={() => add(p, quantity)}
            >
              <ShoppingBag size={18} /> Agregar al carrito
            </button>
          </div>
          {isDemo && (
            <p className="info-banner">
              Producto de muestra. No está habilitado para compras reales.
            </p>
          )}
          <div className="detail-benefits">
            <span>
              <CreditCard size={18} /> Pago por transferencia bancaria
            </span>
            <span>
              <ShieldCheck size={18} /> Pago revisado por nuestro equipo
            </span>
            <span>
              <MapPin size={18} /> Retiro en nuestra tienda de Haina
            </span>
          </div>
          <a
            className="text-link"
            href={
              whatsapp +
              "?text=" +
              encodeURIComponent("Hola, me interesa " + p.name)
            }
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} /> Consultar sobre este producto
          </a>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <h2>También puede gustarte</h2>
        </div>
        <div className="product-grid">
          {products
            .filter((x) => x.id !== id)
            .slice(0, 4)
            .map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
        </div>
      </section>
    </main>
  );
}
