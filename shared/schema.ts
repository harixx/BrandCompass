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
  'finance.yahoo.com',
  'tradingview.com',
  'marketwatch.com',
  'apnews.com',
  'morningstar.com',
  'globenewswire.com',
  'markets.businessinsider.com',
  'ktla.com',
  'fox8.com',
  'wgntv.com',
  'kxan.com',
  'woodtv.com',
  'fox59.com',
  'manilatimes.net',
  'abc27.com',
  '8newsnow.com',
  'kron4.com',
  'kdvr.com',
  'wkbn.com',
  'wavy.com',
  'fox5sandiego.com',
  'wric.com',
  'wkrn.com',
  'fox2now.com',
  'localsyr.com',
  'wane.com',
  'pix11.com',
  'keloland.com',
  'wwlp.com',
  'koin.com'
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
