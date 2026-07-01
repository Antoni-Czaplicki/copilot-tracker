# Nightly QA Status

- Current time: 2026-07-01 08:27:08 CEST
- Current loop: 43
- State: pushed and CI green
- Focus: Harden source-side `/api/health` freshness headers so deployments expose explicit browser and intermediary cache bypass headers
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header; production Chrome smoke shows auth failure text is safe but `role="alert"` semantics are not live
- Latest completed pushed evidence: `ea2685e Harden health freshness headers`; GitHub Actions CI and Build extension completed successfully
- Next action: continue deployment freshness investigation, especially why production still reports unknown build metadata/missing health cache header/stale provider-error callback behavior
- Production target: https://copilot-tracker.antek.page
