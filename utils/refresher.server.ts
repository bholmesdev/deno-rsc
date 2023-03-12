// Source from: https://dev.to/craigmorten/how-to-code-live-browser-refresh-in-deno-309o

/**
 * Constructs a refresh middleware for reloading
 * the browser on file changes.
 */
export function createRefreshMiddleware(): (req: Request) => Response | null {
  watch();

  return refreshMiddleware;
}

/**
 * Watch files from current directory
 * and trigger a refresh on change.
 */
async function watch() {
  // Watch base directory
  const watcher = Deno.watchFs(new URL("../", import.meta.url).pathname);
  for await (const event of watcher) {
    // Skip the "any" and "access" events to reduce
    // unnecessary refreshes.
    if (["any", "access"].includes(event.kind)) {
      continue;
    }
    for (const socket of sockets) {
      socket.send("refresh");
    }
  }
}

const sockets: Set<WebSocket> = new Set();

/**
 * Upgrade a request connection to a WebSocket if
 * the url ends with "/__refresh"
 */
function refreshMiddleware(req: Request): Response | null {
  if (req.url.endsWith("/__refresh")) {
    const { response, socket } = Deno.upgradeWebSocket(req);

    sockets.add(socket);
    socket.onclose = () => {
      sockets.delete(socket);
    };

    return response;
  }
  return null;
}
