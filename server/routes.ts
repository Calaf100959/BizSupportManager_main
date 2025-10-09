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
      const { engagementType, fields } = req.query;
      let offices = await storage.getAllOffices();
      
      // Filter by engagement type if specified
      if (engagementType && engagementType !== 'all') {
        offices = offices.filter(o => o.engagementType === engagementType);
      }

      // Select only requested fields
      const selectedFields = fields ? (fields as string).split(',') : [];
      const csvData = offices.map(office => {
        const row: any = {};
        selectedFields.forEach(field => {
          row[field] = (office as any)[field] || '';
        });
        return row;
      });

      // Convert to CSV format
      if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=offices.csv');
        res.send('\ufeff' + csv); // Add BOM for Excel
      } else {
        res.status(404).json({ message: "No data to export" });
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
