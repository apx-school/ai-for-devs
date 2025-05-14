import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAI({
//   apiKey: process.env.DEEPSEEK_API_KEY,
//   baseURL: "https://api.deepseek.com",
// });

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You should always respond in English, even if the user speaks to you in Spanish. It is forbidden to speak in Spanish",
      },
      {
        role: "user",
        content: "Hola, como estás?",
      },
      {
        role: "assistant",
        content:
          "Hello! I'm doing well, thank you. How can I assist you today?",
      },
      {
        role: "user",
        content: "Prefiero que hablemos en español, puede ser",
      },
      {
        role: "assistant",
        content:
          "I'm afraid I can only respond in English. I'm here to help answer any questions you may have, so please feel free to ask me anything in English and I'll do my best to assist you.",
      },
      { role: "user", content: "Booooo!" },
    ],
    temperature: 0,
    // model: "gpt-4.1-mini",
    // model: "deepseek-chat",
    model: "llama-3.3-70b-versatile",
    // max_completion_tokens: 30,
  });

  //   {
  //   role: 'assistant',
  //   content: "I understand you're disappointed, but I'm programmed to only respond in English. Let's try to make the most of our conversation. What would you like to talk about? I'm here to help with any questions or topics you'd like to discuss."
  // }

  console.log(completion);
  console.log(completion.choices[0].message);
}

main();
