import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const demoPreview = import.meta.env.DEV && import.meta.env.MODE === "demo";
export const supabase =
  url && key && !demoPreview ? createClient(url, key) : null;
export const isDemo = !supabase;
export function errorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "No pudimos completar la acción. Inténtalo de nuevo.";
  const translations: Record<string, string> = {
    "Invalid login credentials": "El correo o la contraseña no son correctos.",
    "Email not confirmed": "Confirma tu correo antes de iniciar sesión.",
    "User already registered":
      "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
    "Failed to fetch":
      "No pudimos conectar con la tienda. Comprueba tu conexión y vuelve a intentarlo.",
    "Email rate limit exceeded":
      "No se pudo enviar el correo en este momento. Inténtalo más tarde o contacta con Dajura.",
    "New password should be different from the old password.":
      "La nueva contraseña debe ser diferente de la anterior.",
  };
  if (
    /email address.*not authorized|error sending recovery email/i.test(message)
  ) {
    return "No pudimos enviar el correo de recuperación. Contacta con Dajura para recibir ayuda.";
  }
  return translations[message] || message;
}
