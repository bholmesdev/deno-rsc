# node-root

esbuild relies on `node_modules` to correctly resolve imports like `react` and `react-dom`. To build our `root.tsx` file, we need to use a node package to resolve necessary dependencies.

Yes, I attempted to use [Deno's `--node-modules-dir` option](https://deno.land/manual@v1.28.0/node/npm_specifiers#--node-modules-dir-flag) to resolve dependencies locally, which gets _most_ of the way there. However, it fails to resolve the experimental release of `react-server-dom-webpack` this project relies on. Hopefully we can switch to a full-deno setup once this is no longer experimental!
