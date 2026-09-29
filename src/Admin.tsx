import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings as SettingsIcon,
  ShoppingBag,
  ArrowUpRight,
  Plus,
  Pencil,
  X,
  Eye,
  CheckCircle2,
  Truck,
  Download,
  RefreshCw,
  ImagePlus,
  LogOut,
} from "lucide-react";
import { supabase, isDemo, errorMessage } from "./lib";
import { useStore } from "./store";
import {
  categories,
  defaultSettings,
  demoProducts,
  money,
  statuses,
} from "./data";
import type { Product, Order, Profile, Settings, OrderStatus } from "./types";
import { Empty } from "./components";
type Tab = "overview" | "orders" | "products" | "customers" | "settings";
const blankProduct: Product = {
  id: "",
  name: "",
  description: "",
  category: "Electrodomésticos",
  price: 0,
  old_price: null,
  stock: 0,
  image_url: "",
  active: true,
  featured: false,
  badge: "",
  sku: "",
};
export default function Admin() {
  const { profile, user, authLoading, notify, refresh, signOut } = useStore();
  const [tab, setTab] = useState<Tab>("overview"),
    [orders, setOrders] = useState<Order[]>([]),
    [products, setProducts] = useState<Product[]>(isDemo ? demoProducts : []),
    [profiles, setProfiles] = useState<Profile[]>([]),
    [settings, setSettings] = useState<Settings>(defaultSettings),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<Product | null>(null),
    [selected, setSelected] = useState<Order | null>(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [action, setAction] = useState<OrderStatus | null>(null),
    [uploading, setUploading] = useState(false);
  const modalOpen = Boolean(editing || selected);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
        ) || [],
      );
    focusables()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(null);
        setSelected(null);
        setAction(null);
      }
      if (e.key === "Tab") {
        const elements = focusables(),
          first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [modalOpen]);
  async function load() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    try {
      const results = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("store_settings").select("*").eq("id", 1).single(),
      ]);
      for (const r of results) if (r.error) throw r.error;
      setOrders(results[0].data as Order[]);
      setProducts(results[1].data as Product[]);
      setProfiles(results[2].data as Profile[]);
      setSettings(results[3].data as Settings);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile?.role]);
  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !editing) {
      notify("Conecta Supabase para guardar productos reales.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { id, ...rest } = editing;
      const { error } = await (id
        ? supabase.from("products").update(rest).eq("id", id)
        : supabase.from("products").insert(rest));
      if (error) throw error;
      setEditing(null);
      await load();
      await refresh();
      notify("Producto guardado.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function uploadImage(file: File) {
    if (!supabase || !editing) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Usa una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const path = crypto.randomUUID() + "." + file.type.split("/")[1];
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);
      setEditing((p) => (p ? { ...p, image_url: data.publicUrl } : p));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading(false);
    }
  }
  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      notify("Conecta Supabase para guardar la configuración.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("store_settings")
        .update(settings)
        .eq("id", 1);
      if (error) throw error;
      await refresh();
      notify("Configuración actualizada.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function transition(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !selected || !action) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.rpc("transition_order", {
        p_order_id: selected.id,
        p_status: action,
        p_note: String(f.get("note") || ""),
      });
      if (error) throw error;
      setSelected(null);
      setAction(null);
      await load();
      notify("Pedido actualizado.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function receipt(o: Order) {
    if (!supabase || !o.receipt_path) return;
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(o.receipt_path, 120);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function changeRole(p: Profile, role: string) {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("set_user_role", {
        p_user_id: p.id,
        p_role: role,
      });
      if (error) throw error;
      await load();
      notify("Permisos actualizados.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function exportOrders() {
    const escape = (v: unknown) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""') +
      '"';
    const csv =
      "\uFEFF" +
      [
        ["Pedido", "Fecha", "Cliente", "Teléfono", "Estado", "Total DOP"],
        ...orders.map((o) => [
          o.number,
          o.created_at,
          o.customer_name,
          o.phone,
          statuses[o.status],
          o.total,
        ]),
      ]
        .map((r) => r.map(escape).join(","))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "dajura-pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (authLoading) return <p className="loading">Verificando acceso…</p>;
  if (!isDemo && (!user || !profile))
    return (
      <Empty
        title={
          user ? "Verificando perfil administrativo" : "Acceso administrativo"
        }
        description={
          user
            ? "Si tu perfil no carga, vuelve a iniciar sesión."
            : "Inicia sesión con tu cuenta de administrador."
        }
        link="/cuenta"
        label="Ir a mi cuenta"
      />
    );
  if (!isDemo && profile?.role !== "admin")
    return (
      <Empty
        title="Este espacio es del equipo Dajura"
        description="Tu cuenta no tiene permisos administrativos."
        link="/cuenta"
        label="Volver a mi cuenta"
      />
    );
  const paid = orders.filter((o) =>
    ["confirmed", "shipped", "delivered"].includes(o.status),
  );
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const filtered = orders.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (String(o.number) + " " + o.customer_name + " " + o.phone)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const tabs: [Tab, typeof Package, string][] = [
    ["overview", LayoutDashboard, "Vista general"],
    ["orders", ShoppingBag, "Pedidos"],
    ["products", Package, "Productos"],
    ["customers", Users, "Usuarios"],
    ["settings", SettingsIcon, "Configuración"],
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo">
          <img src="/logo.jpeg" alt="Dajura" />
        </Link>
        <span className="admin-label">CENTRO DE ADMINISTRACIÓN</span>
        <nav>
          {tabs.map(([id, Icon, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setError("");
              }}
            >
              <Icon size={19} />
              {label}
              {id === "orders" &&
                orders.some((o) => o.status === "payment_review") && (
                  <b>
                    {orders.filter((o) => o.status === "payment_review").length}
                  </b>
                )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">
            Ver mi tienda <ArrowUpRight size={16} />
          </Link>
          <button onClick={() => void signOut()}>
            <LogOut size={16} /> Cerrar sesión
          </button>
          <small>
            Dajura Comercial S.R.L.
            <br />
            RNC 132157682
          </small>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <span>Tu negocio, en un solo lugar.</span>
          <div>
            <span className="admin-avatar">
              {profile?.full_name?.slice(0, 1) || "D"}
            </span>
            <strong>
              {profile?.full_name || "Dajura Comercial"}
              <small>Administrador{isDemo ? " · demostración" : ""}</small>
            </strong>
          </div>
        </header>
        <div className="admin-content">
          {isDemo && (
            <div className="info-banner">
              Dashboard de demostración. Conecta Supabase para gestionar ventas
              reales. Los datos de clientes y ventas no están simulados.
            </div>
          )}
          <div className="section-heading">
            <div>
              <span className="eyebrow">DAJURA / ADMINISTRACIÓN</span>
              <h1>{tabs.find((x) => x[0] === tab)?.[2]}</h1>
              <p>
                {tab === "overview"
                  ? "Así va tu tienda. Cada pedido cuenta."
                  : tab === "orders"
                    ? "Confirma el abono, prepara el pedido y coordina su entrega."
                    : tab === "products"
                      ? "Un catálogo cuidado es el comienzo de una buena venta."
                      : tab === "customers"
                        ? "Las personas que confían en Dajura."
                        : "Los detalles que hacen funcionar tu tienda."}
              </p>
            </div>
            <button
              className="icon-button"
              onClick={() => void load()}
              disabled={busy}
              aria-label="Actualizar dashboard"
            >
              <RefreshCw size={20} />
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {tab === "overview" && (
            <>
              <div className="stats-grid">
                {[
                  [money(revenue), "Ventas confirmadas", ShoppingBag],
                  [
                    orders.filter((o) => o.status === "payment_review").length,
                    "Pagos por revisar",
                    CheckCircle2,
                  ],
                  [
                    orders.filter((o) => o.status === "confirmed").length,
                    "Listos para preparar",
                    Truck,
                  ],
                  [
                    products.filter((p) => p.active).length,
                    "Productos activos",
                    Package,
                  ],
                ].map(([value, label, Icon]) => {
                  const I = Icon as typeof Package;
                  return (
                    <div className="stat-card" key={String(label)}>
                      <div>
                        <span>{String(label)}</span>
                        <I size={20} />
                      </div>
                      <strong>{String(value)}</strong>
                      <small>
                        {label === "Productos activos"
                          ? "En tu catálogo"
                          : "Todos los períodos"}
                      </small>
                    </div>
                  );
                })}
              </div>
              <div className="admin-panel">
                <div className="section-heading">
                  <h2>Pedidos recientes</h2>
                  <button
                    className="text-button"
                    onClick={() => setTab("orders")}
                  >
                    Ver todos →
                  </button>
                </div>
                {orders.length ? (
                  <OrderTable
                    orders={orders.slice(0, 6)}
                    onSelect={setSelected}
                  />
                ) : (
                  <div className="admin-empty">
                    <ShoppingBag size={35} />
                    <h3>Todo listo para el primer pedido</h3>
                    <p>Las compras de tus clientes aparecerán aquí.</p>
                  </div>
                )}
              </div>
              <div className="admin-panels">
                <div className="admin-panel">
                  <h2>El recorrido de un pedido</h2>
                  <ol className="workflow-list">
                    <li>
                      <span>1</span>El cliente crea su pedido y transfiere.
                    </li>
                    <li>
                      <span>2</span>Revisas el comprobante y verificas el abono.
                    </li>
                    <li>
                      <span>3</span>Confirmas el pago y preparas la compra.
                    </li>
                    <li>
                      <span>4</span>Registras el envío o la entrega en tienda.
                    </li>
                  </ol>
                </div>
                <div className="admin-panel">
                  <h2>Atención al inventario</h2>
                  {products.filter((p) => p.active && p.stock < 5).length ? (
                    products
                      .filter((p) => p.active && p.stock < 5)
                      .map((p) => (
                        <div className="low-stock" key={p.id}>
                          <span>{p.name}</span>
                          <b>{p.stock} unidades</b>
                        </div>
                      ))
                  ) : (
                    <p>
                      Los productos activos tienen disponibilidad suficiente.
                    </p>
                  )}
                  <button
                    className="text-button"
                    onClick={() => setTab("products")}
                  >
                    Administrar catálogo →
                  </button>
                </div>
              </div>
            </>
          )}
          {tab === "orders" && (
            <div className="admin-panel">
              <div className="admin-toolbar">
                <input
                  aria-label="Buscar pedidos"
                  placeholder="Buscar pedido, cliente o teléfono…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  aria-label="Filtrar estado"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  {Object.entries(statuses).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button className="button outline" onClick={exportOrders}>
                  <Download size={16} /> Exportar
                </button>
              </div>
              <OrderTable orders={filtered} onSelect={setSelected} />
              {!filtered.length && (
                <p className="admin-empty">
                  No hay pedidos que coincidan con estos filtros.
                </p>
              )}
            </div>
          )}
          {tab === "products" && (
            <div className="admin-panel">
              <div className="section-heading">
                <h2>Catálogo ({products.length})</h2>
                <button
                  className="button primary"
                  onClick={() => setEditing({ ...blankProduct })}
                >
                  <Plus size={17} /> Nuevo producto
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Editar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="table-product">
                            <img src={p.image_url} alt="" />
                            <span>
                              <strong>{p.name}</strong>
                              <small>
                                {p.sku} · {p.category}
                              </small>
                            </span>
                          </div>
                        </td>
                        <td>{money(p.price)}</td>
                        <td>{p.stock}</td>
                        <td>
                          <span
                            className={
                              "status " + (p.active ? "confirmed" : "cancelled")
                            }
                          >
                            {p.active ? "Activo" : "Archivado"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={"Editar " + p.name}
                            onClick={() => setEditing({ ...p })}
                          >
                            <Pencil size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === "customers" && (
            <div className="admin-panel">
              <div className="section-heading">
                <h2>Usuarios registrados ({profiles.length})</h2>
                <Link className="button outline" to="/cuenta">
                  Registro de clientes <ArrowUpRight size={17} />
                </Link>
              </div>
              <p>
                Los clientes crean sus cuentas desde la tienda. Aquí puedes
                asignar o retirar acceso al panel.
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Registro</th>
                      <th>Permisos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr key={p.id}>
                        <td>{p.full_name}</td>
                        <td>{p.phone}</td>
                        <td>
                          {new Date(p.created_at).toLocaleDateString("es-DO")}
                        </td>
                        <td>
                          <select
                            aria-label={"Permisos de " + p.full_name}
                            value={p.role}
                            disabled={p.id === user?.id || busy}
                            onChange={(e) => void changeRole(p, e.target.value)}
                          >
                            <option value="customer">Cliente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!profiles.length && (
                <p className="admin-empty">Aún no hay usuarios registrados.</p>
              )}
            </div>
          )}
          {tab === "settings" && (
            <form className="admin-panel settings-form" onSubmit={saveSettings}>
              <h2>Cuenta para transferencias</h2>
              <p>
                Estos datos se muestran a los clientes al crear un pedido.
                Verifícalos cuidadosamente.
              </p>
              <div className="form-grid">
                <label>
                  Banco
                  <input
                    required
                    value={settings.bank_name}
                    onChange={(e) =>
                      setSettings({ ...settings, bank_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Titular
                  <input
                    required
                    value={settings.bank_holder}
                    onChange={(e) =>
                      setSettings({ ...settings, bank_holder: e.target.value })
                    }
                  />
                </label>
                <label>
                  Número de cuenta
                  <input
                    required
                    value={settings.bank_account}
                    onChange={(e) =>
                      setSettings({ ...settings, bank_account: e.target.value })
                    }
                  />
                </label>
                <label>
                  Tipo de cuenta
                  <select
                    value={settings.account_type}
                    onChange={(e) =>
                      setSettings({ ...settings, account_type: e.target.value })
                    }
                  >
                    <option>Corriente</option>
                    <option>Ahorros</option>
                  </select>
                </label>
              </div>
              <label>
                Instrucciones para el cliente
                <textarea
                  value={settings.payment_instructions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment_instructions: e.target.value,
                    })
                  }
                />
              </label>
              <h2>Entregas</h2>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.delivery_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      delivery_enabled: e.target.checked,
                    })
                  }
                />{" "}
                Habilitar entrega a domicilio
              </label>
              <label>
                Tarifa fija de entrega (RD$)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={settings.shipping_fee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shipping_fee: Number(e.target.value),
                    })
                  }
                />
              </label>
              <p>
                El retiro en tienda siempre está disponible sin costo. La tarifa
                de entrega se incluye en el total antes de confirmar el pedido.
              </p>
              <button className="button primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar configuración"}
              </button>
            </form>
          )}
        </div>
      </main>
      {editing && (
        <div className="modal-overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-edit-title"
            className="modal"
          >
            <div className="section-heading">
              <h2 id="product-edit-title">
                {editing.id ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <form onSubmit={saveProduct}>
              <label>
                Nombre
                <input
                  required
                  maxLength={160}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  SKU / Referencia
                  <input
                    required
                    value={editing.sku}
                    onChange={(e) =>
                      setEditing({ ...editing, sku: e.target.value })
                    }
                  />
                </label>
                <label>
                  Categoría
                  <select
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  >
                    {categories.slice(1).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Precio RD$
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Precio anterior (opcional)
                  <input
                    type="number"
                    min={editing.price}
                    step="0.01"
                    value={editing.old_price ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        old_price: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </label>
                <label>
                  Stock
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={editing.stock}
                    onChange={(e) =>
                      setEditing({ ...editing, stock: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Etiqueta
                  <input
                    maxLength={40}
                    value={editing.badge}
                    onChange={(e) =>
                      setEditing({ ...editing, badge: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Descripción
                <textarea
                  required
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </label>
              <label>
                Imagen (URL https o ruta /)
                <input
                  required
                  pattern="(https://.*|/.*)"
                  value={editing.image_url}
                  onChange={(e) =>
                    setEditing({ ...editing, image_url: e.target.value })
                  }
                />
              </label>
              <label className="upload-label">
                <ImagePlus size={18} />{" "}
                {uploading ? "Subiendo imagen…" : "O sube una fotografía"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isDemo || uploading}
                  onChange={(e) =>
                    e.target.files?.[0] && void uploadImage(e.target.files[0])
                  }
                />
              </label>
              <div className="form-grid">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editing.active}
                    onChange={(e) =>
                      setEditing({ ...editing, active: e.target.checked })
                    }
                  />{" "}
                  Visible en la tienda
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) =>
                      setEditing({ ...editing, featured: e.target.checked })
                    }
                  />{" "}
                  Destacar en portada
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button
                className="button primary full"
                disabled={busy || uploading}
              >
                {busy ? "Guardando…" : "Guardar producto"}
              </button>
            </form>
          </section>
        </div>
      )}
      {selected && (
        <div className="modal-overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-edit-title"
            className="modal"
          >
            <div className="section-heading">
              <h2 id="order-edit-title">Pedido #{selected.number}</h2>
              <button
                className="icon-button"
                aria-label="Cerrar"
                onClick={() => {
                  setSelected(null);
                  setAction(null);
                }}
              >
                <X />
              </button>
            </div>
            <span className={"status " + selected.status}>
              {statuses[selected.status]}
            </span>
            <h3>{selected.customer_name}</h3>
            <p>
              {selected.phone}
              <br />
              {selected.address}
            </p>
            {selected.notes && <p>Nota del cliente: {selected.notes}</p>}
            <div className="order-lines">
              {selected.items.map((x, i) => (
                <div key={i}>
                  <span>
                    {x.quantity} × {x.name}
                  </span>
                  <strong>{money(x.quantity * x.price)}</strong>
                </div>
              ))}
              <div>
                <span>Entrega</span>
                <strong>{money(selected.shipping_fee)}</strong>
              </div>
              <div>
                <strong>Total</strong>
                <strong>{money(selected.total)}</strong>
              </div>
            </div>
            {selected.receipt_path && (
              <button
                className="button outline"
                onClick={() => void receipt(selected)}
              >
                <Eye size={17} /> Ver comprobante privado
              </button>
            )}
            <div className="order-actions">
              {["pending_payment", "payment_review"].includes(
                selected.status,
              ) && (
                <button
                  className="button primary"
                  onClick={() => setAction("confirmed")}
                >
                  Confirmar abono recibido
                </button>
              )}
              {selected.status === "confirmed" && (
                <button
                  className="button primary"
                  onClick={() =>
                    setAction(
                      selected.delivery_method === "pickup"
                        ? "delivered"
                        : "shipped",
                    )
                  }
                >
                  {selected.delivery_method === "pickup"
                    ? "Registrar retiro"
                    : "Registrar envío"}
                </button>
              )}
              {selected.status === "shipped" && (
                <button
                  className="button primary"
                  onClick={() => setAction("delivered")}
                >
                  Confirmar entrega
                </button>
              )}
              {["pending_payment", "payment_review", "confirmed"].includes(
                selected.status,
              ) && (
                <button
                  className="button outline danger"
                  onClick={() => setAction("cancelled")}
                >
                  Cancelar pedido
                </button>
              )}
            </div>
            {action && (
              <form className="action-confirm" onSubmit={transition}>
                <h3>
                  {action === "confirmed"
                    ? "Confirma la recepción del dinero"
                    : action === "cancelled"
                      ? "Cancelar y devolver stock"
                      : action === "shipped"
                        ? "Datos del envío"
                        : "Confirmar entrega al cliente"}
                </h3>
                {action === "confirmed" && (
                  <label className="checkbox-label">
                    <input type="checkbox" required /> He verificado en la
                    cuenta bancaria de Dajura el abono completo de{" "}
                    {money(selected.total)}.
                  </label>
                )}
                {action === "cancelled" && selected.payment_confirmed_at && (
                  <p className="info-banner">
                    Este pedido ya tiene un pago confirmado. La cancelación no
                    devuelve dinero automáticamente: gestiona el reembolso con
                    el cliente.
                  </p>
                )}
                <label>
                  {action === "shipped"
                    ? "Transportista, referencia y detalles"
                    : action === "cancelled"
                      ? "Motivo de cancelación"
                      : "Nota de confirmación (opcional)"}
                  <textarea
                    name="note"
                    required={["shipped", "cancelled"].includes(action)}
                    maxLength={1000}
                  />
                </label>
                <button className="button primary" disabled={busy}>
                  {busy ? "Procesando…" : "Confirmar cambio"}
                </button>
              </form>
            )}
            {error && <p className="form-error">{error}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
function OrderTable({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (o: Order) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>#{o.number}</strong>
                <small>
                  {new Date(o.created_at).toLocaleDateString("es-DO")}
                </small>
              </td>
              <td>{o.customer_name}</td>
              <td>
                <span className={"status " + o.status}>
                  {statuses[o.status]}
                </span>
              </td>
              <td>
                <strong>{money(o.total)}</strong>
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={"Ver pedido " + o.number}
                  onClick={() => onSelect(o)}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
