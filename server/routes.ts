import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { serpApiService } from "./services/serpapi";
import { openaiService } from "./services/openai";
import { auditForm, type AuditResult, type AuditStrategy } from "@shared/schema";
import { NEWS_PUBLICATIONS } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Start brand audit
  app.post("/api/audit", async (req, res) => {
    try {
      const validatedData = auditForm.parse(req.body);
      
      // Create audit record
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

      // Process audit asynchronously
      processAuditAsync(audit.id, validatedData.brandName);

    } catch (error: any) {
      console.error('Audit creation error:', error);
      res.status(400).json({ 
        message: error.message || "Failed to start audit" 
      });
    }
  });

  // Get audit status and results
  app.get("/api/audit/:id", async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      res.json(audit);

    } catch (error: any) {
      console.error('Get audit error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve audit" 
      });
    }
  });

  // Check SerpAPI credits
  app.get("/api/credits", async (req, res) => {
    try {
      const credits = await serpApiService.checkCredits();
      res.json(credits);
    } catch (error: any) {
      console.error('Credits check error:', error);
      res.status(500).json({ 
        message: "Failed to check credits" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processAuditAsync(auditId: string, brandName: string) {
  try {
    const results: AuditResult[] = [];
    let mentionsFound = 0;
    const mentionedDomains: string[] = [];

    // Process each publication
    for (const domain of NEWS_PUBLICATIONS) {
      try {
        console.log(`Searching ${domain} for "${brandName}"`);
        
        const searchResults = await serpApiService.searchDomain(domain, brandName);
        const classification = await openaiService.classifyMention(brandName, searchResults);
        
        const result: AuditResult = {
          domain,
          brandMentioned: classification.brandMentioned,
          title: classification.title,
          snippet: classification.snippet,
          url: classification.url,
          logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        };

        results.push(result);

        if (classification.brandMentioned) {
          mentionsFound++;
          mentionedDomains.push(domain);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error processing ${domain}:`, error);
        
        if (error.message === 'CREDITS_EXHAUSTED') {
          // Update audit with partial results and credits error
          await storage.updateAudit(auditId, {
            status: "failed",
            results: results,
            mentionsFound,
            coverageRate: results.length > 0 ? Math.round((mentionsFound / results.length) * 100) : 0,
            completedAt: new Date()
          });
          return;
        }
        
        // Add failed result for this domain
        results.push({
          domain,
          brandMentioned: false
        });
      }
    }

    // Generate strategy recommendations
    const strategy = await openaiService.generateStrategy(
      brandName,
      NEWS_PUBLICATIONS.length,
      mentionsFound,
      mentionedDomains
    );

    // Find top source
    const mentionedResults = results.filter(r => r.brandMentioned);
    const topSource = mentionedResults.length > 0 ? mentionedResults[0].domain : null;

    // Update audit with final results
    await storage.updateAudit(auditId, {
      status: "completed",
      results,
      strategy,
      mentionsFound,
      coverageRate: Math.round((mentionsFound / NEWS_PUBLICATIONS.length) * 100),
      topSource,
      completedAt: new Date()
    });

    console.log(`Audit ${auditId} completed: ${mentionsFound}/${NEWS_PUBLICATIONS.length} mentions found`);

  } catch (error: any) {
    console.error(`Audit ${auditId} failed:`, error);
    
    await storage.updateAudit(auditId, {
      status: "failed",
      completedAt: new Date()
    });
  }
}
