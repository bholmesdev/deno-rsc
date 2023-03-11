import { Server } from "https://deno.land/std@0.179.0/http/server.ts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Comp } from "./Comp.tsx";

async function handler(req: Request): Promise<Response> {
  const html = renderToStaticMarkup(createElement(Comp));
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

const hostname = "localhost";
const port = 8080;

const server = new Server({ hostname, port, handler });
console.log(`Starting to listen on port ${port}`);
server.listenAndServe();

globalThis.addEventListener("unload", () => {
  server.close();
});
