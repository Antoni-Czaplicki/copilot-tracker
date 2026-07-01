# Nightly QA Status

- Current time: 2026-07-01 06:50:51 CEST
- Current loop: 29
- State: validation complete; preparing commit/push
- Focus: Dependency/release readiness scan
- Blocker: production Azure login returns `invalid_client`; Docker daemon unavailable; exact deployed commit cannot be proven until build SHA is configured; production health has not yet shown the new `Cache-Control: no-store` header
- Latest change: moved ignored package-level security overrides into `pnpm-workspace.yaml`, refreshed the lockfile, and verified `pnpm audit --prod --audit-level moderate` reports no known vulnerabilities
- Validation: PASS `pnpm audit --prod --audit-level moderate`; PASS `pnpm why postcss --prod` reports only `postcss@8.5.15`; PASS `pnpm -r typecheck`; PASS `pnpm -r lint`; PASS `pnpm test` (109 web + 25 extension); PASS web production build with safe placeholder env; PASS extension compile; PASS extension package
- Next action: commit/push the dependency override fix, smoke production, then start loop 30
- Last known git state: dependency/release readiness fix pending commit on top of `a12045b Improve auth failure alert UX`
- Production target: https://copilot-tracker.antek.page
