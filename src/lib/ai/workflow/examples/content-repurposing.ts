import { DBEdge, DBNode } from "app-types/workflow";
import { generateUUID } from "lib/utils";

const INPUT_ID = generateUUID();
const OUTPUT_ID = generateUUID();
const FETCH_ID = generateUUID();
const EXTRACTION_ID = generateUUID();
const TWITTER_ID = generateUUID();
const LINKEDIN_ID = generateUUID();
const INSTAGRAM_ID = generateUUID();

export const contentRepurposingNodes: Partial<DBNode>[] = [
  {
    id: INPUT_ID,
    kind: "input",
    name: "INPUT",
    description: "Content to repurpose — provide a URL or paste text directly",
    uiConfig: {
      position: { x: 0, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "input",
      outputSchema: {
        type: "object",
        properties: {
          content_url: {
            type: "string",
            description: "URL of the article or blog post to repurpose",
          },
          content_text: {
            type: "string",
            description: "Paste the content directly if no URL is available",
          },
          target_audience: {
            type: "string",
            description:
              "Who this content is for (e.g. 'startup founders', 'developers')",
          },
          tone: {
            type: "string",
            description:
              "Tone to use across all platforms. Options: professional, casual, energetic, educational",
          },
        },
        required: ["content_text"],
      },
    },
  },

  {
    id: FETCH_ID,
    kind: "tool",
    name: "FETCH CONTENT",
    description:
      "Fetch full article text from the URL if one was provided, and search for related context",
    uiConfig: {
      position: { x: 360, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "tool",
      outputSchema: {
        type: "object",
        properties: {
          tool_result: { type: "object" },
        },
      },
      model: { provider: "openrouter", model: "openrouter/free" },
      message: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "You are helping prepare content for social media repurposing.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Content URL: " },
              {
                type: "mention",
                attrs: {
                  id: "a1b2c3d4-0001-0001-0001-000000000001",
                  label: `{"nodeId":"${INPUT_ID}","path":["content_url"]}`,
                },
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Content Text: " },
              {
                type: "mention",
                attrs: {
                  id: "a1b2c3d4-0001-0001-0001-000000000002",
                  label: `{"nodeId":"${INPUT_ID}","path":["content_text"]}`,
                },
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "If a URL is provided, fetch its full text. Then search the web for 3-5 related sources to find supporting statistics, trending angles, or expert quotes that would enrich the content. Return everything you find.",
              },
            ],
          },
        ],
      },
      tool: {
        type: "app-tool",
        id: "webSearch",
        description:
          "Web search tool for gathering supporting context, statistics, and related sources.",
        parameterSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            numResults: {
              type: "number",
              default: 5,
              minimum: 1,
              maximum: 20,
            },
            type: {
              type: "string",
              enum: ["auto", "keyword", "neural"],
              default: "auto",
            },
            maxCharacters: {
              type: "number",
              default: 3000,
              minimum: 100,
              maximum: 10000,
            },
          },
          required: ["query"],
        },
      },
    },
  },

  {
    id: EXTRACTION_ID,
    kind: "llm",
    name: "EXTRACT & ANALYZE",
    description:
      "Extract the core message, key points, hooks, and stats from the content",
    uiConfig: {
      position: { x: 720, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: {
              main_message: {
                type: "string",
                description:
                  "The single core idea of the content in 1-2 sentences",
              },
              key_points: {
                type: "array",
                items: { type: "string" },
                description: "3-5 key supporting arguments or insights",
              },
              hook_ideas: {
                type: "array",
                items: { type: "string" },
                description:
                  "3 attention-grabbing opening lines for social posts",
              },
              supporting_stats: {
                type: "array",
                items: { type: "string" },
                description:
                  "Any statistics, data points, or quotes from the content or search results",
              },
              call_to_action: {
                type: "string",
                description: "Recommended CTA based on the content goal",
              },
            },
          },
        },
      },
      messages: [
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Analyze the following content and produce a repurposing brief. IMPORTANT: You must respond with valid JSON only. No explanations, no markdown formatting, no code blocks. Just raw JSON that matches the required schema.",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Content Text: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0002-0001-0001-000000000001",
                      label: `{"nodeId":"${INPUT_ID}","path":["content_text"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Fetched Content & Web Research: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0002-0001-0001-000000000002",
                      label: `{"nodeId":"${FETCH_ID}","path":["tool_result"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Target Audience: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0002-0001-0001-000000000003",
                      label: `{"nodeId":"${INPUT_ID}","path":["target_audience"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Tone: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0002-0001-0001-000000000004",
                      label: `{"nodeId":"${INPUT_ID}","path":["tone"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Extract: main_message, key_points (3-5), hook_ideas (3 options), supporting_stats, and call_to_action.",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openrouter", model: "openrouter/free" },
    },
  },

  {
    id: TWITTER_ID,
    kind: "llm",
    name: "TWITTER THREAD",
    description: "Generate a Twitter/X thread (3-5 tweets)",
    uiConfig: {
      position: { x: 1080, y: -200 },
      type: "default",
    },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          twitter_thread: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tweet_number: { type: "number" },
                content: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a social media expert. Write engaging Twitter/X threads. Each tweet must be under 280 characters. Lead with a scroll-stopping hook on tweet 1. Number tweets as 1/N, 2/N, etc. Hashtags are separate from the tweet body.",
        },
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Main Message: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000001",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","main_message"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Key Points: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000002",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","key_points"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Hook Ideas: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000003",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","hook_ideas"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Stats: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000004",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","supporting_stats"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "CTA: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000005",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","call_to_action"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Tone: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0003-0001-0001-000000000006",
                      label: `{"nodeId":"${INPUT_ID}","path":["tone"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Write a 3-5 tweet thread. Each tweet under 280 characters. Include 2-3 hashtags per tweet. End with a strong CTA tweet. CRITICAL: You must respond with valid JSON only. No explanations, no markdown formatting, no code blocks. Just raw JSON that matches the required schema.",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openrouter", model: "openrouter/free" },
    },
  },

  {
    id: LINKEDIN_ID,
    kind: "llm",
    name: "LINKEDIN POST",
    description: "Generate a LinkedIn post",
    uiConfig: {
      position: { x: 1080, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          linkedin_post: {
            type: "object",
            properties: {
              content: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
              call_to_action: { type: "string" },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a LinkedIn content expert. Write professional posts that open with a bold insight, use short paragraphs, and close with a genuine CTA. Under 1300 characters. No corporate jargon.",
        },
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Main Message: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000001",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","main_message"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Key Points: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000002",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","key_points"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Hook Ideas: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000003",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","hook_ideas"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Stats: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000004",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","supporting_stats"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "CTA: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000005",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","call_to_action"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Tone: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0004-0001-0001-000000000006",
                      label: `{"nodeId":"${INPUT_ID}","path":["tone"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Write the post (under 1300 chars), include 3-5 hashtags and a clear CTA. CRITICAL: You must respond with valid JSON only. No explanations, no markdown formatting, no code blocks. Just raw JSON that matches the required schema.",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openrouter", model: "openrouter/free" },
    },
  },

  {
    id: INSTAGRAM_ID,
    kind: "llm",
    name: "INSTAGRAM CAPTION",
    description: "Generate an Instagram caption with emojis and hashtags",
    uiConfig: {
      position: { x: 1080, y: 200 },
      type: "default",
    },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          instagram_caption: {
            type: "object",
            properties: {
              caption: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are an Instagram content expert. Write engaging captions that open with a strong one-liner, use emojis naturally, include a question to drive comments, and end with a CTA. Put hashtags at the bottom separated by a line break.",
        },
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Main Message: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0005-0001-0001-000000000001",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","main_message"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Key Points: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0005-0001-0001-000000000002",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","key_points"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Hook Ideas: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0005-0001-0001-000000000003",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","hook_ideas"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "CTA: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0005-0001-0001-000000000004",
                      label: `{"nodeId":"${EXTRACTION_ID}","path":["answer","call_to_action"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Tone: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "a1b2c3d4-0005-0001-0001-000000000005",
                      label: `{"nodeId":"${INPUT_ID}","path":["tone"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Write the caption with 5-10 emojis woven in, an engagement question, and 10-15 hashtags at the bottom. CRITICAL: You must respond with valid JSON only. No explanations, no markdown formatting, no code blocks. Just raw JSON that matches the required schema.",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openrouter", model: "openrouter/free" },
    },
  },

  {
    id: OUTPUT_ID,
    kind: "output",
    name: "OUTPUT",
    description: "Repurposed content for all three platforms",
    uiConfig: {
      position: { x: 1440, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "output",
      outputSchema: { type: "object", properties: {} },
      outputData: [
        {
          key: "twitter_thread",
          source: { nodeId: TWITTER_ID, path: ["twitter_thread"] },
        },
        {
          key: "linkedin_post",
          source: { nodeId: LINKEDIN_ID, path: ["linkedin_post"] },
        },
        {
          key: "instagram_caption",
          source: { nodeId: INSTAGRAM_ID, path: ["instagram_caption"] },
        },
      ],
    },
  },
];

export const contentRepurposingEdges: Partial<DBEdge>[] = [
  {
    source: INPUT_ID,
    target: FETCH_ID,
    uiConfig: {},
  },
  {
    source: FETCH_ID,
    target: EXTRACTION_ID,
    uiConfig: {},
  },
  {
    source: EXTRACTION_ID,
    target: TWITTER_ID,
    uiConfig: {},
  },
  {
    source: EXTRACTION_ID,
    target: LINKEDIN_ID,
    uiConfig: {},
  },
  {
    source: EXTRACTION_ID,
    target: INSTAGRAM_ID,
    uiConfig: {},
  },
  {
    source: TWITTER_ID,
    target: OUTPUT_ID,
    uiConfig: {},
  },
  {
    source: LINKEDIN_ID,
    target: OUTPUT_ID,
    uiConfig: {},
  },
  {
    source: INSTAGRAM_ID,
    target: OUTPUT_ID,
    uiConfig: {},
  },
];
