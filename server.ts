import { Server } from "https://deno.land/std@0.179.0/http/server.ts";
import { build } from "esbuild";
import * as esbuildPluginImportMap from "esbuild-plugin-import-map";
import { createElement } from "react";
import RSDWServer from "react-server-dom-webpack/server.browser";
import { routes } from "./src/routes.ts";
import importMap from "./import_map.json" assert { type: "json" };

const port = 8080;
let cachedHtml = await getBaseHtml();

async function handler(req: Request): Promise<Response> {
  const pathname = new URL(req.url).pathname;
  if (pathname.startsWith("/__routes/")) {
    const Comp = routes[pathname.replace(/^\/__routes/, "")];
    if (Comp) {
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
  }

  if (Deno.env.has("DENO_RSC_WATCH_MODE")) {
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
    entryPoints: [new URL("root.tsx", import.meta.url).pathname],
    sourcemap: false,
    write: false,
    // `format` and `bundle` are required for esbuild-plugin-import-map
    // will *not* bundle dependencies inline when using format: "esm"
    format: "esm",
    bundle: true,
    jsxImportSource: importMap.imports.react,
    jsx: "automatic",
    plugins: [esbuildPluginImportMap.plugin()],
  });
  console.log(builtScript.text);
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
