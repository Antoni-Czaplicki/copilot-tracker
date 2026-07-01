# Nightly QA Status

- Current time: 2026-07-01 07:06:07 CEST
- Current loop: 32
- State: validation complete; preparing commit/push
- Focus: Azure DevOps work-item upstream response hardening
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header
- Latest pushed commit: `f2ab551 Normalize work item picker results`; GitHub Actions completed successfully
- Latest change: hardened Azure DevOps work-item successful response parsing so malformed JSON becomes a typed `azure_devops_bad_response` 502 and invalid upstream IDs/items are filtered
- Validation: PASS `pnpm --filter @copilot-tracker/web test` (117 tests); PASS web typecheck/lint; PASS `pnpm -r typecheck`; PASS `pnpm -r lint`; PASS `pnpm test` (117 web + 25 extension); PASS web production build with safe placeholder env; PASS extension compile
- Next action: commit/push the Azure DevOps response hardening fix, smoke production, then continue loop 33
- Production target: https://copilot-tracker.antek.page
