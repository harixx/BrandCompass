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
    console.log(`Starting audit ${auditId} for brand: ${brandName}`);
    
    // Process publications in parallel batches for better performance
    const batchSize = 5; // Process 5 publications simultaneously
    const results: AuditResult[] = [];
    let mentionsFound = 0;
    const mentionedDomains: string[] = [];

    // Update initial progress
    await storage.updateAudit(auditId, {
      status: "processing",
      results: [],
      mentionsFound: 0,
      coverageRate: 0
    });

    for (let i = 0; i < NEWS_PUBLICATIONS.length; i += batchSize) {
      const batch = NEWS_PUBLICATIONS.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (publication) => {
        try {
          console.log(`Searching ${publication.name} for "${brandName}"`);
          
          // Search the publication domain
          const searchResults = await serperService.searchDomain(publication.domain, brandName);
          
          // Only analyze if we have search results
          let hasMention = false;
          let firstMention: any = null;
          
          if (searchResults && searchResults.length > 0) {
            try {
              const analysis = await openaiService.analyzeSearchResults(searchResults, brandName, publication.domain);
              hasMention = analysis.genuineMentions.length > 0;
              firstMention = analysis.genuineMentions[0];
              
              if (hasMention) {
                console.log(`✓ Found mention for ${brandName} on ${publication.name}: ${firstMention?.title || 'No title'}`);
              }
            } catch (aiError) {
              console.error(`AI analysis failed for ${publication.name}:`, aiError);
              // Continue without AI analysis - mark as no mention found
            }
          } else {
            console.log(`No search results found for ${brandName} on ${publication.name}`);
          }
          
          const result: AuditResult = {
            domain: publication.domain,
            brandMentioned: hasMention,
            title: firstMention?.title || undefined,
            snippet: firstMention?.snippet || undefined,
            url: firstMention?.url || undefined,
            logo: `https://www.google.com/s2/favicons?domain=${publication.domain}&sz=32`
          };

          if (hasMention) {
            mentionedDomains.push(publication.name);
          }

          return result;

        } catch (error: any) {
          console.error(`Error processing ${publication.name}:`, error);
          
          // Handle critical API errors
          if (error.message === 'API_KEY_INVALID' || error.message === 'SERPER_API_KEY is required') {
            throw new Error('SERPER_API_KEY_INVALID');
          }
          if (error.message === 'OPENAI_API_KEY_INVALID' || error.message === 'OPENAI_API_KEY is required') {
            throw new Error('OPENAI_API_KEY_INVALID');
          }
          if (error.message === 'RATE_LIMIT_EXCEEDED') {
            throw new Error('RATE_LIMIT_EXCEEDED');
          }
          
          // Return failed result for this domain (non-critical error)
          return {
            domain: publication.domain,
            brandMentioned: false,
            logo: `https://www.google.com/s2/favicons?domain=${publication.domain}&sz=32`
          };
        }
      });

      try {
        // Wait for all publications in the batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Count mentions in this batch
        const batchMentions = batchResults.filter(r => r.brandMentioned).length;
        mentionsFound += batchMentions;

        // Update progress after each batch
        const progress = Math.round((results.length / NEWS_PUBLICATIONS.length) * 100);
        const currentCoverageRate = results.length > 0 ? Math.round((mentionsFound / results.length) * 100) : 0;
        
        await storage.updateAudit(auditId, {
          status: "processing",
          results: [...results], // Create new array to avoid reference issues
          mentionsFound,
          coverageRate: currentCoverageRate,
          totalPublications: NEWS_PUBLICATIONS.length
        });

        console.log(`Batch ${Math.ceil((i + batchSize) / batchSize)} completed. Progress: ${progress}% (${mentionsFound} mentions found)`);

        // Small delay between batches to be respectful to APIs
        if (i + batchSize < NEWS_PUBLICATIONS.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (criticalError: any) {
        console.error(`Critical error in batch processing:`, criticalError);
        
        // Handle critical errors that should stop the entire audit
        if (criticalError.message.includes('API_KEY_INVALID') || 
            criticalError.message.includes('RATE_LIMIT_EXCEEDED')) {
          await storage.updateAudit(auditId, {
            status: "failed",
            results: results,
            mentionsFound,
            coverageRate: results.length > 0 ? Math.round((mentionsFound / results.length) * 100) : 0,
            completedAt: new Date()
          });
          return;
        }
        
        // For other errors, continue with remaining batches
        console.log('Continuing with remaining publications despite error...');
      }
    }

    // Generate strategy recommendations
    const audit = await storage.getAudit(auditId);
    const strategy = await openaiService.generateStrategy(
      results,
      brandName,
      audit?.websiteUrl || ''
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
