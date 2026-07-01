# Nightly QA Status

- Current time: 2026-07-01 07:34:22 CEST
- Current loop: 37
- State: validated
- Focus: Align web work-item picker ID filtering with backend/extension bounds
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header; production Chrome smoke shows auth failure text is safe but `role="alert"` semantics are not live
- Latest pushed commit: `4538973 Preserve Azure provider auth codes`; GitHub Actions completed successfully
- Next action: commit and push the WorkItemPicker ID-bound parity fix, then smoke production and poll CI/deploy
- Production target: https://copilot-tracker.antek.page
