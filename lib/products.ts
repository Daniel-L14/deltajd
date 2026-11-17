export interface Product {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: number;
  stock: number;
  description: string;
  is_active: boolean;
  image_url: string | null;
  presentation_ml: number | null;
  concentration: string;
  notes: string;
  budget_category: string;
  occasion: string;
  climate_preference: string;
}
export const PRODUCT_COLUMNS =
  "id,name,brand,family,price,stock,description,is_active,image_url,presentation_ml,concentration,notes,budget_category,occasion,climate_preference";
export const FAMILIES = [
  "Amaderada",
  "Cítrica",
  "Oriental",
  "Floral",
  "Dulce/Gourmand",
  "Orientales & Madera",
  "Extractos Concentrados",
  "Cítricos & Florales",
];

export function matchingFamilies(family: string): string[] {
  switch (family) {
    case "Amaderada":
    case "Oriental":
      return [family, "Orientales & Madera"];
    case "Cítrica":
    case "Floral":
      return [family, "Cítricos & Florales"];
    default:
      return [family];
  }
}

export interface Preferences {
  budget: string;
  family: string;
  occasion: string;
  climate: string;
}
export const BUDGET_LABELS = {
  ECONOMICO: "Económico · menos de $50.000",
  MEDIO: "Medio · $50.000 a menos de $100.000",
  PREMIUM: "Premium · desde $100.000",
};

function priceBudget(price: number) {
  if (price < 50000) return "ECONOMICO";
  if (price < 100000) return "MEDIO";
  return "PREMIUM";
}

export function rankProducts(products: Product[], p: Preferences) {
  const families = matchingFamilies(p.family);
  return products
    .filter(
      (product) =>
        product.is_active &&
        product.stock > 0 &&
        (product.budget_category === p.budget ||
          (product.budget_category === "SIN_CLASIFICAR" &&
            product.price > 0 &&
            priceBudget(product.price) === p.budget)),
    )
    .map((product) => {
      let score = 25;
      const reasons = [
        product.budget_category === "SIN_CLASIFICAR"
          ? "El precio está dentro de tu rango de presupuesto"
          : "Coincide con tu categoría de presupuesto",
      ];
      if (families.includes(product.family)) {
        score += 40;
        reasons.push("Coincide con tu familia olfativa");
      }
      if (product.occasion === p.occasion || product.occasion === "Todas") {
        score += 20;
        reasons.push("Adecuado según la ocasión registrada");
      }
      if (
        product.climate_preference === p.climate ||
        product.climate_preference === "TODOS"
      ) {
        score += 15;
        reasons.push("Coincide con el clima seleccionado");
      }
      return { product, score, reasons };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.product.price - b.product.price ||
        a.product.id.localeCompare(b.product.id),
    )
    .slice(0, 6);
}
