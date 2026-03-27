import { DBEdge, DBNode } from "app-types/workflow";
import { generateUUID } from "lib/utils";

// Persistent UUIDs for robust edge mapping - Chicago Edition 🐻
const NODE_INPUT = generateUUID();
const NODE_SCRAPE = generateUUID();
const NODE_CONDITION = generateUUID();
const NODE_FALLBACK = generateUUID();
const NODE_TAILOR = generateUUID();
const NODE_MATERIALS = generateUUID();
const NODE_DASHBOARD = generateUUID();
const NODE_README = generateUUID();

export const jobApplicationNodes: Partial<DBNode>[] = [
  {
    id: NODE_INPUT,
    kind: "input",
    name: "JOB_INPUT",
    description: "🐻 Initialize your tailored application",
    uiConfig: { position: { x: 0, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "input",
      outputSchema: {
        type: "object",
        properties: {
          job_url: {
            type: "string",
            description: "Direct LinkedIn/Indeed URL",
          },
          base_resume: {
            type: "string",
            description: "Paste your current resume text here",
            maxLength: 20000,
          },
          personal_context: {
            type: "string",
            description: "e.g., 'Focus on my React/Next.js experience'",
          },
        },
        required: ["job_url", "base_resume"],
      },
    },
  },
  {
    id: NODE_SCRAPE,
    kind: "tool",
    name: "AI_SCRAPER",
    description: "🕵️‍♂️ Extracting job requirements...",
    uiConfig: { position: { x: 300, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "tool",
      outputSchema: {
        type: "object",
        properties: { tool_result: { type: "object" } },
      },
      model: { provider: "openRouter", model: "openrouter/free" },
      message: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Visiting job listing: " },
              {
                type: "mention",
                attrs: {
                  id: "m1",
                  label: `{"nodeId":"${NODE_INPUT}","path":["job_url"]}`,
                },
              },
            ],
          },
        ],
      },
      tool: {
        type: "app-tool",
        id: "webContent",
        description: "Scrape job description",
        parameterSchema: {
          type: "object",
          properties: {
            urls: { type: "array", items: { type: "string" } },
            maxCharacters: { type: "number", default: 6000 },
          },
          required: ["urls"],
        },
      },
    },
  },
  {
    id: NODE_CONDITION,
    kind: "condition",
    name: "CHECK_AUTH_WALL",
    description: "🛡️ Validating scraped content...",
    uiConfig: { position: { x: 600, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "condition",
      outputSchema: { type: "object", properties: {} },
      branches: {
        if: {
          id: "if",
          logicalOperator: "AND",
          type: "if",
          conditions: [
            {
              source: {
                nodeId: NODE_SCRAPE,
                path: ["tool_result", "results", "0", "text"],
                nodeName: "AI_SCRAPER",
                type: "string",
              },
              operator: "is_not_empty",
            },
          ],
        },
        else: {
          id: "else",
          logicalOperator: "AND",
          type: "else",
          conditions: [],
        },
      },
    },
  },
  {
    id: NODE_FALLBACK,
    kind: "llm",
    name: "ASSISTANT_COLLABORATION",
    description: "🤝 LinkedIn is blocking my view",
    uiConfig: { position: { x: 600, y: 150 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: { manual_text: { type: "string" } },
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
                    text: "I hit a login wall. Help me out: can you paste the Job Description here? (Open the link in another tab, copy the text, and paste it below)",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openRouter", model: "openrouter/free" },
    },
  },
  {
    id: NODE_TAILOR,
    kind: "llm",
    name: "ATS_OPTIMIZER",
    description: "✨ Tailoring resume bullets...",
    uiConfig: { position: { x: 900, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: {
              bullets: { type: "array", items: { type: "string" } },
              score: { type: "number" },
            },
          },
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a senior hiring manager in Chicago. Rewrite resume bullets to be 'Masterpiece' level—impactful, keyword-dense, and human-sounding. Use OKLCH color logic if asked.",
        },
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Tailor this: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "t1",
                      label: `{"nodeId":"${NODE_INPUT}","path":["base_resume"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "To JD: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "t2",
                      label: `{"nodeId":"${NODE_SCRAPE}","path":["tool_result","results","0","text"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "OR: " },
                  {
                    type: "mention",
                    attrs: {
                      id: "t3",
                      label: `{"nodeId":"${NODE_FALLBACK}","path":["answer","manual_text"]}`,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openRouter", model: "openrouter/free" },
    },
  },
  {
    id: NODE_MATERIALS,
    kind: "llm",
    name: "CONTENT_GENERATOR",
    description: "🖋️ Drafting intro materials...",
    uiConfig: { position: { x: 1200, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: {
              intro: { type: "string" },
              why_us: { type: "string" },
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
                    text: "Generate a personalized intro for this job. Include a 'Copy to Clipboard' feel.",
                  },
                ],
              },
            ],
          },
        },
      ],
      model: { provider: "openRouter", model: "openrouter/free" },
    },
  },
  {
    id: NODE_DASHBOARD,
    kind: "output",
    name: "TAILORED_DASHBOARD",
    description: "🚀 Masterpiece Application Dashboard",
    uiConfig: { position: { x: 1500, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "output",
      outputSchema: { type: "object", properties: {} },
      outputData: [
        {
          key: "🎯 Tailored Bullets (Copy-Paste Ready)",
          source: { nodeId: NODE_TAILOR, path: ["answer", "bullets"] },
        },
        {
          key: "💬 LinkedIn Intro",
          source: { nodeId: NODE_MATERIALS, path: ["answer", "intro"] },
        },
        {
          key: "❓ 'Why Us?' Response",
          source: { nodeId: NODE_MATERIALS, path: ["answer", "why_us"] },
        },
        {
          key: "📈 ATS Score",
          source: { nodeId: NODE_TAILOR, path: ["answer", "score"] },
        },
        {
          key: "✅ Status",
          source: { nodeId: "", path: ["Ready for Submission"] },
        },
      ],
    },
  },
  {
    id: NODE_README,
    kind: "note",
    name: "README",
    description: `# 🐻 Masterpiece Job Assistant (v1.0)
The ultimate boilerplate for high-conversion applications.

## 📋 Execution Pipeline
1. **SCRAPE**: Attempts a deep scrape of the Job URL.
2. **FALLBACK**: If LinkedIn blocks us, the assistant asks for a manual paste.
3. **TAILOR**: Rewrites resume bullets using Gemini 2.0 Flash (ATS Optimized).
4. **DASHBOARD**: Displays everything in a Copy-Paste ready UI.

## 💡 Chicago Dev Tips
- Open your job board in a side window.
- Use the **Copy All** logic from the dashboard.
- Let's get that offer! 🚀`,
    uiConfig: { position: { x: -300, y: -200 }, type: "default" },
    nodeConfig: {
      kind: "note",
      outputSchema: { type: "object", properties: {} },
    },
  },
];

export const jobApplicationEdges: Partial<DBEdge>[] = [
  { source: NODE_INPUT, target: NODE_SCRAPE, uiConfig: {} },
  { source: NODE_SCRAPE, target: NODE_CONDITION, uiConfig: {} },
  {
    source: NODE_CONDITION,
    target: NODE_FALLBACK,
    uiConfig: { sourceHandle: "else" },
  },
  {
    source: NODE_CONDITION,
    target: NODE_TAILOR,
    uiConfig: { sourceHandle: "if" },
  },
  { source: NODE_FALLBACK, target: NODE_TAILOR, uiConfig: {} },
  { source: NODE_TAILOR, target: NODE_MATERIALS, uiConfig: {} },
  { source: NODE_MATERIALS, target: NODE_DASHBOARD, uiConfig: {} },
];
