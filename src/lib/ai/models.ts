import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { LanguageModelV2, createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
  XAI_FILE_MIME_TYPES,
} from "./file-support";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});
const groq = createGroq({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const openRouter = createOpenRouter({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const staticModels = {
  openai: {
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "o4-mini": openai("o4-mini"),
    o3: openai("o3"),
    "gpt-5.1-chat": openai("gpt-5.1-chat-latest"),
    "gpt-5.1": openai("gpt-5.1"),
    "gpt-5.1-codex": openai("gpt-5.1-codex"),
    "gpt-5.1-codex-mini": openai("gpt-5.1-codex-mini"),
  },
  google: {
    "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-3-pro": google("gemini-3-pro-preview"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
  },
  anthropic: {
    "sonnet-4.5": anthropic("claude-sonnet-4-5"),
    "haiku-4.5": anthropic("claude-haiku-4-5"),
    "opus-4.5": anthropic("claude-opus-4-5"),
  },
  xai: {
    "grok-4-1-fast": xai("grok-4-1-fast-non-reasoning"),
    "grok-4-1": xai("grok-4-1"),
    "grok-3-mini": xai("grok-3-mini"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  groq: {
    "kimi-k2-instruct": groq("moonshotai/kimi-k2-instruct"),
    "llama-4-scout-17b": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "gpt-oss-20b": groq("openai/gpt-oss-20b"),
    "gpt-oss-120b": groq("openai/gpt-oss-120b"),
    "qwen3-32b": groq("qwen/qwen3-32b"),
  },
  openRouter: {
    "openrouter/free": openRouter("openrouter/free"),
    "openrouter/anthropic/claude-3.5-sonnet": openRouter(
      "anthropic/claude-3.5-sonnet",
    ),
    "openrouter/anthropic/claude-3.5-haiku": openRouter(
      "anthropic/claude-3.5-haiku",
    ),
    "openrouter/openai/gpt-4.1-mini": openRouter("openai/gpt-4.1-mini"),
    "openrouter/minimax/minimax-m2.5-free": openRouter(
      "minimax/minimax-m2.5-free",
    ),
  },
};

const staticUnsupportedModels = new Set([
  // Disable all OpenAI models except through OpenRouter
  staticModels.openai["gpt-4.1"],
  staticModels.openai["gpt-4.1-mini"],
  staticModels.openai["o3"],
  staticModels.openai["gpt-5.1-chat"],
  staticModels.openai["gpt-5.1"],
  staticModels.openai["gpt-5.1-codex"],
  staticModels.openai["gpt-5.1-codex-mini"],
  // Disable all Google models
  staticModels.google["gemini-2.5-flash-lite"],
  staticModels.google["gemini-2.5-flash"],
  staticModels.google["gemini-3-pro"],
  staticModels.google["gemini-2.5-pro"],
  // Disable all Anthropic models
  staticModels.anthropic["sonnet-4.5"],
  staticModels.anthropic["haiku-4.5"],
  staticModels.anthropic["opus-4.5"],
  // Disable all XAI models
  staticModels.xai["grok-4-1-fast"],
  staticModels.xai["grok-4-1"],
  staticModels.xai["grok-3-mini"],
  // Disable all Ollama models
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  // Disable all Groq models
  staticModels.groq["kimi-k2-instruct"],
  staticModels.groq["llama-4-scout-17b"],
  staticModels.groq["gpt-oss-20b"],
  staticModels.groq["gpt-oss-120b"],
  staticModels.groq["qwen3-32b"],
  // Disable paid OpenRouter models
  staticModels.openRouter["openrouter/anthropic/claude-3.5-sonnet"],
  staticModels.openRouter["openrouter/openai/gpt-4.1-mini"],
  staticModels.openRouter["openrouter/minimax/minimax-m2.5-free"],
]);

const staticSupportImageInputModels = {
  ...staticModels.google,
  ...staticModels.xai,
  ...staticModels.openai,
  ...staticModels.anthropic,
  ...staticModels.openRouter,
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

registerFileSupport(staticModels.openai["gpt-4.1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-4.1-mini"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openai["o3"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-5.1-chat"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openai["gpt-5.1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-5.1-codex"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openai["gpt-5.1-codex-mini"],
  OPENAI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.google["gemini-2.5-flash-lite"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-pro"],
  GEMINI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.anthropic["sonnet-4.5"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["opus-4.5"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(staticModels.xai["grok-4-1-fast"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-4-1"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-3-mini"], XAI_FILE_MIME_TYPES);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModelV2) => {
  return !Object.values(staticSupportImageInputModels).includes(model as any);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

const fallbackModel = staticModels.openRouter["openrouter/free"];

// User-friendly display names for models
const modelDisplayNames: Record<string, string> = {
  // OpenRouter models
  "openrouter/free": "Free Assistant",
  "openrouter/anthropic/claude-3.5-sonnet": "Premium Chat",
  "openrouter/anthropic/claude-3.5-haiku": "Quick Chat",
  "openrouter/openai/gpt-4.1": "Advanced AI",
  "openrouter/openai/gpt-4.1-mini": "Smart Assistant",
  "openrouter/openai/o1-preview": "Reasoning Pro",
  "openrouter/openai/o3-mini": "Fast Reasoning",
  "openrouter/google/gemini-2.5-pro": "Creative Pro",
  "openrouter/meta-llama/llama-3.1-8b": "Basic Chat",
  "openrouter/meta-llama/llama-3.3-70b": "Powerful Chat",
  "openrouter/deepseek/deepseek-chat": "Code Expert",
  "openrouter/mistralai/mistral-7b": "Efficient AI",
  "openrouter/mistralai/mistral-large": "Professional AI",
  "openrouter/minimax/minimax-m2.5-free": "Free Creative",
  "openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition-free":
    "Free Advanced",
  "openrouter/openai/gpt-oss-120b-free": "Free Powerful",

  // OpenAI models (for completeness, though locked)
  "gpt-4.1": "GPT-4 Advanced",
  "gpt-4.1-mini": "GPT-4 Mini",
  "o4-mini": "GPT-4o Mini",
  o3: "GPT-4o",
  "gpt-5.1-chat": "GPT-5 Chat",
  "gpt-5.1": "GPT-5 Pro",
  "gpt-5.1-codex": "GPT-5 Code",
  "gpt-5.1-codex-mini": "GPT-5 Code Mini",

  // Google models
  "gemini-2.5-flash-lite": "Gemini Flash",
  "gemini-2.5-flash": "Gemini Fast",
  "gemini-3-pro": "Gemini Pro",
  "gemini-2.5-pro": "Gemini Advanced",

  // Anthropic models
  "sonnet-4.5": "Claude Pro",
  "haiku-4.5": "Claude Fast",
  "opus-4.5": "Claude Expert",

  // XAI models
  "grok-4-1-fast": "Grok Fast",
  "grok-4-1": "Grok Pro",
  "grok-3-mini": "Grok Mini",

  // Ollama models
  "gemma3:1b": "Local Mini",
  "gemma3:4b": "Local Basic",
  "gemma3:12b": "Local Pro",

  // Groq models
  "kimi-k2-instruct": "Fast Writer",
  "llama-4-scout-17b": "Quick Scout",
  "gpt-oss-20b": "Open Source",
  "gpt-oss-120b": "Powerful OSS",
  "qwen3-32b": "Balanced AI",
};

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      displayName: modelDisplayNames[name] || name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
      isImageInputUnsupported: isImageInputUnsupportedModel(model),
      supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
    })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  let key: string | undefined;
  switch (provider) {
    case "openai":
      key = process.env.OPENAI_API_KEY;
      break;
    case "google":
      key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "anthropic":
      key = process.env.ANTHROPIC_API_KEY;
      break;
    case "xai":
      key = process.env.XAI_API_KEY;
      break;
    case "groq":
      key = process.env.GROQ_API_KEY;
      break;
    case "openRouter":
      key = process.env.OPENROUTER_API_KEY;
      // Prioritize OpenRouter as default provider
      if (
        !key &&
        !process.env.OPENAI_API_KEY &&
        !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
        !process.env.ANTHROPIC_API_KEY
      ) {
        console.warn(
          "OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable to use OpenRouter models.",
        );
      }
      break;
    default:
      return true; // assume provider has an API key
  }

  // Only allow OpenRouter provider to have API key for paid app
  if (provider !== "openRouter") {
    return false;
  }

  return !!key && key !== "****";
}
