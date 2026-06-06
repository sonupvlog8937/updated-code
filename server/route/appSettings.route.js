import express from "express";
import auth from "../middlewares/auth.js";
import authorizeRole from "../middlewares/authorizeRole.js";
import { getCommerceSettings, updateCommerceSettings } from "../controllers/appSettings.controller.js";
const router = express.Router();
router.get("/commerce", getCommerceSettings);
router.put("/commerce", auth, authorizeRole("ADMIN"), updateCommerceSettings);
export default router;
