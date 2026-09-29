import type { Product, Settings, OrderStatus } from "./types";
export const money = (amount: number) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(amount);
export const whatsapp = "https://wa.me/18496284599";
export const categories = [
  "Todos",
  "Electrodomésticos",
  "Cocina",
  "Hogar",
  "Tecnología",
];
export const defaultSettings: Settings = {
  id: 1,
  bank_name: "",
  bank_account: "",
  bank_holder: "Dajura Comercial",
  account_type: "Corriente",
  shipping_fee: 0,
  delivery_enabled: false,
  payment_instructions:
    "Incluye el número de tu pedido en el concepto de la transferencia. Verificaremos el abono antes de preparar tu compra.",
};
export const statuses: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  payment_review: "Pago en revisión",
  confirmed: "Pago confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
export const demoProducts: Product[] = [
  {
    id: "demo-1",
    name: "Nevera French Door 22 pies",
    category: "Electrodomésticos",
    description:
      "Espacio para todo lo que te gusta. Diseño de puertas francesas, acabado en acero inoxidable y organización inteligente. Producto ilustrativo: especificaciones y precio sujetos al catálogo real.",
    price: 62900,
    old_price: 69900,
    stock: 8,
    image_url: "/products/fridge.svg",
    active: true,
    featured: true,
    badge: "Favorito para tu hogar",
    sku: "DC-001",
  },
  {
    id: "demo-2",
    name: "Lavadora automática 18 kg",
    category: "Electrodomésticos",
    description:
      "Una aliada para el día a día. Carga superior y un diseño práctico para tu hogar. Producto de demostración.",
    price: 24900,
    old_price: 27900,
    stock: 12,
    image_url: "/products/washer.svg",
    active: true,
    featured: true,
    badge: "Más comodidad",
    sku: "DC-002",
  },
  {
    id: "demo-3",
    name: "Estufa de gas 30 pulgadas",
    category: "Cocina",
    description:
      "El punto de encuentro de tus mejores recetas. Acabado elegante y horno de gran capacidad. Producto de demostración.",
    price: 22500,
    old_price: null,
    stock: 6,
    image_url: "/products/stove.svg",
    active: true,
    featured: true,
    badge: "Para compartir",
    sku: "DC-003",
  },
  {
    id: "demo-4",
    name: "Smart TV 50” 4K UHD",
    category: "Tecnología",
    description:
      "Tus series, películas y momentos favoritos en una pantalla más grande. Producto de demostración.",
    price: 23900,
    old_price: 26900,
    stock: 10,
    image_url: "/products/tv.svg",
    active: true,
    featured: true,
    badge: "Tu entretenimiento",
    sku: "DC-004",
  },
  {
    id: "demo-5",
    name: "Licuadora de vaso 1.5 L",
    category: "Cocina",
    description:
      "Dale un comienzo fresco a tus mañanas. Vaso de gran capacidad y control de velocidades. Producto de demostración.",
    price: 3490,
    old_price: null,
    stock: 20,
    image_url: "/products/blender.svg",
    active: true,
    featured: false,
    badge: "Para cada día",
    sku: "DC-005",
  },
  {
    id: "demo-6",
    name: "Abanico de pedestal 18”",
    category: "Hogar",
    description:
      "Un ambiente más fresco en tu espacio favorito. Altura regulable y base estable. Producto de demostración.",
    price: 2950,
    old_price: 3500,
    stock: 15,
    image_url: "/products/fan.svg",
    active: true,
    featured: false,
    badge: "Esencial del hogar",
    sku: "DC-006",
  },
];
