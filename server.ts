import { Server } from "https://deno.land/std@0.179.0/http/server.ts";
import { build } from "esbuild";
import * as esbuildPluginImportMap from "esbuild-plugin-import-map";
import { createElement } from "react";
import RSDWServer from "react-server-dom-webpack/server.browser";
import importMap from "./import_map.json" assert { type: "json" };
import { createRefreshMiddleware } from "./utils/refresher.server.ts";

const port = 8080;
const isWatchMode = Deno.env.has("DENO_RSC_WATCH_MODE");
let cachedHtml = await getBaseHtml();

const routesDir = "src/routes/";
const routesUrl = new URL(routesDir, import.meta.url);

async function handler(req: Request): Promise<Response> {
  if (isWatchMode) {
    const refreshMiddleware = createRefreshMiddleware();
    const refreshRes = refreshMiddleware(req);
    if (refreshRes) {
      return refreshRes;
    }
  }

  const pathname = new URL(req.url).pathname;
  if (pathname.startsWith("/__routes/")) {
    const routePath = pathname.replace(/^\/__routes\//, "");
    const compName = routePath === "" ? "index" : routePath;
    let Comp = null;
    try {
      const mod = await import(
        new URL(
          `${compName}.tsx${
            // Invalidate cached module on every request in dev mode
            // WARNING: can cause memory leaks for long-running dev servers!
            isWatchMode ? `?invalidate=${Date.now()}` : ""
          }`,
          routesUrl
        ).href
      );
      if (typeof mod === "object" && mod != null && mod.default) {
        Comp = mod.default;
      } else {
        return new Response(
          `Components under ${routesDir} must have a default export.`,
          {
            status: 400,
          }
        );
      }
    } catch {
      return new Response(
        `Not Found. Ensure all entries in ${routesDir} are \`.tsx\` files.`,
        {
          status: 404,
        }
      );
    }
    const stream = RSDWServer.renderToReadableStream(createElement(Comp));
    // const ele = await RSDWClient.createFromFetch(
    //   new Promise((resolve) => resolve(new Response(stream)))
    // );
    // const Awaited = await ele;

    return new Response(stream, {
      headers: {
        "content-type": "text/html",
      },
    });
  }

  if (isWatchMode) {
    // Reload base HTML on every request in dev mode
    // to invalidate on potential file changes
    cachedHtml = await getBaseHtml();
  }
  return new Response(cachedHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

const server = new Server({ port, handler });
console.log(`Starting to listen on port ${port}`);
server.listenAndServe();

// Gracefully restart server on `deno --watch`
// https://github.com/denoland/deno/issues/16699#issuecomment-1465009559
globalThis.addEventListener("unload", () => {
  server.close();
});

async function getBaseHtml() {
  // Process ESM imports against import map before sending to the client
  // ex. transform "react" to "https://esm.sh/react@18.2.0"
  await esbuildPluginImportMap.load(importMap);
  const {
    outputFiles: [builtScript],
  } = await build({
    entryPoints: [new URL("src/root.tsx", import.meta.url).pathname],
    sourcemap: false,
    write: false,
    // `format` and `bundle` are required for esbuild-plugin-import-map
    // will *not* bundle dependencies inline when using format: "esm"
    format: "esm",
    bundle: true,
    jsxImportSource: importMap.imports.react,
    jsx: "automatic",
    plugins: [esbuildPluginImportMap.plugin()],
    footer: isWatchMode
      ? {
          js: await Deno.readTextFile(
            new URL("utils/refresher.client.js", import.meta.url)
          ),
        }
      : undefined,
  });
  return `<!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  
  <body>
    <h1>Hey!</h1>
    <div id="root"></div>
  </body>
  
  <script type="module">
  ${builtScript.text}
  </script>
  
  </html>`;
}
