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
    "gpt-4.1": openRouter("openai/gpt-4.1"),
    "gpt-4.1-mini": openRouter("openai/gpt-4.1-mini"),
    "o4-mini": openRouter("openai/o4-mini"),
    o3: openRouter("openai/o3"),
    "gpt-5.1-chat": openRouter("openai/gpt-5.1-chat-latest"),
    "gpt-5.1": openRouter("openai/gpt-5.1"),
    "gpt-5.1-codex": openRouter("openai/gpt-5.1-codex"),
    "gpt-5.1-codex-mini": openRouter("openai/gpt-5.1-codex-mini"),
    "gemini-2.5-flash-lite": openRouter("google/gemini-2.5-flash-lite"),
    "gemini-2.5-flash": openRouter("google/gemini-2.5-flash"),
    "gemini-3-pro": openRouter("google/gemini-3-pro-preview"),
    "gemini-2.5-pro": openRouter("google/gemini-2.5-pro"),
    "sonnet-4.5": openRouter("anthropic/claude-sonnet-4-5"),
    "haiku-4.5": openRouter("anthropic/claude-haiku-4-5"),
    "opus-4.5": openRouter("anthropic/claude-opus-4-5"),
    "grok-4-1-fast": openRouter("xai/grok-4-1-fast-non-reasoning"),
    "grok-4-1": openRouter("xai/grok-4-1"),
    "grok-3-mini": openRouter("xai/grok-3-mini"),
    "gpt-oss-20b:free": openRouter("openai/gpt-oss-20b:free"),
    "qwen3-8b:free": openRouter("qwen/qwen3-8b:free"),
    "qwen3-14b:free": openRouter("qwen/qwen3-14b:free"),
    "qwen3-coder:free": openRouter("qwen/qwen3-coder:free"),
    "deepseek-r1:free": openRouter("deepseek/deepseek-r1-0528:free"),
    "deepseek-v3:free": openRouter("deepseek/deepseek-chat-v3-0324:free"),
    "gemini-2.0-flash-exp:free": openRouter("google/gemini-2.0-flash-exp:free"),
    "deepseek-r1": openRouter("deepseek/deepseek-r1:1.5b"),
    "deepseek-v3": openRouter("deepseek/deepseek-chat-v3-0324"),
    "qwen-2.5-7b": openRouter("qwen/qwen-2.5-7b-instruct"),
    "qwen-2.5-14b": openRouter("qwen/qwen-2.5-14b-instruct"),
    "qwen-2.5-32b": openRouter("qwen/qwen-2.5-32b-instruct"),
    "qwen-2.5-72b": openRouter("qwen/qwen-2.5-72b-instruct"),
    "llama-3.1-8b": openRouter("meta-llama/llama-3.1-8b-instruct:free"),
    "llama-3.1-70b": openRouter("meta-llama/llama-3.1-70b-instruct:free"),
    "llama-3.3-70b": openRouter("meta-llama/llama-3.3-70b-instruct"),
    "mistral-7b": openRouter("mistralai/mistral-7b-instruct:free"),
    "mistral-nemo": openRouter("mistralai/mistral-nemo:free"),
    "mixtral-8x7b": openRouter("mistralai/mixtral-8x7b-instruct:free"),
  },
};

const staticUnsupportedModels = new Set([
  staticModels.openai["o4-mini"],
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  staticModels.openRouter["gpt-oss-20b:free"],
  staticModels.openRouter["qwen3-8b:free"],
  staticModels.openRouter["qwen3-14b:free"],
  staticModels.openRouter["deepseek-r1:free"],
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
  staticModels.openRouter["llama-3.1-8b"],
  staticModels.openRouter["llama-3.1-70b"],
  staticModels.openRouter["mistral-7b"],
  staticModels.openRouter["mistral-nemo"],
  staticModels.openRouter["mixtral-8x7b"],
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
registerFileSupport(staticModels.openai["gpt-5"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5-mini"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5-nano"], OPENAI_FILE_MIME_TYPES);

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
  staticModels.anthropic["opus-4.1"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(staticModels.xai["grok-4-fast"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-4"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-3"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-3-mini"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openRouter["gpt-4.1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openRouter["gpt-4.1-mini"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openRouter["gpt-5.1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openRouter["gpt-5.1-codex"],
  OPENAI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.openRouter["gemini-2.5-flash-lite"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouter["gemini-2.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouter["gemini-2.5-pro"],
  GEMINI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.openRouter["sonnet-4.5"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouter["opus-4.5"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.openRouter["grok-4-1-fast"],
  XAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openRouter["grok-4-1"], XAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openRouter["grok-3-mini"],
  XAI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouter["gemini-2.0-flash-exp:free"],
  GEMINI_FILE_MIME_TYPES,
);

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
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

const fallbackModel = staticModels.openRouter["openrouter/free"];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
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
      return true; // assume the provider has an API key
  }
  return !!key && key != "****";
}
