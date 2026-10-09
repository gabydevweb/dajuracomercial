import type { CartItem } from "./types";

// Calculate in cents so the total sent to PostgreSQL matches its numeric value.
export function cartTotal(cart: CartItem[], shipping = 0) {
  return (
    cart.reduce(
      (total, item) =>
        total + Math.round(item.product.price * 100) * item.quantity,
      Math.round(shipping * 100),
    ) / 100
  );
}
