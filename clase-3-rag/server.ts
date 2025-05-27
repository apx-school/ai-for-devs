import express from "express";
import ViteExpress from "vite-express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import multer, { Request } from "multer";

// Acá pueden configuar el cliente de Open AI con el proveedor que quieran
// const openai = new OpenAI({
//   apiKey: process.env.GROQ_API_KEY,
//   baseURL: "https://api.groq.com/openai/v1",
// });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  console.log("newMessage", newMessage);

  const result = await supabase.from("messages").insert(newMessage);
  console.log("result", result);
  res.json({ status: "ok " });
});

// rag endpoint

import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import md5 from "md5";
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

const pcIndex = pc.index("chunks");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // límite de tamaño del archivo (10MB)
});

app.post("/files/index", upload.single("files"), async (req: Request, res) => {
  console.log(req.file.buffer); // Accede al archivo subido
  console.log(req.file);
  const fileName = req.file.originalname;
  const loader = new PDFLoader(new Blob([req.file.buffer]));

  const docs = await loader.load();
  console.log("docs", docs.length);

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 450,
    chunkOverlap: 300,
    separators: ["\n\n", "\n", " ", ""],
  });

  const chunksToEmbed = await textSplitter.splitDocuments(docs);
  console.log("chunks", chunksToEmbed.length);
  console.log(chunksToEmbed[0]);
  // return;

  const records = await Promise.all(
    chunksToEmbed.map(async (chunk, idx) => {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.pageContent,
        encoding_format: "float",
      });
      return {
        id: md5(fileName) + "#" + idx,
        values: embedding.data[0].embedding,
        metadata: {
          fileName,
          pageNumber: chunk.metadata.loc.pageNumber,
          content: chunk.pageContent,
        },
      };
    })
  );

  // console.log(records);

  await pcIndex.upsert(records);

  // Procesa el archivo y los campos del formulario
  res.json({ message: "Archivo subido con éxito" });
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
  const lastThreeMessages = history.slice(-3);

  const searchEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: lastThreeMessages.map((m) => m.content).join(""),
    encoding_format: "float",
  });

  const queryResponse = await pcIndex.query({
    vector: searchEmbedding.data[0].embedding,
    topK: 3,
    includeValues: false,
    includeMetadata: true,
  });
  console.log(
    "queryResponse metadata",
    queryResponse.matches.map((m) => m.metadata)
  );

  const extraContext = queryResponse.matches
    .map((m) => m.metadata?.content)
    .join("");

  const completion = await openai.chat.completions.create({
    // stream:true,
    messages: [
      {
        role: "system",
        content: `Hola! sos un profe adjunto del curso de AI para developers de apx.
         Tus respuestas son breves, vas directo al grano y sigues la converasción.
          `,
      },
      {
        role: "system",
        content: `# CONTEXT DATA

        ${extraContext}`,
      },
      ...(history as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
    ],
    // Open AI
    model: "gpt-4.1-mini",

    // Deepseek
    // model: "deepseek-chat",

    // Groq
    // model: "llama-3.3-70b-versatile",
  });
  const { role, content } = completion.choices[0].message;

  return {
    role,
    content,
  };
}
