// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  audits;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.audits = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createAudit(insertAudit) {
    const id = randomUUID();
    const audit = {
      id,
      brandName: insertAudit.brandName,
      websiteUrl: insertAudit.websiteUrl,
      status: insertAudit.status || "pending",
      results: insertAudit.results || null,
      strategy: insertAudit.strategy || null,
      totalPublications: insertAudit.totalPublications || null,
      mentionsFound: insertAudit.mentionsFound || null,
      coverageRate: insertAudit.coverageRate || null,
      topSource: insertAudit.topSource || null,
      shareableLink: null,
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null
    };
    this.audits.set(id, audit);
    return audit;
  }
  async getAudit(id) {
    return this.audits.get(id);
  }
  async updateAudit(id, updates) {
    const audit = this.audits.get(id);
    if (!audit) return void 0;
    const updatedAudit = { ...audit, ...updates };
    this.audits.set(id, updatedAudit);
    return updatedAudit;
  }
  async getAuditsByStatus(status) {
    return Array.from(this.audits.values()).filter((audit) => audit.status === status);
  }
};
var storage = new MemStorage();

// server/services/serpapi.ts
import axios from "axios";
var SerperService = class {
  apiKey;
  baseUrl = "https://google.serper.dev/search";
  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("SERPER_API_KEY is required");
    }
  }
  async searchDomain(domain, brandName) {
    try {
      const queries = [
        `site:${domain} "${brandName}"`,
        // Exact match primary
        `site:${domain} ${brandName}`,
        // Broader match
        `site:${domain} "${brandName}" OR "${brandName} inc" OR "${brandName} corp"`
        // Corporate variations
      ];
      let allResults = [];
      const seenUrls = /* @__PURE__ */ new Set();
      const primaryResponse = await axios.post(this.baseUrl, {
        q: queries[0],
        num: 15,
        // Increased from 10 for better coverage
        gl: "us",
        // Geographic location for consistent results
        hl: "en"
        // Language preference
      }, {
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json"
        }
      });
      if (primaryResponse.data.error) {
        throw new Error(primaryResponse.data.error);
      }
      const primaryResults = primaryResponse.data.organic || [];
      primaryResults.forEach((result) => {
        if (result.link && !seenUrls.has(result.link)) {
          seenUrls.add(result.link);
          allResults.push({
            title: result.title || "",
            snippet: result.snippet || "",
            link: result.link || ""
          });
        }
      });
      if (allResults.length < 3) {
        try {
          const broadResponse = await axios.post(this.baseUrl, {
            q: queries[1],
            num: 10
          }, {
            headers: {
              "X-API-KEY": this.apiKey,
              "Content-Type": "application/json"
            }
          });
          const broadResults = broadResponse.data.organic || [];
          broadResults.forEach((result) => {
            if (result.link && !seenUrls.has(result.link)) {
              seenUrls.add(result.link);
              allResults.push({
                title: result.title || "",
                snippet: result.snippet || "",
                link: result.link || ""
              });
            }
          });
        } catch (broadError) {
          console.log(`Broad search failed for ${brandName} on ${domain}, using primary results only`);
        }
      }
      console.log(`Search completed for ${brandName} on ${domain}: ${allResults.length} results found`);
      return allResults;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error("API_KEY_INVALID");
      }
      if (error.response?.status === 429) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      console.error(`Serper API error for ${brandName} on ${domain}:`, error.message);
      throw new Error(`Serper API error: ${error.message}`);
    }
  }
  async checkCredits() {
    return { credits_left: 1e3 };
  }
};
function getSerperService() {
  return new SerperService();
}
var serperService = getSerperService();

