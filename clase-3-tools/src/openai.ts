import z, { ZodSchema } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

export function genOpenAiTool<T extends ZodSchema>(
  toolName: string,
  options: {
    description: string;
    execute: (args?: z.infer<T>) => Promise<any>;
    paramsSchema?: T;
  }
): OpenAITool {
  const { description, execute, paramsSchema } = options;

  return {
    type: "function",
    function: {
      name: toolName,
      description,
      function: async (args) => {
        console.log("\n⚡️⚡️⚡️ Running:", toolName);
        console.log(args);
        const result = await execute(args);
        console.log("Result:", result);
        console.log("⚡️⚡️⚡️⚡️⚡️⚡️ END Running ----------", toolName);

        return result;
      },
      parse: paramsSchema
        ? (params) => {
            const parsed =
              typeof params === "string" ? JSON.parse(params) : params;
            // console.log("parsed", parsed);

            return paramsSchema.parse(parsed);
          }
        : undefined,
      parameters: paramsSchema ? zodToJsonSchema(paramsSchema) : undefined,
    },
  };
}
export type OpenAITool = {
  type: "function";
  function: {
    name: string;
    description: string;
    function: (input: any) => any;
    parse?: (input: any) => any;
    parameters: any;
  };
};
