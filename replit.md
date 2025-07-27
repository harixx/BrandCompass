# BrandScope - PR Audit Tool

## Overview

BrandScope is a modern SaaS-style web application that analyzes a brand's digital media presence across 30+ predefined news publications. The application allows users to input their brand name and website URL, then runs automated searches across major news outlets to determine mention coverage and provides AI-powered strategic recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for audit operations
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: In-memory storage implementation with interface for easy migration to persistent storage

### Database Design
The application uses a simple schema with two main entities:
- **Users**: Basic user authentication (username/password)
- **Audits**: Brand audit records with status tracking and results storage

## Key Components

### Core Audit Workflow
1. **Input Collection**: Brand name and website URL validation
2. **Search Execution**: Automated searches across 30+ news publications using SerpAPI
3. **AI Analysis**: OpenAI GPT-4 classification of search results for genuine brand mentions
4. **Results Processing**: Aggregation of findings into comprehensive report
5. **Strategy Generation**: AI-powered recommendations based on audit results

### External Service Integrations
- **SerpAPI**: Search engine results for domain-specific brand searches
- **OpenAI API**: GPT-4 for content analysis and strategy recommendations
- **Credit Management**: Built-in handling for API credit exhaustion

### User Interface Components
- **Audit Form**: Clean input interface with real-time validation
- **Loading States**: Animated progress indicators during processing
- **Results Dashboard**: Comprehensive data visualization with charts and tables
- **Strategy Section**: AI-generated insights and recommendations
- **Pricing Section**: SaaS pricing tiers with upgrade prompts

## Data Flow

1. User submits brand information through the audit form
2. Backend creates audit record and initiates asynchronous processing
3. System searches each publication domain using SerpAPI with brand-specific queries
4. Search results are analyzed by OpenAI for genuine brand mentions
5. Results are aggregated and stored with completion metrics
6. Frontend polls for updates and displays real-time progress
7. Upon completion, comprehensive report and strategy recommendations are presented

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Efficient server state management
- **axios**: HTTP client for external API calls
- **shadcn/ui**: Comprehensive UI component library

### API Services
- **SerpAPI**: Search result aggregation (with credit monitoring)
- **OpenAI API**: Content analysis and strategy generation
- **Recharts**: Data visualization for audit results

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Development Environment
- Vite development server with HMR for rapid iteration
- TypeScript compilation with strict type checking
- Environment variable management for API keys
- Replit-specific optimizations for cloud development

### Production Build
- Vite production build with code splitting and optimization
- Express server bundling with esbuild
- Static asset serving through Express
- Environment-based configuration management

### Architecture Decisions

**Database Choice**: PostgreSQL with Drizzle ORM was chosen for type safety and scalability, though the current implementation includes an in-memory storage layer for development flexibility.

**State Management**: TanStack Query provides efficient caching and synchronization of server state, reducing the need for complex client-side state management.

**UI Framework**: shadcn/ui with Radix UI primitives offers accessibility and customization while maintaining design consistency.

**API Integration**: Separate service classes for external APIs (SerpAPI, OpenAI) provide clean abstraction and error handling.

**Async Processing**: Audit processing runs asynchronously with polling-based status updates to provide responsive user experience during long-running operations.