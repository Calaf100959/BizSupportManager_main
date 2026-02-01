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
  themeColor: varchar("theme_color").default("blue"), // blue, pink, aqua, mint, purple, orange, beige
  dashboardLayout: jsonb("dashboard_layout"), // Array of widget IDs for custom ordering
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
  nextVisitDate: date("next_visit_date"),
  
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

// Audit log table for change history tracking
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // 'office', 'person', 'karte', etc.
  entityId: varchar("entity_id").notNull(),
  operation: varchar("operation").notNull(), // 'create', 'update', 'delete'
  fieldChanges: jsonb("field_changes"), // JSON object with before/after values
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// Subsidy programs master table
export const subsidyPrograms = pgTable("subsidy_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"), // '補助金', '助成金', '支援制度' etc.
  provider: varchar("provider"), // 提供機関
  status: varchar("status").notNull().default('開始前'), // '開始前', '公募中', '事業期間中', '事業終了'
  urls: text("urls").array(), // Up to 5 URLs for subsidy information
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubsidyProgramSchema = createInsertSchema(subsidyPrograms)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    urls: z.array(z.string().url("有効なURLを入力してください").min(1, "URLは空にできません")).max(5, "URLは最大5つまで登録できます").optional(),
  });

export type InsertSubsidyProgram = z.infer<typeof insertSubsidyProgramSchema>;
export type SubsidyProgram = typeof subsidyPrograms.$inferSelect;

// Office subsidy records table (tracks subsidy applications per office)
export const officeSubsidyRecords = pgTable("office_subsidy_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  programId: varchar("program_id").references(() => subsidyPrograms.id).notNull(),
  
  status: varchar("status").notNull(), // '検討中', '申請準備中', '申請済み', '採択', '不採択', '完了'
  applicationDate: date("application_date"),
  deadlineDate: date("deadline_date"),
  resultDate: date("result_date"),
  completionDate: date("completion_date"),
  
  amount: integer("amount"), // 申請額または交付決定額
  milestones: text("milestones"), // マイルストーン・進捗メモ
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOfficeSubsidyRecordSchema = createInsertSchema(officeSubsidyRecords).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedBy: true,
  updatedAt: true,
});

export type InsertOfficeSubsidyRecord = z.infer<typeof insertOfficeSubsidyRecordSchema>;
export type OfficeSubsidyRecord = typeof officeSubsidyRecords.$inferSelect;

// ===== Financial Management Tables =====

