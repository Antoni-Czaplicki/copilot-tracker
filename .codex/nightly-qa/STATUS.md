# Nightly QA Status

- Current time: 2026-07-01 05:10:10 CEST
- Current loop: 4
- State: local validation passed; preparing commit
- Focus: Chat request batch merge/dedupe/token normalization coverage
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured
- Next action: commit/push `chatRequestMerge`, smoke production, then continue with the next gap
- Last known git state: WorkItemPicker helper coverage pushed at `91fb8d3 Add work item picker coverage`; local chat request merge tests added but not committed
- Production target: https://copilot-tracker.antek.page
