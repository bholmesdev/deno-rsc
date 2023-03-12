import { Server } from "https://deno.land/std@0.179.0/http/server.ts";
import { build } from "npm:esbuild";
import { createElement } from "react";
import RSDWServer from "npm:react-server-dom-webpack@0.0.0-experimental-b72ed698f-20230303/server.browser";
import { routes } from "./src/routes.ts";

const port = 8080;
const html = await getBaseHtml();

async function handler(req: Request): Promise<Response> {
  const pathname = new URL(req.url).pathname;
  if (pathname === "" || pathname === "/") {
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  if (pathname.startsWith("/routes/")) {
    const Comp = routes[pathname.replace(/^\/routes/, "")];
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
  return new Response("Not found", { status: 404 });
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
  const nodeRoot = new URL("node-root/", import.meta.url);
  const {
    outputFiles: [builtScript],
  } = await build({
    entryPoints: [new URL("root.tsx", nodeRoot).pathname],
    sourcemap: false,
    write: false,
    bundle: true,
    nodePaths: [nodeRoot.pathname],
    jsxImportSource: "react",
    jsx: "automatic",
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
