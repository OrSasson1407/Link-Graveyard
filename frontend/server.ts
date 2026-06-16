import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";

// Resolve directories (ES module environment compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// In-memory server state seeded with visual mockups
const DEFAULT_BOOKMARKS = [
  {
    id: "1",
    title: "Understanding React Server Components Architecture",
    url: "https://github.com/reactjs/rfcs/blob/main/text/0000-react-server-components.md",
    domain: "github.com",
    summary: "RSCs execute entirely on the server, resulting in zero bundle size cost for the client. They allow direct access to backend resources (databases, file systems) directly from React components. Unlike traditional SSR, RSCs can be re-fetched without losing client state (e.g., focus, input values).",
    intent: "You saved this shortly after bookmarking two Next.js 13 documentation pages. It appears you are researching performance optimization patterns for your upcoming refactor.",
    status: "REVIVED" as const,
    tags: ["REACT", "ARCHITECTURE"],
    addedAt: "2026-06-16T04:04:36.000Z", // 2h ago
    readingTime: "8m read",
    isRead: false
  },
  {
    id: "2",
    title: "The Techno-Capitalist Machine",
    url: "https://pmarca.substack.com/p/techno-capitalist-machine",
    domain: "pmarca.substack.com",
    summary: "Exploring the philosophical underpinnings of accelerationism in the context of modern AI development and industrial computing cycles.",
    intent: "You bookmarked this during an intensive study of AI macroeconomic cycles and historical techno-capital structures.",
    status: "ARCHIVED" as const,
    tags: ["PHILOSOPHY", "AI"],
    addedAt: "2026-06-15T06:04:36.000Z", // Yesterday
    readingTime: "18m read",
    isRead: true
  },
  {
    id: "3",
    title: "Designing for Developer Experience",
    url: "https://figma.com/design/dev-experience",
    domain: "figma.com",
    summary: "How we structured our component library to bridge the gap between design tokens and production-ready implementations in development workflows.",
    intent: "This is a key component of your design token integration workflow, saved during a review of cross-functional team specifications.",
    status: "ARCHIVED" as const,
    tags: ["DESIGN SYSTEMS"],
    addedAt: "2026-06-12T06:04:36.000Z", // Oct 12
    readingTime: "14m read",
    isRead: true
  },
  {
    id: "4",
    title: "Understanding the WebGL Rendering Pipeline",
    url: "https://github.com/webgl/rendering-pipeline",
    domain: "github.com",
    summary: "A deep dive into how WebGL processes vertices and fragments to render complex 3D scenes in the browser context with hardware acceleration.",
    intent: "Investigating GPU resources and rendering pipelines, specifically looking for bottlenecks in shader compiles.",
    status: "PROCESSING" as const,
    tags: ["graphics", "webdev"],
    addedAt: "2026-06-16T05:52:36.000Z", // 12m ago
    readingTime: "12m read",
    isRead: false
  },
  {
    id: "5",
    title: "Anthropic System Prompts Documentation",
    url: "https://docs.anthropic.com/claude/docs/system-prompts",
    domain: "anthropic.com",
    summary: "Guidelines for structuring effective system prompts to steer Claude's behavior and establish persistent system constraints.",
    intent: "Steering prompt constraints and formatting robust custom models for specialized agent logic.",
    status: "REVIVED" as const,
    tags: ["Unread", "ai"],
    addedAt: "2026-06-16T04:04:36.000Z", // 2h ago
    readingTime: "5m read",
    isRead: false
  },
  {
    id: "6",
    title: "Advanced CSS Grid Techniques - Conference Talk",
    url: "https://youtube.com/watch?v=grid-techniques",
    domain: "youtube.com",
    summary: "Video presentation covering subgrid, complex track sizing, and responsive layouts without media queries for layout layouts.",
    intent: "Refined CSS tricks review, focusing on alignment performance for dashboards.",
    status: "ARCHIVED" as const,
    tags: ["webdev"],
    addedAt: "2026-06-15T06:04:36.000Z", // Yesterday
    readingTime: "25m read",
    isRead: true
  },
  {
    id: "7",
    title: "The Architecture of Tomorrow",
    url: "https://archive.org/details/architecture-tomorrow",
    domain: "archive.org",
    summary: "An in-depth exploration of emerging structural paradigms in digital spaces, focusing on sovereign infrastructure and localized data sanctuaries.",
    intent: "Sovereign platform research and localized offline archival strategies.",
    status: "REVIVED" as const,
    tags: ["architecture", "sovereign"],
    addedAt: "2026-06-16T04:04:36.000Z", // 2h ago
    readingTime: "15m read",
    isRead: false
  },
  {
    id: "8",
    title: "State of CSS 2024",
    url: "https://dev.to/state-of-css-2024",
    domain: "dev.to",
    summary: "A comprehensive review of new CSS features including subgrid, complex selectors, and native nesting capabilities for modern web development.",
    intent: "Kept for review regarding nesting benchmarks and scroll-driven animation updates.",
    status: "ARCHIVED" as const,
    tags: ["css", "webdev"],
    addedAt: "2026-06-15T06:04:36.000Z", // Yesterday
    readingTime: "10m read",
    isRead: true
  },
  {
    id: "9",
    title: "Understanding WebGL Shaders",
    url: "https://github.com/webgl/shaders-tutorial",
    domain: "github.com",
    summary: "A technical dive into writing efficient fragment shaders for immersive web experiences. Discussing performance implications and creative applications.",
    intent: "Written during shader development sessions targeting lower battery depletion on mobile.",
    status: "PROCESSING" as const,
    tags: ["shaders", "graphics"],
    addedAt: "2026-06-13T06:04:36.000Z", // 3d ago
    readingTime: "12m read",
    isRead: false
  }
];

