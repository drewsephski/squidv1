<div align="center">

<img width="800" alt="Squid - AI Chatbot" src="https://github.com/user-attachments/assets/d6ba80ff-a62a-4920-b266-85c4a89d6076" />

<h1>Squid</h1>

<p><strong>The open-source AI assistant that brings all your tools together.</strong></p>

<p>
  <a href="https://squidv1-demo.vercel.app/" target="_blank"><strong>🚀 Live Demo</strong></a> •
  <a href="#quick-start"><strong>⚡ Quick Start</strong></a> •
  <a href="#features"><strong>✨ Features</strong></a> •
  <a href="https://discord.gg/gCRu69Upnp" target="_blank"><strong>💬 Discord</strong></a>
</p>

[![MCP Supported](https://img.shields.io/badge/MCP-Supported-00c853)](https://modelcontextprotocol.io/introduction)
[![Local First](https://img.shields.io/badge/Local-First-blue)](https://localfirstweb.dev/)
[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)
[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY&env=GOOGLE_GENERATIVE_AI_API_KEY&env=ANTHROPIC_API_KEY&envDescription=BETTER_AUTH_SECRET+is+required+(enter+any+secret+value).+At+least+one+LLM+provider+API+key+(OpenAI,+Claude,+or+Google)+is+required,+but+you+can+add+all+of+them.+See+the+link+below+for+details.&envLink=https://github.com/cgoinglove/better-chatbot/blob/main/.env.example&demo-title=squid&demo-description=An+Open-Source+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"integration","protocol":"storage","productSlug":"upstash-kv","integrationSlug":"upstash"},{"type":"blob"}>)

</div>

---

## What is Squid?

**Squid** is an open-source AI chatbot that combines the best features from ChatGPT, Claude, Grok, and Gemini — into one powerful, customizable platform.

Think of it as your **universal AI workspace**: chat with any AI model, connect any tool, automate workflows, and collaborate with your team — all in one place.

---

## ✨ Features

### 🤖 Multi-AI Support
Connect to **all major AI providers** — use the best model for each task.

- OpenAI (GPT-4o, o1, o3)
- Anthropic (Claude 3.5, 3.7 Sonnet)
- Google (Gemini 1.5, 2.0)
- xAI (Grok)
- Groq (fast inference)
- Ollama (local models)
- OpenRouter (access 100+ models)

### 🔌 MCP Tools Integration
**Connect any tool** to your AI with the Model Context Protocol. Squid works with:

- **Browser automation** (Playwright MCP)
- **Database queries** (PostgreSQL, MySQL)
- **File systems** (local, cloud storage)
- **GitHub operations** (issues, PRs, code search)
- **Custom APIs** (REST, GraphQL)
- **Code execution** (JavaScript, Python)

> **Use case:** Ask your AI to "check my GitHub issues, search the web for solutions, and create a summary report" — all in one chat.

### 🎨 Image Generation & Editing
Create stunning visuals directly in your chats:

- Generate images from text descriptions
- Edit and modify existing images
- Support for OpenAI DALL-E, Google Imagen, and more

### 🗣️ Realtime Voice Chat
Talk to your AI naturally with **voice conversations** powered by OpenAI's Realtime API. Perfect for hands-free assistance while you work.

### 🔄 Visual Workflows
Build **reusable automation** by connecting AI reasoning with tool execution:

- Create visual workflows with drag-and-drop
- Chain multiple AI calls and tool actions
- Publish workflows as `@mentionable` tools

> **Use case:** Build a "Research Assistant" workflow that searches the web, summarizes findings, and creates a formatted report.

### 🤖 Custom Agents
Create **specialized AI assistants** for specific tasks:

- Define custom system prompts
- Configure which tools each agent can access
- Invoke instantly with `@agent_name`

> **Use case:** A "GitHub Manager" agent that handles all your repository tasks, or a "Code Reviewer" that checks your pull requests.

### ⚡ Quick Tool Mentions (`@`)
**Type `@` to instantly access** any tool, agent, or workflow — no menus, no clicks.

| What you type | What happens |
|---------------|--------------|
| `@web` | Search the internet |
| `@agent_name` | Switch to your custom agent |
| `@workflow` | Run your automation |
| `@mcp("server")` | Use any MCP tool |

### 🛠️ Built-in Tools
Essential tools included out of the box:

- **Web Search** — AI-powered search with Exa AI
- **Code Execution** — Run JavaScript/Python in sandboxed environment
- **Data Visualization** — Interactive tables and charts
- **File Upload** — Store and reference documents, images, code

### 🔐 Team Collaboration
Built for teams from day one:

- **Share agents** with your team
- **Share workflows** for consistent processes
- **Share MCP configurations** — one setup, whole team benefits
- **Role-based access** for admin control

---

### Browser Automation with MCP

> "Navigate to Google, search for 'Model Context Protocol', and summarize the top 3 results"

### Visual Workflows

![Workflow Builder](https://github.com/user-attachments/assets/e69e72e8-595c-480e-b519-4531f4c6331f)

> Build complex automations visually, then use them with `@workflow_name`

### Voice Assistant + Tools

> Talk naturally while the AI executes tools in real-time

---

## 📖 Use Cases

### For Developers
- **Code review assistant** — automated PR summaries, bug detection
- **DevOps automation** — deploy, monitor, alert workflows
- **Documentation generator** — turn code into docs automatically

### For Researchers
- **Research assistant** — web search, summarize, cite sources
- **Data analysis** — process CSVs, generate charts, export reports
- **Literature review** — search papers, extract insights

### For Teams
- **Shared knowledge base** — team agents with company context
- **Onboarding automation** — new hire workflows
- **Meeting summaries** — transcribe, action items, follow-ups

### For Creators
- **Content generation** — blog posts, social media, newsletters
- **Image creation** — thumbnails, graphics, illustrations
- **Idea brainstorming** — structured ideation sessions

---

## 📚 Documentation

- **[MCP Server Setup](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)** — Connect any tool
- **[Docker Hosting](./docs/tips-guides/docker.md)** — Self-host with Docker
- **[Vercel Deploy](./docs/tips-guides/vercel.md)** — Production deployment
- **[OAuth Setup](./docs/tips-guides/oauth.md)** — Google/GitHub/Microsoft login
- **[System Prompts](./docs/tips-guides/system-prompts-and-customization.md)** — Customize your AI
- **[File Storage](./docs/tips-guides/file-storage.md)** — Upload and manage files
- **[E2E Testing](./docs/tips-guides/e2e-testing-guide.md)** — Automated testing

---

## 🗺️ Roadmap

- [x] File Upload & Storage
- [x] Image Generation
- [x] Realtime Voice Chat
- [x] MCP Protocol Support
- [x] Visual Workflow Builder
- [ ] Collaborative Document Editing (like OpenAI Canvas)
- [ ] RAG (Retrieval-Augmented Generation)
- [ ] Web-based Compute (WebContainers integration)

---

## 💝 Support

If Squid helps you work smarter, please consider supporting the project:

- ⭐ **Star** this repository
- 🐛 **[Report issues](https://github.com/drewsephski/squidv1/issues)** or suggest features
- 💰 **[Become a sponsor](https://github.com/sponsors/cgoinglove)**

---

## 🤝 Contributing

We welcome contributions! See our **[Contributing Guide](./CONTRIBUTING.md)** for details.

- Bug reports and feature ideas
- Code improvements and optimizations
- **[Language translations](./messages/language.md)** — help make Squid accessible worldwide

---

## 💬 Community

[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)

Join our Discord for support, feature discussions, and to connect with other Squid users!

---

<p align="center">
  Built with ❤️ using <a href="https://nextjs.org">Next.js</a> and <a href="https://sdk.vercel.ai">Vercel AI SDK</a>
</p>

