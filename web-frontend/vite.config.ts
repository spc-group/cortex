import { defineConfig } from 'vite'
import tailwindcss from "@tailwindcss/vite";
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// const PYODIDE_EXCLUDE = [
//   "!**/*.{md,html}",
//   "!**/*.d.ts",
//   "!**/*.whl",
//   "!**/pyodide/node_modules",
// ];

const PYODIDE_PACKAGES = new Set(['micropip', 'numpy' /* add other packages here */]);

export function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        // src: [join(pyodideDir, "*").replace(/\\/g, "/")].concat(
        //   PYODIDE_EXCLUDE
        // ),
	src: [
          join(pyodideDir, 'micropip-*-py3-none-any.whl'),
	  join(pyodideDir, 'numpy-*-wasm32.whl'),
        // add other specific wheel files here
	],
        dest: "assets/pyodide",
      },
      {
	src: join(pyodideDir, 'pyodide-lock.json'),
	dest: 'assets/pyodide',
	transform: (content) => {
          const lockfile = JSON.parse(content.toString());
          lockfile.packages = Object.fromEntries(
            Object.entries(lockfile.packages).filter(([name]) =>
              PYODIDE_PACKAGES.has(name)
						    )
          );
          return JSON.stringify(lockfile);
	},
      },
    ],
  });
}

// https://vite.dev/config/
export default defineConfig({
  base: "/app/",
  optimizeDeps: { exclude: ["pyodide"] },
  plugins: [react(), tailwindcss(), viteStaticCopyPyodide()],
  build: {
    sourcemap: true,
  }
})
