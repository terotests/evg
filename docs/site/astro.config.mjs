// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

/**
 * Commit of the tree that the site describes. The Pages workflow sets
 * EVG_COMMIT; a local build reads HEAD.
 */
function evgCommit() {
  const fromEnv = (process.env.EVG_COMMIT || process.env.RANGER_COMMIT || "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commit = evgCommit();
if (commit && !process.env.EVG_COMMIT) {
  process.env.EVG_COMMIT = commit;
}

/**
 * Project Pages for github.com/terotests/evg. The site root is the
 * documentation. Ranger language docs stay at /Ranger/docs/.
 */
export default defineConfig({
  site: "https://terotests.github.io",
  base: "/evg/",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "EVG",
      favicon: "/favicon.svg",
      logo: {
        src: "./public/favicon.svg",
        alt: "EVG",
      },
      description:
        "Technical documentation of EVG, the layout engine: the CSS subset, " +
        "the layouts, the properties and the GPU surface effects.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/terotests/evg" },
      ],
      editLink: {
        baseUrl: "https://github.com/terotests/evg/edit/master/docs/site/",
      },
      lastUpdated: true,
      customCss: ["./src/styles/docs.css"],
      components: {
        Footer: "./src/components/Footer.astro",
      },
      sidebar: [
        {
          label: "Start",
          items: [
            { label: "About this documentation", slug: "index" },
            { label: "Install", slug: "start/install" },
            { label: "Syntax", slug: "start/syntax" },
            { label: "The pipeline", slug: "start/pipeline" },
            { label: "Licenses", slug: "start/licenses" },
          ],
        },
        {
          label: "CSS",
          items: [
            { label: "The CSS subset", slug: "css/overview" },
            { label: "Properties", slug: "css/properties" },
            { label: "Units", slug: "css/units" },
          ],
        },
        {
          label: "Layout",
          items: [
            { label: "Layouts", slug: "layout/overview" },
            { label: "Flex", slug: "layout/flex" },
            { label: "Grid", slug: "layout/grid" },
          ],
        },
        {
          label: "Effects",
          items: [{ label: "Shaders and surface effects", slug: "effects/shaders" }],
        },
      ],
    }),
  ],
  vite: {
    define: {
      __EVG_VERSION__: JSON.stringify(pkg.version),
      "import.meta.env.EVG_COMMIT": JSON.stringify(commit),
      "import.meta.env.EVG_VERSION": JSON.stringify(pkg.version),
    },
  },
});
