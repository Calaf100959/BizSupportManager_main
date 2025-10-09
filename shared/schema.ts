import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Offices table
export const offices = pgTable("offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  name: varchar("name").notNull(),
  nameKana: varchar("name_kana"),
  representativeName: varchar("representative_name"),
  representativeKana: varchar("representative_kana"),
  companyType: varchar("company_type"),
  capital: integer("capital"),
  corporateNumber: varchar("corporate_number"),
  invoiceNumber: varchar("invoice_number"),
  
  // Phone numbers with notes
  phone1: varchar("phone1"),
  phone1Note: varchar("phone1_note"),
  phone2: varchar("phone2"),
  phone2Note: varchar("phone2_note"),
  phone3: varchar("phone3"),
  phone3Note: varchar("phone3_note"),
  phone4: varchar("phone4"),
  phone4Note: varchar("phone4_note"),
  phone5: varchar("phone5"),
  phone5Note: varchar("phone5_note"),
  
  representativeMobile: varchar("representative_mobile"),
  
  // Office details
  industry: varchar("industry"),
  employees: integer("employees"),
  regularEmployees: integer("regular_employees"),
  companyCategory: varchar("company_category"),
  engagementType: varchar("engagement_type"),
  engagementDate: date("engagement_date"),
  withdrawalDate: date("withdrawal_date"),
  withdrawalReason: varchar("withdrawal_reason"),
  withdrawalReasonDetail: text("withdrawal_reason_detail"),
  closureDate: date("closure_date"),
  postalCode: varchar("postal_code"),
  address: text("address"),
  foundedDate: date("founded_date"),
  officePhone: varchar("office_phone"),
  fax: varchar("fax"),
  url: varchar("url"),
  email1: varchar("email1"),
  email2: varchar("email2"),
  email3: varchar("email3"),
  sns1: varchar("sns1"),
  sns2: varchar("sns2"),
  sns3: varchar("sns3"),
  referral: text("referral"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOfficeSchema = createInsertSchema(offices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOffice = z.infer<typeof insertOfficeSchema>;
export type Office = typeof offices.$inferSelect;

// Persons table (individual contacts for each office)
export const persons = pgTable("persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  code: varchar("code"),
  name: varchar("name").notNull(),
  nameKana: varchar("name_kana"),
  gender: varchar("gender"),
  birthDate: date("birth_date"),
  personCategory: varchar("person_category"),
  phone: varchar("phone"),
  fax: varchar("fax"),
  mobile: varchar("mobile"),
  email1: varchar("email1"),
  email2: varchar("email2"),
  email3: varchar("email3"),
  sns1: varchar("sns1"),
  sns2: varchar("sns2"),
  sns3: varchar("sns3"),
  organization1: varchar("organization1"),
  organization2: varchar("organization2"),
  organization3: varchar("organization3"),
  organization4: varchar("organization4"),
  organization5: varchar("organization5"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonSchema = createInsertSchema(persons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

// Karte (management chart) table
export const kartes = pgTable("kartes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  visitDate: date("visit_date").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  nextAction: text("next_action"),
  
  // Guidance classification fields
  guidanceItem: varchar("guidance_item"),
  guidanceCategory: varchar("guidance_category"),
  guidanceContent: varchar("guidance_content"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKarteSchema = createInsertSchema(kartes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKarte = z.infer<typeof insertKarteSchema>;
export type Karte = typeof kartes.$inferSelect;

// Work log table
export const worklogs = pgTable("worklogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  time: varchar("time"),
  duration: varchar("duration"),
  activity: varchar("activity").notNull(),
  detail: text("detail"),
  relatedOffice: varchar("related_office"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorklogSchema = createInsertSchema(worklogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorklog = z.infer<typeof insertWorklogSchema>;
export type Worklog = typeof worklogs.$inferSelect;
