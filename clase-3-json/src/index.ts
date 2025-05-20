import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import z from "zod";

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

// Cada modelo tiene su forma de generar salidas estructuradas
// Open AI Docs: https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses#json-mode

async function main() {
  const jsonSchema = zodResponseFormat(
    z.object({
      subject: z.string(),
      body: z.string(),
    }),
    "json"
  );

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Necesito que redactes un email de ventas para este usuario. La idea es que sea un email corto y convincente.",
      },
      {
        role: "system",
        content:
          "El usuario se llama Marce y quiere que le hables como un amigo.",
      },
      {
        role: "system",
        content: `# Formato
          Escribí un email en texto plano, usa <br> para los saltos de linea y que sea corto. Menos de 150 palabras.
          El subject debe ser algo corto: 6 palabras aprox.
          `,
      },
      {
        role: "system",
        content: `# Respuesta JSON
          Debes responde en formato json, usando este esquema: ${JSON.stringify(
            jsonSchema
          )}
          `,
      },
    ],
    temperature: 1.2,
    response_format: { type: "json_object" },
    // response_format: zodResponseFormat(
    //   z.object({
    //     subject: z.string(),
    //     body: z.string(),
    //   }),
    //   "json"
    // ),
    // response_format: ,
    // model: "gpt-4.1-mini",
    // model: "deepseek-chat",
    model: "llama3-8b-8192",
    // max_completion_tokens: 30,
  });

  const obj = JSON.parse(completion?.choices[0]?.message?.content || "{}");
  // console.log(completion);
  // console.log(completion.choices[0].message);

  console.log(obj);
}

main();
