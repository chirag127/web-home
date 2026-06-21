---
type: index
title: "home-app — knowledge bundle"
description: "App-specific knowledge for oriz.in home-app. Cross-cutting family rules live at master `c:/D/oriz/knowledge/`."
tags: [okf, index, app, home]
timestamp: 2026-06-21
format_version: okf-v0.1
status: active
---

# home-app — knowledge bundle

This is the per-app OKF-light bundle for **oriz.in** (the family home / anchor). App-specific facts only. Cross-cutting family rules / decisions / services live at master [`../../../../knowledge/`](../../../../knowledge/).

## Subdirs

- [`decisions/`](./decisions/) — app-specific architectural / naming / stack decisions
  - [`anchor-patterns.md`](./decisions/anchor-patterns.md) — Family-anchor v2 design reference: how `oriz-home` sets the dark-surface + mustard-yellow patterns that other 10 sites adopt when implementing their v2 designs.
- [`runbooks/`](./runbooks/) — operational procedures specific to this app
- [`services/`](./services/) — external services used only by this app

## App snapshot

- **Subdomain**: `https://oriz.in` (apex)
- **Category**: hub (family anchor)
- **Family role**: oriz.in family-wide landing + AdSense apex + cross-promo for every sibling site.

## Cross-refs

- Family rules → [`master knowledge/rules/`](../../../../knowledge/rules/)
- Family decisions → [`master knowledge/decisions/`](../../../../knowledge/decisions/)
- 15 family packages → [`master knowledge/architecture/the-six-packages.md`](../../../../knowledge/architecture/the-six-packages.md)
- 8 hard rules → [`master AGENTS.md`](../../../../AGENTS.md)
