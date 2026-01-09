import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  imageBase64: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 }: ScanRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const systemPrompt = `You are an expert at reading grocery receipts and extracting food items. Analyze the receipt image and extract ALL food/grocery items.

For each item, provide:
- name: The item name (cleaned up, e.g., "ORG BANANAS" → "Organic Bananas")
- quantity: The quantity purchased (default to 1 if not visible)
- unit: The unit (e.g., "lb", "oz", "kg", "unit", "pack", "bag")
- category: Categorize as one of: "produce", "dairy", "meat", "bakery", "frozen", "canned", "grains", "spices", "oils", "beverages", "snacks", "other"
- suggestedDestination: "fridge" for perishables (produce, dairy, meat) or "pantry" for shelf-stable items

IMPORTANT:
- Extract ONLY food/grocery items, not taxes, discounts, or store info
- Clean up abbreviated names to be readable
- If you can't read an item clearly, skip it
- Return the results as a JSON array

Return ONLY a JSON object like:
{
  "items": [
    { "name": "Organic Bananas", "quantity": 1, "unit": "bunch", "category": "produce", "suggestedDestination": "fridge" },
    { "name": "Whole Milk", "quantity": 1, "unit": "gallon", "category": "dairy", "suggestedDestination": "fridge" }
  ],
  "storeName": "Store name if visible",
  "total": "Total amount if visible"
}`;

    // Prepare the image for the API (handle data URL or raw base64)
    let imageData = imageBase64;
    let mimeType = "image/jpeg";
    
    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageData = match[2];
      }
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
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`,
                },
              },
              {
                type: "text",
                text: "Please analyze this grocery receipt and extract all food items. Return the JSON response.",
              },
            ],
          },
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
    let result = { items: [], storeName: null, total: null };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Content:", content);
      return new Response(JSON.stringify({
        error: "Failed to parse receipt. Please try a clearer photo.",
        items: [],
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in scan-receipt:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      items: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
