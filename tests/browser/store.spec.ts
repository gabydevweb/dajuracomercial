import { test, expect } from "@playwright/test";
test("textos íntegros, pantallas pequeñas y diálogo accesible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ["/", "/carrito", "/checkout", "/admin"]) {
    await page.goto(route);
    expect(await page.locator("body").innerText()).not.toMatch(
      /[\uFFFD\u2B26\u0014\u0019]/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Productos", exact: true }).click();
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await expect(
    page.getByRole("button", { name: "Cerrar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Nuevo producto" }),
  ).toBeFocused();
});
test("portada, catálogo y carrito persistente", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Los buenos/ })).toBeVisible();
  await page.getByRole("link", { name: "Encuentra lo tuyo" }).click();
  await expect(page.locator(".product-card")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Agregar Nevera French Door 22 pies" })
    .click();
  await page.getByRole("link", { name: "Carrito, 1 artículos" }).click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await page.reload();
  await expect(page.locator(".quantity span")).toHaveText("2");
  await page.getByRole("link", { name: "Continuar con mi pedido" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu tienda está tomando forma" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("búsqueda, categorías y ficha de producto", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Buscar productos" })
    .fill("lavadora");
  await page.getByRole("textbox", { name: "Buscar productos" }).press("Enter");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("heading", { name: "Lavadora automática 18 kg" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Lavadora automática 18 kg" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Agregar al carrito" }),
  ).toBeVisible();
  await page.goto("/tienda?categoria=Cocina");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Ordenar productos" })
    .selectOption("low");
  await expect(page.locator(".product-card h3").first()).toHaveText(
    "Licuadora de vaso 1.5 L",
  );
});
test("eliminar del carrito y estado vacío", async ({ page }) => {
  await page.goto("/tienda");
  await page
    .getByRole("button", { name: "Agregar Smart TV 50” 4K UHD" })
    .click();
  await page.goto("/carrito");
  await page
    .getByRole("button", { name: "Eliminar Smart TV 50” 4K UHD" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu carrito espera algo especial" }),
  ).toBeVisible();
});
test("formularios de cuenta y dashboard de demostración", async ({ page }) => {
  await page.goto("/cuenta");
  await page.getByRole("button", { name: "Regístrate", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Nombre completo" }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Vista general" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Productos", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Número de cuenta" }),
  ).toBeVisible();
});
test("móvil sin desbordamiento y navegación funcional", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/tienda",
    "/carrito",
    "/cuenta",
    "/admin",
    "/contacto",
  ]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .getByRole("link", { name: "Todos los productos", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Todo para vivir mejor." }),
  ).toBeVisible();
});
test("enlaces de contacto correctos y página desconocida", async ({ page }) => {
  await page.goto("/contacto");
  await expect(
    page.locator('.contact-grid a[href="tel:+18299533756"]'),
  ).toBeVisible();
  await expect(
    page.locator('.contact-grid a[href="https://wa.me/18496284599"]'),
  ).toBeVisible();
  await page.goto("/ruta-inexistente");
  await expect(
    page.getByRole("heading", { name: "Por aquí no era…" }),
  ).toBeVisible();
});
