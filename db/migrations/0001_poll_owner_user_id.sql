ALTER TABLE "polls" ADD COLUMN "owner_user_id" text;--> statement-breakpoint
CREATE INDEX "polls_owner_user_id_idx" ON "polls" USING btree ("owner_user_id");