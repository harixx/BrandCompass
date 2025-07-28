import axios from 'axios';

export interface SerpResult {
  title: string;
  snippet: string;
  link: string;
}

export class SerperService {
  private apiKey: string;
  private baseUrl = 'https://google.serper.dev/search';

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY is required');
    }
  }

  async searchDomain(domain: string, brandName: string): Promise<SerpResult[]> {
    try {
      // Enhanced search strategy with multiple query variations for maximum recall
      const queries = [
        `site:${domain} "${brandName}"`,                    // Exact match primary
        `site:${domain} ${brandName}`,                      // Broader match
        `site:${domain} "${brandName}" OR "${brandName} inc" OR "${brandName} corp"` // Corporate variations
      ];

      let allResults: SerpResult[] = [];
      const seenUrls = new Set<string>();

      // Execute primary search with exact brand name
      const primaryResponse = await axios.post(this.baseUrl, {
        q: queries[0],
        num: 15, // Increased from 10 for better coverage
        gl: 'us', // Geographic location for consistent results
        hl: 'en'  // Language preference
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (primaryResponse.data.error) {
        throw new Error(primaryResponse.data.error);
      }

      const primaryResults = primaryResponse.data.organic || [];
      
      // Process primary results
      primaryResults.forEach((result: any) => {
        if (result.link && !seenUrls.has(result.link)) {
          seenUrls.add(result.link);
          allResults.push({
            title: result.title || '',
            snippet: result.snippet || '',
            link: result.link || ''
          });
        }
      });

      // If primary search yielded few results, try broader search
      if (allResults.length < 3) {
        try {
          const broadResponse = await axios.post(this.baseUrl, {
            q: queries[1],
            num: 10
          }, {
            headers: {
              'X-API-KEY': this.apiKey,
              'Content-Type': 'application/json'
            }
          });

          const broadResults = broadResponse.data.organic || [];
          
          // Add unique results from broader search
          broadResults.forEach((result: any) => {
            if (result.link && !seenUrls.has(result.link)) {
              seenUrls.add(result.link);
              allResults.push({
                title: result.title || '',
                snippet: result.snippet || '',
                link: result.link || ''
              });
            }
          });

        } catch (broadError) {
          console.log(`Broad search failed for ${brandName} on ${domain}, using primary results only`);
        }
      }

      console.log(`Search completed for ${brandName} on ${domain}: ${allResults.length} results found`);
      return allResults;

    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('API_KEY_INVALID');
      }
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      console.error(`Serper API error for ${brandName} on ${domain}:`, error.message);
      throw new Error(`Serper API error: ${error.message}`);
    }
  }

  async checkCredits(): Promise<{ credits_left: number }> {
    // Serper.dev doesn't have a credits endpoint, return a default value
    return { credits_left: 1000 };
  }
}

export const serperService = new SerperService();
