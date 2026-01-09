import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FridgeItem {
  name: string;
  quantity: number;
  unit: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
}

interface MealRequest {
  fridgeItems: FridgeItem[];
  preferences: {
    mealType: 'any' | 'healthy' | 'comfort';
    onlyUseAvailable: boolean;
    count: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fridgeItems, preferences }: MealRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const itemsList = fridgeItems.map(item => 
      `- ${item.name}: ${item.quantity} ${item.unit} (${item.calories_per_serving} kcal, ${item.protein_per_serving}g protein, ${item.carbs_per_serving}g carbs, ${item.fat_per_serving}g fat per serving)`
    ).join('\n');

    const mealTypePrompt = preferences.mealType === 'healthy' 
      ? 'Focus on healthy, nutritious meals with high protein, balanced macros, or lower calories.'
      : preferences.mealType === 'comfort'
      ? 'Focus on comfort food, indulgent meals, and satisfying dishes that may be higher in calories.'
      : 'Include a mix of healthy and comfort food options.';

    const ingredientPrompt = preferences.onlyUseAvailable
      ? 'ONLY use the ingredients from the fridge list. Do not suggest any additional ingredients.'
      : 'Use the fridge ingredients as the base, but you may suggest common pantry items (oil, salt, pepper, flour, sugar, spices, garlic, onion, butter, milk, eggs if not in list) or optional ingredients the user might want to buy.';

    const systemPrompt = `You are a creative chef assistant that generates realistic, cookable meal ideas based on available ingredients.

Your task is to suggest ${preferences.count} complete meal ideas.

${mealTypePrompt}
${ingredientPrompt}

For each meal, provide:
1. A creative, appetizing meal name
2. A short description (1-2 sentences)
3. Cooking style: one of "quick" (under 15 min), "simple" (15-30 min), "cooked" (30-60 min), "slow-cook" (1+ hour), "no-cook" (no cooking required)
4. Meal type: breakfast, lunch, dinner, or snack
5. Ingredients split into:
   - "have": ingredients from the fridge list with quantities to use
   - "pantry": common pantry items assumed available (only if onlyUseAvailable is false)
   - "missing": optional ingredients the user might want to buy (only if onlyUseAvailable is false)
6. Brief cooking instructions (2-4 steps)
7. Estimated total macros for the meal

IMPORTANT: 
- Be realistic about what can be made with the given ingredients
- Calculate macros based on the nutritional info provided
- For pantry items, use reasonable estimates (1 tbsp oil = 120 kcal, 14g fat; salt/pepper = 0 kcal; 1 clove garlic = 4 kcal)
- Make meals varied - don't repeat similar dishes`;

    const userPrompt = `Here are the available fridge items:

${itemsList}

Generate ${preferences.count} meal ideas as a JSON array. Each meal should have this structure:
{
  "name": "Meal Name",
  "description": "Short appetizing description",
  "cookingStyle": "quick|simple|cooked|slow-cook|no-cook",
  "mealType": "breakfast|lunch|dinner|snack",
  "ingredients": {
    "have": [{ "name": "ingredient", "quantity": 1, "unit": "serving", "calories": 100, "protein": 10, "carbs": 5, "fat": 3 }],
    "pantry": [{ "name": "ingredient", "quantity": 1, "unit": "tbsp", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }],
    "missing": [{ "name": "ingredient", "quantity": 1, "unit": "piece", "calories": 50, "protein": 5, "carbs": 5, "fat": 2 }]
  },
  "instructions": ["Step 1", "Step 2"],
  "totalMacros": { "calories": 500, "protein": 40, "carbs": 30, "fat": 20 },
  "servings": 1
}

Return ONLY the JSON array, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let meals = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        meals = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Content:", content);
      return new Response(JSON.stringify({ 
        error: "Failed to parse meal suggestions. Please try again.",
        meals: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ meals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-meal-ideas:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      meals: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
