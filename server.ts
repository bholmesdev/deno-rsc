import { Server } from "https://deno.land/std@0.179.0/http/server.ts";
import { build } from "npm:esbuild";
import { createElement } from "npm:react";
import RSDWServer from "npm:react-server-dom-webpack@0.0.0-experimental-b72ed698f-20230303/server.browser";
import { routes } from "./src/routes.ts";

const PORT = 8080;
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

const hostname = "localhost";

const server = new Server({ hostname, port: PORT, handler });
console.log(`Starting to listen on port ${PORT}`);
server.listenAndServe();

// Gracefully restart server on `deno --watch`
// https://github.com/denoland/deno/issues/16699#issuecomment-1465009559
globalThis.addEventListener("unload", () => {
  server.close();
});

async function getBaseHtml() {
  const esbuildEntrypoint = new URL("esbuild-entrypoint/", import.meta.url);

  const index = await Deno.readTextFile(
    new URL("index.html", esbuildEntrypoint)
  );
  const {
    outputFiles: [builtScript],
  } = await build({
    entryPoints: [new URL("index.js", esbuildEntrypoint).pathname],
    sourcemap: false,
    write: false,
    bundle: true,
    nodePaths: [esbuildEntrypoint.pathname],
  });
  const html = index.replace("<!--@@SCRIPT@@-->", builtScript.text);
  return html;
}
