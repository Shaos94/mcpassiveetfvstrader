# mcpassiveetfvstrader

Single-page React/Vite app for comparing passive ETF investing vs trading scenarios with a Monte Carlo model.

## Repository target
This project is preconfigured for:

`https://shaos94.github.io/mcpassiveetfvstrader/`

## Local run

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages deployment
This project already includes:

- `base: '/mcpassiveetfvstrader/'` in `vite.config.ts`
- `.github/workflows/deploy.yml` for GitHub Pages

### What to do
1. Upload all files in this folder to the GitHub repo `Shaos94/mcpassiveetfvstrader`.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push to `main`.
5. Wait for the Actions workflow to finish.

## Final URL

`https://shaos94.github.io/mcpassiveetfvstrader/`

## Notes
- This is a static site.
- No backend is required.
- The app does not depend on external icon CDNs.
