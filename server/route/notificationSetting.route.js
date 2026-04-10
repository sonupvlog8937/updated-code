import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  getNotificationSettingsController,
  updateNotificationSettingsController,
} from "../controllers/notificationSetting.controller.js";

const notificationSettingRouter = Router();

notificationSettingRouter.get("/", auth, getNotificationSettingsController);
notificationSettingRouter.put("/", auth, updateNotificationSettingsController);

export default notificationSettingRouter;