let bookmarksState = [...DEFAULT_BOOKMARKS];

let profileState = {
  displayName: "Crypt Researcher",
  bio: "Archiving the forgotten web. Focus on early 2000s protocols and lost digital art.",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuACJD8IkDVzRgBl6E9degcji8WwAdzRtx1u-dtnoOAxCc14xEFjN1I9geQx6zNlJLj4ZvI0_mMz65_hdz_ZQkxt66xK7CUwlV73hvKIZt6gAR6q0z_jpMDjmH4p-YsJN_XQGApI2OtEqqH6T4plWgJMwfyUx8MIEo3WdSncGifS1s6AXLfIbWgJyOriN0_ezm7RNhBaEUIuakdN9rNbK340R_9LK550zcFTnEgdh7mcqYuw80HYStR8fx_uKg-3fVdp2uUicOyUTU9a"
};

let billingHistoryState = [
  { id: "b1", date: "Nov 14, 2023", description: "Premium Annual Plan", amount: "$120.00", status: "PAID" as const },
  { id: "b2", date: "Nov 14, 2022", description: "Premium Annual Plan", amount: "$120.00", status: "PAID" as const },
  { id: "b3", date: "Nov 14, 2021", description: "Pro Annual Plan", amount: "$96.00", status: "PAID" as const }
];

let appearanceState = {
  theme: "dark" as const,
  accent: "indigo" as const,
  density: "comfortable" as const
};

let aiQueryHistory: Array<{ query: string; response: string; timestamp: string }> = [];

// Lazy-initialized GoogleGenAI SDK client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Falling back to local static processing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "DUMMY_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Extract domain helper
function extractDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);
    return parsed.hostname.replace("www.", "");
  } catch (e) {
    return "unknown.com";
  }
}

// API Routes

// GET: All Server State
app.get("/api/state", (req, res) => {
  res.json({
    bookmarks: bookmarksState,
    profile: profileState,
    billingHistory: billingHistoryState,
    appearance: appearanceState,
    aiQueryHistory
  });
});

