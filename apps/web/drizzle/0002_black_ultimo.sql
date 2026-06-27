CREATE TABLE "github_copilot_billing_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"scope_type" text NOT NULL,
	"scope" text NOT NULL,
	"date" text NOT NULL,
	"product" text,
	"sku" text,
	"quantity" text,
	"unit_type" text,
	"gross_amount" text,
	"discount_amount" text,
	"net_amount" text,
	"raw" jsonb NOT NULL,
	"fetched_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "github_copilot_billing_usage_scope_idx" ON "github_copilot_billing_usage" USING btree ("scope_type","scope");--> statement-breakpoint
CREATE INDEX "github_copilot_billing_usage_date_idx" ON "github_copilot_billing_usage" USING btree ("date");