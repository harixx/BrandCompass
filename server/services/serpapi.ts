import axios from 'axios';

export interface SerpResult {
  title: string;
  snippet: string;
  link: string;
}

export class SerpAPIService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || '323fb93b331243fb3fe11900ec1bab86e8d3e773';
  }

  async searchDomain(domain: string, brandName: string): Promise<SerpResult[]> {
    try {
      const query = `site:${domain} "${brandName}"`;
      
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.apiKey,
          engine: 'google',
          q: query,
          num: 10
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const organicResults = response.data.organic_results || [];
      
      return organicResults.map((result: any) => ({
        title: result.title || '',
        snippet: result.snippet || '',
        link: result.link || ''
      }));

    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.data?.error?.includes('credits')) {
        throw new Error('CREDITS_EXHAUSTED');
      }
      throw new Error(`SerpAPI error: ${error.message}`);
    }
  }

  async checkCredits(): Promise<{ credits_left: number }> {
    try {
      const response = await axios.get('https://serpapi.com/account', {
        params: {
          api_key: this.apiKey
        }
      });
      
      return {
        credits_left: response.data.account?.credits_left || 0
      };
    } catch (error: any) {
      throw new Error(`Credits check failed: ${error.message}`);
    }
  }
}

export const serpApiService = new SerpAPIService();
