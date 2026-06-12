# Claude handoff

This folder is ready to import into Claude or any local editor as a Vite React project.

## Goal
Deploy a single-page Monte Carlo finance app to GitHub Pages for:

`Shaos94/mcpassiveetfvstrader`

## Already configured
- Vite base path: `/mcpassiveetfvstrader/`
- GitHub Actions workflow for Pages deployment
- Static React app
- No external icon dependency

## If Claude edits the UI
Keep these constraints:
- Must stay a single-page app
- Must remain compatible with GitHub Pages
- Do not remove `base: '/mcpassiveetfvstrader/'`
- Keep the workflow file unless explicitly replacing it

## Deploy command flow
```bash
npm install
npm run build
```

## Publish flow
- Push to `main`
- GitHub Actions deploys automatically to Pages
