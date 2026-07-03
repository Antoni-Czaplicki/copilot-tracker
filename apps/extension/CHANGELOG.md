# Change Log

All notable changes to the "copilot-tracker" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Share received OTLP records across VS Code windows through a persistent
  spool file, so windows that cannot bind the local OTLP port still track
  their own Copilot usage and token stats survive window reloads.
- Retry binding the local OTLP receiver port instead of failing permanently
  when another window (or a restarting extension host) still holds it.
- Switch tracking to GitHub Copilot Chat OpenTelemetry JSONL ingestion.
- Initial release
