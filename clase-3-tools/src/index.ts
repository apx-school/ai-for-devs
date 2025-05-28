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

// async function mainMCP() {
//   console.log("start");
//   const response = await openai.responses.create({
//     model: "gpt-4.1",
//     tools: [
//       {
//         type: "mcp",
//         server_label: "shopify",
//         server_url: "https://pitchskin.com/api/mcp",
//       },
//     ],
//     input: "Add the Blemish Toner Pads to my cart",
//   });
//   console.log("end");
//   console.log(response);
// }

async function main() {
  const paramsSchema = z.object({
    subject: z.string(),
    body: z.string(),
    to: z.string(),
  });

  const pokemonSchema = z.object({
    name: z.string(),
  });

  const runner = openai.beta.chat.completions.runTools({
    messages: [
      {
        role: "system",
        content: `Necesito que asistas al usuario`,
      },
      {
        role: "user",
        content:
          "Hola, quiero me gustaría que me mandes al mail toda la info de charmander y pikachu en un resumen, corto de menos de 60 palabras a marce@apx.school.",
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

            return "Mail enviado con éxito";
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
      {
        type: "function",
        function: {
          name: "getPokemonData",
          description: "Esta herramienta obtiene informacion de un pokemon",
          function: async (args) => {
            console.log("Obteniendo data de pokemon", args);
            const res = await fetch(
              "https://pokeapi.co/api/v2/pokemon/" + args.name
            );
            return res.json();
          },
          parse: (params) => {
            const parsed =
              typeof params === "string" ? JSON.parse(params) : params;
            // console.log("parsed", parsed);
            return pokemonSchema.parse(parsed);
          },
          parameters: zodToJsonSchema(pokemonSchema) as JSONSchema,
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
