import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const sdPlugin = "de.atacama-blooms.soundboard.sdPlugin";

/**
 * koffi stays external: it loads a native .node binary at runtime, which scripts/vendor-koffi.mjs
 * copies (for win32-x64) into the plugin's bin/node_modules.
 *
 * @type {import('rollup').RollupOptions}
 */
export default {
	input: "src/plugin.ts",
	external: ["koffi"],
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: true,
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart() {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
			},
		},
		typescript({ include: ["src/**/*.ts"] }),
		nodeResolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
		commonjs(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			},
		},
	],
};
