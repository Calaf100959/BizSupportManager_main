import {
  users,
  offices,
  persons,
  kartes,
  worklogs,
  auditLogs,
  subsidyPrograms,
  officeSubsidyRecords,
  financialPeriods,
  financialAccounts,
  financialBsEntries,
  financialPlEntries,
  financialCashflows,
  financialMetrics,
  companies,
  bankAccounts,
  companySettings,
  invoices,
  invoiceItems,
  payments,
  type User,
  type UpsertUser,
  type Office,
  type InsertOffice,
  type Person,
  type InsertPerson,
  type Karte,
  type InsertKarte,
  type Worklog,
  type InsertWorklog,
  type AuditLog,
  type SubsidyProgram,
  type InsertSubsidyProgram,
  type OfficeSubsidyRecord,
  type InsertOfficeSubsidyRecord,
  type FinancialPeriod,
  type InsertFinancialPeriod,
  type FinancialAccount,
  type InsertFinancialAccount,
  type FinancialBsEntry,
  type InsertFinancialBsEntry,
  type FinancialPlEntry,
  type InsertFinancialPlEntry,
  type FinancialCashflow,
  type FinancialMetric,
  type Company,
  type InsertCompany,
  type BankAccount,
  type InsertBankAccount,
  type CompanySettings,
  type InsertCompanySettings,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Payment,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTheme(userId: string, themeColor: string): Promise<User>;
  updateUserDashboardLayout(userId: string, layout: string[]): Promise<User>;
  
  // Office operations
  createOffice(office: InsertOffice): Promise<Office>;
  getOffice(id: string): Promise<Office | undefined>;
  getOfficeByCode(code: string): Promise<Office | undefined>;
  updateOffice(id: string, office: Partial<InsertOffice>): Promise<Office>;
  deleteOffice(id: string): Promise<void>;
  searchOffices(query: { 
    code?: string; 
    name?: string; 
    representative?: string;
  }): Promise<Office[]>;
  getAllOffices(): Promise<Office[]>;
  
  // Person operations
  createPerson(person: InsertPerson): Promise<Person>;
  getPerson(id: string): Promise<Person | undefined>;
  getPersonsByOffice(officeId: string): Promise<Person[]>;
  updatePerson(id: string, person: Partial<InsertPerson>): Promise<Person>;
  deletePerson(id: string): Promise<void>;
  
  // Karte operations
  createKarte(karte: InsertKarte): Promise<Karte>;
  getKarte(id: string): Promise<Karte | undefined>;
  getKartesByOffice(officeId: string): Promise<Karte[]>;
  getKartesByDate(date: string): Promise<Karte[]>;
  updateKarte(id: string, karte: Partial<InsertKarte>): Promise<Karte>;
  deleteKarte(id: string): Promise<void>;
  
  // Worklog operations
  createWorklog(worklog: InsertWorklog): Promise<Worklog>;
  getWorklogsByUser(userId: string): Promise<Worklog[]>;
  getWorklogsByDate(date: string): Promise<Worklog[]>;
  updateWorklog(id: string, worklog: Partial<InsertWorklog>): Promise<Worklog>;
  deleteWorklog(id: string): Promise<void>;
  
  // Audit log operations
  createAuditLog(log: { entityType: string; entityId: string; operation: string; fieldChanges: any; userId: string }): Promise<AuditLog>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  
  // Subsidy program operations
  createSubsidyProgram(program: InsertSubsidyProgram): Promise<SubsidyProgram>;
  getSubsidyProgram(id: string): Promise<SubsidyProgram | undefined>;
  getAllSubsidyPrograms(): Promise<SubsidyProgram[]>;
  updateSubsidyProgram(id: string, program: Partial<InsertSubsidyProgram>): Promise<SubsidyProgram>;
  deleteSubsidyProgram(id: string): Promise<void>;
  getOfficesBySubsidyProgram(programId: string): Promise<Array<Office & { recordStatus: string; recordId: string }>>;
  
  // Office subsidy record operations
  createOfficeSubsidyRecord(record: InsertOfficeSubsidyRecord): Promise<OfficeSubsidyRecord>;
  getOfficeSubsidyRecord(id: string): Promise<OfficeSubsidyRecord | undefined>;
  getOfficeSubsidyRecordsByOffice(officeId: string): Promise<OfficeSubsidyRecord[]>;
  getOfficeSubsidyRecordsByProgram(programId: string): Promise<OfficeSubsidyRecord[]>;
  getUpcomingDeadlines(daysAhead: number): Promise<OfficeSubsidyRecord[]>;
  updateOfficeSubsidyRecord(id: string, record: Partial<InsertOfficeSubsidyRecord>): Promise<OfficeSubsidyRecord>;
  deleteOfficeSubsidyRecord(id: string): Promise<void>;
  
  // Financial period operations
  createFinancialPeriod(period: InsertFinancialPeriod): Promise<FinancialPeriod>;
  getFinancialPeriod(id: string): Promise<FinancialPeriod | undefined>;
  getFinancialPeriodsByOffice(officeId: string): Promise<FinancialPeriod[]>;
  updateFinancialPeriod(id: string, period: Partial<InsertFinancialPeriod>): Promise<FinancialPeriod>;
  deleteFinancialPeriod(id: string): Promise<void>;
  
  // Financial account operations
  getAllFinancialAccounts(): Promise<FinancialAccount[]>;
  getFinancialAccountsByType(statementType: 'BS' | 'PL'): Promise<FinancialAccount[]>;
  createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount>;
  
  // Balance Sheet entry operations
  createFinancialBsEntry(entry: InsertFinancialBsEntry): Promise<FinancialBsEntry>;
  getFinancialBsEntriesByPeriod(periodId: string): Promise<FinancialBsEntry[]>;
  upsertFinancialBsEntries(entries: InsertFinancialBsEntry[]): Promise<FinancialBsEntry[]>;
  deleteFinancialBsEntriesByPeriod(periodId: string): Promise<void>;
  
  // Profit & Loss entry operations
  createFinancialPlEntry(entry: InsertFinancialPlEntry): Promise<FinancialPlEntry>;
  getFinancialPlEntriesByPeriod(periodId: string): Promise<FinancialPlEntry[]>;
  upsertFinancialPlEntries(entries: InsertFinancialPlEntry[]): Promise<FinancialPlEntry[]>;
  deleteFinancialPlEntriesByPeriod(periodId: string): Promise<void>;
  
  // Cash flow operations
  getFinancialCashflowByPeriod(periodId: string): Promise<FinancialCashflow | undefined>;
  upsertFinancialCashflow(periodId: string, cashflow: Partial<FinancialCashflow>): Promise<FinancialCashflow>;
  
  // Financial metrics operations
  getFinancialMetricsByPeriod(periodId: string): Promise<FinancialMetric | undefined>;
  upsertFinancialMetrics(periodId: string, metrics: Partial<FinancialMetric>): Promise<FinancialMetric>;
  
  // Company operations (新しい複数会社対応)
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  getCompaniesByUser(userId: string): Promise<Company[]>;
  getDefaultCompany(userId: string): Promise<Company | undefined>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  setDefaultCompany(userId: string, companyId: string): Promise<void>;
  
  // Bank account operations (新しい複数口座対応)
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  getBankAccount(id: string): Promise<BankAccount | undefined>;
  getBankAccountsByCompany(companyId: string): Promise<BankAccount[]>;
  getDefaultBankAccount(companyId: string): Promise<BankAccount | undefined>;
  updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: string): Promise<void>;
  setDefaultBankAccount(companyId: string, accountId: string): Promise<void>;
  
  // Company settings operations (レガシー - 後方互換性のため)
  getCompanySettings(userId: string): Promise<CompanySettings | undefined>;
  upsertCompanySettings(userId: string, settings: Omit<InsertCompanySettings, 'userId'>): Promise<CompanySettings>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[]; office: Office } | undefined>;
  getInvoicesByUser(userId: string): Promise<Invoice[]>;
  getInvoicesByOffice(officeId: string): Promise<Invoice[]>;
  searchInvoices(query: { status?: string; officeId?: string; startDate?: string; endDate?: string }): Promise<Invoice[]>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getNextInvoiceNumber(): Promise<string>;
  
  // Invoice item operations
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]>;
  updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<void>;
  deleteInvoiceItemsByInvoice(invoiceId: string): Promise<void>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  deletePayment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserTheme(userId: string, themeColor: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ themeColor, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserDashboardLayout(userId: string, layout: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ dashboardLayout: layout, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Office operations
  async createOffice(officeData: InsertOffice): Promise<Office> {
    const [office] = await db.insert(offices).values(officeData).returning();
    return office;
  }

  async getOffice(id: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.id, id));
    return office;
  }

  async getOfficeByCode(code: string): Promise<Office | undefined> {
    const [office] = await db.select().from(offices).where(eq(offices.code, code));
    return office;
  }

  async updateOffice(id: string, officeData: Partial<InsertOffice>): Promise<Office> {
    // Get the old office data before update
    const oldOffice = await this.getOffice(id);
    
    const [office] = await db
      .update(offices)
      .set({ ...officeData, updatedAt: new Date() })
      .where(eq(offices.id, id))
      .returning();
    
    // Create audit log if office was updated and userId is available
    if (oldOffice && officeData.updatedBy) {
      const changes: Record<string, { before: any; after: any }> = {};
      for (const key in officeData) {
        if (key !== 'updatedAt' && key !== 'updatedBy' && officeData[key as keyof typeof officeData] !== oldOffice[key as keyof Office]) {
          changes[key] = {
            before: oldOffice[key as keyof Office],
            after: officeData[key as keyof typeof officeData]
          };
        }
      }
      
      if (Object.keys(changes).length > 0) {
        await this.createAuditLog({
          entityType: 'office',
          entityId: id,
          operation: 'update',
          fieldChanges: changes,
          userId: officeData.updatedBy
        });
      }
    }
    
    return office;
  }

  async deleteOffice(id: string): Promise<void> {
    // Delete child records first to avoid FK constraint violations
    // (none of these FK relations have ON DELETE CASCADE)
    const officeInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.officeId, id));
    for (const inv of officeInvoices) {
      await db.delete(payments).where(eq(payments.invoiceId, inv.id));
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    }
    await db.delete(invoices).where(eq(invoices.officeId, id));
    await db.delete(officeSubsidyRecords).where(eq(officeSubsidyRecords.officeId, id));
    const periods = await db.select({ id: financialPeriods.id }).from(financialPeriods).where(eq(financialPeriods.officeId, id));
    for (const period of periods) {
      await db.delete(financialBsEntries).where(eq(financialBsEntries.periodId, period.id));
      await db.delete(financialPlEntries).where(eq(financialPlEntries.periodId, period.id));
      await db.delete(financialCashflows).where(eq(financialCashflows.periodId, period.id));
      await db.delete(financialMetrics).where(eq(financialMetrics.periodId, period.id));
    }
    await db.delete(financialPeriods).where(eq(financialPeriods.officeId, id));
    await db.delete(kartes).where(eq(kartes.officeId, id));
    await db.delete(persons).where(eq(persons.officeId, id));
    await db.delete(offices).where(eq(offices.id, id));
  }

  async searchOffices(query: { 
    code?: string; 
    name?: string; 
    representative?: string;
  }): Promise<Office[]> {
    const conditions = [];
    
    if (query.code) {
      conditions.push(ilike(offices.code, `%${query.code}%`));
    }
    if (query.name) {
      conditions.push(
        or(
          ilike(offices.name, `%${query.name}%`),
          ilike(offices.nameKana, `%${query.name}%`)
        )
      );
    }
    if (query.representative) {
      conditions.push(
        or(
          ilike(offices.representativeName, `%${query.representative}%`),
          ilike(offices.representativeKana, `%${query.representative}%`)
        )
      );
    }

    if (conditions.length === 0) {
      return this.getAllOffices();
    }

    return db.select().from(offices).where(or(...conditions));
  }

  async getAllOffices(): Promise<Office[]> {
    return db.select().from(offices);
  }

  // Person operations
  async createPerson(personData: InsertPerson): Promise<Person> {
    const [person] = await db.insert(persons).values(personData).returning();
    return person;
  }

  async getPerson(id: string): Promise<Person | undefined> {
    const [person] = await db.select().from(persons).where(eq(persons.id, id));
    return person;
  }

  async getPersonsByOffice(officeId: string): Promise<Person[]> {
    return db.select().from(persons).where(eq(persons.officeId, officeId));
  }

  async updatePerson(id: string, personData: Partial<InsertPerson>): Promise<Person> {
    const [person] = await db
      .update(persons)
      .set({ ...personData, updatedAt: new Date() })
      .where(eq(persons.id, id))
      .returning();
    return person;
  }

  async deletePerson(id: string): Promise<void> {
    await db.delete(persons).where(eq(persons.id, id));
  }

  // Karte operations
  async createKarte(karteData: InsertKarte): Promise<Karte> {
    const [karte] = await db.insert(kartes).values(karteData).returning();
    return karte;
  }

  async getKarte(id: string): Promise<Karte | undefined> {
    const [karte] = await db.select().from(kartes).where(eq(kartes.id, id));
    return karte;
  }

  async getKartesByOffice(officeId: string): Promise<Karte[]> {
    return db
      .select()
      .from(kartes)
      .where(eq(kartes.officeId, officeId))
      .orderBy(sql`${kartes.visitDate} DESC`);
  }

  async getKartesByDate(date: string): Promise<Karte[]> {
    return db
      .select()
      .from(kartes)
      .where(eq(kartes.visitDate, date))
      .orderBy(sql`${kartes.createdAt} DESC`);
  }

  async updateKarte(id: string, karteData: Partial<InsertKarte>): Promise<Karte> {
    const [karte] = await db
      .update(kartes)
      .set({ ...karteData, updatedAt: new Date() })
      .where(eq(kartes.id, id))
      .returning();
    return karte;
  }

  async deleteKarte(id: string): Promise<void> {
    await db.delete(kartes).where(eq(kartes.id, id));
  }

  // Worklog operations
  async createWorklog(worklogData: InsertWorklog): Promise<Worklog> {
    const [worklog] = await db.insert(worklogs).values(worklogData).returning();
    return worklog;
  }

  async getWorklogsByUser(userId: string): Promise<Worklog[]> {
    return db
      .select()
      .from(worklogs)
      .where(eq(worklogs.createdBy, userId))
      .orderBy(sql`${worklogs.date} DESC`);
  }

  async getWorklogsByDate(date: string): Promise<Worklog[]> {
    return db
      .select()
      .from(worklogs)
      .where(eq(worklogs.date, date))
      .orderBy(sql`${worklogs.time} ASC`);
  }

  async updateWorklog(id: string, worklogData: Partial<InsertWorklog>): Promise<Worklog> {
    const [worklog] = await db
      .update(worklogs)
      .set({ ...worklogData, updatedAt: new Date() })
      .where(eq(worklogs.id, id))
      .returning();
    return worklog;
  }

  async deleteWorklog(id: string): Promise<void> {
    await db.delete(worklogs).where(eq(worklogs.id, id));
  }
  
  // Audit log operations
  async createAuditLog(log: { entityType: string; entityId: string; operation: string; fieldChanges: any; userId: string }): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }
  
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(sql`${auditLogs.createdAt} DESC`);
  }
  
  // Subsidy program operations
  async createSubsidyProgram(programData: InsertSubsidyProgram): Promise<SubsidyProgram> {
    const [program] = await db.insert(subsidyPrograms).values(programData).returning();
    return program;
  }
  
  async getSubsidyProgram(id: string): Promise<SubsidyProgram | undefined> {
    const [program] = await db.select().from(subsidyPrograms).where(eq(subsidyPrograms.id, id));
    return program;
  }
  
  async getAllSubsidyPrograms(): Promise<SubsidyProgram[]> {
    return db.select().from(subsidyPrograms).orderBy(sql`${subsidyPrograms.name} ASC`);
  }
  
  async updateSubsidyProgram(id: string, programData: Partial<InsertSubsidyProgram>): Promise<SubsidyProgram> {
    const [program] = await db
      .update(subsidyPrograms)
      .set({ ...programData, updatedAt: new Date() })
      .where(eq(subsidyPrograms.id, id))
      .returning();
    return program;
  }
  
  async deleteSubsidyProgram(id: string): Promise<void> {
    await db.delete(subsidyPrograms).where(eq(subsidyPrograms.id, id));
  }
  
  async getOfficesBySubsidyProgram(programId: string): Promise<Array<Office & { recordStatus: string; recordId: string }>> {
    const result = await db
      .select({
        office: offices,
        recordStatus: officeSubsidyRecords.status,
        recordId: officeSubsidyRecords.id,
      })
      .from(officeSubsidyRecords)
      .innerJoin(offices, eq(officeSubsidyRecords.officeId, offices.id))
      .where(eq(officeSubsidyRecords.programId, programId))
      .orderBy(sql`${offices.name} ASC`);
    
    return result.map(row => ({
      ...row.office,
      recordStatus: row.recordStatus,
      recordId: row.recordId,
    }));
  }
  
  // Office subsidy record operations
  async createOfficeSubsidyRecord(recordData: Omit<InsertOfficeSubsidyRecord, 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'> & { createdBy: string }): Promise<OfficeSubsidyRecord> {
    const dataWithDefaults = {
      ...recordData,
      updatedBy: recordData.createdBy,
    };
    const [record] = await db.insert(officeSubsidyRecords).values(dataWithDefaults as any).returning();
    return record;
  }
  
  async getOfficeSubsidyRecord(id: string): Promise<OfficeSubsidyRecord | undefined> {
    const [record] = await db.select().from(officeSubsidyRecords).where(eq(officeSubsidyRecords.id, id));
    return record;
  }
  
  async getOfficeSubsidyRecordsByOffice(officeId: string): Promise<OfficeSubsidyRecord[]> {
    return db
      .select()
      .from(officeSubsidyRecords)
      .where(eq(officeSubsidyRecords.officeId, officeId))
      .orderBy(sql`${officeSubsidyRecords.deadlineDate} ASC`);
  }
  
  async getOfficeSubsidyRecordsByProgram(programId: string): Promise<OfficeSubsidyRecord[]> {
    return db
      .select()
      .from(officeSubsidyRecords)
      .where(eq(officeSubsidyRecords.programId, programId))
      .orderBy(sql`${officeSubsidyRecords.deadlineDate} ASC`);
  }
  
  async getUpcomingDeadlines(daysAhead: number): Promise<OfficeSubsidyRecord[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return db
      .select()
      .from(officeSubsidyRecords)
      .where(
        and(
          sql`${officeSubsidyRecords.deadlineDate} >= ${today.toISOString().split('T')[0]}`,
          sql`${officeSubsidyRecords.deadlineDate} <= ${futureDate.toISOString().split('T')[0]}`,
          or(
            eq(officeSubsidyRecords.status, '検討中'),
            eq(officeSubsidyRecords.status, '申請準備中')
          )
        )
      )
      .orderBy(sql`${officeSubsidyRecords.deadlineDate} ASC`);
  }
  
  async updateOfficeSubsidyRecord(id: string, recordData: Partial<InsertOfficeSubsidyRecord>): Promise<OfficeSubsidyRecord> {
    const [record] = await db
      .update(officeSubsidyRecords)
      .set({ ...recordData, updatedAt: new Date() })
      .where(eq(officeSubsidyRecords.id, id))
      .returning();
    return record;
  }
  
  async deleteOfficeSubsidyRecord(id: string): Promise<void> {
    await db.delete(officeSubsidyRecords).where(eq(officeSubsidyRecords.id, id));
  }
  
  // Financial period operations
  async createFinancialPeriod(periodData: InsertFinancialPeriod): Promise<FinancialPeriod> {
    const [period] = await db.insert(financialPeriods).values(periodData).returning();
    return period;
  }
  
  async getFinancialPeriod(id: string): Promise<FinancialPeriod | undefined> {
    const [period] = await db.select().from(financialPeriods).where(eq(financialPeriods.id, id));
    return period;
  }
  
  async getFinancialPeriodsByOffice(officeId: string): Promise<FinancialPeriod[]> {
    return db
      .select()
      .from(financialPeriods)
      .where(eq(financialPeriods.officeId, officeId))
      .orderBy(sql`${financialPeriods.endDate} DESC`);
  }
  
  async updateFinancialPeriod(id: string, periodData: Partial<InsertFinancialPeriod>): Promise<FinancialPeriod> {
    const [period] = await db
      .update(financialPeriods)
      .set({ ...periodData, updatedAt: new Date() })
      .where(eq(financialPeriods.id, id))
      .returning();
    return period;
  }
  
  async deleteFinancialPeriod(id: string): Promise<void> {
    await db.delete(financialBsEntries).where(eq(financialBsEntries.periodId, id));
    await db.delete(financialPlEntries).where(eq(financialPlEntries.periodId, id));
    await db.delete(financialCashflows).where(eq(financialCashflows.periodId, id));
    await db.delete(financialMetrics).where(eq(financialMetrics.periodId, id));
    await db.delete(financialPeriods).where(eq(financialPeriods.id, id));
  }
  
  // Financial account operations
  async getAllFinancialAccounts(): Promise<FinancialAccount[]> {
    return db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.isActive, 1))
      .orderBy(sql`${financialAccounts.displayOrder} ASC`);
  }
  
  async getFinancialAccountsByType(statementType: 'BS' | 'PL'): Promise<FinancialAccount[]> {
    return db
      .select()
      .from(financialAccounts)
      .where(and(
        eq(financialAccounts.statementType, statementType),
        eq(financialAccounts.isActive, 1)
      ))
      .orderBy(sql`${financialAccounts.displayOrder} ASC`);
  }
  
  async createFinancialAccount(accountData: InsertFinancialAccount): Promise<FinancialAccount> {
    const [account] = await db.insert(financialAccounts).values(accountData).returning();
    return account;
  }
  
  // Balance Sheet entry operations
  async createFinancialBsEntry(entryData: InsertFinancialBsEntry): Promise<FinancialBsEntry> {
    const [entry] = await db.insert(financialBsEntries).values(entryData).returning();
    return entry;
  }
  
  async getFinancialBsEntriesByPeriod(periodId: string): Promise<(FinancialBsEntry & { account: FinancialAccount | null })[]> {
    const results = await db
      .select({
        id: financialBsEntries.id,
        periodId: financialBsEntries.periodId,
        accountId: financialBsEntries.accountId,
        amount: financialBsEntries.amount,
        notes: financialBsEntries.notes,
        createdAt: financialBsEntries.createdAt,
        updatedAt: financialBsEntries.updatedAt,
        createdBy: financialBsEntries.createdBy,
        updatedBy: financialBsEntries.updatedBy,
        account: {
          id: financialAccounts.id,
          code: financialAccounts.code,
          name: financialAccounts.name,
          nameEn: financialAccounts.nameEn,
          statementType: financialAccounts.statementType,
          category: financialAccounts.category,
          subcategory: financialAccounts.subcategory,
          displayOrder: financialAccounts.displayOrder,
          isDebit: financialAccounts.isDebit,
          isActive: financialAccounts.isActive,
          description: financialAccounts.description,
          createdAt: financialAccounts.createdAt,
          updatedAt: financialAccounts.updatedAt,
        },
      })
      .from(financialBsEntries)
      .leftJoin(financialAccounts, eq(financialBsEntries.accountId, financialAccounts.id))
      .where(eq(financialBsEntries.periodId, periodId));
    return results;
  }
  
  async upsertFinancialBsEntries(entries: InsertFinancialBsEntry[]): Promise<FinancialBsEntry[]> {
    if (entries.length === 0) return [];
    const results: FinancialBsEntry[] = [];
    for (const entry of entries) {
      const [existing] = await db
        .select()
        .from(financialBsEntries)
        .where(and(
          eq(financialBsEntries.periodId, entry.periodId),
          eq(financialBsEntries.accountId, entry.accountId)
        ));
      
      if (existing) {
        const [updated] = await db
          .update(financialBsEntries)
          .set({ amount: entry.amount, notes: entry.notes, updatedAt: new Date(), updatedBy: entry.updatedBy })
          .where(eq(financialBsEntries.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(financialBsEntries).values(entry).returning();
        results.push(created);
      }
    }
    return results;
  }
  
  async deleteFinancialBsEntriesByPeriod(periodId: string): Promise<void> {
    await db.delete(financialBsEntries).where(eq(financialBsEntries.periodId, periodId));
  }
  
  // Profit & Loss entry operations
  async createFinancialPlEntry(entryData: InsertFinancialPlEntry): Promise<FinancialPlEntry> {
    const [entry] = await db.insert(financialPlEntries).values(entryData).returning();
    return entry;
  }
  
  async getFinancialPlEntriesByPeriod(periodId: string): Promise<(FinancialPlEntry & { account: FinancialAccount | null })[]> {
    const results = await db
      .select({
        id: financialPlEntries.id,
        periodId: financialPlEntries.periodId,
        accountId: financialPlEntries.accountId,
        amount: financialPlEntries.amount,
        notes: financialPlEntries.notes,
        createdAt: financialPlEntries.createdAt,
        updatedAt: financialPlEntries.updatedAt,
        createdBy: financialPlEntries.createdBy,
        updatedBy: financialPlEntries.updatedBy,
        account: {
          id: financialAccounts.id,
          code: financialAccounts.code,
          name: financialAccounts.name,
          nameEn: financialAccounts.nameEn,
          statementType: financialAccounts.statementType,
          category: financialAccounts.category,
          subcategory: financialAccounts.subcategory,
          displayOrder: financialAccounts.displayOrder,
          isDebit: financialAccounts.isDebit,
          isActive: financialAccounts.isActive,
          description: financialAccounts.description,
          createdAt: financialAccounts.createdAt,
          updatedAt: financialAccounts.updatedAt,
        },
      })
      .from(financialPlEntries)
      .leftJoin(financialAccounts, eq(financialPlEntries.accountId, financialAccounts.id))
      .where(eq(financialPlEntries.periodId, periodId));
    return results;
  }
  
  async upsertFinancialPlEntries(entries: InsertFinancialPlEntry[]): Promise<FinancialPlEntry[]> {
    if (entries.length === 0) return [];
    const results: FinancialPlEntry[] = [];
    for (const entry of entries) {
      const [existing] = await db
        .select()
        .from(financialPlEntries)
        .where(and(
          eq(financialPlEntries.periodId, entry.periodId),
          eq(financialPlEntries.accountId, entry.accountId)
        ));
      
      if (existing) {
        const [updated] = await db
          .update(financialPlEntries)
          .set({ amount: entry.amount, notes: entry.notes, updatedAt: new Date(), updatedBy: entry.updatedBy })
          .where(eq(financialPlEntries.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(financialPlEntries).values(entry).returning();
        results.push(created);
      }
    }
    return results;
  }
  
  async deleteFinancialPlEntriesByPeriod(periodId: string): Promise<void> {
    await db.delete(financialPlEntries).where(eq(financialPlEntries.periodId, periodId));
  }
  
  // Cash flow operations
  async getFinancialCashflowByPeriod(periodId: string): Promise<FinancialCashflow | undefined> {
    const [cf] = await db.select().from(financialCashflows).where(eq(financialCashflows.periodId, periodId));
    return cf;
  }
  
  async upsertFinancialCashflow(periodId: string, cashflowData: Partial<FinancialCashflow>): Promise<FinancialCashflow> {
    const existing = await this.getFinancialCashflowByPeriod(periodId);
    if (existing) {
      const [updated] = await db
        .update(financialCashflows)
        .set({ ...cashflowData, calculatedAt: new Date(), updatedAt: new Date() })
        .where(eq(financialCashflows.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(financialCashflows)
        .values({ ...cashflowData, periodId })
        .returning();
      return created;
    }
  }
  
  // Financial metrics operations
  async getFinancialMetricsByPeriod(periodId: string): Promise<FinancialMetric | undefined> {
    const [metrics] = await db.select().from(financialMetrics).where(eq(financialMetrics.periodId, periodId));
    return metrics;
  }
  
  async upsertFinancialMetrics(periodId: string, metricsData: Partial<FinancialMetric>): Promise<FinancialMetric> {
    const existing = await this.getFinancialMetricsByPeriod(periodId);
    if (existing) {
      const [updated] = await db
        .update(financialMetrics)
        .set({ ...metricsData, calculatedAt: new Date(), updatedAt: new Date() })
        .where(eq(financialMetrics.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(financialMetrics)
        .values({ ...metricsData, periodId })
        .returning();
      return created;
    }
  }
  
  // Company operations (新しい複数会社対応)
  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }
  
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  
  async getCompaniesByUser(userId: string): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.userId, userId));
  }
  
  async getDefaultCompany(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.userId, userId), eq(companies.isDefault, 'true')));
    return company;
  }
  
  async updateCompany(id: string, companyData: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }
  
  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }
  
  async setDefaultCompany(userId: string, companyId: string): Promise<void> {
    // まず、すべての会社のデフォルトフラグをfalseに
    await db
      .update(companies)
      .set({ isDefault: 'false', updatedAt: new Date() })
      .where(eq(companies.userId, userId));
    
    // 指定された会社をデフォルトに
    await db
      .update(companies)
      .set({ isDefault: 'true', updatedAt: new Date() })
      .where(eq(companies.id, companyId));
  }
  
  // Bank account operations (新しい複数口座対応)
  async createBankAccount(accountData: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values(accountData).returning();
    return account;
  }
  
  async getBankAccount(id: string): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }
  
  async getBankAccountsByCompany(companyId: string): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.companyId, companyId));
  }
  
  async getDefaultBankAccount(companyId: string): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts)
      .where(and(eq(bankAccounts.companyId, companyId), eq(bankAccounts.isDefault, 'true')));
    return account;
  }
  
  async updateBankAccount(id: string, accountData: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [updated] = await db
      .update(bankAccounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated;
  }
  
  async deleteBankAccount(id: string): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }
  
  async setDefaultBankAccount(companyId: string, accountId: string): Promise<void> {
    // まず、この会社のすべての口座のデフォルトフラグをfalseに
    await db
      .update(bankAccounts)
      .set({ isDefault: 'false', updatedAt: new Date() })
      .where(eq(bankAccounts.companyId, companyId));
    
    // 指定された口座をデフォルトに
    await db
      .update(bankAccounts)
      .set({ isDefault: 'true', updatedAt: new Date() })
      .where(eq(bankAccounts.id, accountId));
  }
  
  // Company settings operations (レガシー - 後方互換性のため)
  async getCompanySettings(userId: string): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).where(eq(companySettings.userId, userId));
    return settings;
  }
  
  async upsertCompanySettings(userId: string, settingsData: Omit<InsertCompanySettings, 'userId'>): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(userId);
    if (existing) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companySettings)
        .values({ ...settingsData, userId })
        .returning();
      return created;
    }
  }
  
  // Invoice operations
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // JSONBフィールドは配列をそのまま渡せる（Drizzleが自動変換）
    const dataToInsert = {
      ...invoiceData,
      bankAccountIds: invoiceData.bankAccountIds || null,
    };
    const [invoice] = await db.insert(invoices).values(dataToInsert as any).returning();
    return invoice;
  }
  
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getInvoiceWithItems(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[]; office: Office; company: Company | null; bankAccounts: BankAccount[] } | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const items = await this.getInvoiceItemsByInvoice(id);
    const office = await this.getOffice(invoice.officeId);
    if (!office) return undefined;
    
    // Get company info
    let company: Company | null = null;
    if (invoice.companyId) {
      company = await this.getCompany(invoice.companyId) || null;
    }
    
    // Get bank accounts info
    let bankAccounts: BankAccount[] = [];
    if (invoice.bankAccountIds && Array.isArray(invoice.bankAccountIds)) {
      const accountPromises = invoice.bankAccountIds.map(accountId => this.getBankAccount(accountId));
      const accounts = await Promise.all(accountPromises);
      bankAccounts = accounts.filter((acc): acc is BankAccount => acc !== undefined);
    }
    
    return { invoice, items, office, company, bankAccounts };
  }
  
  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.createdBy, userId))
      .orderBy(sql`${invoices.issueDate} DESC`);
  }
  
  async getInvoicesByOffice(officeId: string): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.officeId, officeId))
      .orderBy(sql`${invoices.issueDate} DESC`);
  }
  
  async searchInvoices(query: { status?: string; officeId?: string; startDate?: string; endDate?: string }): Promise<Invoice[]> {
    const conditions = [];
    
    if (query.status) {
      conditions.push(eq(invoices.status, query.status));
    }
    if (query.officeId) {
      conditions.push(eq(invoices.officeId, query.officeId));
    }
    if (query.startDate) {
      conditions.push(sql`${invoices.issueDate} >= ${query.startDate}`);
    }
    if (query.endDate) {
      conditions.push(sql`${invoices.issueDate} <= ${query.endDate}`);
    }
    
    if (conditions.length === 0) {
      return db.select().from(invoices).orderBy(sql`${invoices.issueDate} DESC`);
    }
    
    return db.select().from(invoices).where(and(...conditions)).orderBy(sql`${invoices.issueDate} DESC`);
  }
  
  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const dataToUpdate = {
      ...invoiceData,
      bankAccountIds: invoiceData.bankAccountIds !== undefined ? invoiceData.bankAccountIds : undefined,
      updatedAt: new Date(),
    };
    const [invoice] = await db
      .update(invoices)
      .set(dataToUpdate as any)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }
  
  async deleteInvoice(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.invoiceId, id));
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }
  
  async getNextInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;
    
    const [latest] = await db
      .select()
      .from(invoices)
      .where(sql`${invoices.invoiceNumber} LIKE ${prefix + '%'}`)
      .orderBy(sql`${invoices.invoiceNumber} DESC`)
      .limit(1);
    
    if (latest) {
      const lastNumber = parseInt(latest.invoiceNumber.split('-').pop() || '0', 10);
      return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
    }
    return `${prefix}-0001`;
  }
  
  // Invoice item operations
  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(itemData).returning();
    return item;
  }
  
  async getInvoiceItemsByInvoice(invoiceId: string): Promise<InvoiceItem[]> {
    return db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(sql`${invoiceItems.displayOrder} ASC`);
  }
  
  async updateInvoiceItem(id: string, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [item] = await db
      .update(invoiceItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  }
  
  async deleteInvoiceItem(id: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }
  
  async deleteInvoiceItemsByInvoice(invoiceId: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }
  
  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    
    // Update invoice paid amount and status
    const invoice = await this.getInvoice(paymentData.invoiceId);
    if (invoice) {
      const allPayments = await this.getPaymentsByInvoice(paymentData.invoiceId);
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      
      let newStatus = invoice.status;
      if (totalPaid >= invoice.totalAmount) {
        newStatus = '入金済';
      } else if (totalPaid > 0) {
        newStatus = '一部入金';
      }
      
      await this.updateInvoice(paymentData.invoiceId, {
        paidAmount: totalPaid,
        status: newStatus,
        updatedBy: paymentData.createdBy,
      });
    }
    
    return payment;
  }
  
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(sql`${payments.paymentDate} DESC`);
  }
  
  async deletePayment(id: string): Promise<void> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!payment) return;
    
    await db.delete(payments).where(eq(payments.id, id));
    
    // Recalculate invoice paid amount
    const invoice = await this.getInvoice(payment.invoiceId);
    if (invoice) {
      const remainingPayments = await this.getPaymentsByInvoice(payment.invoiceId);
      const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      let newStatus = invoice.status;
      if (totalPaid >= invoice.totalAmount) {
        newStatus = '入金済';
      } else if (totalPaid > 0) {
        newStatus = '一部入金';
      } else if (invoice.status === '入金済' || invoice.status === '一部入金') {
        newStatus = '送付済';
      }
      
      await this.updateInvoice(payment.invoiceId, {
        paidAmount: totalPaid,
        status: newStatus,
      });
    }
  }
}

export const storage = new DatabaseStorage();
