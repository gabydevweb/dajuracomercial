import { describe, expect, it } from "vitest";
import { cartTotal } from "../src/orderMath";
import { money, demoProducts } from "../src/data";
import { fetchAll } from "../src/queries";

describe("Importes y consultas completas", () => {
  it("conserva centavos al multiplicar cantidades y sumar entrega", () => {
    expect(
      cartTotal(
        [
          { product: { ...demoProducts[0], price: 10.1 }, quantity: 3 },
          { product: { ...demoProducts[1], price: 19.99 }, quantity: 2 },
        ],
        0.05,
      ),
    ).toBe(70.33);
    expect(
      cartTotal([
        { product: { ...demoProducts[0], price: 10.1 }, quantity: 3 },
      ]),
    ).toBe(30.3);
  });
  it("muestra los centavos que el cliente debe transferir", () => {
    expect(money(1999.99)).toContain("1,999.99");
    expect(money(2000)).toContain("2,000.00");
  });
  it("recupera pedidos más allá del límite de mil filas", async () => {
    const rows = Array.from({ length: 2001 }, (_, id) => ({ id }));
    expect(
      await fetchAll(async (from, to) => ({
        data: rows.slice(from, to + 1),
        error: null,
      })),
    ).toEqual(rows);
  });
  it("no presenta un total parcial si falla una página", async () => {
    await expect(
      fetchAll(async (from) =>
        from === 0
          ? { data: Array(1000).fill({ id: 1 }), error: null }
          : { data: null, error: { message: "Connection failed" } },
      ),
    ).rejects.toEqual({ message: "Connection failed" });
  });
});
