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

## Custom domain (optional)

If you own a domain and want this at something like `breathe.yourdomain.com`
instead of the workers.dev URL, that's a few clicks in the Cloudflare dashboard
under Workers & Pages → your project → Custom Domains. Ask me if you want the
exact walkthrough once you're at that point.

## Local preview before deploying

If you want to see it in a real browser before pushing it live:
```
npm run dev
```
Opens at http://localhost:5173 with hot-reload as you edit.
