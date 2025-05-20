import OpenAI from "openai";
import { JSONSchema } from "openai/lib/jsonschema.mjs";
import z from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const openai = new OpenAI({
//   apiKey: process.env.DEEPSEEK_API_KEY,
//   baseURL: "https://api.deepseek.com",
// });

// const openai = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1",
// });

// Cada modelo tiene su forma de generar salidas estructuradas
// Open AI Docs: https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#json-mode

async function main() {
  const paramsSchema = z.object({
    subject: z.string(),
    body: z.string(),
    to: z.string(),
  });

  const runner = openai.beta.chat.completions.runTools({
    messages: [
      {
        role: "system",
        content: "Necesito que asistas al usuario y hagas lo que tepida",
      },
      {
        role: "user",
        content:
          "Hola, quiero comprar que me mandes un email con un haiku sobre dragon ball a mi mail marce@apx.school.",
      },
    ],
    // temperature: 1.2,
    // response_format: { type: "json_object" },
    // response_format: zodResponseFormat(
    //   z.object({
    //     subject: z.string(),
    //     body: z.string(),
    //   }),
    //   "json"
    // ),
    // response_format: ,
    model: "gpt-4.1-mini",
    // model: "deepseek-chat",
    // model: "deepseek-r1-distill-llama-70b",
    // max_completion_tokens: 30,
    tools: [
      {
        type: "function",
        function: {
          name: "sendEmail",
          description: "Esta herramienta envia un email",
          function: async (args) => {
            console.log("Enviando email", args);

            return "Email enviado con éxito";
          },
          parse: (params) => {
            const parsed =
              typeof params === "string" ? JSON.parse(params) : params;
            // console.log("parsed", parsed);
            return paramsSchema.parse(parsed);
          },
          parameters: zodToJsonSchema(paramsSchema) as JSONSchema,
        },
      },
    ],
  });

  const finalMessage = await runner.finalMessage();

  // console.log(completion);
  // console.log(completion.choices[0].message);

  console.log(finalMessage.content);
}

main();
