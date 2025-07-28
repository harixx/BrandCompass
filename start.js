#!/usr/bin/env node

// Simple production startup script to handle environment setup
console.log('🚀 Starting BrandScope PR Audit Tool...');
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`Port: ${process.env.PORT || '5000'}`);

// Check for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'SERPER_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ Environment variables configured');

// Import and start the main application
import('./dist/index.js').catch(err => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});