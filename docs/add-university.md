# Adding a University Slice

This runbook covers the full pipeline for adding a new university to RepoPulse's Universities tab. The pipeline has three stages:

1. **Repo discovery** — repofinder scrapes GitHub and produces a list of repos affiliated with the university
2. **Health scoring** — `score-university.ts` runs each repo through RepoPulse's analysis pipeline
3. **Publish** — push the scored JSON to the repofinder fork so the app can fetch it

## Prerequisites

| Requirement | Notes |
|---|---|
| `../repofinder` cloned | The fork at [arun-gupta/repofinder](https://github.com/arun-gupta/repofinder), `repo-pulse-integration` branch checked out |
| Python ≥ 3.10 + `pip install -r requirements.txt` | Run inside `workspaces/repofinder/` |
| `GITHUB_TOKEN` in `repofinder/.env` | Used by the scraper; needs `public_repo` scope |
| `GITHUB_TOKEN_1` env var | Used by `score-university.ts`; needs `public_repo` scope |
| RepoPulse dev server running on port 3000 | `npm run dev` inside `workspaces/repo-pulse/` |

## Stage 1 — Repo discovery (repofinder)

All steps in this stage run inside the **forked** repofinder repo at [arun-gupta/repofinder](https://github.com/arun-gupta/repofinder), on the `repo-pulse-integration` branch — not the upstream repofinder repo.

```bash
cd workspaces/repofinder        # the fork
git checkout repo-pulse-integration
```

### 1a. Check whether a config already exists

Config files for all UC campuses are pre-built:

```
repofinder/config/config_ucb.json   # UC Berkeley
repofinder/config/config_ucd.json   # UC Davis
repofinder/config/config_uci.json   # UC Irvine
repofinder/config/config_ucla.json  # UCLA
repofinder/config/config_ucm.json   # UC Merced
repofinder/config/config_ucr.json   # UC Riverside
repofinder/config/config_ucsb.json  # UC Santa Barbara
repofinder/config/config_ucsc.json  # UC Santa Cruz (already scored)
repofinder/config/config_ucsd.json  # UC San Diego
repofinder/config/config_ucsf.json  # UC San Francisco
```

For a university not on this list, create `config/config_{ACRONYM}.json`:

```json
{
  "UNIVERSITY_NAME": "University of California, Los Angeles",
  "UNIVERSITY_ACRONYM": "UCLA",
  "UNIVERSITY_LOCATION": "Los Angeles",
  "UNIVERSITY_EMAIL_DOMAIN": "ucla.edu",
  "UNIVERSITY_WEBSITE_URL": "ucla.edu",
  "ADDITIONAL_QUERIES": ["UC Los Angeles"]
}
```

### 1b. Run the scraper

From `workspaces/repofinder/`, pass the acronym directly via Python's `-c` flag:

```bash
python -c "from main_scraping_minimal import scrape_minimal; scrape_minimal(['UCLA'])"
```

Replace `UCLA` with your university's acronym (must match the config filename, e.g. `UCSB` for `config_ucsb.json`).

This takes 10–30 minutes depending on the size of the university. It writes intermediate JSON files to `Data/json/` and a SQLite database to `Data/db/`.

### 1c. Export the repo list

```bash
python export.py --acronym UCLA --predictor sbc --data-dir exports/universities
```

- `--predictor sbc` uses the keyword/heuristic classifier (no LLM or extra API key needed). Use `--predictor gpt` if you have an OpenAI key and want higher-precision affiliation scoring.
- `--threshold` (default 0.5) controls the minimum affiliation score. Lower values include more repos; higher values are stricter.

This writes `exports/universities/ucla.json` — a list of `{full_name, university, affiliation_score}` objects.

**Verify the output looks reasonable:**

```bash
python -c "import json; d=json.load(open('exports/universities/ucla.json')); print(len(d), 'repos'); print(d[0])"
```

## Stage 2 — Health scoring (repo-pulse)

The scoring script reads the repo list from the live repofinder fork URL, so push the discovery output first:

```bash
# From workspaces/repofinder/
git add exports/universities/ucla.json
git commit -m "feat(universities): add UCLA repo list"
git push origin repo-pulse-integration
```

Then run the scorer from `workspaces/repo-pulse/` with the dev server running:

```bash
GITHUB_TOKEN_1=ghp_... npx tsx scripts/score-university.ts \
  --slug ucla \
  --repofinder-dir ../repofinder
```

**Key flags:**

| Flag | Default | Notes |
|---|---|---|
| `--slug` | `ucsc` | Must match the filename in `exports/universities/{slug}.json` |
| `--batch-size` | `25` | Repos per `/api/analyze` call; lower if you hit rate limits |
| `--offset` | `0` | Resume a partial run from this repo index |
| `--limit` | (none) | Score only N repos; useful for testing |
| `--repofinder-dir` | `../repofinder` | Path to the repofinder checkout |

**Large universities (> 500 repos):** Run in batches using `--offset` to avoid hitting GitHub rate limits in a single session:

```bash
# Batch 1: repos 0–499
GITHUB_TOKEN_1=ghp_... npx tsx scripts/score-university.ts --slug ucla --limit 500 --repofinder-dir ../repofinder

# Batch 2: repos 500–999
GITHUB_TOKEN_1=ghp_... npx tsx scripts/score-university.ts --slug ucla --offset 500 --limit 500 --repofinder-dir ../repofinder
```

The script merges batches automatically — re-running with a different `--offset` appends to the existing `{slug}-scored.json` without duplicating repos.

When complete, `exports/universities/ucla-scored.json` and an updated `manifest.json` are written to the repofinder checkout.

## Stage 3 — Publish

```bash
# From workspaces/repofinder/
git add exports/universities/ucla-scored.json exports/universities/manifest.json
git commit -m "feat(universities): add UCLA scored data (N repos)"
git push origin repo-pulse-integration
```

The app fetches the manifest with a 1-hour cache (`next: { revalidate: 3600 }`), so the new university card will appear within an hour of the push — or immediately on the next cold start.

## Verifying

1. Open the dev server at `http://localhost:3000`
2. Click the **Universities** tab
3. The new university card should appear in the grid
4. Click it — the summary stats and repo table should load
5. If Ask AI is enabled, try a starter chip to confirm the chat context serializes correctly

## Troubleshooting

**Scraper finds very few repos** — try lowering `--threshold` in the export step, or check that the config's `UNIVERSITY_EMAIL_DOMAIN` and `ADDITIONAL_QUERIES` are broad enough.

**`score-university.ts` fails on a batch** — use `--offset` to skip past the failing repos. Failed repos are recorded in `{slug}-scored.json` under `failures` and excluded from the health table.

**University doesn't appear in the app** — confirm `manifest.json` was updated and pushed. The manifest is what the app reads to build the university grid.
