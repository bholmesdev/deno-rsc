import { ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

window.__webpack_require__ = async (id: string) => {
  return import(id);
};

const root = createRoot(document.getElementById("root")!);

// FETCHES A SERVER APP TO RENDER ON THE CLIENT
// This doesn't mean RSCs run on the client!
// it just means I'm dumb and don't know how to import
// a RSC from a server app.

createFromFetch(fetch(`/__routes${window.location.pathname}`)).then(
  async (ele) => {
    root.render(<StrictMode>{await ele}</StrictMode>);
  }
);
