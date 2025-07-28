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
      const prompt = `Analyze these search results for genuine mentions of the brand "${brandName}" on ${domain}. 
      
Consider a mention "genuine" if:
- The brand name appears meaningfully in the title or content
- It's not just a generic keyword or unrelated mention
- The content is actually about or relates to the brand

Return a JSON object with "genuineMentions" array containing only the genuine mentions in this format:
{
  "genuineMentions": [
    {
      "domain": "${domain}",
      "brandMentioned": true,
      "title": "article title",
      "snippet": "relevant snippet", 
      "url": "article url"
    }
  ]
}

Search results to analyze:
${JSON.stringify(results, null, 2)}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        return { genuineMentions: [] };
      }

    } catch (error: any) {
      console.error('OpenAI analysis error:', error);
      if (error.code === 'insufficient_quota') {
        throw new Error('OPENAI_QUOTA_EXCEEDED');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('OPENAI_API_KEY_INVALID');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
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