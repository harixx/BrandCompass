import OpenAI from 'openai';
import type { AuditResult, AuditStrategy } from '@shared/schema';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing from environment variables');
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async analyzeSearchResults(results: any[], brandName: string, domain: string): Promise<{ genuineMentions: AuditResult[] }> {
    try {
      // Enhanced validation of input data
      if (!results || results.length === 0) {
        console.log(`No search results to analyze for ${brandName} on ${domain}`);
        return { genuineMentions: [] };
      }

      // Clean and prepare search results for analysis
      const cleanResults = results.slice(0, 10).map(result => ({
        title: result.title || '',
        snippet: result.snippet || '',
        link: result.link || ''
      })).filter(result => result.title || result.snippet);

      if (cleanResults.length === 0) {
        console.log(`No valid search results to analyze for ${brandName} on ${domain}`);
        return { genuineMentions: [] };
      }

      // MULTI-LAYERED ANALYSIS APPROACH for maximum accuracy
      
      // Layer 1: Pattern-based validation (fast, high-precision fallback)
      const patternValidatedResults = this.patternBasedValidation(cleanResults, brandName, domain);
      
      // Layer 2: Enhanced AI Analysis with improved prompting
      const aiValidatedResults = await this.enhancedAIAnalysis(cleanResults, brandName, domain);
      
      // Layer 3: Hybrid decision making - combine both approaches
      const finalResults = this.combineValidationResults(patternValidatedResults, aiValidatedResults, brandName, domain);
      
      console.log(`Multi-layer analysis for ${brandName} on ${domain}: ${finalResults.length} genuine mentions found`);
      return { genuineMentions: finalResults };

    } catch (error: any) {
      console.error(`Analysis error for ${brandName} on ${domain}:`, error);
      
      // Critical error handling - use pattern-based fallback
      const fallbackResults = this.patternBasedValidation(
        results.slice(0, 10).map(result => ({
          title: result.title || '',
          snippet: result.snippet || '',
          link: result.link || ''
        })).filter(result => result.title || result.snippet),
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
  private patternBasedValidation(results: any[], brandName: string, domain: string): any[] {
    const validMentions: any[] = [];
    
    // Create case-insensitive regex patterns for brand detection
    const exactMatch = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const contextKeywords = ['company', 'corp', 'inc', 'ltd', 'business', 'firm', 'brand', 'organization'];
    
    results.forEach(result => {
      const combinedText = `${result.title} ${result.snippet}`.toLowerCase();
      const brandMatches = combinedText.match(exactMatch);
      
      if (brandMatches && brandMatches.length > 0) {
        // Additional context validation
        const hasBusinessContext = contextKeywords.some(keyword => 
          combinedText.includes(keyword)
        );
        
        // Length-based relevance check (articles with substantial content)
        const hasSubstantialContent = result.snippet.length > 50;
        
        // URL quality check (avoid generic pages)
        const hasQualityUrl = !result.link.includes('/search') && 
                              !result.link.includes('/tag/') && 
                              !result.link.includes('?') ||
                              result.link.includes(brandName.toLowerCase());
        
        // Scoring system for confidence
        let confidenceScore = 0;
        confidenceScore += brandMatches.length * 2; // Multiple mentions = higher confidence
        confidenceScore += hasBusinessContext ? 1 : 0;
        confidenceScore += hasSubstantialContent ? 1 : 0;
        confidenceScore += hasQualityUrl ? 1 : 0;
        
        // Accept if confidence score >= 2 (moderate threshold for high recall)
        if (confidenceScore >= 2) {
          validMentions.push({
            domain: domain,
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
  private async enhancedAIAnalysis(results: any[], brandName: string, domain: string): Promise<any[]> {
    try {
      const prompt = `You are a professional brand monitoring analyst. Your task is to identify genuine brand mentions with HIGH RECALL - don't miss legitimate mentions.

TARGET BRAND: "${brandName}"
PUBLICATION: ${domain}

SEARCH RESULTS:
${results.map((result, i) => `
[${i + 1}] Title: ${result.title}
    Snippet: ${result.snippet}
    URL: ${result.link}
`).join('\n')}

ANALYSIS GUIDELINES:
✅ MARK AS GENUINE if the brand "${brandName}":
- Appears in title or content text (exact match or clear reference)
- Is discussed in any business/news context
- Is mentioned as a company, product, or service
- Appears in financial, tech, business, or industry coverage
- Is referenced in any meaningful business context

❌ ONLY REJECT if:
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
        model: 'gpt-4o',
        messages: [{ 
          role: 'system', 
          content: 'You are a brand monitoring AI optimized for HIGH RECALL. Capture all legitimate brand mentions. Respond only with valid JSON.' 
        }, {
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.2, // Slightly higher for more inclusive analysis
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        console.log(`No AI response for ${brandName} on ${domain} - using pattern fallback`);
        return [];
      }

      try {
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        
        if (!parsed.genuineMentions || !Array.isArray(parsed.genuineMentions)) {
          console.log(`Invalid AI response structure for ${brandName} on ${domain} - using pattern fallback`);
          return [];
        }

        return parsed.genuineMentions.filter((mention: any) => 
          mention.domain && mention.title && mention.url
        );

      } catch (parseError) {
        console.log(`AI response parse error for ${brandName} on ${domain} - using pattern fallback`);
        return [];
      }

    } catch (error: any) {
      console.log(`AI analysis failed for ${brandName} on ${domain} - using pattern fallback:`, error.message);
      return [];
    }
  }

  /**
   * Hybrid decision making - combines pattern and AI results for maximum accuracy
   */
  private combineValidationResults(patternResults: any[], aiResults: any[], brandName: string, domain: string): any[] {
    // Create a map to avoid duplicates
    const uniqueMentions = new Map<string, any>();
    
    // Add pattern-based results (high precision)
    patternResults.forEach(mention => {
      uniqueMentions.set(mention.url, {
        ...mention,
        validationMethod: 'pattern'
      });
    });
    
    // Add AI results (may catch edge cases pattern missed)
    aiResults.forEach(mention => {
      if (!uniqueMentions.has(mention.url)) {
        uniqueMentions.set(mention.url, {
          ...mention,
          validationMethod: 'ai'
        });
      }
    });
    
    const finalResults = Array.from(uniqueMentions.values());
    
    console.log(`${brandName} on ${domain}: Pattern=${patternResults.length}, AI=${aiResults.length}, Final=${finalResults.length}`);
    
    return finalResults;
  }

  async generateStrategy(auditResults: AuditResult[], brandName: string, websiteUrl: string): Promise<AuditStrategy> {
    try {
      const mentionsCount = auditResults.filter(r => r.brandMentioned).length;
      const publications = auditResults.filter(r => r.brandMentioned).map(r => r.domain).join(', ');

      const prompt = `Based on this brand audit for "${brandName}" (${websiteUrl}), generate strategic recommendations.

Audit Summary:
- Total genuine mentions found: ${mentionsCount}
- Publications with mentions: ${publications || 'None'}

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
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No strategy response from OpenAI');
      }

      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse OpenAI strategy response:', content);
        return {
          insights: ["Unable to generate strategy analysis", "Focus on building brand awareness"],
          priorityTargets: ["Industry-specific publications", "Local news outlets"],
          actions: ["Develop targeted content strategy", "Create thought leadership content", "Build media relationships"]
        };
      }

    } catch (error: any) {
      console.error('OpenAI strategy generation error:', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('OPENAI_QUOTA_EXCEEDED');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('OPENAI_API_KEY_INVALID');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

// Export as function to avoid top-level instantiation issues
export function getOpenAIService(): OpenAIService {
  return new OpenAIService();
}

export const openaiService = getOpenAIService();