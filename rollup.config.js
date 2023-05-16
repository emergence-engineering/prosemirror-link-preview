import typescript from "rollup-plugin-typescript2";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { terser } from "rollup-plugin-minification";
import copy from "rollup-plugin-copy";

import pkg from "./package.json";

export default {
  name: "prosemirror-link-preview",
  input: "src/index.ts",
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    { file: pkg.module, format: "es" },
  ],
  external: [...Object.keys(pkg.dependencies || {})],
  plugins: [
    peerDepsExternal(),
    copy({
      targets: [{ src: "src/styles/**/*", dest: "dist/styles" }],
    }),
    typescript(),
    terser(),
  ],
  sourcemap: true,
};
