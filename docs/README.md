# EVG documentation site

Published at <https://terotests.github.io/evg/>.

The site uses the same engine as the Ranger language documentation
(<https://terotests.github.io/Ranger/docs/>): **Astro + Starlight**, the
same chrome (`docs.css`), and the same writing rules (short sentences,
no promotional wording).

The operator reference on the Ranger site is generated from the compiler.
This site is written by hand from `storm/README.md`, `storm/SPEC.md` and
`storm/PLAN_EFFECTS.md`.

## Layout

| Path | Content |
| --- | --- |
| `docs/site/` | Astro + Starlight project |
| `docs/site/src/content/docs/` | Pages (Markdown) |
| `docs/site/src/styles/docs.css` | Theme copied from Ranger `docs/site` |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deploy |

## Commands

```sh
npm run docs:dev      # local server (http://localhost:4321/evg/)
npm run docs:build    # static site in docs/site/dist
```

Or, inside `docs/site`:

```sh
npm ci
npm run dev
npm run build
```

## GitHub Pages

Repository setting: **Settings → Pages → Build and deployment → Source:
GitHub Actions**.

A branch/Jekyll source would parse Astro `---` front matter as YAML and
fail. Do not add a root Jekyll `_config.yml` to "fix" that — it would
publish the raw tree and clobber this workflow's artifact.

The site base is `/evg/` because this is a project Pages site
(`terotests.github.io/evg/`).
