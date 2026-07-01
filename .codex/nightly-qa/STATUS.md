# Nightly QA Status

- Current time: 2026-07-01 06:44:23 CEST
- Current loop: 28
- State: validation passed; preparing commit
- Focus: Auth failure UX prominence
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header
- Next action: update QA logs, commit/push auth failure alert polish, then smoke production and poll CI/deploy freshness
- Last known git state: shared route JSON payload parsing pushed at `72438f5 Share route JSON payload parsing`
- Production target: https://copilot-tracker.antek.page
