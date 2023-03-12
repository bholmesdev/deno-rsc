import { ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

const root = createRoot(document.getElementById("root")!);

// FETCHES A SERVER APP TO RENDER ON THE CLIENT
// This doesn't mean RSCs run on the client!
// it just means I'm dumb and don't know how to import
// a RSC from a server app.

createFromFetch(fetch(`/__routes${window.location.pathname}`)).then(
  (ele: ReactNode) => {
    root.render(<StrictMode>{ele}</StrictMode>);
  }
);
