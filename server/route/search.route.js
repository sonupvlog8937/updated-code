import { Router } from "express";
import auth from "../middlewares/auth.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import searchRateLimit from "../middlewares/searchRateLimit.js";
import {
  validateSearchQuery,
  validateSuggestionsQuery,
  validateTopSearchQuery,
  validateHistoryBody,
  validateRecentDelete,
} from "../middlewares/searchValidation.js";
import {
  searchController,
  suggestionsController,
  topSearchesController,
  recentSearchesController,
  createHistoryController,
  deleteRecentController,
  clearRecentController,
  analyticsController,
  voiceSearchController,
} from "../controllers/search.controller.js";

const searchRouter = Router();

searchRouter.use(searchRateLimit);

searchRouter.get("/", optionalAuth, validateSearchQuery, searchController);
searchRouter.get("/suggestions", optionalAuth, validateSuggestionsQuery, suggestionsController);
searchRouter.get("/top", validateTopSearchQuery, topSearchesController);
searchRouter.get("/recent", auth, recentSearchesController);
searchRouter.post("/history", optionalAuth, validateHistoryBody, createHistoryController);
searchRouter.delete("/recent", auth, validateRecentDelete, deleteRecentController);
searchRouter.delete("/recent/all", auth, clearRecentController);
searchRouter.get("/analytics", auth, authorizeRole("ADMIN"), analyticsController);
searchRouter.post("/voice", optionalAuth, voiceSearchController);

export default searchRouter;
