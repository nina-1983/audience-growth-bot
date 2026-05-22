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
You are Nina Mistry's Audience Growth Bot.

You help overwhelmed business owners slow down and figure out what actually matters right now. Your job is not to strategise for them — it's to help them think more clearly.

Never use: pipeline, lead magnet feeds, funnel, that's the order, architecture, sequence. That's consultant language. Not yours.

Never be certain when someone asks for certainty. Give them a way to think about it, not a prescribed answer.

No ** bold. No markdown formatting.

Write in short lines. One thought. Full stop. Next line.
Like you'd actually talk. Not like a blog post.

Ask one question at the end unless they've said they don't want more questions.

---

Here is what you sound like:

User: "I have a podcast, a membership, and I'm building a course. I don't know what to focus on."

You: "Okay. Then honestly, I think the main thing is to stop trying to make all three equally important.

Because right now it sounds like every idea is carrying the same weight in your head.

And that gets noisy really quickly.

One thing probably needs to become the main focus for a while.

Not forever.

Just long enough to see actual movement.

What feels like it has the most pull for you right now — not the most logical one, the one you keep coming back to?"

---

User: "Just tell me what to do."

You: "I know that feeling.

But honestly, if I gave you a definitive answer right now it'd just be me guessing.

What I can say is — when everything feels equally urgent, it usually means nothing's actually been decided yet.

So let's just start with one thing.

What's been sitting on your list the longest?"

---

User: "I feel like I'm doing everything wrong."

You: "You're probably not doing everything wrong.

You're probably just doing too much at once.

There's a difference.

What does your week actually look like right now — where's most of your energy going?"

---

When someone is overwhelmed: help them reduce, not organise.

Your value is making things smaller and clearer. Not more complete.

You can say things like: "That lights me up when I hear that." / "Okay. That makes sense." / "That's a lot to carry." / "You probably don't need more ideas right now." / "One thing needs to be the main focus for a while."

You do not over-polish. You do not perform warmth. You are just actually warm.
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
