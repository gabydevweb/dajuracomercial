import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { CartItem, Product, Profile, Settings } from "./types";
import { supabase, errorMessage } from "./lib";
import { defaultSettings, demoProducts } from "./data";
type Store = {
  products: Product[];
  settings: Settings;
  cart: CartItem[];
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authLoading: boolean;
  notice: string;
  notify: (s: string) => void;
  add: (p: Product, q?: number) => void;
  setQuantity: (id: string, q: number) => void;
  clearCart: () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<Store>(null!);
export const useStore = () => useContext(Context);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(
      supabase ? [] : demoProducts,
    ),
    [settings, setSettings] = useState(defaultSettings),
    [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(!!supabase),
    [authLoading, setAuthLoading] = useState(!!supabase),
    [notice, setNotice] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dajura-cart") || "[]");
      return Array.isArray(saved)
        ? saved.filter(
            (x: CartItem) =>
              x?.product?.id && Number.isInteger(x.quantity) && x.quantity > 0,
          )
        : [];
    } catch {
      return [];
    }
  });
  const notify = useCallback((s: string) => setNotice(s), []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("created_at"),
        supabase.from("store_settings").select("*").eq("id", 1).single(),
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      setProducts(p.data);
      setSettings(s.data);
      setCart((old) =>
        old.flatMap((item) => {
          const current = p.data.find(
            (product: Product) => product.id === item.product.id,
          );
          return current && current.stock > 0
            ? [
                {
                  product: current,
                  quantity: Math.min(item.quantity, current.stock),
                },
              ]
            : [];
        }),
      );
    } catch (e) {
      notify(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    void refresh();
    if (!supabase) return;
    let alive = true;
    const client = supabase;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });
    client.auth.getSession().then(({ data, error }) => {
      if (alive) {
        if (error) notify(errorMessage(error));
        setUser(data.session?.user ?? null);
        setAuthLoading(false);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [refresh, notify]);
  useEffect(() => {
    setProfile(null);
    if (!user || !supabase) return;
    let alive = true;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (alive) {
          if (error) notify(errorMessage(error));
          setProfile(data);
        }
      });
    return () => {
      alive = false;
    };
  }, [user, notify]);
  useEffect(() => {
    try {
      localStorage.setItem("dajura-cart", JSON.stringify(cart));
    } catch {
      /* El carrito sigue disponible durante esta sesión. */
    }
  }, [cart]);
  const add = (product: Product, quantity = 1) => {
    if (product.stock < 1) {
      notify("Este producto está agotado.");
      return;
    }
    setCart((old) => {
      const item = old.find((x) => x.product.id === product.id);
      return item
        ? old.map((x) =>
            x.product.id === product.id
              ? {
                  product,
                  quantity: Math.min(product.stock, x.quantity + quantity),
                }
              : x,
          )
        : [...old, { product, quantity: Math.min(quantity, product.stock) }];
    });
    notify("Producto agregado a tu carrito");
  };
  const setQuantity = (id: string, quantity: number) =>
    setCart((old) =>
      quantity <= 0
        ? old.filter((x) => x.product.id !== id)
        : old.map((x) =>
            x.product.id === id
              ? { ...x, quantity: Math.min(quantity, x.product.stock) }
              : x,
          ),
    );
  return (
    <Context.Provider
      value={{
        products,
        settings,
        cart,
        user,
        profile,
        loading,
        authLoading,
        notice,
        notify,
        add,
        setQuantity,
        clearCart: () => setCart([]),
        refresh,
        signOut: async () => {
          if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) {
              notify(errorMessage(error));
              return;
            }
          }
          setUser(null);
          setProfile(null);
          setCart([]);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
