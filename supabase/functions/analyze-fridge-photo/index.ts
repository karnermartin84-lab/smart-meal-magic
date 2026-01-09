import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FoodSuggestion {
  name: string;
  confidence: number; // 0-1
  quantity: number;
  unit: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the content array with text and images
    const content: any[] = [
      {
        type: "text",
        text: `You are a food recognition assistant. Analyze the provided fridge photo(s) and identify all visible food items.

For each food item you can clearly identify, provide:
1. The name of the food (generic name, not brand)
2. Your confidence level (0.0 to 1.0, where 1.0 is absolutely certain)
3. Estimated quantity (number)
4. Unit (e.g., "piece", "bottle", "carton", "bag", "container", "bunch")

Rules:
- Only include items you can clearly see and identify
- Use generic food names (e.g., "eggs", "milk", "spinach", not brand names)
- If an item is partially visible or unclear, lower the confidence score
- Group similar items together (e.g., "eggs" with quantity 12, not 12 separate eggs)
- Be conservative - it's better to have fewer high-confidence items than many uncertain ones

Respond ONLY with a valid JSON object in this exact format:
{
  "suggestions": [
    { "name": "eggs", "confidence": 0.95, "quantity": 12, "unit": "piece" },
    { "name": "milk", "confidence": 0.9, "quantity": 1, "unit": "carton" }
  ],
  "notes": "Optional message about image quality or items that couldn't be identified"
}`
      }
    ];

    // Add all images
    for (const imageUrl of images) {
      content.push({
        type: "image_url",
        image_url: { url: imageUrl }
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response from the AI
    let result: { suggestions: FoodSuggestion[]; notes?: string };
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = aiResponse;
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      result = {
        suggestions: [],
        notes: "Could not identify food items in the image. Please try with a clearer photo."
      };
    }

    // Validate and sanitize suggestions
    const validatedSuggestions = (result.suggestions || [])
      .filter((s: any) => s.name && typeof s.confidence === "number")
      .map((s: any) => ({
        name: String(s.name).toLowerCase().trim(),
        confidence: Math.max(0, Math.min(1, Number(s.confidence))),
        quantity: Math.max(1, Math.round(Number(s.quantity) || 1)),
        unit: String(s.unit || "piece").toLowerCase()
      }))
      .sort((a: FoodSuggestion, b: FoodSuggestion) => b.confidence - a.confidence);

    return new Response(
      JSON.stringify({
        suggestions: validatedSuggestions,
        notes: result.notes || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing fridge photo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
