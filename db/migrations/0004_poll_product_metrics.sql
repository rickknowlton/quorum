ALTER TABLE "polls" ADD COLUMN "created_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "organizer_link_copied_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "organizer_link_open_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "polls" SET "created_anonymous" = true WHERE "owner_user_id" IS NULL;
