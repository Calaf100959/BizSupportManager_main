import {
  users,
  offices,
  persons,
  kartes,
  worklogs,
  auditLogs,
  subsidyPrograms,
  officeSubsidyRecords,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  async createOfficeSubsidyRecord(recordData: InsertOfficeSubsidyRecord): Promise<OfficeSubsidyRecord> {
    const [record] = await db.insert(officeSubsidyRecords).values(recordData).returning();
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
}

export const storage = new DatabaseStorage();
