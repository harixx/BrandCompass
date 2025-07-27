import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { serperService } from "./services/serpapi";
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

  // Check Serper API credits
  app.get("/api/credits", async (req, res) => {
    try {
      const credits = await serperService.checkCredits();
      res.json(credits);
    } catch (error: any) {
      console.error('Credits check error:', error);
      res.status(500).json({ 
        message: "Failed to check credits" 
      });
    }
  });

  // Share route
  app.get('/api/share/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const audit = await storage.getAudit(id);
      
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found' });
      }
      
      res.json(audit);
    } catch (error) {
      console.error('Error fetching shared audit:', error);
      res.status(500).json({ error: 'Failed to fetch audit' });
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
    for (const publication of NEWS_PUBLICATIONS) {
      try {
        console.log(`Searching ${publication.name} for "${brandName}"`);
        
        const searchResults = await serperService.searchDomain(publication.domain, brandName);
        const classification = await openaiService.classifyMention(brandName, searchResults);
        
        const result: AuditResult = {
          domain: publication.domain,
          brandMentioned: classification.brandMentioned,
          title: classification.title,
          snippet: classification.snippet,
          url: classification.url,
          logo: `https://www.google.com/s2/favicons?domain=${publication.domain}&sz=32`
        };

        results.push(result);

        if (classification.brandMentioned) {
          mentionsFound++;
          mentionedDomains.push(publication.name);
        }

        // Small delay to avoid rate limiting (reduced for faster processing)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`Error processing ${publication.name}:`, error);
        
        if (error.message === 'API_KEY_INVALID' || error.message === 'RATE_LIMIT_EXCEEDED') {
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
          domain: publication.domain,
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
    const topSource = mentionedResults.length > 0 ? 
      NEWS_PUBLICATIONS.find(p => p.domain === mentionedResults[0].domain)?.name || mentionedResults[0].domain : null;

    // Generate shareable link
    const shareableLink = `${process.env.BASE_URL || 'http://localhost:5000'}/share/${auditId}`;

    // Update audit with final results
    await storage.updateAudit(auditId, {
      status: "completed",
      results,
      strategy,
      mentionsFound,
      coverageRate: Math.round((mentionsFound / NEWS_PUBLICATIONS.length) * 100),
      topSource,
      shareableLink,
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
