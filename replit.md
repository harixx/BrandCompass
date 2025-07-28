# BrandScope - PR Audit Tool

## Overview

BrandScope is a free digital media analysis tool that examines a brand's presence across 30+ major news publications. Users input their brand name and website URL to run automated searches using the site:domain "brand name" query format. The tool provides comprehensive coverage analysis, detailed results visualization, and AI-powered strategic recommendations for improving media presence.

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
- **Serper.dev API**: Google search results using site:domain "brand name" queries
- **OpenAI API**: GPT-4o for content analysis and strategy recommendations
- **Error Handling**: Built-in handling for API key issues and rate limiting

### User Interface Components
- **Audit Form**: Clean input interface with real-time validation
- **Loading States**: Animated progress indicators during processing
- **Results Dashboard**: Comprehensive data visualization with charts and tables
- **Strategy Section**: AI-generated insights and recommendations (displayed after audit completion)
- **Tool-focused Design**: Simplified interface without SaaS elements like sign-in or pricing

## Data Flow

1. User submits brand information through the audit form
2. Backend creates audit record and initiates asynchronous processing
3. System searches each publication domain using Serper.dev with site:domain "brand name" queries
4. Search results are analyzed by OpenAI GPT-4o for genuine brand mentions
5. Results are aggregated and stored with completion metrics
6. Frontend polls for updates and displays real-time progress
7. Upon completion, comprehensive report is displayed followed by AI-generated strategy recommendations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Efficient server state management
- **axios**: HTTP client for external API calls
- **shadcn/ui**: Comprehensive UI component library

### API Services
- **Serper.dev**: Google search result aggregation with site-specific queries
- **OpenAI API**: GPT-4o for content analysis and strategy generation
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

**API Integration**: Separate service classes for external APIs (Serper.dev, OpenAI) provide clean abstraction and error handling.

**Async Processing**: Audit processing runs asynchronously with polling-based status updates to provide responsive user experience during long-running operations.

**Tool Design**: Simplified as a free analysis tool rather than SaaS platform, removing pricing tiers, sign-in functionality, and footer elements for focused user experience.

## Recent Changes (January 2025)

- **Migration Complete**: Successfully migrated from Replit Agent to standard Replit environment
- **Service Integration**: Created missing OpenAI service module with proper type compatibility
- **API Configuration**: Set up required environment variables (SERPER_API_KEY, OPENAI_API_KEY)
- **Enhanced Visualization**: Added interactive pie chart showing coverage analysis with Publications Checked (30), Mentions Found, Missed Opportunities, and Coverage Score vs Industry benchmark (25%)
- **UI Improvement**: Replaced "Company Overview Report Missing" section with comprehensive Coverage Analysis chart
- **API Migration**: Switched from SerpAPI to Serper.dev for search functionality using site:domain "brand name" query format
- **UI Simplification**: Removed SaaS elements (pricing section, sign-in, footer) to focus on tool functionality
- **Workflow Update**: Strategy recommendations now display after audit completion as requested
- **Error Handling**: Updated error messages and handling for Serper.dev API integration
- **Type Safety**: Fixed storage type issues for better development experience