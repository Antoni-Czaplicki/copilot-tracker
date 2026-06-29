ALTER TABLE "sessions" ADD COLUMN "azure_access_token" text;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "azure_refresh_token" text;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "azure_token_expires_at" text;
--> statement-breakpoint
CREATE INDEX "chat_requests_session_id_idx" ON "chat_requests" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX "chat_requests_user_session_id_idx" ON "chat_requests" USING btree ("user_id","session_id");
