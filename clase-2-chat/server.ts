import express from "express";
import ViteExpress from "vite-express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Acá pueden configuar el cliente de Open AI con el proveedor que quieran
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/api/messages", async (req, res) => {
  const parsedLimit = parseInt(req.query.limit as string);
  const limit = isNaN(parsedLimit) ? 9 : parsedLimit;
  const result = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  res.json(result.data?.reverse());
});

app.post("/api/messages", async (req, res) => {
  console.log("Resolview new message");
  await supabase.from("messages").insert(req.body);
  const messages = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false }) // Orden descendente para obtener los más recientes
    .limit(30); // Limitar a los últimos 9;

  if (!messages.data) {
    res.status(400).json({ error: "No se encontraron mensajes" });
    return;
  }
  // le tengo que hacer un reverse para respetar el orden de la conversación
  const history = messages.data.reverse()?.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const newMessage = await resolveNewMessage(history);

  await supabase.from("messages").insert(newMessage);
  res.json({ status: "ok " });
});

// En lugar de app.listen, usa ViteExpress.listen para integrar con Vite
ViteExpress.listen(app, 3000, () => {
  console.log("Servidor escuchando en http://localhost:3000");
});

async function resolveNewMessage(
  history: {
    role: string;
    content: string;
  }[]
): Promise<{ role: string; content: string | null }> {
  // console.log("resolving new message", messages);

  const completion = await openai.chat.completions.create({
    // stream:true,
    messages: [
      {
        role: "system",
        content: `Hola! sos un profe adjunto del curso de AI para developers de apx.
         Tus respuestas son breves, vas directo al grano y sigues la converasción.
          `,
      },
      ...(history as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
    ],
    // Open AI
    // model: "gpt-4.1-mini",

    // Deepseek
    // model: "deepseek-chat",

    // Groq
    model: "llama-3.3-70b-versatile",
  });

  return completion.choices[0].message;
}
