import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { requireOnboarded } from "../../middleware/require-onboarded";
import { userLimiter } from "../../shared/http/user-limiter";
import { listCategories } from "./categories.controller";

export const categoriesRouter = Router();

categoriesRouter.get("/", authenticate, userLimiter(120, 15 * 60 * 1000), requireOnboarded, listCategories);