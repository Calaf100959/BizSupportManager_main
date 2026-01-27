import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOfficeSchema, 
  insertPersonSchema, 
  insertKarteSchema, 
  insertWorklogSchema,
  insertSubsidyProgramSchema,
  insertOfficeSubsidyRecordSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/user/theme', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const { themeColor } = req.body;
      const validThemes = ["blue", "pink", "aqua", "mint", "purple", "orange", "beige"];
      if (!validThemes.includes(themeColor)) {
        return res.status(400).json({ message: "Invalid theme color" });
      }
      const user = await storage.updateUserTheme(userId, themeColor);
      res.json(user);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Failed to update theme" });
    }
  });

  // Office routes
  app.get('/api/offices', isAuthenticated, async (req, res) => {
    try {
      const { code, name, representative } = req.query;
      const offices = await storage.searchOffices({
        code: code as string,
        name: name as string,
        representative: representative as string,
      });
      res.json(offices);
    } catch (error) {
      console.error("Error searching offices:", error);
      res.status(500).json({ message: "Failed to search offices" });
    }
  });

  app.get('/api/offices/:id', isAuthenticated, async (req, res) => {
    try {
      const office = await storage.getOffice(req.params.id);
      if (!office) {
        return res.status(404).json({ message: "Office not found" });
      }
      res.json(office);
    } catch (error) {
      console.error("Error fetching office:", error);
      res.status(500).json({ message: "Failed to fetch office" });
    }
  });

  app.post('/api/offices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSchema.parse(req.body);
      const office = await storage.createOffice({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(office);
    } catch (error) {
      console.error("Error creating office:", error);
      res.status(400).json({ message: "Failed to create office" });
    }
  });

  app.patch('/api/offices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSchema.partial().parse(req.body);
      const office = await storage.updateOffice(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(office);
    } catch (error) {
      console.error("Error updating office:", error);
      res.status(400).json({ message: "Failed to update office" });
    }
  });

  app.delete('/api/offices/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteOffice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting office:", error);
      res.status(500).json({ message: "Failed to delete office" });
    }
  });

  // Person routes
  app.get('/api/persons/:id', isAuthenticated, async (req, res) => {
    try {
      const person = await storage.getPerson(req.params.id);
      if (!person) {
        return res.status(404).json({ message: "Person not found" });
      }
      res.json(person);
    } catch (error) {
      console.error("Error fetching person:", error);
      res.status(500).json({ message: "Failed to fetch person" });
    }
  });

  app.get('/api/offices/:officeId/persons', isAuthenticated, async (req, res) => {
    try {
      const persons = await storage.getPersonsByOffice(req.params.officeId);
      res.json(persons);
    } catch (error) {
      console.error("Error fetching persons:", error);
      res.status(500).json({ message: "Failed to fetch persons" });
    }
  });

  app.post('/api/persons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPersonSchema.parse(req.body);
      const person = await storage.createPerson({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(person);
    } catch (error) {
      console.error("Error creating person:", error);
      res.status(400).json({ message: "Failed to create person" });
    }
  });

  app.patch('/api/persons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertPersonSchema.partial().parse(req.body);
      const person = await storage.updatePerson(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(person);
    } catch (error) {
      console.error("Error updating person:", error);
      res.status(400).json({ message: "Failed to update person" });
    }
  });

  app.delete('/api/persons/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deletePerson(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting person:", error);
      res.status(500).json({ message: "Failed to delete person" });
    }
  });

  // Karte routes
  app.get('/api/kartes/:id', isAuthenticated, async (req, res) => {
    try {
      const karte = await storage.getKarte(req.params.id);
      if (!karte) {
        return res.status(404).json({ message: "Karte not found" });
      }
      res.json(karte);
    } catch (error) {
      console.error("Error fetching karte:", error);
      res.status(500).json({ message: "Failed to fetch karte" });
    }
  });

  app.get('/api/offices/:officeId/kartes', isAuthenticated, async (req, res) => {
    try {
      const kartes = await storage.getKartesByOffice(req.params.officeId);
      res.json(kartes);
    } catch (error) {
      console.error("Error fetching kartes:", error);
      res.status(500).json({ message: "Failed to fetch kartes" });
    }
  });

  app.get('/api/kartes', isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const kartes = await storage.getKartesByDate(date as string);
      res.json(kartes);
    } catch (error) {
      console.error("Error fetching kartes by date:", error);
      res.status(500).json({ message: "Failed to fetch kartes" });
    }
  });

  app.post('/api/kartes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertKarteSchema.parse(req.body);
      const karte = await storage.createKarte({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(karte);
    } catch (error) {
      console.error("Error creating karte:", error);
      res.status(400).json({ message: "Failed to create karte" });
    }
  });

  app.patch('/api/kartes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertKarteSchema.partial().parse(req.body);
      const karte = await storage.updateKarte(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(karte);
    } catch (error) {
      console.error("Error updating karte:", error);
      res.status(400).json({ message: "Failed to update karte" });
    }
  });

  app.delete('/api/kartes/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteKarte(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting karte:", error);
      res.status(500).json({ message: "Failed to delete karte" });
    }
  });

  // Worklog routes
  app.get('/api/worklogs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.query;
      
      const worklogs = date 
        ? await storage.getWorklogsByDate(date as string)
        : await storage.getWorklogsByUser(userId);
      
      res.json(worklogs);
    } catch (error) {
      console.error("Error fetching worklogs:", error);
      res.status(500).json({ message: "Failed to fetch worklogs" });
    }
  });

  app.post('/api/worklogs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWorklogSchema.parse(req.body);
      const worklog = await storage.createWorklog({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(worklog);
    } catch (error) {
      console.error("Error creating worklog:", error);
      res.status(400).json({ message: "Failed to create worklog" });
    }
  });

  app.patch('/api/worklogs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWorklogSchema.partial().parse(req.body);
      const worklog = await storage.updateWorklog(req.params.id, {
        ...parsed,
        updatedBy: userId,
      });
      res.json(worklog);
    } catch (error) {
      console.error("Error updating worklog:", error);
      res.status(400).json({ message: "Failed to update worklog" });
    }
  });

  app.delete('/api/worklogs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWorklog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting worklog:", error);
      res.status(500).json({ message: "Failed to delete worklog" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/visit-reminders', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getAllOffices();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      const showAll = req.query.all === 'true';
      
      // Get kartes for each office
      const kartesPromises = offices.map(o => storage.getKartesByOffice(o.id));
      const allKartes = await Promise.all(kartesPromises);
      
      // For each office, find the earliest upcoming visit (future or today)
      const reminders: any[] = [];
      allKartes.forEach((kartes, index) => {
        // Filter kartes with nextVisitDate set and not in the past
        const upcomingKartes = kartes.filter(k => {
          if (!k.nextVisitDate) return false;
          const visitDate = new Date(k.nextVisitDate);
          visitDate.setHours(0, 0, 0, 0);
          return visitDate >= today;
        });
        
        if (upcomingKartes.length > 0) {
          // Sort by nextVisitDate and take the earliest one
          upcomingKartes.sort((a, b) => {
            const dateA = new Date(a.nextVisitDate!);
            const dateB = new Date(b.nextVisitDate!);
            return dateA.getTime() - dateB.getTime();
          });
          
          const earliestKarte = upcomingKartes[0];
          reminders.push({
            officeId: offices[index].id,
            officeName: offices[index].name,
            karteId: earliestKarte.id,
            karteTitle: earliestKarte.title,
            visitDate: earliestKarte.visitDate,
            nextAction: earliestKarte.nextAction || "",
            nextVisitDate: earliestKarte.nextVisitDate
          });
        }
      });
      
      // Sort all reminders by nextVisitDate ascending (upcoming visits first)
      reminders.sort((a, b) => {
        const dateA = new Date(a.nextVisitDate);
        const dateB = new Date(b.nextVisitDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Return all reminders if showAll=true, otherwise top 10
      res.json(showAll ? reminders : reminders.slice(0, 10));
    } catch (error) {
      console.error("Error fetching visit reminders:", error);
      res.status(500).json({ message: "Failed to fetch visit reminders" });
    }
  });
  
  app.get('/api/dashboard/activity-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = req.query.period as string || 'week';
      
      const today = new Date();
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate.setMonth(today.getMonth() - 1);
      }
      
      const allWorklogs = await storage.getWorklogsByUser(userId);
      const worklogs = allWorklogs.filter(w => {
        const worklogDate = new Date(w.date);
        return worklogDate >= startDate && worklogDate <= today;
      });
      
      let totalHours = 0;
      worklogs.forEach(w => {
        if (w.duration) {
          const hours = parseFloat(w.duration);
          if (!isNaN(hours)) totalHours += hours;
        }
      });
      
      res.json({
        period,
        visitCount: worklogs.length,
        totalHours: totalHours.toFixed(1),
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error fetching activity summary:", error);
      res.status(500).json({ message: "Failed to fetch activity summary" });
    }
  });
  
  app.get('/api/dashboard/health-snapshot', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getAllOffices();
      
      const kartesPromises = offices.map(o => storage.getKartesByOffice(o.id));
      const allKartes = await Promise.all(kartesPromises);
      
      const today = new Date();
      const healthSnapshot = offices.map((office, index) => {
        const kartes = allKartes[index];
        const lastVisit = kartes.length > 0 ? kartes[0].visitDate : null;
        
        let daysSinceVisit = null;
        let status = 'unknown';
        
        if (lastVisit) {
          const lastVisitDate = new Date(lastVisit);
          daysSinceVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceVisit < 30) status = 'healthy';
          else if (daysSinceVisit < 90) status = 'warning';
          else status = 'critical';
        }
        
        return {
          officeId: office.id,
          officeName: office.name,
          engagementType: office.engagementType,
          lastVisitDate: lastVisit,
          daysSinceVisit,
          status
        };
      });
      
      res.json(healthSnapshot);
    } catch (error) {
      console.error("Error fetching health snapshot:", error);
      res.status(500).json({ message: "Failed to fetch health snapshot" });
    }
  });
  
  // Audit log routes
  app.get('/api/audit-logs/:entityType/:entityId', isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getAuditLogsByEntity(entityType, entityId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  
  // Subsidy program routes
  app.get('/api/subsidy-programs', isAuthenticated, async (req, res) => {
    try {
      const programs = await storage.getAllSubsidyPrograms();
      res.json(programs);
    } catch (error) {
      console.error("Error fetching subsidy programs:", error);
      res.status(500).json({ message: "Failed to fetch subsidy programs" });
    }
  });
  
  app.get('/api/subsidy-programs/:id', isAuthenticated, async (req, res) => {
    try {
      const program = await storage.getSubsidyProgram(req.params.id);
      if (!program) {
        return res.status(404).json({ message: "Subsidy program not found" });
      }
      res.json(program);
    } catch (error) {
      console.error("Error fetching subsidy program:", error);
      res.status(500).json({ message: "Failed to fetch subsidy program" });
    }
  });
  
  app.post('/api/subsidy-programs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Normalize URLs before validation: trim, filter empty, remove duplicates, limit to 5
      const normalizedBody = {
        ...req.body,
        urls: req.body.urls
          ? Array.from(new Set(
              req.body.urls
                .map((url: string) => url.trim())
                .filter((url: string) => url.length > 0)
            )).slice(0, 5)
          : undefined,
      };
      
      // Validate normalized data with schema (strict URL format validation via Zod)
      const result = insertSubsidyProgramSchema.safeParse(normalizedBody);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const program = await storage.createSubsidyProgram({
        ...result.data,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating subsidy program:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch('/api/subsidy-programs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Normalize URLs before validation if present
      const normalizedBody = {
        ...req.body,
        ...(req.body.urls !== undefined && {
          urls: req.body.urls && req.body.urls.length > 0
            ? Array.from(new Set(
                req.body.urls
                  .map((url: string) => url.trim())
                  .filter((url: string) => url.length > 0)
              )).slice(0, 5)
            : undefined
        }),
      };
      
      // Validate normalized data with schema (strict URL format validation via Zod)
      const result = insertSubsidyProgramSchema.partial().safeParse(normalizedBody);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const program = await storage.updateSubsidyProgram(req.params.id, {
        ...result.data,
        updatedBy: userId,
      });
      res.json(program);
    } catch (error) {
      console.error("Error updating subsidy program:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete('/api/subsidy-programs/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSubsidyProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subsidy program:", error);
      res.status(500).json({ message: "Failed to delete subsidy program" });
    }
  });
  
  app.get('/api/subsidy-programs/:id/offices', isAuthenticated, async (req, res) => {
    try {
      const offices = await storage.getOfficesBySubsidyProgram(req.params.id);
      // Return dedicated linkage object with nested office summary
      const linkedOfficeRecords = offices.map(office => ({
        linkageId: office.recordId,  // Unique identifier for this office-subsidy linkage
        status: office.recordStatus,  // Status of the subsidy record for this office
        createdAt: office.createdAt,
        updatedAt: office.updatedAt,
        office: {
          id: office.id,
          code: office.code,
          name: office.name,
          representativeName: office.representativeName,
          engagementType: office.engagementType,
        },
      }));
      res.json(linkedOfficeRecords);
    } catch (error) {
      console.error("Error fetching offices by subsidy program:", error);
      res.status(500).json({ message: "Failed to fetch offices" });
    }
  });
  
  // Office subsidy record routes
  app.get('/api/offices/:officeId/subsidy-records', isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getOfficeSubsidyRecordsByOffice(req.params.officeId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching office subsidy records:", error);
      res.status(500).json({ message: "Failed to fetch office subsidy records" });
    }
  });
  
  app.get('/api/subsidy-records/:id', isAuthenticated, async (req, res) => {
    try {
      const record = await storage.getOfficeSubsidyRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ message: "Subsidy record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching subsidy record:", error);
      res.status(500).json({ message: "Failed to fetch subsidy record" });
    }
  });
  
  app.get('/api/subsidy-records/upcoming-deadlines', isAuthenticated, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 30;
      const records = await storage.getUpcomingDeadlines(daysAhead);
      res.json(records);
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      res.status(500).json({ message: "Failed to fetch upcoming deadlines" });
    }
  });
  
  app.post('/api/subsidy-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSubsidyRecordSchema.parse(req.body);
      const record = await storage.createOfficeSubsidyRecord({
        ...parsed,
        createdBy: userId,
        updatedBy: userId,
      } as any);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating subsidy record:", error);
      res.status(400).json({ message: "Failed to create subsidy record" });
    }
  });
  
  app.patch('/api/subsidy-records/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertOfficeSubsidyRecordSchema.partial().parse(req.body);
      const record = await storage.updateOfficeSubsidyRecord(req.params.id, {
        ...parsed,
        updatedBy: userId,
      } as any);
      res.json(record);
    } catch (error) {
      console.error("Error updating subsidy record:", error);
      res.status(400).json({ message: "Failed to update subsidy record" });
    }
  });
  
  app.delete('/api/subsidy-records/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteOfficeSubsidyRecord(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subsidy record:", error);
      res.status(500).json({ message: "Failed to delete subsidy record" });
    }
  });

  // CSV export route
  app.get('/api/export/offices', isAuthenticated, async (req, res) => {
    try {
      const { code, name, representative, fields } = req.query;
      
      // Use search to filter offices
      const offices = await storage.searchOffices({
        code: code as string,
        name: name as string,
        representative: representative as string,
      });

      // Define field labels in Japanese
      const fieldLabels: Record<string, string> = {
        code: '事業所コード',
        name: '事業所名',
        nameKana: 'フリガナ',
        representativeName: '代表者氏名',
        representativeKana: '代表者フリガナ',
        companyType: '会社区分',
        capital: '資本金',
        corporateNumber: '法人番号',
        invoiceNumber: 'インボイス番号',
        phone1: '電話番号1',
        phone2: '電話番号2',
        phone3: '電話番号3',
        phone4: '電話番号4',
        phone5: '電話番号5',
        representativeMobile: '代表者携帯',
        industry: '業種',
        employees: '従業員数',
        regularEmployees: '正社員数',
        companyCategory: '会社区分',
        engagementType: '関与区分',
        engagementDate: '関与開始日',
        withdrawalDate: '関与終了日',
        withdrawalReason: '関与終了理由',
        closureDate: '廃業日',
        postalCode: '郵便番号',
        address: '住所',
        email: 'メールアドレス',
        website: 'ホームページ',
        bankName: '金融機関名',
        bankBranch: '支店名',
        accountType: '口座種別',
        accountNumber: '口座番号',
        accountHolder: '口座名義',
        notes: '備考'
      };

      // Parse selected fields
      const selectedFields = fields ? (fields as string).split(',') : Object.keys(fieldLabels);

      // Helper function to escape CSV values
      const escapeCsv = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Convert to CSV format
      const headers = selectedFields.map(field => fieldLabels[field] || field).join(',');
      const rows = offices.map(office => 
        selectedFields.map(field => escapeCsv((office as any)[field])).join(',')
      ).join('\n');
      const csv = offices.length > 0 ? `${headers}\n${rows}` : `${headers}\n`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=offices.csv');
      res.send('\ufeff' + csv); // Add BOM for Excel
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // ===== Financial Management API Routes =====
  
  // Financial periods
  app.get('/api/offices/:officeId/financial-periods', isAuthenticated, async (req, res) => {
    try {
      const periods = await storage.getFinancialPeriodsByOffice(req.params.officeId);
      res.json(periods);
    } catch (error) {
      console.error("Error fetching financial periods:", error);
      res.status(500).json({ message: "Failed to fetch financial periods" });
    }
  });
  
  app.get('/api/financial-periods/:id', isAuthenticated, async (req, res) => {
    try {
      const period = await storage.getFinancialPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Financial period not found" });
      }
      res.json(period);
    } catch (error) {
      console.error("Error fetching financial period:", error);
      res.status(500).json({ message: "Failed to fetch financial period" });
    }
  });
  
  app.post('/api/offices/:officeId/financial-periods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = await storage.createFinancialPeriod({
        ...req.body,
        officeId: req.params.officeId,
        createdBy: userId,
        updatedBy: userId,
      });
      res.status(201).json(period);
    } catch (error) {
      console.error("Error creating financial period:", error);
      res.status(400).json({ message: "Failed to create financial period" });
    }
  });
  
  app.patch('/api/financial-periods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = await storage.updateFinancialPeriod(req.params.id, {
        ...req.body,
        updatedBy: userId,
      });
      res.json(period);
    } catch (error) {
      console.error("Error updating financial period:", error);
      res.status(400).json({ message: "Failed to update financial period" });
    }
  });
  
  app.delete('/api/financial-periods/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteFinancialPeriod(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting financial period:", error);
      res.status(500).json({ message: "Failed to delete financial period" });
    }
  });
  
  // Financial accounts (master data)
  app.get('/api/financial-accounts', isAuthenticated, async (req, res) => {
    try {
      const { type } = req.query;
      if (type === 'BS' || type === 'PL') {
        const accounts = await storage.getFinancialAccountsByType(type);
        res.json(accounts);
      } else {
        const accounts = await storage.getAllFinancialAccounts();
        res.json(accounts);
      }
    } catch (error) {
      console.error("Error fetching financial accounts:", error);
      res.status(500).json({ message: "Failed to fetch financial accounts" });
    }
  });
  
  // Balance Sheet entries (with Cache-Control for real-time sync)
  app.get('/api/financial-periods/:periodId/bs', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const entries = await storage.getFinancialBsEntriesByPeriod(req.params.periodId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching BS entries:", error);
      res.status(500).json({ message: "Failed to fetch BS entries" });
    }
  });
  
  app.put('/api/financial-periods/:periodId/bs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = req.body.entries.map((entry: any) => ({
        ...entry,
        periodId: req.params.periodId,
        createdBy: userId,
        updatedBy: userId,
      }));
      const result = await storage.upsertFinancialBsEntries(entries);
      res.json(result);
    } catch (error) {
      console.error("Error upserting BS entries:", error);
      res.status(400).json({ message: "Failed to save BS entries" });
    }
  });
  
  // Profit & Loss entries (with Cache-Control for real-time sync)
  app.get('/api/financial-periods/:periodId/pl', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const entries = await storage.getFinancialPlEntriesByPeriod(req.params.periodId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching PL entries:", error);
      res.status(500).json({ message: "Failed to fetch PL entries" });
    }
  });
  
  app.put('/api/financial-periods/:periodId/pl', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = req.body.entries.map((entry: any) => ({
        ...entry,
        periodId: req.params.periodId,
        createdBy: userId,
        updatedBy: userId,
      }));
      const result = await storage.upsertFinancialPlEntries(entries);
      res.json(result);
    } catch (error) {
      console.error("Error upserting PL entries:", error);
      res.status(400).json({ message: "Failed to save PL entries" });
    }
  });
  
  
  // CSV Import for financial data
  app.post('/api/offices/:officeId/financials/import-csv', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { periodId, statementType, data } = req.body;
      
      if (!periodId || !statementType || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid import data" });
      }
      
      const accounts = await storage.getAllFinancialAccounts();
      const accountByCode = new Map(accounts.map(a => [a.code, a]));
      
      const entries = data
        .filter((row: any) => row.accountCode && row.amount !== undefined)
        .map((row: any) => {
          const account = accountByCode.get(row.accountCode);
          if (!account) return null;
          return {
            periodId,
            accountId: account.id,
            amount: parseInt(row.amount, 10) || 0,
            notes: row.notes || '',
            createdBy: userId,
            updatedBy: userId,
          };
        })
        .filter(Boolean);
      
      if (entries.length === 0) {
        return res.status(400).json({ message: "No valid entries found in CSV" });
      }
      
      let result;
      if (statementType === 'PL') {
        result = await storage.upsertFinancialPlEntries(entries);
      } else if (statementType === 'BS') {
        result = await storage.upsertFinancialBsEntries(entries);
      } else {
        return res.status(400).json({ message: "Invalid statement type" });
      }
      
      res.json({ imported: result.length, total: data.length });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ message: "Failed to import CSV data" });
    }
  });
  
  // Calculate and store cash flow (indirect method)
  app.post('/api/financial-periods/:periodId/calculate-cashflow', isAuthenticated, async (req, res) => {
    try {
      const periodId = req.params.periodId;
      const period = await storage.getFinancialPeriod(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }
      
      const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
      const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
      const accounts = await storage.getAllFinancialAccounts();
      
      const accountById = new Map(accounts.map(a => [a.id, a]));
      
      const getAmountByCode = (entries: typeof plEntries | typeof bsEntries, code: string) => {
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.code === code) return entry.amount;
        }
        return 0;
      };
      
      const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.category === category) {
            total += entry.amount;
          }
        }
        return total;
      };
      
      const netIncome = getAmountsByCategory(plEntries, '売上高') - 
                        getAmountsByCategory(plEntries, '売上原価') - 
                        getAmountsByCategory(plEntries, '販売費及び一般管理費') +
                        getAmountsByCategory(plEntries, '営業外収益') - 
                        getAmountsByCategory(plEntries, '営業外費用') +
                        getAmountsByCategory(plEntries, '特別利益') - 
                        getAmountsByCategory(plEntries, '特別損失') - 
                        getAmountsByCategory(plEntries, '法人税等');
      
      const depreciation = getAmountByCode(plEntries, '4309');
      
      const operatingCashflow = netIncome + depreciation;
      const investingCashflow = 0;
      const financingCashflow = 0;
      const netCashflow = operatingCashflow + investingCashflow + financingCashflow;
      const beginningCash = getAmountByCode(bsEntries, '1101');
      const endingCash = beginningCash + netCashflow;
      
      const cashflow = await storage.upsertFinancialCashflow(periodId, {
        operatingCashFlow: operatingCashflow,
        investingCashFlow: investingCashflow,
        financingCashFlow: financingCashflow,
        netCashChange: netCashflow,
        beginningCash,
        endingCash,
        depreciation,
        netIncome,
      });
      
      res.json(cashflow);
    } catch (error) {
      console.error("Error calculating cashflow:", error);
      res.status(500).json({ message: "Failed to calculate cashflow" });
    }
  });
  
  // Helper function to calculate metrics
  async function calculateMetricsForPeriod(periodId: string) {
    const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
    const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
    const accounts = await storage.getAllFinancialAccounts();
    
    if (plEntries.length === 0 && bsEntries.length === 0) return null;
    
    const accountById = new Map(accounts.map(a => [a.id, a]));
    
    const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
      let total = 0;
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.category === category) total += entry.amount;
      }
      return total;
    };
    
    const sales = getAmountsByCategory(plEntries, '売上高');
    const cogs = getAmountsByCategory(plEntries, '売上原価');
    const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
    const grossProfit = sales - cogs;
    const operatingProfit = grossProfit - sga;
    const ordinaryProfit = operatingProfit + getAmountsByCategory(plEntries, '営業外収益') - getAmountsByCategory(plEntries, '営業外費用');
    const extraordinaryProfit = getAmountsByCategory(plEntries, '特別利益') - getAmountsByCategory(plEntries, '特別損失');
    const taxes = getAmountsByCategory(plEntries, '法人税等');
    const netIncome = ordinaryProfit + extraordinaryProfit - taxes;
    
    const currentAssets = getAmountsByCategory(bsEntries, '流動資産');
    const fixedAssets = getAmountsByCategory(bsEntries, '固定資産');
    const totalAssets = currentAssets + fixedAssets;
    const currentLiabilities = getAmountsByCategory(bsEntries, '流動負債');
    const fixedLiabilities = getAmountsByCategory(bsEntries, '固定負債');
    const totalLiabilities = currentLiabilities + fixedLiabilities;
    const netAssets = getAmountsByCategory(bsEntries, '純資産');
    
    const grossProfitMargin = sales > 0 ? Math.round((grossProfit / sales) * 10000) : 0;
    const operatingProfitMargin = sales > 0 ? Math.round((operatingProfit / sales) * 10000) : 0;
    const ordinaryProfitMargin = sales > 0 ? Math.round((ordinaryProfit / sales) * 10000) : 0;
    const netProfitMargin = sales > 0 ? Math.round((netIncome / sales) * 10000) : 0;
    const currentRatio = currentLiabilities > 0 ? Math.round((currentAssets / currentLiabilities) * 10000) : 0;
    const debtToEquityRatio = netAssets > 0 ? Math.round((totalLiabilities / netAssets) * 10000) : 0;
    const equityRatio = totalAssets > 0 ? Math.round((netAssets / totalAssets) * 10000) : 0;
    const roa = totalAssets > 0 ? Math.round((netIncome / totalAssets) * 10000) : 0;
    const roe = netAssets > 0 ? Math.round((netIncome / netAssets) * 10000) : 0;
    const assetTurnover = totalAssets > 0 ? Math.round((sales / totalAssets) * 10000) : 0;
    
    return storage.upsertFinancialMetrics(periodId, {
      revenue: sales, grossProfit, operatingProfit, ordinaryProfit, netIncome,
      totalAssets, netAssets, totalLiabilities, currentAssets, currentLiabilities,
      grossProfitMargin, operatingProfitMargin, ordinaryProfitMargin, netProfitMargin,
      currentRatio, debtToEquityRatio, equityRatio, roa, roe, assetTurnover,
    });
  }
  
  // Get financial metrics for a period (always recalculate from PL/BS data for real-time sync)
  app.get('/api/financial-periods/:periodId/metrics', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const periodId = req.params.periodId;
      const metrics = await calculateMetricsForPeriod(periodId);
      res.json(metrics || null);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  
  // Helper function to calculate cashflow for a period (always recalculate from PL/BS data)
  async function calculateCashflowForPeriod(periodId: string) {
    const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
    const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
    const accounts = await storage.getAllFinancialAccounts();
    
    if (plEntries.length === 0 && bsEntries.length === 0) return null;
    
    const accountById = new Map(accounts.map(a => [a.id, a]));
    
    const getAmountByCode = (entries: typeof bsEntries, code: string) => {
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.code === code) return entry.amount;
      }
      return 0;
    };
    
    const getAmountsByCategory = (entries: typeof plEntries, category: string) => {
      let total = 0;
      for (const entry of entries) {
        const account = accountById.get(entry.accountId);
        if (account?.category === category) total += entry.amount;
      }
      return total;
    };
    
    const sales = getAmountsByCategory(plEntries, '売上高');
    const cogs = getAmountsByCategory(plEntries, '売上原価');
    const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
    const grossProfit = sales - cogs;
    const operatingProfit = grossProfit - sga;
    const ordinaryProfit = operatingProfit + getAmountsByCategory(plEntries, '営業外収益') - getAmountsByCategory(plEntries, '営業外費用');
    const extraordinaryProfit = getAmountsByCategory(plEntries, '特別利益') - getAmountsByCategory(plEntries, '特別損失');
    const taxes = getAmountsByCategory(plEntries, '法人税等');
    const netIncome = ordinaryProfit + extraordinaryProfit - taxes;
    
    const depreciation = (() => {
      for (const entry of plEntries) {
        const account = accountById.get(entry.accountId);
        if (account?.code === '4309') return entry.amount;
      }
      return 0;
    })();
    
    const operatingCF = netIncome + depreciation;
    const beginningCash = getAmountByCode(bsEntries, '1101');
    
    return storage.upsertFinancialCashflow(periodId, {
      operatingCashFlow: operatingCF,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashChange: operatingCF,
      beginningCash,
      endingCash: beginningCash + operatingCF,
      depreciation,
      netIncome,
    });
  }
  
  // Get financial cashflow for a period (always recalculate from PL/BS data for real-time sync)
  app.get('/api/financial-periods/:periodId/cashflow', isAuthenticated, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const periodId = req.params.periodId;
      const cashflow = await calculateCashflowForPeriod(periodId);
      res.json(cashflow || null);
    } catch (error) {
      console.error("Error fetching cashflow:", error);
      res.status(500).json({ message: "Failed to fetch cashflow" });
    }
  });
  
  // Calculate and store financial metrics
  app.post('/api/financial-periods/:periodId/calculate-metrics', isAuthenticated, async (req, res) => {
    try {
      const periodId = req.params.periodId;
      
      const plEntries = await storage.getFinancialPlEntriesByPeriod(periodId);
      const bsEntries = await storage.getFinancialBsEntriesByPeriod(periodId);
      const accounts = await storage.getAllFinancialAccounts();
      
      const accountById = new Map(accounts.map(a => [a.id, a]));
      
      const getAmountsByCategory = (entries: typeof plEntries | typeof bsEntries, category: string) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account?.category === category) {
            total += entry.amount;
          }
        }
        return total;
      };
      
      const getTotalByCategories = (entries: typeof bsEntries, categories: string[], isDebit: boolean) => {
        let total = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (account && categories.includes(account.category)) {
            total += (account.isDebit === 1) === isDebit ? entry.amount : -entry.amount;
          }
        }
        return total;
      };
      
      const sales = getAmountsByCategory(plEntries, '売上高');
      const cogs = getAmountsByCategory(plEntries, '売上原価');
      const sga = getAmountsByCategory(plEntries, '販売費及び一般管理費');
      const grossProfit = sales - cogs;
      const operatingProfit = grossProfit - sga;
      const ordinaryProfit = operatingProfit + 
                            getAmountsByCategory(plEntries, '営業外収益') - 
                            getAmountsByCategory(plEntries, '営業外費用');
      const netIncome = ordinaryProfit + 
                        getAmountsByCategory(plEntries, '特別利益') - 
                        getAmountsByCategory(plEntries, '特別損失') - 
                        getAmountsByCategory(plEntries, '法人税等');
      
      const totalAssets = getTotalByCategories(bsEntries, ['流動資産', '固定資産'], true);
      const currentAssets = getTotalByCategories(bsEntries, ['流動資産'], true);
      const currentLiabilities = getTotalByCategories(bsEntries, ['流動負債'], false);
      const totalLiabilities = getTotalByCategories(bsEntries, ['流動負債', '固定負債'], false);
      const netAssets = getTotalByCategories(bsEntries, ['純資産'], false);
      
      const grossProfitMargin = sales > 0 ? Math.round((grossProfit / sales) * 10000) : 0;
      const operatingProfitMargin = sales > 0 ? Math.round((operatingProfit / sales) * 10000) : 0;
      const netProfitMargin = sales > 0 ? Math.round((netIncome / sales) * 10000) : 0;
      const currentRatio = currentLiabilities > 0 ? Math.round((currentAssets / currentLiabilities) * 10000) : 0;
      const debtToEquityRatio = netAssets > 0 ? Math.round((totalLiabilities / netAssets) * 10000) : 0;
      const equityRatio = totalAssets > 0 ? Math.round((netAssets / totalAssets) * 10000) : 0;
      const roa = totalAssets > 0 ? Math.round((netIncome / totalAssets) * 10000) : 0;
      const roe = netAssets > 0 ? Math.round((netIncome / netAssets) * 10000) : 0;
      const assetTurnover = totalAssets > 0 ? Math.round((sales / totalAssets) * 10000) : 0;
      
      const metrics = await storage.upsertFinancialMetrics(periodId, {
        revenue: sales,
        grossProfit,
        operatingProfit,
        ordinaryProfit,
        netIncome,
        totalAssets,
        netAssets,
        totalLiabilities,
        currentAssets,
        currentLiabilities,
        grossProfitMargin,
        operatingProfitMargin,
        netProfitMargin,
        currentRatio,
        debtToEquityRatio,
        equityRatio,
        roa,
        roe,
        assetTurnover,
      });
      
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating metrics:", error);
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
