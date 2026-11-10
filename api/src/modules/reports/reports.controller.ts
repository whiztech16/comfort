import type { RequestHandler } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { createReportSchema } from "./reports.validation";
import { createReport } from "./reports.service";

export const submitReport: RequestHandler = asyncHandler(async (req, res) => {
  await createReport(req.auth!.userId, createReportSchema.parse(req.body));
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ success: true, message: "Report received", data: {} });
});