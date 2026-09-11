# Fixing MyChart's County Field

A working demo of a real redundant-data-entry problem in MyChart's signup
flow: the form asks for city, state, and ZIP code, then still makes you
manually find your county from an unfiltered list of every county in the
country, even though the ZIP code alone determines it.

Two modes, both fully working, not mockups:

- **Current MyChart flow** — replicates the actual problem. Enter any
  address, get handed the full unfiltered ~3,282-county list to search by
  hand. It also doesn't validate your pick against your ZIP, so you can
  (accidentally, like the real flow lets you) confirm a county that doesn't
  match.
- **What I'd change** — same fields, but the county is looked up
  automatically from your ZIP code against a real dataset of ~40,900 active
  U.S. ZIP codes, with a manual override narrowed to just your state (not
  narrowed to zero, in case someone's ZIP is missing or wrong).

No build step, no framework, plain HTML/CSS/JS plus two static JSON data
files.

## Run it locally

This one needs a local server (not just opening the HTML file directly),
since the JSON data loads via `fetch`, which browsers block on `file://`.

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Host it on GitHub Pages

Same process as your other projects:

1. Push this folder's contents to a repo, with `index.html` at the root.
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
3. Live at `https://<username>.github.io/<repo-name>/` shortly after.

## Data source

`data/zip_to_county.json` and `data/all_counties.json` were generated from
the `zipcodes` Python package's underlying dataset (USPS/Census-derived),
trimmed to active U.S. ZIP codes with city, state, and county. Regenerate
or update by re-running the same extraction against a newer release of that
package if the data goes stale.