// POST: Add new Bookmark
app.post("/api/bookmarks", async (req, res) => {
  const { url, title } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL parameter is required" });
  }

  const domain = extractDomain(url);
  const cleanTitle = title || `Source: ${domain}`;
  const isKeyAvailable = !!process.env.GEMINI_API_KEY;

  let summary = "Pending AI-powered metadata crawling...";
  let intent = "Saved during active research session.";
  let tags = ["webdev"];
  let readingTime = "5m read";

  if (isKeyAvailable) {
    try {
      const ai = getAiClient();
      const prompt = `Analyze this bookmarked page: Title="${cleanTitle}", URL="${url}".
      Please output a highly-styled, short description of the article's core content,
      a specific and interesting "inferred user intent" relating to why a researcher might archive it,
      and 2-3 logical lowercase tag labels (without the "#" character). Format the response as JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are Link Graveyard's high-fidelity AI Preservation engine. Generate deep, sovereign-style summaries, reading timelines, tags, and cognitive intent reports about pages.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Detailed 1-2 sentence breakdown." },
              intent: { type: Type.STRING, description: "Detailed contextual inferred user intent, beginning with 'You saved this ...' or similar scholarly, smart phrasing." },
              readingTime: { type: Type.STRING, description: "Duration format, e.g. '8m read' or '12m read'" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 2 lowercase categorizations, e.g. ['graphics', 'webdev']."
              }
            },
            required: ["summary", "intent", "readingTime", "tags"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text.trim());
        summary = data.summary || summary;
        intent = data.intent || intent;
        readingTime = data.readingTime || readingTime;
        tags = data.tags || tags;
      }
    } catch (err: any) {
      console.error("Gemini crawl failed, falling back safely:", err.message);
      // Fallback fallback generator based on title
      summary = `Archived reference regarding ${cleanTitle}. Contextual crawls will retry once processing queue resolves.`;
      intent = `You archived this page while researching terms related to ${domain}.`;
      tags = [domain.split(".")[0], "archive"];
    }
  } else {
    // Elegant fallback simulation
    summary = `Autosaved archive reference of ${cleanTitle}. For real-time AI summaries, hook up your GEMINI_API_KEY in Settings Secrets.`;
    intent = `You preserved this bookmark from ${domain} to guard against link rot and preserve contextual knowledge.`;
    tags = [domain.split(".")[0] || "web", "archived"];
    readingTime = "7m read";
  }

  const newBookmark = {
    id: String(Date.now()),
    title: cleanTitle,
    url,
    domain,
    summary,
    intent,
    status: "PROCESSING" as const,
    tags,
    addedAt: new Date().toISOString(),
    readingTime,
    isRead: false
  };

  bookmarksState.unshift(newBookmark);
  res.status(201).json(newBookmark);
});

// POST: Update Bookmark status
app.post("/api/bookmarks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, isRead } = req.body;
  const item = bookmarksState.find(b => b.id === id);
  if (!item) {
    return res.status(404).json({ error: "Bookmark not found" });
  }

  if (status !== undefined) item.status = status;
  if (isRead !== undefined) item.isRead = isRead;

  res.json(item);
});

// DELETE: Remove Bookmark
app.delete("/api/bookmarks/:id", (req, res) => {
  const { id } = req.params;
  bookmarksState = bookmarksState.filter(b => b.id !== id);
  res.json({ success: true, id });
});

// POST: Update Profile
app.post("/api/profile", (req, res) => {
  const { displayName, bio } = req.body;
  if (displayName !== undefined) profileState.displayName = displayName;
  if (bio !== undefined) profileState.bio = bio;
  res.json(profileState);
});

// POST: Update Appearance
app.post("/api/appearance", (req, res) => {
  const { theme, accent, density } = req.body;
  if (theme !== undefined) appearanceState.theme = theme;
  if (accent !== undefined) appearanceState.accent = accent;
  if (density !== undefined) appearanceState.density = density;
  res.json(appearanceState);
});

// POST: Query AI (Context-aware search or smart prompt)
app.post("/api/query-ai", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt parameter is required" });
  }

  const isKeyAvailable = !!process.env.GEMINI_API_KEY;
  let responseText = "";

  // Compile context of saved links for Gemini grounding
  const activeLogs = bookmarksState.map(b => `- [${b.title}] at ${b.domain}: summary: ${b.summary}`).join("\n");

  if (isKeyAvailable) {
    try {
      const ai = getAiClient();
      const promptBody = `You are the Sovereign intelligence core. A user has query: "${prompt}".
      Ground your knowledge strictly using their physical archive state, which is:
      ${activeLogs}
      Provide a highly polished, analytical, and short diagnostic answer identifying patterns in their reading,
      recommending which links they should immediately revive, or answering specific questions. Keep the tone calm, highly structured, and respectful.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptBody,
      });

      responseText = result.text || "No response received from active vectors.";
    } catch (err: any) {
      console.error("Query AI engine error:", err.message);
      responseText = `The sovereign intelligence core is offline. However, reflecting on your ${bookmarksState.length} buried records, you are strongly focused on ${bookmarksState[0]?.tags.join(", ") || "development frameworks"}. Connect your GEMINI_API_KEY to authorize contextual queries.`;
    }
  } else {
    // Clean mock response targeting user query
    if (prompt.toLowerCase().includes("tailwind") || prompt.toLowerCase().includes("design")) {
      responseText = `I have scanned your archive. You have multiple items targeting UX including "**Designing for Developer Experience**". I suggest reviving that figma.com entry now to streamline your tokens strategy.`;
    } else {
      responseText = `Analytical response: Based on your ${bookmarksState.length} preserved documents, the primary density lies in systems code and frontend rendering. Check your settings to hook up GEMINI_API_KEY in the **Secrets** panel for full cognitive search grounding.`;
    }
  }

  const historyItem = {
    query: prompt,
    response: responseText,
    timestamp: new Date().toISOString()
  };

  aiQueryHistory.unshift(historyItem);
  res.json(historyItem);
});


// Setup development server or production assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Server static assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Link Graveyard] Server successfully booted at http://localhost:${PORT}`);
  });
}

startServer();
