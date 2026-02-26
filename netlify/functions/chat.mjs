// This function runs on Netlify's server (not in the browser)
// It securely proxies requests to the Anthropic API using your API key

export default async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const ANTHROPIC_API_KEY = Netlify.env.get("ANTHROPIC_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: "⚠️ ANTHROPIC_API_KEY not configured. Go to Netlify Dashboard → Site configuration → Environment variables → Add ANTHROPIC_API_KEY" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model || "claude-sonnet-4-20250514",
        max_tokens: body.max_tokens || 1024,
        system: body.system || "",
        messages: body.messages || [],
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: "⚠️ Server error: " + error.message }],
      }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
};

export const config = {
  path: "/api/chat",
};
