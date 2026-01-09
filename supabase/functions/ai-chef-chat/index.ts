import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, fridgeItems, pantryItems }: ChatRequest = await req.json();
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

    const systemPrompt = `You are a friendly personal chef AI assistant. You help users plan meals, create recipes, and answer cooking questions.

The user has the following items available:

=== FRIDGE (Fresh Items) ===
${fridgeList || "No fridge items"}

=== PANTRY (Staples) ===
${pantryList || "No pantry items"}

IMPORTANT GUIDELINES:
1. When asked to create a recipe, you MUST output a JSON block that can be parsed. Format it as:
\`\`\`json
{
  "name": "Recipe Name",
  "description": "Brief appetizing description",
  "cookingStyle": "quick|simple|cooked|slow-cook|no-cook",
  "mealType": "breakfast|lunch|dinner|snack",
  "servings": 2,
  "ingredients": [
    { "name": "ingredient", "quantity": 1, "unit": "cup", "calories": 100, "protein": 5, "carbs": 10, "fat": 3 }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "totalMacros": { "calories": 800, "protein": 40, "carbs": 60, "fat": 30 }
}
\`\`\`

2. Respect calorie requests! If someone asks for 800-1200+ calories, create hearty, substantial meals. Don't default to low-calorie options.
3. Include diverse meals: pastas, burgers, steaks, rice bowls, sandwiches, etc. - not just salads and light meals.
4. Be realistic about portions and macros. A hearty pasta should be 700-1000+ kcal.
5. Use the available ingredients as much as possible, but suggest additional items if needed.
6. Be conversational and helpful. You can discuss cooking tips, substitutions, and more.
7. When calculating macros, be accurate based on ingredient amounts.

Remember: You're a personal chef who understands that people have different goals - muscle gain, high-energy lifestyles, comfort eating, etc. Cater to what they ask for!`;

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
