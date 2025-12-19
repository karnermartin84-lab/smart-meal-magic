export interface FoodProduct {
  code: string;
  product_name: string;
  brands: string;
  image_url: string | null;
  nutriments: {
    'energy-kcal_100g': number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
  };
  serving_size: string | null;
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    return data.product as FoodProduct;
  } catch {
    return null;
  }
}

export function convertToFridgeItem(product: FoodProduct) {
  const n = product.nutriments || {} as FoodProduct['nutriments'];
  return {
    barcode: product.code,
    name: product.product_name || 'Unknown Product',
    brand: product.brands || null,
    quantity: 1,
    unit: 'serving',
    calories_per_serving: Math.round(n['energy-kcal_100g'] || 0),
    protein_per_serving: Math.round((n.proteins_100g || 0) * 10) / 10,
    carbs_per_serving: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat_per_serving: Math.round((n.fat_100g || 0) * 10) / 10,
    serving_size: product.serving_size || '100g',
    image_url: product.image_url || null,
    expires_at: null
  };
}

export async function searchFoods(query: string): Promise<FoodProduct[]> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.products || []) as FoodProduct[];
  } catch {
    return [];
  }
}