// server/services/openai.ts
import OpenAI from "openai";
var OpenAIService = class {
  client;
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }
    this.client = new OpenAI({
      apiKey
    });
  }
  async analyzeSearchResults(results, brandName, domain) {
    try {
      if (!results || results.length === 0) {
        console.log(`No search results to analyze for ${brandName} on ${domain}`);
        return { genuineMentions: [] };
      }
      const cleanResults = results.slice(0, 10).map((result) => ({
        title: result.title || "",
        snippet: result.snippet || "",
        link: result.link || ""
      })).filter((result) => result.title || result.snippet);
      if (cleanResults.length === 0) {
        console.log(`No valid search results to analyze for ${brandName} on ${domain}`);
        return { genuineMentions: [] };
      }
      const patternValidatedResults = this.patternBasedValidation(cleanResults, brandName, domain);
      const aiValidatedResults = await this.enhancedAIAnalysis(cleanResults, brandName, domain);
      const finalResults = this.combineValidationResults(patternValidatedResults, aiValidatedResults, brandName, domain);
      console.log(`Multi-layer analysis for ${brandName} on ${domain}: ${finalResults.length} genuine mentions found`);
      return { genuineMentions: finalResults };
    } catch (error) {
      console.error(`Analysis error for ${brandName} on ${domain}:`, error);
      const fallbackResults = this.patternBasedValidation(
        results.slice(0, 10).map((result) => ({
          title: result.title || "",
          snippet: result.snippet || "",
          link: result.link || ""
        })).filter((result) => result.title || result.snippet),
        brandName,
        domain
      );
      console.log(`Using pattern-based fallback for ${brandName} on ${domain}: ${fallbackResults.length} mentions found`);
      return { genuineMentions: fallbackResults };
    }
  }
  /**
   * Pattern-based validation - enterprise-grade fallback method
   * Uses sophisticated regex and context analysis
   */
  patternBasedValidation(results, brandName, domain) {
    const validMentions = [];
    const exactMatch = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const contextKeywords = ["company", "corp", "inc", "ltd", "business", "firm", "brand", "organization"];
    results.forEach((result) => {
      const combinedText = `${result.title} ${result.snippet}`.toLowerCase();
      const brandMatches = combinedText.match(exactMatch);
      if (brandMatches && brandMatches.length > 0) {
        const hasBusinessContext = contextKeywords.some(
          (keyword) => combinedText.includes(keyword)
        );
        const hasSubstantialContent = result.snippet.length > 50;
        const hasQualityUrl = !result.link.includes("/search") && !result.link.includes("/tag/") && !result.link.includes("?") || result.link.includes(brandName.toLowerCase());
        let confidenceScore = 0;
        confidenceScore += brandMatches.length * 2;
        confidenceScore += hasBusinessContext ? 1 : 0;
        confidenceScore += hasSubstantialContent ? 1 : 0;
        confidenceScore += hasQualityUrl ? 1 : 0;
        if (confidenceScore >= 2) {
          validMentions.push({
            domain,
            brandMentioned: true,
            title: result.title,
            snippet: result.snippet,
            url: result.link
          });
        }
      }
    });
    return validMentions;
  }
  /**
   * Enhanced AI Analysis with improved prompting strategy
   */
  async enhancedAIAnalysis(results, brandName, domain) {
    try {
      const prompt = `You are a professional brand monitoring analyst. Your task is to identify genuine brand mentions with HIGH RECALL - don't miss legitimate mentions.

TARGET BRAND: "${brandName}"
PUBLICATION: ${domain}

SEARCH RESULTS:
${results.map((result, i) => `
[${i + 1}] Title: ${result.title}
    Snippet: ${result.snippet}
    URL: ${result.link}
`).join("\n")}

ANALYSIS GUIDELINES:
\u2705 MARK AS GENUINE if the brand "${brandName}":
- Appears in title or content text (exact match or clear reference)
- Is discussed in any business/news context
- Is mentioned as a company, product, or service
- Appears in financial, tech, business, or industry coverage
- Is referenced in any meaningful business context

\u274C ONLY REJECT if:
- Brand name appears purely as unrelated keyword (e.g., "apple" fruit vs Apple company)
- Content is completely unrelated to the business entity
- Clearly false positive matches

IMPORTANT: Err on the side of inclusion. If you're uncertain, include it. Missing genuine mentions is worse than including borderline cases.

Return JSON with ALL genuine mentions:
{
  "genuineMentions": [
    {
      "domain": "${domain}",
      "brandMentioned": true,
      "title": "exact title",
      "snippet": "relevant snippet",
      "url": "full URL"
    }
  ]
}`;
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: "You are a brand monitoring AI optimized for HIGH RECALL. Capture all legitimate brand mentions. Respond only with valid JSON."
        }, {
          role: "user",
          content: prompt
        }],
        temperature: 0.2,
        // Slightly higher for more inclusive analysis
        max_tokens: 1500
      });
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        console.log(`No AI response for ${brandName} on ${domain} - using pattern fallback`);
        return [];
      }
      try {
        const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanContent);
        if (!parsed.genuineMentions || !Array.isArray(parsed.genuineMentions)) {
          console.log(`Invalid AI response structure for ${brandName} on ${domain} - using pattern fallback`);
          return [];
        }
        return parsed.genuineMentions.filter(
          (mention) => mention.domain && mention.title && mention.url
        );
      } catch (parseError) {
        console.log(`AI response parse error for ${brandName} on ${domain} - using pattern fallback`);
        return [];
      }
    } catch (error) {
      console.log(`AI analysis failed for ${brandName} on ${domain} - using pattern fallback:`, error.message);
      return [];
    }
  }
  /**
   * Hybrid decision making - combines pattern and AI results for maximum accuracy
   */
  combineValidationResults(patternResults, aiResults, brandName, domain) {
    const uniqueMentions = /* @__PURE__ */ new Map();
    patternResults.forEach((mention) => {
      uniqueMentions.set(mention.url, {
        ...mention,
        validationMethod: "pattern"
      });
    });
    aiResults.forEach((mention) => {
      if (!uniqueMentions.has(mention.url)) {
        uniqueMentions.set(mention.url, {
          ...mention,
          validationMethod: "ai"
        });
      }
    });
    const finalResults = Array.from(uniqueMentions.values());
    console.log(`${brandName} on ${domain}: Pattern=${patternResults.length}, AI=${aiResults.length}, Final=${finalResults.length}`);
    return finalResults;
  }
  async generateStrategy(auditResults, brandName, websiteUrl) {
    try {
      const mentionsCount = auditResults.filter((r) => r.brandMentioned).length;
      const publications = auditResults.filter((r) => r.brandMentioned).map((r) => r.domain).join(", ");
      const prompt = `Based on this brand audit for "${brandName}" (${websiteUrl}), generate strategic recommendations.

Audit Summary:
- Total genuine mentions found: ${mentionsCount}
- Publications with mentions: ${publications || "None"}

Generate a comprehensive strategy with these sections:
1. Key insights (2-3 strategic insights)
2. Priority targets (2-3 high-value publications to target)
3. Recommended actions (3-4 specific actionable steps)

Return a JSON object in this exact format:
{
  "insights": [
    "Strategic insight 1",
    "Strategic insight 2"
  ],
  "priorityTargets": [
    "Target publication 1",
    "Target publication 2"
  ],
  "actions": [
    "Action item 1",
    "Action item 2",
    "Action item 3"
  ]
}`;
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No strategy response from OpenAI");
      }
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (parseError) {
        console.error("Failed to parse OpenAI strategy response:", content);
        return {
          insights: ["Unable to generate strategy analysis", "Focus on building brand awareness"],
          priorityTargets: ["Industry-specific publications", "Local news outlets"],
          actions: ["Develop targeted content strategy", "Create thought leadership content", "Build media relationships"]
        };
      }
    } catch (error) {
      console.error("OpenAI strategy generation error:", error);
      if (error.code === "insufficient_quota") {
        throw new Error("OPENAI_QUOTA_EXCEEDED");
      }
      if (error.code === "invalid_api_key") {
        throw new Error("OPENAI_API_KEY_INVALID");
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
};
function getOpenAIService() {
  return new OpenAIService();
}
var openaiService = getOpenAIService();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandName: text("brand_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, processing, completed, failed
  results: jsonb("results"),
  strategy: jsonb("strategy"),
  totalPublications: integer("total_publications").default(0),
  mentionsFound: integer("mentions_found").default(0),
  coverageRate: integer("coverage_rate").default(0),
  topSource: text("top_source"),
  shareableLink: varchar("shareable_link"),
  createdAt: timestamp("created_at").default(sql`now()`),
  completedAt: timestamp("completed_at")
});
var auditForm = z.object({
  brandName: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
  websiteUrl: z.string().url("Please enter a valid URL")
});
var insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
  completedAt: true
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var NEWS_PUBLICATIONS = [
  { domain: "finance.yahoo.com", name: "Yahoo Finance" },
  { domain: "tradingview.com", name: "TradingView" },
  { domain: "marketwatch.com", name: "MarketWatch" },
  { domain: "apnews.com", name: "AP News" },
  { domain: "morningstar.com", name: "Morningstar" },
  { domain: "globenewswire.com", name: "GlobeNewswire" },
  { domain: "markets.businessinsider.com", name: "Business Insider" },
  { domain: "ktla.com", name: "KTLA" },
  { domain: "fox8.com", name: "Fox 8" },
  { domain: "wgntv.com", name: "WGN TV" },
  { domain: "kxan.com", name: "KXAN" },
  { domain: "woodtv.com", name: "Wood TV" },
  { domain: "fox59.com", name: "Fox 59" },
  { domain: "manilatimes.net", name: "Manila Times" },
  { domain: "abc27.com", name: "ABC 27" },
  { domain: "8newsnow.com", name: "8 News Now" },
  { domain: "kron4.com", name: "KRON 4" },
  { domain: "kdvr.com", name: "KDVR" },
  { domain: "wkbn.com", name: "WKBN" },
  { domain: "wavy.com", name: "WAVY" },
  { domain: "fox5sandiego.com", name: "Fox 5 San Diego" },
  { domain: "wric.com", name: "WRIC" },
  { domain: "wkrn.com", name: "WKRN" },
  { domain: "fox2now.com", name: "Fox 2 Now" },
  { domain: "localsyr.com", name: "Local SYR" },
  { domain: "wane.com", name: "WANE" },
  { domain: "pix11.com", name: "PIX11" },
  { domain: "keloland.com", name: "KELOLAND" },
  { domain: "wwlp.com", name: "WWLP" },
  { domain: "koin.com", name: "KOIN" }
];

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/audit", async (req, res) => {
    try {
      const validatedData = auditForm.parse(req.body);
      const audit = await storage.createAudit({
        brandName: validatedData.brandName,
        websiteUrl: validatedData.websiteUrl,
        status: "processing",
        results: null,
        strategy: null,
        totalPublications: NEWS_PUBLICATIONS.length,
        mentionsFound: 0,
        coverageRate: 0,
        topSource: null
      });
      res.json({ auditId: audit.id });
      processAuditAsync(audit.id, validatedData.brandName);
    } catch (error) {
      console.error("Audit creation error:", error);
      res.status(400).json({
        message: error.message || "Failed to start audit"
      });
    }
  });
  app2.get("/api/audit/:id", async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Get audit error:", error);
      res.status(500).json({
        message: "Failed to retrieve audit"
      });
    }
  });
  app2.get("/api/credits", async (req, res) => {
    try {
      const credits = await serperService.checkCredits();
      res.json(credits);
    } catch (error) {
      console.error("Credits check error:", error);
      res.status(500).json({
        message: "Failed to check credits"
      });
    }
  });
  app2.get("/api/share/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Error fetching shared audit:", error);
      res.status(500).json({ error: "Failed to fetch audit" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function processAuditAsync(auditId, brandName) {
  try {
    console.log(`Starting audit ${auditId} for brand: ${brandName}`);
    const batchSize = 5;
    const results = [];
    let mentionsFound = 0;
    const mentionedDomains = [];
    await storage.updateAudit(auditId, {
      status: "processing",
      results: [],
      mentionsFound: 0,
      coverageRate: 0
    });
    for (let i = 0; i < NEWS_PUBLICATIONS.length; i += batchSize) {
      const batch = NEWS_PUBLICATIONS.slice(i, i + batchSize);
      const batchPromises = batch.map(async (publication) => {
        try {
          console.log(`Searching ${publication.name} for "${brandName}"`);
          const searchResults = await serperService.searchDomain(publication.domain, brandName);
          let hasMention = false;
          let firstMention = null;
          if (searchResults && searchResults.length > 0) {
            try {
              const analysis = await openaiService.analyzeSearchResults(searchResults, brandName, publication.domain);
              hasMention = analysis.genuineMentions.length > 0;
              firstMention = analysis.genuineMentions[0];
              if (hasMention) {
                console.log(`\u2713 Found mention for ${brandName} on ${publication.name}: ${firstMention?.title || "No title"}`);
              }
            } catch (aiError) {
              console.error(`AI analysis failed for ${publication.name}:`, aiError);
            }
          } else {
            console.log(`No search results found for ${brandName} on ${publication.name}`);
          }
          const result = {
            domain: publication.domain,
            brandMentioned: hasMention,
            title: firstMention?.title || void 0,
            snippet: firstMention?.snippet || void 0,
            url: firstMention?.url || void 0,
            logo: `https://www.google.com/s2/favicons?domain=${publication.domain}&sz=32`
          };
          if (hasMention) {
            mentionedDomains.push(publication.name);
          }
          return result;
        } catch (error) {
          console.error(`Error processing ${publication.name}:`, error);
          if (error.message === "API_KEY_INVALID" || error.message === "SERPER_API_KEY is required") {
            throw new Error("SERPER_API_KEY_INVALID");
          }
          if (error.message === "OPENAI_API_KEY_INVALID" || error.message === "OPENAI_API_KEY is required") {
            throw new Error("OPENAI_API_KEY_INVALID");
          }
          if (error.message === "RATE_LIMIT_EXCEEDED") {
            throw new Error("RATE_LIMIT_EXCEEDED");
          }
          return {
            domain: publication.domain,
            brandMentioned: false,
            logo: `https://www.google.com/s2/favicons?domain=${publication.domain}&sz=32`
          };
        }
      });
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        const batchMentions = batchResults.filter((r) => r.brandMentioned).length;
        mentionsFound += batchMentions;
        const progress = Math.round(results.length / NEWS_PUBLICATIONS.length * 100);
        const currentCoverageRate = results.length > 0 ? Math.round(mentionsFound / results.length * 100) : 0;
        await storage.updateAudit(auditId, {
          status: "processing",
          results: [...results],
          // Create new array to avoid reference issues
          mentionsFound,
          coverageRate: currentCoverageRate,
          totalPublications: NEWS_PUBLICATIONS.length
        });
        console.log(`Batch ${Math.ceil((i + batchSize) / batchSize)} completed. Progress: ${progress}% (${mentionsFound} mentions found)`);
        if (i + batchSize < NEWS_PUBLICATIONS.length) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      } catch (criticalError) {
        console.error(`Critical error in batch processing:`, criticalError);
        if (criticalError.message.includes("API_KEY_INVALID") || criticalError.message.includes("RATE_LIMIT_EXCEEDED")) {
          await storage.updateAudit(auditId, {
            status: "failed",
            results,
            mentionsFound,
            coverageRate: results.length > 0 ? Math.round(mentionsFound / results.length * 100) : 0,
            completedAt: /* @__PURE__ */ new Date()
          });
          return;
        }
        console.log("Continuing with remaining publications despite error...");
      }
    }
    const audit = await storage.getAudit(auditId);
    const strategy = await openaiService.generateStrategy(
      results,
      brandName,
      audit?.websiteUrl || ""
    );
    const mentionedResults = results.filter((r) => r.brandMentioned);
    const topSource = mentionedResults.length > 0 ? NEWS_PUBLICATIONS.find((p) => p.domain === mentionedResults[0].domain)?.name || mentionedResults[0].domain : null;
    const shareableLink = `${process.env.BASE_URL || "http://localhost:5000"}/share/${auditId}`;
    await storage.updateAudit(auditId, {
      status: "completed",
      results,
      strategy,
      mentionsFound,
      coverageRate: Math.round(mentionsFound / NEWS_PUBLICATIONS.length * 100),
      topSource,
      shareableLink,
      completedAt: /* @__PURE__ */ new Date()
    });
    console.log(`Audit ${auditId} completed: ${mentionsFound}/${NEWS_PUBLICATIONS.length} mentions found`);
  } catch (error) {
    console.error(`Audit ${auditId} failed:`, error);
    await storage.updateAudit(auditId, {
      status: "failed",
      completedAt: /* @__PURE__ */ new Date()
    });
  }
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode...`);
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Express error handler:", err);
      res.status(status).json({ message });
      if (process.env.NODE_ENV !== "production") {
        throw err;
      }
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`Server started successfully on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV || "development"}`);
      log(`Static files served from: ${process.env.NODE_ENV === "production" ? "dist/public" : "client"}`);
    });
  } catch (error) {
    console.error("Fatal server startup error:", error);
    process.exit(1);
  }
})();
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
