import { useState, useRef, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Trash2,
  ShieldCheck,
  CreditCard,
  MapPin,
  Truck,
} from "lucide-react";
import { useStore } from "./store";
import { Breadcrumb, Empty, Quantity } from "./components";
import { money } from "./data";
import { supabase, isDemo, errorMessage } from "./lib";
export function Cart() {
  const { cart, setQuantity } = useStore();
  const total = cart.reduce((s, x) => s + x.product.price * x.quantity, 0);
  return (
    <main className="container page">
      <Breadcrumb items={["Tu carrito"]} />
      <div className="page-heading">
        <span className="eyebrow">ESTÁS UN PASO MÁS CERCA</span>
        <h1>Tu próxima mejora empieza aquí.</h1>
      </div>
      {cart.length ? (
        <div className="checkout-layout">
          <div className="cart-items">
            {cart.map(({ product: p, quantity }) => (
              <div className="cart-item" key={p.id}>
                <Link to={"/producto/" + p.id}>
                  <img src={p.image_url} alt={p.name} />
                </Link>
                <div>
                  <small>{p.category}</small>
                  <Link to={"/producto/" + p.id}>
                    <h3>{p.name}</h3>
                  </Link>
                  <strong>{money(p.price)}</strong>
                  <Quantity
                    value={quantity}
                    max={p.stock}
                    onChange={(q) => setQuantity(p.id, q)}
                  />
                </div>
                <div className="cart-item-end">
                  <button
                    className="icon-button"
                    aria-label={"Eliminar " + p.name}
                    onClick={() => setQuantity(p.id, 0)}
                  >
                    <Trash2 size={18} />
                  </button>
                  <strong>{money(p.price * quantity)}</strong>
                </div>
              </div>
            ))}
            <Link className="text-link" to="/tienda">
              <ArrowLeft size={17} /> Seguir explorando
            </Link>
          </div>
          <aside className="summary-card">
            <h2>Resumen de tu compra</h2>
            <div>
              <span>
                Productos ({cart.reduce((s, x) => s + x.quantity, 0)})
              </span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <span>En el siguiente paso</span>
            </div>
            <div className="summary-total">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <Link to="/checkout" className="button primary full">
              Continuar con mi pedido <ArrowRight size={18} />
            </Link>
            <p className="safe-note">
              <ShieldCheck size={17} /> Pago por transferencia bancaria
            </p>
            {isDemo && (
              <p className="info-banner">
                Esta es una vista de demostración. No se procesan compras ni
                pagos reales.
              </p>
            )}
          </aside>
        </div>
      ) : (
        <Empty
          title="Tu carrito espera algo especial"
          description="Encuentra eso que le hace falta a tu hogar."
        />
      )}
    </main>
  );
}
export function Checkout() {
  const {
    cart,
    user,
    profile,
    settings,
    clearCart,
    notify,
    authLoading,
    refresh,
  } = useStore();
  const navigate = useNavigate();
  const requestId = useRef(crypto.randomUUID());
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const subtotal = cart.reduce((s, x) => s + x.product.price * x.quantity, 0);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc("create_order", {
        p_items: cart.map((x) => ({
          product_id: x.product.id,
          quantity: x.quantity,
        })),
        p_customer_name: f.get("name"),
        p_phone: f.get("phone"),
        p_address:
          method === "delivery" ? f.get("address") : "Retiro en tienda",
        p_notes: f.get("notes"),
        p_delivery_method: method,
        p_request_id: requestId.current,
        p_expected_total:
          subtotal + (method === "delivery" ? settings.shipping_fee : 0),
      });
      if (error) throw error;
      clearCart();
      void refresh();
      notify(
        "Pedido creado. Encontrarás las instrucciones de pago en el detalle.",
      );
      navigate("/pedidos/" + data);
    } catch (e) {
      setError(errorMessage(e));
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (authLoading) return <p className="loading">Cargando sesión…</p>;
  if (!cart.length)
    return (
      <Empty
        title="Tu carrito está vacío"
        description="Agrega tus favoritos antes de realizar el pedido."
      />
    );
  if (isDemo)
    return (
      <main className="container page">
        <Empty
          title="Tu tienda está tomando forma"
          description="El carrito funciona en esta demostración. Para realizar pedidos reales es necesario conectar Supabase, cargar el catálogo y configurar la cuenta bancaria."
          link="/carrito"
          label="Volver a mi carrito"
        />
      </main>
    );
  if (!user)
    return (
      <main className="container page">
        <Empty
          title="Tu compra comienza con tu cuenta"
          description="Inicia sesión o regístrate para guardar tu pedido y seguir su entrega."
          link="/cuenta?next=/checkout"
          label="Iniciar sesión o registrarme"
        />
      </main>
    );
  if (!settings.bank_account || !settings.bank_name)
    return (
      <main className="container page">
        <Empty
          title="Estamos preparando las compras online"
          description="La información bancaria aún no está disponible. Contacta a Dajura para recibir atención."
          link="/contacto"
          label="Contactar a Dajura"
        />
      </main>
    );
  return (
    <main className="container page">
      <Breadcrumb items={["Carrito", "Finalizar pedido"]} />
      <div className="page-heading">
        <span className="eyebrow">EL SIGUIENTE PASO HACIA TU HOGAR</span>
        <h1>Preparemos tu pedido.</h1>
        <p>Pagarás por transferencia después de crear el pedido.</p>
      </div>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="form-card">
          <h2>01. Tus datos</h2>
          <div className="form-grid">
            <label>
              Nombre completo
              <input
                name="name"
                required
                minLength={3}
                maxLength={120}
                defaultValue={profile?.full_name}
              />
            </label>
            <label>
              Teléfono / WhatsApp
              <input
                name="phone"
                type="tel"
                required
                minLength={10}
                maxLength={25}
                defaultValue={profile?.phone}
                placeholder="809-000-0000"
              />
            </label>
          </div>
          <h2>02. ¿Cómo lo recibes?</h2>
          <div className="delivery-options">
            <button
              type="button"
              className={method === "pickup" ? "selected" : ""}
              onClick={() => setMethod("pickup")}
            >
              <MapPin />
              <strong>Retiro en tienda</strong>
              <span>Sin costo · Bajos de Haina</span>
            </button>
            {settings.delivery_enabled && (
              <button
                type="button"
                className={method === "delivery" ? "selected" : ""}
                onClick={() => setMethod("delivery")}
              >
                <Truck />
                <strong>Entrega a domicilio</strong>
                <span>{money(settings.shipping_fee)} · Coordinada contigo</span>
              </button>
            )}
          </div>
          {method === "delivery" ? (
            <label>
              Dirección completa y referencia
              <textarea
                name="address"
                required
                minLength={10}
                maxLength={500}
                placeholder="Calle, número, sector, municipio y referencia"
              />
            </label>
          ) : (
            <p className="info-banner">
              Calle Gaston F. Deligne No. 21, Villa Penca, Bajos de Haina, San
              Cristóbal. Espera nuestra confirmación antes de recoger.
            </p>
          )}
          <label>
            Una nota para nuestro equipo (opcional)
            <textarea
              name="notes"
              maxLength={1000}
              placeholder="¿Hay algo que debamos saber?"
            />
          </label>
          <h2>03. Pago por transferencia</h2>
          <p>
            Al crear el pedido verás la cuenta bancaria y podrás subir tu
            comprobante. Nuestro equipo verificará el abono antes de preparar y
            enviar tus productos.
          </p>
          <label className="checkbox-label">
            <input type="checkbox" required />{" "}
            <span>
              He leído las{" "}
              <Link to="/politicas" target="_blank">
                condiciones de compra
              </Link>{" "}
              y la{" "}
              <Link to="/privacidad" target="_blank">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <aside className="summary-card">
          <h2>Tu pedido</h2>
          {cart.map((x) => (
            <div key={x.product.id}>
              <span>
                {x.quantity} × {x.product.name}
              </span>
              <strong>{money(x.product.price * x.quantity)}</strong>
            </div>
          ))}
          <div>
            <span>Entrega</span>
            <strong>
              {method === "pickup" ? "Sin costo" : money(settings.shipping_fee)}
            </strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>
              {money(
                subtotal + (method === "delivery" ? settings.shipping_fee : 0),
              )}
            </strong>
          </div>
          <small>
            Precios finales publicados. No se añaden cargos ocultos.
          </small>
          <button className="button primary full" disabled={busy}>
            {busy ? "Creando pedido…" : "Crear pedido"}
            <ArrowRight size={18} />
          </button>
          <p className="safe-note">
            <CreditCard size={17} /> No se realiza ningún cobro automático.
          </p>
        </aside>
      </form>
    </main>
  );
}
