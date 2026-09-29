import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import {
  UserRound,
  LogOut,
  ArrowRight,
  Upload,
  FileCheck,
  Package,
  ShieldCheck,
} from "lucide-react";
import { supabase, isDemo, errorMessage } from "./lib";
import { useStore } from "./store";
import { Breadcrumb, Empty } from "./components";
import { money, statuses, whatsapp } from "./data";
import type { Order } from "./types";
export function Account() {
  const { user, profile, signOut, notify, authLoading } = useStore();
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(
      location.hash.includes("type=recovery") ? "reset" : "login",
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [orders, setOrders] = useState<Order[]>([]),
    [ordersLoading, setOrdersLoading] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) return;
    setOrdersLoading(true);
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(errorMessage(error));
        setOrders(data || []);
        setOrdersLoading(false);
      });
  }, [user]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!supabase) {
      setError(
        "Conecta Supabase para activar el registro y el inicio de sesión.",
      );
      return;
    }
    setBusy(true);
    const f = new FormData(e.currentTarget),
      email = String(f.get("email") || "").trim(),
      password = String(f.get("password") || "");
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: f.get("name"), phone: f.get("phone") },
            emailRedirectTo: location.origin + "/cuenta",
          },
        });
        if (error) throw error;
        if (!data.session) {
          notify(
            "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
          );
          setMode("login");
        } else
          navigate(
            params.get("next") === "/checkout" ? "/checkout" : "/cuenta",
          );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + "/cuenta",
        });
        if (error) throw error;
        notify(
          "Si hay una cuenta con ese correo, recibirás las instrucciones de recuperación.",
        );
        setMode("login");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        notify("Contraseña actualizada.");
        setMode("login");
        navigate("/cuenta");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate(params.get("next") === "/checkout" ? "/checkout" : "/cuenta");
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (authLoading) return <p className="loading">Cargando tu cuenta…</p>;
  if (user && mode !== "reset")
    return (
      <main className="container page">
        <Breadcrumb items={["Mi cuenta"]} />
        <div className="section-heading page-heading">
          <div>
            <span className="eyebrow">TU ESPACIO EN DAJURA</span>
            <h1>Hola, {profile?.full_name?.split(" ")[0] || "bienvenido"}.</h1>
            <p>{user.email}</p>
          </div>
          <button className="button outline" onClick={() => void signOut()}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
        {profile?.role === "admin" && (
          <Link to="/admin" className="button primary">
            Abrir dashboard <ArrowRight size={17} />
          </Link>
        )}
        <button
          className="button outline"
          style={{ marginLeft: 12 }}
          onClick={() => {
            setError("");
            setMode("reset");
          }}
        >
          Cambiar mi contraseña
        </button>
        <h2 className="account-orders-title">Mis pedidos</h2>
        {error && <p className="form-error">{error}</p>}
        {ordersLoading ? (
          <p>Cargando pedidos…</p>
        ) : orders.length ? (
          <div className="orders-list">
            {orders.map((o) => (
              <Link to={"/pedidos/" + o.id} key={o.id}>
                <div className="order-icon">
                  <Package />
                </div>
                <div>
                  <strong>Pedido #{o.number}</strong>
                  <small>
                    {new Date(o.created_at).toLocaleDateString("es-DO")}
                  </small>
                </div>
                <span className={"status " + o.status}>
                  {statuses[o.status]}
                </span>
                <strong>{money(o.total)}</strong>
                <ArrowRight size={19} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Tu primer pedido te espera"
            description="Cuando compres en Dajura, podrás dar seguimiento a tus pedidos aquí."
          />
        )}
      </main>
    );
  return (
    <main className="container page auth-page">
      <div className="auth-story">
        <span className="eyebrow">BIENVENIDO A DAJURA</span>
        <h1>
          Tu hogar tiene
          <br />
          un nuevo aliado.
        </h1>
        <p>
          Guarda tus pedidos, consulta tus compras y mantente al tanto de cada
          entrega.
        </p>
        <img src="/products/washer.svg" alt="Una mejora para tu hogar" />
        <span className="auth-story-footer">
          <ShieldCheck size={20} /> Cerca de ti, en cada paso.
        </span>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <span className="auth-icon">
          <UserRound />
        </span>
        <h2>
          {mode === "register"
            ? "Hagamos espacio para ti."
            : mode === "forgot"
              ? "Recupera tu acceso."
              : mode === "reset"
                ? "Tu nueva contraseña."
                : "Qué bueno verte por aquí."}
        </h2>
        <p>
          {mode === "register"
            ? "Crea tu cuenta y empieza a explorar."
            : "Accede a tu cuenta Dajura Comercial."}
        </p>
        {isDemo && (
          <p className="info-banner">
            Vista de demostración. El acceso estará disponible cuando se conecte
            Supabase.
          </p>
        )}
        {mode === "register" && (
          <>
            <label>
              Nombre completo
              <input name="name" autoComplete="name" required minLength={3} />
            </label>
            <label>
              Teléfono
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                minLength={10}
                required
              />
            </label>
          </>
        )}
        {mode !== "reset" && (
          <label>
            Correo electrónico
            <input name="email" type="email" autoComplete="email" required />
          </label>
        )}
        {mode !== "forgot" && (
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>
        )}
        {mode === "register" && (
          <label className="checkbox-label">
            <input type="checkbox" required />
            <span>
              Acepto las <Link to="/politicas">condiciones</Link> y la{" "}
              <Link to="/privacidad">privacidad</Link>.
            </span>
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy
            ? "Un momento…"
            : mode === "register"
              ? "Crear mi cuenta"
              : mode === "forgot"
                ? "Enviar instrucciones"
                : mode === "reset"
                  ? "Guardar contraseña"
                  : "Iniciar sesión"}
          <ArrowRight size={17} />
        </button>
        {mode === "login" && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
          >
            Olvidé mi contraseña
          </button>
        )}
        <div className="auth-switch">
          {mode === "login"
            ? "¿Primera vez por aquí?"
            : "¿Ya tienes una cuenta?"}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </div>
      </form>
    </main>
  );
}
export function OrderDetail() {
  const { id } = useParams();
  const { user, settings, notify, authLoading } = useStore();
  const [order, setOrder] = useState<Order | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        setOrder(data);
        if (error) setError("No pudimos cargar este pedido.");
        setLoading(false);
      });
  }, [id, user]);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !order || !user) return;
    const form = e.currentTarget;
    const file = new FormData(form).get("receipt") as File;
    if (!file?.size) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
    ) {
      setError("Sube un JPG, PNG o PDF de hasta 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    const path =
      user.id +
      "/" +
      order.id +
      "/" +
      crypto.randomUUID() +
      "." +
      (file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/png"
          ? "png"
          : "jpg");
    try {
      const { error: storageError } = await supabase.storage
        .from("receipts")
        .upload(path, file, { contentType: file.type });
      if (storageError) throw storageError;
      const { error } = await supabase.rpc("submit_receipt", {
        p_order_id: order.id,
        p_receipt_path: path,
      });
      if (error) {
        await supabase.storage.from("receipts").remove([path]);
        throw error;
      }
      setOrder({ ...order, receipt_path: path, status: "payment_review" });
      notify("Comprobante recibido. Nuestro equipo revisará el abono.");
      form.reset();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (authLoading || loading)
    return <p className="loading">Cargando pedido…</p>;
  if (!user)
    return (
      <Empty
        title="Inicia sesión para ver tu pedido"
        description="Tus datos de compra son privados."
        link="/cuenta"
        label="Ir a mi cuenta"
      />
    );
  if (!order)
    return (
      <Empty
        title="Pedido no encontrado"
        description={error || "Este pedido no está disponible en tu cuenta."}
        link="/cuenta"
        label="Mis pedidos"
      />
    );
  return (
    <main className="container page">
      <Breadcrumb items={["Mi cuenta", "Pedido #" + order.number]} />
      <div className="section-heading page-heading">
        <div>
          <span className="eyebrow">GRACIAS POR ELEGIR DAJURA</span>
          <h1>Pedido #{order.number}</h1>
          <p>{new Date(order.created_at).toLocaleString("es-DO")}</p>
        </div>
        <span className={"status " + order.status}>
          {statuses[order.status]}
        </span>
      </div>
      <div className="checkout-layout">
        <div>
          <section className="form-card">
            <h2>
              {order.status === "pending_payment"
                ? "El siguiente paso: tu transferencia."
                : order.status === "payment_review"
                  ? "Estamos revisando tu pago."
                  : order.status === "cancelled"
                    ? "Pedido cancelado."
                    : "Tu pedido está en buenas manos."}
            </h2>
            {["pending_payment", "payment_review"].includes(order.status) && (
              <>
                <p>
                  Transfiere el total a la cuenta de Dajura. Usa{" "}
                  <strong>Pedido #{order.number}</strong> como referencia.
                </p>
                <div className="bank-info">
                  <div>
                    <small>Banco</small>
                    <strong>{settings.bank_name}</strong>
                  </div>
                  <div>
                    <small>Titular</small>
                    <strong>{settings.bank_holder}</strong>
                  </div>
                  <div>
                    <small>Cuenta {settings.account_type}</small>
                    <strong>{settings.bank_account}</strong>
                  </div>
                  <div>
                    <small>Total a transferir</small>
                    <strong>{money(order.total)}</strong>
                  </div>
                </div>
                <p>{settings.payment_instructions}</p>
                <p className="info-banner">
                  Un comprobante no confirma el pago automáticamente.
                  Prepararemos el pedido cuando nuestro equipo verifique que el
                  dinero llegó a nuestra cuenta.
                </p>
                {order.receipt_path ? (
                  <p className="success-text">
                    <FileCheck size={19} /> Comprobante enviado para revisión.
                  </p>
                ) : (
                  <form onSubmit={upload}>
                    <label>
                      Sube tu comprobante
                      <input
                        type="file"
                        name="receipt"
                        accept="image/jpeg,image/png,application/pdf"
                        required
                      />
                    </label>
                    <small>JPG, PNG o PDF. Máximo 5 MB.</small>
                    <button className="button primary" disabled={busy}>
                      <Upload size={17} />
                      {busy ? "Enviando…" : "Enviar comprobante"}
                    </button>
                  </form>
                )}
              </>
            )}
            {order.payment_confirmed_at && (
              <p className="success-text">
                <ShieldCheck size={18} /> Pago confirmado el{" "}
                {new Date(order.payment_confirmed_at).toLocaleDateString(
                  "es-DO",
                )}
                .
              </p>
            )}
            {order.tracking && (
              <p>
                <strong>Información de entrega:</strong> {order.tracking}
              </p>
            )}
            {order.cancellation_reason && (
              <p>
                <strong>Motivo de cancelación:</strong>{" "}
                {order.cancellation_reason}
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </section>
          <section className="form-card order-address">
            <h2>
              {order.delivery_method === "pickup"
                ? "Retiro en tienda"
                : "Dirección de entrega"}
            </h2>
            <p>
              {order.customer_name} · {order.phone}
            </p>
            <p>{order.address}</p>
            {order.notes && <p>Nota: {order.notes}</p>}
            <a
              className="text-link"
              href={
                whatsapp +
                "?text=" +
                encodeURIComponent(
                  "Hola, necesito ayuda con el pedido #" + order.number,
                )
              }
              target="_blank"
              rel="noreferrer"
            >
              Consultar mi pedido por WhatsApp <ArrowRight size={17} />
            </a>
          </section>
        </div>
        <aside className="summary-card">
          <h2>Tu compra</h2>
          {order.items.map((x, i) => (
            <div key={i}>
              <span>
                {x.quantity} × {x.name}
              </span>
              <strong>{money(x.price * x.quantity)}</strong>
            </div>
          ))}
          <div>
            <span>Entrega</span>
            <strong>{money(order.shipping_fee)}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
          <Link to="/cuenta" className="text-link">
            Ver todos mis pedidos <ArrowRight size={17} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
