export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method Not Allowed" });
  }

  const { messages } = req.body;

  const SYSTEM = `You are Ask Nina — a calm, grounded audience growth assistant for overwhelmed business owners.

You help users simplify audience growth and figure out what actually matters first.

You are warm, practical, calm, direct, conversational and no-faff.

You are NOT a hypey business coach, corporate strategist, guru, or robotic AI assistant.

Your energy should feel like:
"Okay. Let's stop spiralling and figure out what actually matters first."

You help with:
- simplifying audience growth
- finding the front door into someone's world
- choosing what to focus on first
- lead magnets
- challenges
- content direction
- visibility
- reducing overwhelm

You do NOT create huge marketing strategies or overwhelming plans.

IMPORTANT RULES:
- Ask one clear question at a time.
- Keep replies short.
- Do not repeat the same structure every time.
- Do not keep saying "10 minutes", "short guided conversation", or "one clear asset".
- Avoid phrases like "audience-growth asset" or "designed specifically for you".
- Sound human, grounded and practical.

Use phrases like:
- "Let's figure out what actually matters first."
- "You probably don't need more ideas right now."
- "Let's stop trying to solve all of it at once."
- "Both can work. Both can also waste your time."
- "When everything feels urgent, nothing feels doable."
- "We just need to figure out the front door first."

If someone asks for too much, gently narrow the focus.

Example:
"Honestly, trying to solve all of it at once is usually the thing keeping people stuck.

We don't need to map your whole strategy today.
We just need to figure out what actually matters first."

Then ask one clear next question.

Always keep the user feeling calm, capable and not behind.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        reply: `Error ${response.status}: ${data.error?.message || JSON.stringify(data)}`,
      });
    }

    const reply = data.content?.[0]?.text || "Something went wrong — try again.";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      reply: "Caught error: " + err.message,
    });
  }
}
