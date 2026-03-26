import { DBEdge, DBNode } from "app-types/workflow";
import { generateUUID } from "lib/utils";

const INPUT_ID = generateUUID();
const SEARCH_ID = generateUUID();
const ANALYSIS_ID = generateUUID();
const DETAIL_CONDITION_ID = generateUUID();
const DETAIL_FETCH_ID = generateUUID();
const SUMMARY_ID = generateUUID();
const OUTPUT_ID = generateUUID();
const NOTE_ID = generateUUID();

export const productResearchNodes: Partial<DBNode>[] = [
  {
    id: INPUT_ID,
    kind: "input",
    name: "INPUT",
    description: "Collect product name and research context",
    uiConfig: {
      position: { x: 0, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "input",
      outputSchema: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description:
              "Name of the product to research (e.g., 'iPhone 16', 'Tesla Model 3')",
          },
          research_focus: {
            type: "string",
            description:
              "What aspects to focus on (e.g., 'pricing, features, reviews')",
          },
        },
        required: ["product_name"],
      },
    },
  },
  {
    id: SEARCH_ID,
    kind: "tool",
    name: "WEB_SEARCH",
    description: "Search for product information",
    uiConfig: {
      position: { x: 360, y: 0 },
      type: "default",
    },
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
              {
                type: "text",
                text: "Search for information about ",
              },
              {
                type: "mention",
                attrs: {
                  id: "search-mention-1",
                  label: `{"nodeId":"${INPUT_ID}","path":["product_name"]}`,
                },
              },
              {
                type: "text",
                text: ", focusing on: ",
              },
              {
                type: "mention",
                attrs: {
                  id: "search-mention-2",
                  label: `{"nodeId":"${INPUT_ID}","path":["research_focus"]}`,
                },
              },
            ],
          },
        ],
      },
      tool: {
        type: "app-tool",
        id: "webSearch",
        description:
          "Web search tool for finding product information, reviews, pricing, and specifications",
        parameterSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query for product research",
            },
            numResults: {
              type: "number",
              description: "Number of results to return",
              default: 8,
              minimum: 1,
              maximum: 15,
            },
          },
          required: ["query"],
        },
      },
    },
  },
  {
    id: ANALYSIS_ID,
    kind: "llm",
    name: "ANALYZE_RESULTS",
    description: "Analyze search results and identify key product details",
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
              product_summary: {
                type: "string",
                description: "Brief overview of what the product is",
              },
              key_features: {
                type: "array",
                items: { type: "string" },
                description: "List of main features or specifications",
              },
              pricing_info: {
                type: "string",
                description: "Pricing information if available",
              },
              sentiment: {
                type: "string",
                description:
                  "General market sentiment (positive, mixed, negative)",
              },
              best_source_url: {
                type: "string",
                description:
                  "URL of the most detailed/reliable source for deeper extraction (empty if none found)",
              },
              sources_count: {
                type: "number",
                description: "Number of sources analyzed",
              },
            },
          },
          totalTokens: { type: "number" },
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
                    text: "Analyze the following search results for ",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: "analysis-mention-1",
                      label: `{"nodeId":"${INPUT_ID}","path":["product_name"]}`,
                    },
                  },
                  {
                    type: "text",
                    text: ":",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "mention",
                    attrs: {
                      id: "analysis-mention-2",
                      label: `{"nodeId":"${SEARCH_ID}","path":["tool_result"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "\n\nExtract the following information in structured format:\n\n1. **product_summary**: What is this product? Who makes it? What does it do?\n2. **key_features**: List 3-5 main features or specs\n3. **pricing_info**: Any pricing found, or 'Not specified in search results'\n4. **sentiment**: Overall reception (positive/mixed/negative)\n5. **best_source_url**: If there's a particularly detailed source (official site, detailed review), provide the URL for deeper extraction. Otherwise empty string.\n6. **sources_count**: How many sources were reviewed",
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
    id: DETAIL_CONDITION_ID,
    kind: "condition",
    name: "HAS_DETAIL_URL?",
    description:
      "Check if there's a URL worth extracting detailed content from",
    uiConfig: {
      position: { x: 720, y: 180 },
      type: "default",
    },
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
                nodeId: ANALYSIS_ID,
                path: ["answer", "best_source_url"],
                nodeName: "ANALYZE_RESULTS",
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
    id: DETAIL_FETCH_ID,
    kind: "tool",
    name: "FETCH_DETAILS",
    description: "Extract detailed content from the best source URL",
    uiConfig: {
      position: { x: 1080, y: 120 },
      type: "default",
    },
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
              {
                type: "text",
                text: "Extract detailed content from: ",
              },
              {
                type: "mention",
                attrs: {
                  id: "detail-mention-1",
                  label: `{"nodeId":"${ANALYSIS_ID}","path":["answer","best_source_url"]}`,
                },
              },
            ],
          },
        ],
      },
      tool: {
        type: "app-tool",
        id: "webContent",
        description: "Extract full content from a specific webpage",
        parameterSchema: {
          type: "object",
          properties: {
            urls: {
              type: "array",
              items: { type: "string" },
              description: "URLs to extract content from",
            },
            maxCharacters: {
              type: "number",
              description: "Maximum characters to extract",
              default: 4000,
            },
          },
          required: ["urls"],
        },
      },
    },
  },
  {
    id: SUMMARY_ID,
    kind: "llm",
    name: "FINAL_SUMMARY",
    description: "Generate comprehensive product research report",
    uiConfig: {
      position: { x: 1440, y: 0 },
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
              report: {
                type: "string",
                description: "Comprehensive markdown report on the product",
              },
              verdict: {
                type: "string",
                description: "Quick recommendation or verdict",
              },
              confidence: {
                type: "number",
                description: "Confidence in findings (1-10)",
              },
            },
          },
          totalTokens: { type: "number" },
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
                    text: "Create a comprehensive product research report for ",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: "summary-mention-1",
                      label: `{"nodeId":"${INPUT_ID}","path":["product_name"]}`,
                    },
                  },
                  {
                    type: "text",
                    text: " based on the following analysis:",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "\n\n**Initial Analysis:**\n",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: "summary-mention-2",
                      label: `{"nodeId":"${ANALYSIS_ID}","path":["answer"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "\n\n**Detailed Content (if available):**\n",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: "summary-mention-3",
                      label: `{"nodeId":"${DETAIL_FETCH_ID}","path":["tool_result"]}`,
                    },
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: '\n\nGenerate a structured report with:\n1. **report** (markdown): Product overview, key features, pricing, pros/cons, sources cited\n2. **verdict** (string): A brief recommendation (e.g., "Recommended for power users", "Consider alternatives")\n3. **confidence** (number 1-10): How confident are you in this assessment based on sources found',
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
    id: OUTPUT_ID,
    kind: "output",
    name: "OUTPUT",
    description: "Output the product research report",
    uiConfig: {
      position: { x: 1800, y: 0 },
      type: "default",
    },
    nodeConfig: {
      kind: "output",
      outputSchema: { type: "object", properties: {} },
      outputData: [
        {
          key: "product_report",
          source: { nodeId: SUMMARY_ID, path: ["answer", "report"] },
        },
        {
          key: "verdict",
          source: { nodeId: SUMMARY_ID, path: ["answer", "verdict"] },
        },
        {
          key: "confidence_score",
          source: { nodeId: SUMMARY_ID, path: ["answer", "confidence"] },
        },
        {
          key: "sources_analyzed",
          source: { nodeId: ANALYSIS_ID, path: ["answer", "sources_count"] },
        },
      ],
    },
  },
  {
    id: NOTE_ID,
    kind: "note",
    name: "README",
    description: `# 🔍 Product Research Workflow

A practical workflow template for researching products. Combines web search, LLM analysis, and conditional deep extraction.

## 📋 How to Use

1. **INPUT**: Provide a product name and research focus areas
2. **WEB_SEARCH**: Automatically searches for product information
3. **ANALYZE_RESULTS**: LLM extracts key insights from search results
4. **HAS_DETAIL_URL?**: Conditional branch - if a good source is found, fetch detailed content
5. **FINAL_SUMMARY**: Generates comprehensive markdown report
6. **OUTPUT**: Returns structured report with verdict and confidence score

## 🔄 Flow

\`\`\`
INPUT → WEB_SEARCH → ANALYZE_RESULTS → [HAS_DETAIL_URL?] → FETCH_DETAILS (optional)
                                           ↓
                                    FINAL_SUMMARY → OUTPUT
\`\`\`

## 📊 Output Format

- **product_report**: Markdown formatted research report
- **verdict**: Brief recommendation
- **confidence_score**: 1-10 rating
- **sources_analyzed**: Number of sources reviewed
`,
    uiConfig: {
      position: { x: -200, y: -200 },
      type: "default",
    },
    nodeConfig: {
      kind: "note",
      outputSchema: { type: "object", properties: {} },
    },
  },
];

export const productResearchEdges: Partial<DBEdge>[] = [
  {
    source: INPUT_ID,
    target: SEARCH_ID,
    uiConfig: {},
  },
  {
    source: SEARCH_ID,
    target: ANALYSIS_ID,
    uiConfig: {},
  },
  {
    source: ANALYSIS_ID,
    target: DETAIL_CONDITION_ID,
    uiConfig: {},
  },
  {
    source: DETAIL_CONDITION_ID,
    target: DETAIL_FETCH_ID,
    uiConfig: { sourceHandle: "if" },
  },
  {
    source: DETAIL_CONDITION_ID,
    target: SUMMARY_ID,
    uiConfig: { sourceHandle: "else" },
  },
  {
    source: DETAIL_FETCH_ID,
    target: SUMMARY_ID,
    uiConfig: {},
  },
  {
    source: SUMMARY_ID,
    target: OUTPUT_ID,
    uiConfig: {},
  },
];
