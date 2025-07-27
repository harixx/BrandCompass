import { type User, type InsertUser, type Audit, type InsertAudit } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudit(id: string): Promise<Audit | undefined>;
  updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | undefined>;
  getAuditsByStatus(status: string): Promise<Audit[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private audits: Map<string, Audit>;

  constructor() {
    this.users = new Map();
    this.audits = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    const id = randomUUID();
    const audit: Audit = { 
      ...insertAudit, 
      id, 
      createdAt: new Date(),
      completedAt: null,
      results: insertAudit.results || null,
      strategy: insertAudit.strategy || null,
      status: insertAudit.status || "pending"
    };
    this.audits.set(id, audit);
    return audit;
  }

  async getAudit(id: string): Promise<Audit | undefined> {
    return this.audits.get(id);
  }

  async updateAudit(id: string, updates: Partial<Audit>): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;
    
    const updatedAudit = { ...audit, ...updates };
    this.audits.set(id, updatedAudit);
    return updatedAudit;
  }

  async getAuditsByStatus(status: string): Promise<Audit[]> {
    return Array.from(this.audits.values()).filter(audit => audit.status === status);
  }
}

export const storage = new MemStorage();
