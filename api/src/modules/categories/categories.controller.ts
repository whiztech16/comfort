import type { RequestHandler } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import * as service from "./categories.service";

export const listCategories: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await service.listCategories();
  res.setHeader("Cache-Control", "private, max-age=300");
  res.status(200).json({ success: true, message: "OK", data: { items } });
});