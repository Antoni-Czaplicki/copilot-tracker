CREATE TABLE "chat_requests" (
	"request_record_id" text PRIMARY KEY NOT NULL,
	"request_id" text,
	"response_id" text,
	"session_id" text NOT NULL,
	"session_title" text,
	"session_created_at" text,
	"request_started_at" text,
	"request_completed_at" text,
	"model_id" text,
	"resolved_model" text,
	"model_name" text,
	"model_vendor" text,
	"model_family" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"token_source" text NOT NULL,
	"prompt_token_details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tool_call_round_count" integer DEFAULT 0 NOT NULL,
	"stop_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"captured_at" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_path" text,
	"workspace_name" text,
	"repository_root" text,
	"repository_remote_url" text,
	"branch" text,
	"default_task" text,
	"selected_task" text,
	"github_login" text,
	"github_id" bigint
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"github_id" bigint NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" text NOT NULL,
	"user" text NOT NULL,
	"vscode_version" text NOT NULL,
	"extension_version" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_path" text,
	"workspace_name" text,
	"repository_root" text,
	"repository_remote_url" text,
	"branch" text,
	"default_task" text,
	"selected_task" text,
	"payload" jsonb,
	"github_login" text,
	"github_id" bigint
);
--> statement-breakpoint
CREATE TABLE "users" (
	"github_id" bigint PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"email" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" text NOT NULL,
	"last_seen_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_github_id_users_github_id_fk" FOREIGN KEY ("github_id") REFERENCES "public"."users"("github_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_github_id_users_github_id_fk" FOREIGN KEY ("github_id") REFERENCES "public"."users"("github_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_events" ADD CONSTRAINT "tracker_events_github_id_users_github_id_fk" FOREIGN KEY ("github_id") REFERENCES "public"."users"("github_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_requests_github_id_idx" ON "chat_requests" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "chat_requests_workspace_id_idx" ON "chat_requests" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "chat_requests_selected_task_idx" ON "chat_requests" USING btree ("selected_task");--> statement-breakpoint
CREATE INDEX "chat_requests_captured_at_idx" ON "chat_requests" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX "sessions_github_id_idx" ON "sessions" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "tracker_events_github_id_idx" ON "tracker_events" USING btree ("github_id");--> statement-breakpoint
CREATE INDEX "tracker_events_workspace_id_idx" ON "tracker_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "tracker_events_timestamp_idx" ON "tracker_events" USING btree ("timestamp");