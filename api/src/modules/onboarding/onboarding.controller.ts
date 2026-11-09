import type { RequestHandler } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { onboardingBodySchema } from "./onboarding.validation";
import { completeOnboarding } from "./onboarding.service";

export const onboard: RequestHandler = asyncHandler(async (req, res) => {
    const data = await completeOnboarding(req.auth!.userId, onboardingBodySchema.parse(req.body));
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ success: true, message: "Onboarding completed", data: { user: data } });
});