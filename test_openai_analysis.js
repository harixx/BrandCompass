import { openaiService } from './server/services/openai.js';

const testResults = [
  {
    title: "Apple iPhone 16 review: The best basic iPhone ever",
    snippet: "Apple's iPhone 16 is the best $799 iPhone yet, packing a gorgeous design, good battery life and many of the iPhone 16 Pro's most exciting features.",
    link: "https://www.cnn.com/cnn-underscored/reviews/apple-iphone-16"
  },
  {
    title: "Apple backs its diversity policies, calling anti-DEI proposal",
    snippet: "Apple's board of directors has recommended shareholders vote against a conservative think tank's proposal to consider scrapping the tech giant's diversity",
    link: "https://www.cnn.com/2025/01/13/business/apple-dei-companies"
  }
];

async function testAnalysis() {
  try {
    console.log('=== Testing OpenAI Analysis for Apple on CNN ===');
    const analysis = await openaiService.analyzeSearchResults(testResults, 'Apple', 'cnn.com');
    console.log('Analysis result:', JSON.stringify(analysis, null, 2));
    console.log('Genuine mentions found:', analysis.genuineMentions.length);
  } catch (error) {
    console.error('Analysis error:', error);
  }
}

testAnalysis();