// Financial periods (事業年度)
export const financialPeriods = pgTable("financial_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  periodName: varchar("period_name").notNull(), // e.g., "第10期", "2024年度"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: varchar("status").notNull().default('入力中'), // '入力中', '確定', '監査済'
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;

// Financial accounts master (勘定科目マスタ)
export const financialAccounts = pgTable("financial_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(), // 科目コード e.g., "1101", "4101"
  name: varchar("name").notNull(), // 科目名 e.g., "現金及び預金", "売上高"
  nameEn: varchar("name_en"), // English name
  statementType: varchar("statement_type").notNull(), // 'BS' or 'PL'
  category: varchar("category").notNull(), // BS: '流動資産', '固定資産', etc. PL: '売上高', '売上原価', etc.
  subcategory: varchar("subcategory"), // 細分類
  displayOrder: integer("display_order").notNull().default(0),
  isDebit: integer("is_debit").notNull().default(1), // 1: 借方科目, 0: 貸方科目
  isActive: integer("is_active").notNull().default(1),
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;
export type FinancialAccount = typeof financialAccounts.$inferSelect;

// Balance Sheet entries (貸借対照表エントリ)
export const financialBsEntries = pgTable("financial_bs_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").references(() => financialPeriods.id).notNull(),
  accountId: varchar("account_id").references(() => financialAccounts.id).notNull(),
  amount: integer("amount").notNull().default(0), // 金額（円単位）
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialBsEntrySchema = createInsertSchema(financialBsEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialBsEntry = z.infer<typeof insertFinancialBsEntrySchema>;
export type FinancialBsEntry = typeof financialBsEntries.$inferSelect;

// Profit & Loss entries (損益計算書エントリ)
export const financialPlEntries = pgTable("financial_pl_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").references(() => financialPeriods.id).notNull(),
  accountId: varchar("account_id").references(() => financialAccounts.id).notNull(),
  amount: integer("amount").notNull().default(0), // 金額（円単位）
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialPlEntrySchema = createInsertSchema(financialPlEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialPlEntry = z.infer<typeof insertFinancialPlEntrySchema>;
export type FinancialPlEntry = typeof financialPlEntries.$inferSelect;

// Cash Flow Statement (キャッシュフロー計算書 - 計算結果保存用)
export const financialCashflows = pgTable("financial_cashflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").references(() => financialPeriods.id).notNull(),
  
  // Operating Activities (営業活動)
  netIncome: integer("net_income").default(0),
  depreciation: integer("depreciation").default(0),
  amortization: integer("amortization").default(0),
  provisionChange: integer("provision_change").default(0),
  receivablesChange: integer("receivables_change").default(0),
  inventoryChange: integer("inventory_change").default(0),
  payablesChange: integer("payables_change").default(0),
  otherOperatingChange: integer("other_operating_change").default(0),
  operatingCashFlow: integer("operating_cash_flow").default(0),
  
  // Investing Activities (投資活動)
  fixedAssetPurchase: integer("fixed_asset_purchase").default(0),
  fixedAssetSale: integer("fixed_asset_sale").default(0),
  investmentPurchase: integer("investment_purchase").default(0),
  investmentSale: integer("investment_sale").default(0),
  loanChange: integer("loan_change").default(0),
  investingCashFlow: integer("investing_cash_flow").default(0),
  
  // Financing Activities (財務活動)
  shortTermBorrowingChange: integer("short_term_borrowing_change").default(0),
  longTermBorrowingIncrease: integer("long_term_borrowing_increase").default(0),
  longTermBorrowingDecrease: integer("long_term_borrowing_decrease").default(0),
  stockIssuance: integer("stock_issuance").default(0),
  dividendPaid: integer("dividend_paid").default(0),
  financingCashFlow: integer("financing_cash_flow").default(0),
  
  // Total
  netCashChange: integer("net_cash_change").default(0),
  beginningCash: integer("beginning_cash").default(0),
  endingCash: integer("ending_cash").default(0),
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FinancialCashflow = typeof financialCashflows.$inferSelect;

// Financial Metrics (財務指標 - KPI計算結果)
export const financialMetrics = pgTable("financial_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodId: varchar("period_id").references(() => financialPeriods.id).notNull(),
  
  // Absolute Values (絶対額)
  revenue: integer("revenue"), // 売上高
  grossProfit: integer("gross_profit"), // 売上総利益
  operatingProfit: integer("operating_profit"), // 営業利益
  ordinaryProfit: integer("ordinary_profit"), // 経常利益
  netIncome: integer("net_income"), // 当期純利益
  totalAssets: integer("total_assets"), // 総資産
  netAssets: integer("net_assets"), // 純資産
  totalLiabilities: integer("total_liabilities"), // 総負債
  currentAssets: integer("current_assets"), // 流動資産
  currentLiabilities: integer("current_liabilities"), // 流動負債
  
  // Profitability (収益性)
  grossProfitMargin: integer("gross_profit_margin"), // 売上高総利益率 (小数点2桁 * 100)
  operatingProfitMargin: integer("operating_profit_margin"), // 売上高営業利益率
  ordinaryProfitMargin: integer("ordinary_profit_margin"), // 売上高経常利益率
  netProfitMargin: integer("net_profit_margin"), // 売上高当期純利益率
  roa: integer("roa"), // 総資本利益率
  roe: integer("roe"), // 自己資本利益率
  
  // Safety (安全性)
  currentRatio: integer("current_ratio"), // 流動比率
  quickRatio: integer("quick_ratio"), // 当座比率
  equityRatio: integer("equity_ratio"), // 自己資本比率
  debtRatio: integer("debt_ratio"), // 負債比率
  debtToEquityRatio: integer("debt_to_equity_ratio"), // D/E比率
  fixedRatio: integer("fixed_ratio"), // 固定比率
  fixedLongTermRatio: integer("fixed_long_term_ratio"), // 固定長期適合率
  
  // Growth (成長性)
  salesGrowthRate: integer("sales_growth_rate"), // 売上高成長率
  operatingProfitGrowthRate: integer("operating_profit_growth_rate"), // 営業利益成長率
  totalAssetGrowthRate: integer("total_asset_growth_rate"), // 総資産成長率
  
  // Efficiency (効率性)
  totalAssetTurnover: integer("total_asset_turnover"), // 総資本回転率 (小数点2桁 * 100)
  assetTurnover: integer("asset_turnover"), // 総資産回転率
  receivablesTurnover: integer("receivables_turnover"), // 売上債権回転率
  inventoryTurnover: integer("inventory_turnover"), // 棚卸資産回転率
  payablesTurnover: integer("payables_turnover"), // 仕入債務回転率
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FinancialMetric = typeof financialMetrics.$inferSelect;

// ===== Invoice Management Tables =====

// Companies (自社情報) - Support multiple companies per user
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Company basic info
  companyName: varchar("company_name").notNull(),
  companyNameKana: varchar("company_name_kana"),
  representativeName: varchar("representative_name"),
  
  // Invoice system registration (インボイス制度対応)
  invoiceRegistrationNumber: varchar("invoice_registration_number"), // T + 13 digits
  
  // Address
  postalCode: varchar("postal_code"),
  address: text("address"),
  
  // Contact
  phone: varchar("phone"),
  fax: varchar("fax"),
  email: varchar("email"),
  
  // Payment terms
  defaultPaymentTerms: varchar("default_payment_terms"), // e.g., "月末締め翌月末払い"
  
  // Default flag
  isDefault: varchar("is_default").default('false'), // 'true' or 'false' - デフォルトの会社
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Bank accounts (振込先口座) - Multiple accounts per company
export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  
  accountName: varchar("account_name").notNull(), // 口座名称（表示用）e.g., "メイン口座", "サブ口座"
  bankName: varchar("bank_name").notNull(),
  bankBranch: varchar("bank_branch").notNull(),
  bankAccountType: varchar("bank_account_type").notNull(), // '普通', '当座'
  bankAccountNumber: varchar("bank_account_number").notNull(),
  bankAccountHolder: varchar("bank_account_holder").notNull(),
  
  // Default flag for this company
  isDefault: varchar("is_default").default('false'), // 'true' or 'false' - この会社のデフォルト口座
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Legacy: Keep companySettings table for backward compatibility and migration
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  
  // Company basic info
  companyName: varchar("company_name").notNull(),
  companyNameKana: varchar("company_name_kana"),
  representativeName: varchar("representative_name"),
  
  // Invoice system registration (インボイス制度対応)
  invoiceRegistrationNumber: varchar("invoice_registration_number"), // T + 13 digits
  
  // Address
  postalCode: varchar("postal_code"),
  address: text("address"),
  
  // Contact
  phone: varchar("phone"),
  fax: varchar("fax"),
  email: varchar("email"),
  
  // Bank account info (振込先口座)
  bankName: varchar("bank_name"),
  bankBranch: varchar("bank_branch"),
  bankAccountType: varchar("bank_account_type"), // '普通', '当座'
  bankAccountNumber: varchar("bank_account_number"),
  bankAccountHolder: varchar("bank_account_holder"),
  
  // Payment terms
  defaultPaymentTerms: varchar("default_payment_terms"), // e.g., "月末締め翌月末払い"
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// Invoices (請求書)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Invoice identification
  invoiceNumber: varchar("invoice_number").notNull().unique(), // 請求書番号
  
  // Client info (links to existing offices table)
  officeId: varchar("office_id").references(() => offices.id).notNull(),
  
  // Company info (自社情報) - which company is issuing this invoice
  companyId: varchar("company_id").references(() => companies.id),
  
  // Bank account info (振込先口座) - multiple bank accounts can be displayed
  bankAccountIds: jsonb("bank_account_ids").$type<string[]>(), // Array of bank account IDs
  
  // Invoice dates
  issueDate: date("issue_date").notNull(), // 発行日
  dueDate: date("due_date"), // 支払期限
  
  // Invoice content (税率ごとの合計)
  subtotal: integer("subtotal").notNull().default(0), // 税抜合計
  taxAmount10: integer("tax_amount_10").default(0), // 10%消費税額
  taxAmount8: integer("tax_amount_8").default(0), // 8%消費税額（軽減税率）
  totalAmount: integer("total_amount").notNull().default(0), // 税込合計
  
  // Status tracking
  status: varchar("status").notNull().default('下書き'), // '下書き', '発行済', '送付済', '入金済', '一部入金', 'キャンセル'
  
  // Payment tracking
  paidAmount: integer("paid_amount").default(0), // 入金済み金額
  
  // Notes
  notes: text("notes"), // 備考
  
  // Email tracking
  emailSentAt: timestamp("email_sent_at"),
  emailSentTo: varchar("email_sent_to"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice items (請求書明細)
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  
  // Item details
  description: varchar("description").notNull(), // 品目・内容
  quantity: integer("quantity").notNull().default(1), // 数量
  unit: varchar("unit"), // 単位 (個、時間、式など)
  unitPrice: integer("unit_price").notNull().default(0), // 単価
  amount: integer("amount").notNull().default(0), // 金額（税抜）
  
  // Tax settings
  taxRate: integer("tax_rate").notNull().default(10), // 10 or 8 (percent)
  
  displayOrder: integer("display_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Payments (入金記録)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  
  // Payment info
  paymentDate: date("payment_date").notNull(), // 入金日
  amount: integer("amount").notNull(), // 入金額
  paymentMethod: varchar("payment_method"), // '銀行振込', '現金', 'その他'
  
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
