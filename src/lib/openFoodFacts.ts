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
    // Some products also have per-serving values
    'energy-kcal_serving'?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
  };
  serving_size: string | null;
  serving_quantity?: number; // grams per serving if available
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

/**
 * Parse a serving size string like "100g", "1 egg (44g)", "30 g" into grams.
 * Returns null if unparseable.
 */
function parseServingSizeGrams(servingSize: string | null | undefined): number | null {
  if (!servingSize) return null;
  
  // Try to find a number followed by 'g' (grams)
  // Handles: "100g", "30 g", "1 egg (44g)", "2 slices (56 g)"
  const matches = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g(?:rams?)?/i);
  if (matches) {
    return parseFloat(matches[1].replace(',', '.'));
  }
  
  // Try to find ml for liquids (approximate 1ml = 1g)
  const mlMatches = servingSize.match(/(\d+(?:[.,]\d+)?)\s*ml/i);
  if (mlMatches) {
    return parseFloat(mlMatches[1].replace(',', '.'));
  }
  
  return null;
}

/**
 * Convert per-100g nutrition values to per-serving values.
 */
function convertPer100gToPerServing(
  per100g: number,
  servingGrams: number
): number {
  return Math.round((per100g * servingGrams / 100) * 10) / 10;
}

export function convertToFridgeItem(product: FoodProduct) {
  const n = product.nutriments || {} as FoodProduct['nutriments'];
  
  // Try to get serving size in grams
  const servingSizeStr = product.serving_size || '100g';
  let servingGrams = product.serving_quantity || parseServingSizeGrams(servingSizeStr);
  
  // If we can't parse the serving size, default to 100g
  if (!servingGrams || servingGrams <= 0) {
    servingGrams = 100;
  }
  
  // Prefer per-serving values if available from the API, otherwise calculate from per-100g
  const hasPerServing = n['energy-kcal_serving'] !== undefined;
  
  let calories: number;
  let protein: number;
  let carbs: number;
  let fat: number;
  
  if (hasPerServing && n['energy-kcal_serving']) {
    // Use the API's per-serving values directly
    calories = Math.round(n['energy-kcal_serving'] || 0);
    protein = Math.round((n.proteins_serving || 0) * 10) / 10;
    carbs = Math.round((n.carbohydrates_serving || 0) * 10) / 10;
    fat = Math.round((n.fat_serving || 0) * 10) / 10;
  } else {
    // Convert from per-100g to per-serving
    calories = Math.round(convertPer100gToPerServing(n['energy-kcal_100g'] || 0, servingGrams));
    protein = convertPer100gToPerServing(n.proteins_100g || 0, servingGrams);
    carbs = convertPer100gToPerServing(n.carbohydrates_100g || 0, servingGrams);
    fat = convertPer100gToPerServing(n.fat_100g || 0, servingGrams);
  }
  
  return {
    barcode: product.code,
    name: product.product_name || 'Unknown Product',
    brand: product.brands || null,
    quantity: 1,
    unit: 'serving',
    calories_per_serving: calories,
    protein_per_serving: protein,
    carbs_per_serving: carbs,
    fat_per_serving: fat,
    serving_size: servingSizeStr,
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
