# Morning Breath — deploy to Cloudflare

This is the breathing-routine app, set up as a normal buildable React project so it
can be deployed to Cloudflare Workers (Cloudflare's current home for static sites —
it replaced the old "Pages" product for new projects).

## What's in here

```
breathflow-site/
├── index.html          entry HTML
├── src/
│   ├── App.jsx          the full app (your component)
│   └── main.jsx          mounts App into the page
├── worker/
│   └── index.js          tiny API that saves/loads your breath-hold
│                          history to Cloudflare KV
├── package.json
├── vite.config.js        build tool config
└── wrangler.jsonc        Cloudflare deploy config
```

## One-time setup

You need Node.js installed (v18+). Check with `node -v`. If you don't have it,
grab it from nodejs.org — Cloudflare's tooling runs on it.

1. Unzip this folder somewhere and open a terminal in it.
2. Install dependencies:
   ```
   npm install
   ```
3. Log in to Cloudflare (opens a browser window to authorize):
   ```
   npx wrangler login
   ```
   If you don't have a Cloudflare account yet, it'll prompt you to create one —
   free tier is enough for this.

### Create the KV namespace (required, one-time)

Your best/last breath-hold time is saved to Cloudflare KV — a small key-value
store — so it survives a page refresh or a new device. Before your first
deploy, you need to create that store and tell `wrangler.jsonc` where it is:

```
npx wrangler kv namespace create HOLD_HISTORY
```

This prints something like:

```
🌀 Creating namespace with title "morning-breath-HOLD_HISTORY"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{
  "kv_namespaces": [
    {
      "binding": "HOLD_HISTORY",
      "id": "a1b2c3d4e5f6..."
    }
  ]
}
```

Open `wrangler.jsonc` and replace `REPLACE_WITH_YOUR_NAMESPACE_ID` with the
`id` value it just gave you. That's the only edit you ever need to make to
`wrangler.jsonc` — everything else is already set up.

If you skip this step, the app still works, it just won't remember your
breath-hold history between visits (each save will quietly fail and fall back
to "this session only," with a small notice after the hold).

## Deploy

```
npm run deploy
```

This builds the app and pushes it to Cloudflare Workers in one step. The first
time you run it, Wrangler may ask you to confirm the project name (already set
to `morning-breath` in `wrangler.jsonc`, so you can just confirm).

When it finishes, it prints a live URL — something like:

```
https://morning-breath.<your-subdomain>.workers.dev
```

That's your app, live, on Cloudflare's global network. Open it on your phone,
add it to your home screen, and it behaves like a standalone app.

## Updating later

Whenever you want to change something (tweak the routine, fix a typo, adjust a
sound), edit `src/App.jsx` and run `npm run deploy` again. Same command, every
time — it rebuilds and redeploys in a few seconds.

## About your saved breath-hold history

Your hold times are stored in one shared spot in Cloudflare KV — there's no
login, so this is set up for a single person using the site (you). If you ever
share the URL with someone else, they'd see and add to the same history rather
than getting their own. That's fine for personal use; flag it if that ever
needs to change and the save logic would need a rework to keep people's data
separate.

## Custom domain (optional)

If you own a domain and want this at something like `breathe.yourdomain.com`
instead of the workers.dev URL, that's a few clicks in the Cloudflare dashboard
under Workers & Pages → your project → Custom Domains. Ask me if you want the
exact walkthrough once you're at that point.

## Local preview before deploying

```
npm run dev
```
Opens at http://localhost:5173 with hot-reload as you edit. Good for checking
layout and the exercises themselves, but the save-your-breath-hold feature
won't work here — this only runs the front end, not the API.

To test the whole thing locally, including saving and loading your breath-hold
history, build first and then run Wrangler's dev server instead:
```
npm run build
npx wrangler dev
```
This runs the real Worker + API locally (using a local, throwaway copy of KV,
so it won't touch your real saved data) at http://localhost:8787.
