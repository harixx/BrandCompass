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
      const query = `site:${domain} "${brandName}"`;
      
      const response = await axios.post(this.baseUrl, {
        q: query,
        num: 10
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const organicResults = response.data.organic || [];
      
      return organicResults.map((result: any) => ({
        title: result.title || '',
        snippet: result.snippet || '',
        link: result.link || ''
      }));

    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('API_KEY_INVALID');
      }
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      throw new Error(`Serper API error: ${error.message}`);
    }
  }

  async checkCredits(): Promise<{ credits_left: number }> {
    // Serper.dev doesn't have a credits endpoint, return a default value
    return { credits_left: 1000 };
  }
}

export const serperService = new SerperService();
