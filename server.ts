import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Standard dotenv loading
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database for Sandbox Mode
interface ResearchItem {
  id: string;
  user_id: string;
  question: string;
  search_query: string;
  attempts: number;
  final_answer: string;
  created_at: string;
}

interface SandboxUser {
  email: string;
  passwordHash: string;
}

const sandboxUsers: SandboxUser[] = [
  // Seed a default user for easy testing
  { email: "user@example.com", passwordHash: "password123" }
];

const sandboxResearchHistory: ResearchItem[] = [
  {
    id: "res-1",
    user_id: "user-default",
    question: "What is LangGraph?",
    search_query: "LangGraph agentic workflows multi agent langchain documentation",
    attempts: 2,
    final_answer: "### LangGraph Overview\n\n**LangGraph** is a library developed by LangChain designed to build stateful, multi-actor applications with LLMs. It is heavily inspired by graphs, allowing developers to define workflows as cyclic graphs (contain loops), which is dynamic for agentic architectures.\n\n#### Key Characteristics:\n1. **Cycles and Loops**: Unlike standard linear chains (DAGs), LangGraph allows cycles. This is essential for iterative agentic reasoning, such as *agent-explores -> finds missing info -> loops back to planning -> executes again*.\n2. **State Management**: It maintains a persistent state thread throughout the cycle, ensuring context is never lost across multiple turns or multiple interactive entities.\n3. **Human-in-the-Loop Integration**: Native support for pausing execution, awaiting approvals, and hot-swapping states in the graph.",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  },
  {
    id: "res-2",
    user_id: "user-default",
    question: "How does React 19 Server Actions work?",
    search_query: "React 19 Server Actions use server formAction hooks spec",
    attempts: 1,
    final_answer: "### React 19 Server Actions\n\nReact 19 introduces **Server Actions** natively to bridge the gap between clients and servers. They allow clients to call server side functions directly through forms or standard triggers, without writing custom fetch endpoints.\n\n#### Key benefits:\n* **Form integration**: Can be passed directly to the `<form action={myServerAction}>` prop.\n* **Stateful feedback**: Pairs beautifully with hooks such as `useActionState` and `useFormStatus` to handle pending states and result values natively.\n* **Progressive enhancement**: Forms are fully functional even before client-side JavaScript finishes downloading.",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  }
];

// Sandbox Authentication API
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const userExists = sandboxUsers.some((u) => u.email === email);
  if (userExists) {
    return res.status(400).json({ error: "User already exists" });
  }

  sandboxUsers.push({ email, passwordHash: password });
  return res.status(200).json({ status: "success", message: "User registered successfully" });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = sandboxUsers.find((u) => u.email === email && u.passwordHash === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Return a simulation JWT token
  return res.json({
    access_token: `sandbox_jwt_token_${Buffer.from(email).toString("base64")}`
  });
});

// Middleware to mock Authorization check for Sandbox API
const authenticateSandboxToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access: Access Token missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token.startsWith("sandbox_jwt_token_")) {
    return res.status(401).json({ error: "Unauthorized access: Invalid or expired token" });
  }
  // Extract mock user_id
  const base64Part = token.replace("sandbox_jwt_token_", "");
  try {
    req.userEmail = Buffer.from(base64Part, "base64").toString("ascii");
  } catch {
    req.userEmail = "user@example.com";
  }
  next();
};

// Sandbox Research API (No Google Gemini SDK required)
app.post("/api/research", authenticateSandboxToken, async (req: any, res : any) => {
  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Research query is required" });
  }

  try {
    const generatedSearchQuery = `${query.trim().toLowerCase().split(" ").slice(0, 5).join(" ")} detailed analysis documentation wiki`;
    const attemptsCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 attempts

    // Construct high-quality synthesized study guide mock report as sandbox result
    const synthesizedAnswer = `## Executive Summary
    
Multi-vector synthesis completed for query: **"${query.trim()}"**.

### Primary Findings & Architecture

1. **Procedural Overview**: To process this inquiry, automated sequence operations were instantiated. 
2. **Contextual Evaluation**: Multiple resources were evaluated to construct this executive brief.
3. **Primary Recommendation**: Keep execution highly modular, stateful, and secure using standard asynchronous middleware controls.

*Note: This response model matches the expected { id, final_answer } payload format.*`;

    const newItem: ResearchItem = {
      id: "res-" + Date.now(),
      user_id: req.userEmail || "user-default",
      question: query,
      search_query: generatedSearchQuery,
      attempts: attemptsCount,
      final_answer: synthesizedAnswer,
      created_at: new Date().toISOString()
    };

    sandboxResearchHistory.unshift(newItem); // prepends to list

    return res.status(200).json({
      final_answer: newItem.final_answer
    });
  } catch (err: any) {
    console.error("Research API Error:", err);
    return res.status(500).json({ error: err.message || "An error occurred during research compilation." });
  }
});

// Sandbox History (Paginated)
app.get("/api/history", authenticateSandboxToken, (req: any, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;

  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;

  const paginatedList = sandboxResearchHistory.slice(startIndex, endIndex);

  // Return list with only question, attempts, final_answer, and created_at fields in response payload
  const responseHistory = paginatedList.map((item) => ({
    question: item.question,
    attempts: item.attempts,
    final_answer: item.final_answer,
    created_at: item.created_at
  }));

  return res.json({
    history: responseHistory,
    page: page,
    size: size,
    total: sandboxResearchHistory.length
  });
});

// Sandbox History Details
app.get("/api/history/:history_id", authenticateSandboxToken, (req, res) => {
  const { history_id } = req.params;
  const item = sandboxResearchHistory.find((h) => h.id === history_id || h.created_at === history_id);
  if (!item) {
    return res.status(404).json({ error: "Research log not found" });
  }
  return res.json({
    id: item.created_at, // Use created_at as logical ID on frontend
    user_id: item.user_id,
    question: item.question,
    search_query: item.search_query,
    attempts: item.attempts,
    final_answer: item.final_answer,
    created_at: item.created_at
  });
});

// Sandbox History Delete
app.delete("/api/history/:history_id", authenticateSandboxToken, (req, res) => {
  const { history_id } = req.params;
  const index = sandboxResearchHistory.findIndex((h) => h.id === history_id || h.created_at === history_id);
  if (index === -1) {
    return res.status(404).json({ error: "Research log not found" });
  }
  sandboxResearchHistory.splice(index, 1);
  return res.json({ status: "success", message: "Research log deleted representationally" });
});

// Sandbox Analytics API
app.get("/api/analytics", authenticateSandboxToken, (req, res) => {
  const totalResearches = sandboxResearchHistory.length;
  const averageAttempts = totalResearches > 0
    ? parseFloat((sandboxResearchHistory.reduce((acc, h) => acc + h.attempts, 0) / totalResearches).toFixed(1))
    : 0;

  const uniqueUsers = new Set(sandboxUsers.map((u) => u.email)).size;

  const latestResearchStr = totalResearches > 0
    ? sandboxResearchHistory[0].created_at
    : new Date().toISOString();

  return res.json({
    total_users: uniqueUsers,
    total_researches: totalResearches,
    average_attempts: averageAttempts,
    latest_research: latestResearchStr
  });
});

// Vite & Static file hosting setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Research Assistant listening on port ${PORT}`);
  });
}

startServer();
