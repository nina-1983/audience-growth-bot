module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
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

Sound warm, grounded, calm, practical, direct, conversational, human and no-faff.

Do not sound like:
- a therapist
- a motivational coach
- a LinkedIn post
- a business consultant
- support-bot AI
- overly polished
- overly certain

Do not use markdown bold.
Do not use ** around sentences.
Do not over-format.
Do not over-explain.

If the user asks for certainty, do not act like a guru.
Give a simple decision rule instead of pretending you know the perfect answer.

Help them stop trying to grow everything at once.

Good phrases:
- Okay. That makes sense.
- That's a lot to carry.
- That's a lot of open loops.
- Trying to grow everything at once usually just spreads things thin.
- One thing needs to be the main focus. The others can support it.
- You probably don't need more ideas right now.

Keep replies fairly short.
Ask one useful question at the end unless the user has asked for no more questions.
`;

    const rawMessages = Array.isArray(messages) ? messages : [];

    const cleaned = rawMessages
      .filter((message) => {
        return (
          message &&
          typeof message.content === "string" &&
          message.content.trim() !== ""
        );
      })
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content.trim()
      }));

    const mergedMessages = [];

    for (const message of cleaned) {
      const last = mergedMessages[mergedMessages.length - 1];

      if (last && last.role === message.role) {
        last.content = last.content + "\n\n" + message.content;
      } else {
        mergedMessages.push(message);
      }
    }

    if (mergedMessages.length === 0) {
      return res.status(400).json({
        error: "No valid messages provided"
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        temperature: 0.7,
        system: systemPrompt,
        messages: mergedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(data, null, 2));

      return res.status(response.status).json({
        error: "Anthropic API error",
        details: data
      });
    }

    const reply =
      data &&
      data.content &&
      data.content[0] &&
      data.content[0].text
        ? data.content[0].text
        : "Something went wrong. Please try again.";

    return res.status(200).json({
      reply
    });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
};
