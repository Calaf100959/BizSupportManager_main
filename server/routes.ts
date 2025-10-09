import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOfficeSchema, 
  insertPersonSchema, 
  insertKarteSchema, 
  insertWorklogSchema 
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

  const httpServer = createServer(app);

  return httpServer;
}
