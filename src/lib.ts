import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const demoPreview = import.meta.env.DEV && import.meta.env.MODE === "demo";
export const supabase =
  url && key && !demoPreview ? createClient(url, key) : null;
export const isDemo = !supabase;
export function errorMessage(error: unknown): string {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "No pudimos completar la acción. Inténtalo de nuevo.";
}
