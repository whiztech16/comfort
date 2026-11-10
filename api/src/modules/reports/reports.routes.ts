import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { submitReport } from "./reports.controller";

export const reportsRouter = Router();

reportsRouter.post("/", authenticate, userLimiter(10, 60 * 60 * 1000), requireOnboarded, submitReport);