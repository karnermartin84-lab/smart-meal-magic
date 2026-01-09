import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type VibeFilter = 'comfort' | 'brainpower' | 'vacation' | 'quick' | null;

interface ChatRequest {
  messages: ChatMessage[];
  vibeFilter?: VibeFilter;
  fridgeItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories_per_serving: number;
    protein_per_serving: number;
    carbs_per_serving: number;
    fat_per_serving: number;
  }>;
  pantryItems: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    calories_per_serving: number;
    protein_per_serving: number;
    carbs_per_serving: number;
    fat_per_serving: number;
  }>;
}

const vibeDescriptions: Record<NonNullable<VibeFilter>, string> = {
  comfort: `🍲 COMFORT FOOD VIBE: The user wants hearty, soul-warming comfort food. Think:
- High calorie, rich dishes (800-1500+ kcal)
- Mac and cheese, lasagna, pot pies, mashed potatoes, fried chicken
- Creamy sauces, melted cheese, buttery goodness
- Foods that feel like a warm hug`,
  brainpower: `🧠 BRAIN POWER VIBE: The user wants food for mental clarity and focus. Prioritize:
- Omega-3 rich foods: salmon, sardines, mackerel, walnuts, flaxseed
- Antioxidant-rich berries, dark leafy greens
- Healthy fats: avocado, olive oil, nuts
- Complex carbs for sustained energy
- Foods known to support cognitive function`,
  vacation: `🌴 VACATION VIBES: The user wants tropical, exotic, vacation-inspired flavors. Think:
- Tropical fruits: mango, pineapple, coconut, papaya, passion fruit
- Caribbean, Hawaiian, Thai, Mediterranean influences
- Fresh, bright, citrusy flavors
- Seafood with tropical twists
- Dishes that feel like a beach getaway`,
  quick: `⚡ TOO TIRED TO COOK: The user is exhausted. Create meals that are:
- Ready in under 10 minutes
- Minimal ingredients (5 or fewer ideally)
- Simple techniques: no complex prep
- One-pan or no-cook options
- Microwave-friendly or just-assemble dishes
- Focus on convenience without sacrificing taste`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, vibeFilter, fridgeItems, pantryItems }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const fridgeList = fridgeItems.map(item =>
      `- ${item.name}: ${item.quantity} ${item.unit} (${item.calories_per_serving} kcal, ${item.protein_per_serving}g P, ${item.carbs_per_serving}g C, ${item.fat_per_serving}g F per serving)`
    ).join('\n');

    const pantryList = pantryItems.map(item =>
      `- ${item.name} (${item.category}): ${item.quantity} ${item.unit}`
    ).join('\n');

    // Build vibe-specific instructions
    const vibeSection = vibeFilter && vibeDescriptions[vibeFilter] 
      ? `\n=== CURRENT VIBE FILTER ===\n${vibeDescriptions[vibeFilter]}\n\nIMPORTANT: Apply this vibe to ALL meal suggestions unless the user explicitly asks for something different!\n`
      : '';

    const systemPrompt = `You are an enthusiastic, can-do personal chef AI assistant. You ALWAYS fulfill recipe requests - no exceptions!

The user has the following items available (use these to save them money when possible):

=== FRIDGE (Fresh Items) ===
${fridgeList || "Empty - that's okay, we'll add items to the shopping list!"}

=== PANTRY (Staples) ===
${pantryList || "Empty - that's okay, we'll add items to the shopping list!"}
${vibeSection}
=== CRITICAL RULES - NEVER BREAK THESE ===

1. **NEVER REFUSE A REQUEST**: You can make ANY recipe the user asks for. Even if they have zero ingredients, say "I can make that for you! I'll list the ingredients you need to buy."

2. **NO "SORRY" OR REJECTION MESSAGES**: Never say things like:
   - "I can't make that because you don't have..."
   - "Unfortunately, you're missing..."
   - "Sorry, but without X ingredient..."
   Instead, always be positive: "Great choice! Here's the recipe - I've noted which ingredients you'll need to pick up."

3. **ALWAYS OUTPUT A RECIPE JSON** when asked to cook something. Format:
\`\`\`json
{
  "name": "Recipe Name",
  "description": "Brief appetizing description",
  "cookingStyle": "quick|simple|cooked|slow-cook|no-cook",
  "mealType": "breakfast|lunch|dinner|snack",
  "servings": 2,
  "prepTime": "5 mins",
  "ingredientsHave": [
    { "name": "ingredient from fridge/pantry", "quantity": 1, "unit": "cup", "calories": 100, "protein": 5, "carbs": 10, "fat": 3 }
  ],
  "ingredientsMissing": [
    { "name": "ingredient to buy", "quantity": 1, "unit": "cup", "calories": 50, "protein": 2, "carbs": 8, "fat": 1 }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "totalMacros": { "calories": 800, "protein": 40, "carbs": 60, "fat": 30 },
  "vibeMatch": "${vibeFilter || 'none'}"
}
\`\`\`

4. **SMART SHOPPING**: 
   - "ingredientsHave" = items from their fridge/pantry (saves money!)
   - "ingredientsMissing" = items they need to buy (will be auto-added to shopping list)
   - It's PERFECTLY FINE if ingredientsMissing has many items - that's what shopping is for!

5. **PRIORITIZE BUT DON'T LIMIT**: Try to use available ingredients first to save money, but ALWAYS make the recipe the user wants, even if it requires buying everything.

6. **CALORIE FLEXIBILITY**: Honor any calorie request. 400 kcal? Done. 1500 kcal? Absolutely. Make diverse meals: pastas, burgers, steaks, curries, stir-fries, desserts - anything!

7. **BE ENTHUSIASTIC**: You love cooking! When the user asks for a recipe, respond with excitement: "Ooh, great choice!" or "That sounds delicious, let's make it!"

8. **VIBE AWARENESS**: If a vibe filter is active, acknowledge it! Say things like "Perfect for some comfort food!" or "This will definitely fuel your brain!" or "Getting those vacation vibes! 🌴"

Remember: You're a personal chef who makes dreams come true. There's no recipe you can't create - shopping lists exist for a reason!`;

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
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in ai-chef-chat:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
