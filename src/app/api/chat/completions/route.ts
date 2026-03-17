import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { generateText } from "ai";
import { customModelProvider } from "lib/ai/models";

export async function POST(request: NextRequest) {
  try {
    console.log("Chat completions request received"); // Debug log

    const session = await getSession();
    console.log("Session:", session ? "Found user session" : "No session"); // Debug log

    if (!session?.user.id) {
      console.error("Unauthorized: No user session found"); // Debug log
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log("Request body:", requestBody); // Debug log

    const { messages, model = "openrouter/free" } = requestBody;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // Get the model from provider
    console.log("Getting model for:", model); // Debug log
    const languageModel = customModelProvider.getModel({
      provider: "openRouter",
      model: model,
    });
    console.log("Language model:", languageModel); // Debug log

    // Generate completion
    console.log("Generating text with messages:", messages); // Debug log
    const result = await generateText({
      model: languageModel,
      messages: messages,
      temperature: 0.7,
    });

    const response = result.text || "I understand what you said.";
    console.log("Generated response:", response); // Debug log

    return NextResponse.json({
      choices: [
        {
          message: {
            role: "assistant",
            content: response,
          },
        },
      ],
    });
  } catch (error: any) {
    console.error("Chat completion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 },
    );
  }
}
