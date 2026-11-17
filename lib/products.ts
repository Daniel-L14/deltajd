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
export interface Preferences {
  budget: string;
  family: string;
  occasion: string;
  climate: string;
}
export function rankProducts(products: Product[], p: Preferences) {
  const aliases: Record<string, string[]> = {
    Amaderada: ["Amaderada", "Orientales & Madera"],
    Oriental: ["Oriental", "Orientales & Madera"],
    Cítrica: ["Cítrica", "Cítricos & Florales"],
    Floral: ["Floral", "Cítricos & Florales"],
  };
  return products
    .filter((x) => x.is_active && x.stock > 0 && x.budget_category === p.budget)
    .map((product) => {
      let score = 25;
      const reasons = ["Coincide con tu categoría de presupuesto"];
      if ((aliases[p.family] ?? [p.family]).includes(product.family)) {
        score += 40;
        reasons.push("Coincide con tu familia olfativa");
      }
      if (product.occasion === p.occasion || product.occasion === "Todas") {
        score += 20;
        reasons.push("Adecuado según la ocasión registrada");
      }
      if (
        p.climate === "TODOS" ||
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
