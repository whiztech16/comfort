import { ApiError } from "../../shared/errors";
import { findVisiblePostAuthor } from "../posts/posts.repository";
import type { CreateReportInput } from "./reports.validation";
import * as repo from "./reports.repository";

const notFound = () => new ApiError(404, "NOT_FOUND", "Report target not found");

async function resolveTarget(reporterId: string, input: CreateReportInput) {
  switch (input.targetType) {
    case "post": {
      const authorId = await findVisiblePostAuthor(input.targetId, reporterId);
      if (!authorId) throw notFound();
      return { targetId: input.targetId, reportedUserId: authorId };
    }
    case "comfort": {
      const senderId = await repo.findComfortSender(input.targetId, reporterId);
      if (!senderId) throw notFound();
      return { targetId: input.targetId, reportedUserId: senderId };
    }
    case "message": {
      const senderId = await repo.findMessageSender(input.targetId, reporterId);
      if (!senderId) throw notFound();
      return { targetId: input.targetId, reportedUserId: senderId };
    }
    case "user": {
      const user = await repo.findReportableUser(input.username);
      if (!user || (user.userId !== reporterId && !user.discoverable)) throw notFound();
      return { targetId: user.userId, reportedUserId: user.userId };
    }
  }
}

export async function createReport(reporterId: string, input: CreateReportInput) {
  if (input.reason === "other" && !input.description) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
      { path: "description", message: "Please describe the problem" },
    ]);
  }

  const { targetId, reportedUserId } = await resolveTarget(reporterId, input);

  if (reportedUserId === reporterId) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid request", [
      { path: "target", message: "You can't report yourself or your own content" },
    ]);
  }

  await repo.insertReport({
    reporterId,
    reportedUserId,
    targetType: input.targetType,
    targetId,
    reason: input.reason,
    description: input.description ? input.description : null,
  });
}