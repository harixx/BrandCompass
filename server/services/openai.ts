import OpenAI from 'openai';
import type { AuditResult, AuditStrategy } from '@shared/schema';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
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

      const prompt = `You are an expert brand analyst. Analyze these search results to determine if "${brandName}" is genuinely mentioned.

BRAND TO SEARCH FOR: "${brandName}"
PUBLICATION DOMAIN: ${domain}

SEARCH RESULTS:
${cleanResults.map((result, i) => `
Result ${i + 1}:
Title: ${result.title}
Snippet: ${result.snippet}
URL: ${result.link}
`).join('\n')}

ANALYSIS CRITERIA:
A mention is GENUINE if:
1. The exact brand name "${brandName}" appears in the title or snippet
2. The content discusses, references, or relates to this specific brand/company
3. It's not just a generic keyword match or unrelated mention
4. The article is actually ABOUT the brand or mentions it meaningfully

Be STRICT in your analysis. Only mark as genuine if you're confident the brand is meaningfully mentioned.

Return ONLY a JSON object in this exact format (no additional text):
{
  "genuineMentions": [
    {
      "domain": "${domain}",
      "brandMentioned": true,
      "title": "exact article title here",
      "snippet": "relevant snippet text here",
      "url": "full article URL here"
    }
  ]
}

If no genuine mentions are found, return: {"genuineMentions": []}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ 
          role: 'system', 
          content: 'You are a precise brand analysis AI. Respond only with valid JSON. Be strict about genuine brand mentions.' 
        }, {
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.1, // Very low temperature for consistency
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        console.error(`No response from OpenAI for ${brandName} on ${domain}`);
        return { genuineMentions: [] };
      }

      try {
        // Clean the response (remove any markdown formatting)
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        
        // Validate the response structure
        if (!parsed.genuineMentions || !Array.isArray(parsed.genuineMentions)) {
          console.error(`Invalid response structure from OpenAI for ${brandName} on ${domain}:`, parsed);
          return { genuineMentions: [] };
        }

        // Validate each mention
        const validMentions = parsed.genuineMentions.filter((mention: any) => {
          return mention.domain && mention.title && mention.url;
        });

        console.log(`OpenAI analysis for ${brandName} on ${domain}: ${validMentions.length} genuine mentions found`);
        return { genuineMentions: validMentions };

      } catch (parseError) {
        console.error(`Failed to parse OpenAI response for ${brandName} on ${domain}:`, content);
        console.error('Parse error:', parseError);
        return { genuineMentions: [] };
      }

    } catch (error: any) {
      console.error(`OpenAI analysis error for ${brandName} on ${domain}:`, error);
      
      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota' || error.message?.includes('quota')) {
        throw new Error('OPENAI_QUOTA_EXCEEDED');
      }
      if (error.code === 'invalid_api_key' || error.message?.includes('api_key')) {
        throw new Error('OPENAI_API_KEY_INVALID');
      }
      if (error.code === 'rate_limit_exceeded' || error.message?.includes('rate limit')) {
        console.log(`Rate limit hit for ${brandName} on ${domain}, continuing without AI analysis`);
        return { genuineMentions: [] };
      }
      
      // For other errors, return empty result but continue processing
      console.log(`Continuing without AI analysis for ${brandName} on ${domain} due to error:`, error.message);
      return { genuineMentions: [] };
    }
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

export const openaiService = new OpenAIService();