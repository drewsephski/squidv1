import { DBEdge, DBNode, DBWorkflow } from "app-types/workflow";
import { generateUUID } from "lib/utils";
import { babyResearchEdges, babyResearchNodes } from "./baby-research";
import { getWeatherEdges, getWeatherNodes } from "./get-weather";
import { productResearchNodes, productResearchEdges } from "./product-research";
import {
  contentRepurposingNodes,
  contentRepurposingEdges,
} from "./content-repurposing";

export const GetWeather = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description: "Get weather data from the API",
      name: "Get Weather",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c8-fe0f.png",
        style: {
          backgroundColor: "oklch(20.5% 0 0)",
        },
      },
    },
    nodes: getWeatherNodes,
    edges: getWeatherEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const BabyResearch = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description:
        "Comprehensive web research workflow that performs multi-layered search and content analysis to generate detailed research reports based on user instructions and research objectives.",
      name: "baby-research",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-1f3fb-200d-1f52c.png",
        style: {
          backgroundColor: "oklch(78.5% 0.115 274.713)",
        },
      },
    },
    nodes: babyResearchNodes,
    edges: babyResearchEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const ProductResearch = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description:
        "Research any product with AI-powered web search. Analyzes search results, extracts key features and pricing, optionally fetches detailed content, and generates a comprehensive report with verdict and confidence score.",
      name: "product-research",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f50d.png",
        style: {
          backgroundColor: "oklch(65% 0.15 250)",
        },
      },
    },
    nodes: productResearchNodes,
    edges: productResearchEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const ContentRepurposing = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description:
        "Transform one piece of content into platform-specific posts for Twitter, LinkedIn, and Instagram. Extracts key messages and generates ready-to-post content with appropriate formatting, hashtags, and tone for each platform.",
      name: "content-repurposing",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/270d-fe0f.png",
        style: {
          backgroundColor: "oklch(45.2% 0.245 277.723)",
        },
      },
    },
    nodes: contentRepurposingNodes,
    edges: contentRepurposingEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};
