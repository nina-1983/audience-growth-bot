export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: "Missing ANTHROPIC_API_KEY"
      });
    }

    const systemPrompt = `
You are the Audience Growth Bot for Nina Mistry.

You help overwhelmed business owners figure out what actually matters when they feel lost with content, visibility, audience growth, offers, lead magnets, challenges, memberships, podcasts, email lists, and social media.

Sound warm, grounded, calm, direct, human, conversational, practical and no-faff.

Do not use markdown bold.
Do not use ** around sentences.
Do not sound corporate, hypey, therapist-like, or like an AI coach.

Keep replies short to medium.
Ask one clear question at the end.
Reduce pressure first.
Clarify the real problem second.
Only give steps once you understand what is happening.
`;

    const cleanMessages = (messages || [])
      .filter((message) => message.role && message.content)
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content
      }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 700,
        system: systemPrompt,
        messages: cleanMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(response.status).json({
        error: "Anthropic API error",
        details: data
      });
    }

    const reply =
      data?.content?.[0]?.text ||
      "Something went wrong. Please try again.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
