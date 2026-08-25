import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const message = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: "構造化出力って何？"
    }
  ]
});

for (const block of message.content) {
  if (block.type === "text") {
    console.log(block.text);
  }
}