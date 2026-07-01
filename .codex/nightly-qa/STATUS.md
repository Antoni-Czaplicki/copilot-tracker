# Nightly QA Status

- Current time: 2026-07-01 07:30:57 CEST
- Current loop: 36
- State: validated
- Focus: Preserve sanitized Azure OAuth provider error codes in callback redirects
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header; production Chrome smoke shows auth failure text is safe but `role="alert"` semantics are not live
- Latest pushed commit: `294cf69 Guard extension work item ids`; GitHub Actions completed successfully
- Next action: commit and push the provider-error-code improvement, then smoke production and poll CI
- Production target: https://copilot-tracker.antek.page
