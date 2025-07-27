import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandName: text("brand_name").notNull(),
  websiteUrl: text("website_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  results: jsonb("results"),
  strategy: jsonb("strategy"),
  totalPublications: integer("total_publications").default(0),
  mentionsFound: integer("mentions_found").default(0),
  coverageRate: integer("coverage_rate").default(0),
  topSource: text("top_source"),
  shareableLink: varchar("shareable_link"),
  createdAt: timestamp("created_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const auditForm = z.object({
  brandName: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
  websiteUrl: z.string().url("Please enter a valid URL"),
});

export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;
export type AuditForm = z.infer<typeof auditForm>;

export interface AuditResult {
  domain: string;
  brandMentioned: boolean;
  title?: string;
  snippet?: string;
  url?: string;
  logo?: string;
}

export interface AuditStrategy {
  insights: string[];
  priorityTargets: string[];
  actions: string[];
}

export const NEWS_PUBLICATIONS = [
  { domain: 'finance.yahoo.com', name: 'Yahoo Finance' },
  { domain: 'tradingview.com', name: 'TradingView' },
  { domain: 'marketwatch.com', name: 'MarketWatch' },
  { domain: 'apnews.com', name: 'AP News' },
  { domain: 'morningstar.com', name: 'Morningstar' },
  { domain: 'globenewswire.com', name: 'GlobeNewswire' },
  { domain: 'markets.businessinsider.com', name: 'Business Insider' },
  { domain: 'ktla.com', name: 'KTLA' },
  { domain: 'fox8.com', name: 'Fox 8' },
  { domain: 'wgntv.com', name: 'WGN TV' },
  { domain: 'kxan.com', name: 'KXAN' },
  { domain: 'woodtv.com', name: 'Wood TV' },
  { domain: 'fox59.com', name: 'Fox 59' },
  { domain: 'manilatimes.net', name: 'Manila Times' },
  { domain: 'abc27.com', name: 'ABC 27' },
  { domain: '8newsnow.com', name: '8 News Now' },
  { domain: 'kron4.com', name: 'KRON 4' },
  { domain: 'kdvr.com', name: 'KDVR' },
  { domain: 'wkbn.com', name: 'WKBN' },
  { domain: 'wavy.com', name: 'WAVY' },
  { domain: 'fox5sandiego.com', name: 'Fox 5 San Diego' },
  { domain: 'wric.com', name: 'WRIC' },
  { domain: 'wkrn.com', name: 'WKRN' },
  { domain: 'fox2now.com', name: 'Fox 2 Now' },
  { domain: 'localsyr.com', name: 'Local SYR' },
  { domain: 'wane.com', name: 'WANE' },
  { domain: 'pix11.com', name: 'PIX11' },
  { domain: 'keloland.com', name: 'KELOLAND' },
  { domain: 'wwlp.com', name: 'WWLP' },
  { domain: 'koin.com', name: 'KOIN' }
];

export const PRICING_PLANS = {
  starter: {
    name: 'PR Starter',
    price: 999,
    features: [
      '1 Press Release Syndication',
      'Yahoo & AP News Distribution', 
      'Basic Media Monitoring',
      '400+ Guaranteed Links',
      'Monthly Performance Report',
      'Email Support'
    ]
  },
  allinone: {
    name: 'All-in-One PR',
    price: 3500,
    features: [
      '3 Press Releases + Editorial Pitches',
      'Full Syndication Network (400+ outlets)',
      'Custom Story Development',
      'Direct Journalist Outreach',
      '15–20 Guaranteed Editorial Links',
      'Weekly Performance Reports',
      'Dedicated Account Manager',
      'Strategy Calls & Priority Support'
    ]
  }
};
