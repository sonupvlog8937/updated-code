import { Router } from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import {
  // Synonym routes
  createSynonymController,
  updateSynonymController,
  deleteSynonymController,
  getAllSynonymsController,
  getSynonymByIdController,
  toggleSynonymController,
  bulkImportSynonymsController,
  // Stop word routes
  createStopWordController,
  updateStopWordController,
  deleteStopWordController,
  getAllStopWordsController,
  getStopWordByIdController,
  toggleStopWordController,
  bulkImportStopWordsController,
  // Settings routes
  createSettingController,
  updateSettingController,
  updateSettingByIdController,
  deleteSettingController,
  getAllSettingsController,
  getSettingsByCategoryController,
  getSettingByIdController,
  toggleSettingController,
  bulkUpsertSettingsController,
  initializeDefaultSettingsController,
} from "../controllers/searchSettings.controller.js";

const searchSettingsRouter = Router();

// All routes require authentication and admin role
searchSettingsRouter.use(auth);
searchSettingsRouter.use(authorizeRole("ADMIN"));

// ═══════════════════════════════════════════════════════════════════
// Synonym Management Routes
// ═══════════════════════════════════════════════════════════════════

searchSettingsRouter.post("/synonyms", createSynonymController);
searchSettingsRouter.get("/synonyms", getAllSynonymsController);
searchSettingsRouter.get("/synonyms/:id", getSynonymByIdController);
searchSettingsRouter.put("/synonyms/:id", updateSynonymController);
searchSettingsRouter.delete("/synonyms/:id", deleteSynonymController);
searchSettingsRouter.patch("/synonyms/:id/toggle", toggleSynonymController);
searchSettingsRouter.post("/synonyms/bulk-import", bulkImportSynonymsController);

// ═══════════════════════════════════════════════════════════════════
// Stop Word Management Routes
// ═══════════════════════════════════════════════════════════════════

searchSettingsRouter.post("/stop-words", createStopWordController);
searchSettingsRouter.get("/stop-words", getAllStopWordsController);
searchSettingsRouter.get("/stop-words/:id", getStopWordByIdController);
searchSettingsRouter.put("/stop-words/:id", updateStopWordController);
searchSettingsRouter.delete("/stop-words/:id", deleteStopWordController);
searchSettingsRouter.patch("/stop-words/:id/toggle", toggleStopWordController);
searchSettingsRouter.post("/stop-words/bulk-import", bulkImportStopWordsController);

// ═══════════════════════════════════════════════════════════════════
// Search Settings Management Routes
// ═══════════════════════════════════════════════════════════════════

searchSettingsRouter.post("/settings", createSettingController);
searchSettingsRouter.get("/settings", getAllSettingsController);
searchSettingsRouter.get("/settings/category/:category", getSettingsByCategoryController);
searchSettingsRouter.get("/settings/:id", getSettingByIdController);
searchSettingsRouter.put("/settings/key/:key", updateSettingController);
searchSettingsRouter.put("/settings/:id", updateSettingByIdController);
searchSettingsRouter.delete("/settings/:id", deleteSettingController);
searchSettingsRouter.patch("/settings/:id/toggle", toggleSettingController);
searchSettingsRouter.post("/settings/bulk-upsert", bulkUpsertSettingsController);
searchSettingsRouter.post("/settings/initialize-defaults", initializeDefaultSettingsController);

export default searchSettingsRouter;
