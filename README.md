# FlavorFlow

Food-discovery and ordering demo built with **Expo** (iOS · Android · **web**).

## Live demo (web)

### Render (Blueprint)

**https://exs-d7r3799kh4rs73ejt7rg.onrender.com**

If you rename the service in the Render dashboard, use `https://<that-name>.onrender.com` instead.

1. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect the GitHub repo and select this branch (`main`).
3. Render reads [`render.yaml`](render.yaml): `npm ci && npm run build`, static publish **`dist`**.

Use **Node 20+** (see `engines` in `package.json`). Do **not** set `GITHUB_PAGES_BASE_PATH` for Render—the app must stay at `/` on the hostname.

### GitHub Pages

After you enable Pages (see below), the static web build is also served at:

**https://prekshaaggarwal.github.io/FlavorFlow/**

(Asset paths use your repo name; the Actions workflow sets `GITHUB_PAGES_BASE_PATH` from the repository automatically.)

#### Turn on GitHub Pages

1. Repo **Settings → Pages**.
2. **Build and deployment**: source **GitHub Actions** (not “Deploy from a branch”).
3. Push to `main` or run workflow **Deploy web demo → Run workflow**.

The first deploy will **fail** until step 2 is done; after that, open **Actions**, select the failed **Deploy web demo** run, and click **Re-run all jobs**.

The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs `expo export` and publishes the `dist` folder. A `.nojekyll` file is added so folders like `_expo/` are served (Jekyll would ignore them otherwise).

### “404 · There isn't a GitHub Pages site here”

That screen means GitHub hasn’t published anything **yet**, or you’re on the wrong address.

1. **Use the full project URL**, not only `github.io`:
   `https://prekshaaggarwal.github.io/FlavorFlow/`  
   Opening `https://prekshaaggarwal.github.io/` (no repo name) will 404.

2. **Confirm Pages source** — [FlavorFlow → Settings → Pages](https://github.com/prekshaaggarwal/FlavorFlow/settings/pages): **Build** must be **GitHub Actions**.

3. **Confirm the workflow succeeded** — [Actions → Deploy web demo](https://github.com/prekshaaggarwal/FlavorFlow/actions/workflows/deploy-pages.yml).  
   Fix any red run, then wait 1–3 minutes after a green deploy and hard-refresh (`Ctrl+F5`).

### Stop `cursoragent` from appearing as a contributor

Cursor keeps appending **`Co-authored-by: Cursor <cursoragent@cursor.com>`** to commits unless you disable that in Cursor.

Enable this repo hook once (Terminal in the project folder):

```bash
git config core.hooksPath .githooks
```

After that, commits that include Cursor’s trailer are **blocked** until you amend the message.

Also turn **off** Cursor’s Git “co-author / trailer” feature in **Cursor Settings** (search for *commit*, *co-author*, or *trailer*).

## Run locally

```bash
npm install
npm run web       # Expo web dev server
npm start         # Expo dev hub
npm run api       # Optional Node API on :8787 — see server/.env.example
```

## Environment

See [`.env.example`](.env.example) (app) and [`server/.env.example`](server/.env.example) (API). For Google Sign-In, add authorized JavaScript origins for **localhost**, your **GitHub Pages** URL, and your **Render** `https://…onrender.com` URL.
