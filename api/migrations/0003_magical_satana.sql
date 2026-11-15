CREATE TYPE "public"."post_visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "visibility" "post_visibility" DEFAULT 'public' NOT NULL;