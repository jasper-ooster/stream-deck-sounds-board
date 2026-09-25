// Copies koffi's JavaScript files plus the win32-x64 native binary into the plugin's bin/node_modules.
// koffi only installs the binary for the current platform (linux in WSL), so the Windows one is fetched with `npm pack`.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginBin = path.join(root, "de.atacama-blooms.soundboard.sdPlugin", "bin");
const koffiSrc = path.join(root, "node_modules", "koffi");
const NATIVE_PKG = "@koromix/koffi-win32-x64";

const isRuntimeFile = (file) => /\.(c?js|json|txt)$/.test(file);

export function vendorKoffi() {
	const { version } = JSON.parse(readFileSync(path.join(koffiSrc, "package.json"), "utf8"));
	const target = path.join(pluginBin, "node_modules");
	rmSync(target, { recursive: true, force: true });

	// koffi JS loader (no C++ sources, docs or vendored headers)
	for (const dir of [".", "src/koffi", "src/koffi/src"]) {
		const from = path.join(koffiSrc, dir);
		const to = path.join(target, "koffi", dir);
		mkdirSync(to, { recursive: true });
		for (const entry of readdirSync(from, { withFileTypes: true })) {
			if (entry.isFile() && isRuntimeFile(entry.name)) {
				cpSync(path.join(from, entry.name), path.join(to, entry.name));
			}
		}
	}

	// win32-x64 native binary, cached per version
	const cache = path.join(root, ".cache", `koffi-win32-x64-${version}`);
	if (!existsSync(path.join(cache, "package", "package.json"))) {
		mkdirSync(cache, { recursive: true });
		const tgz = execFileSync("npm", ["pack", `${NATIVE_PKG}@${version}`, "--pack-destination", cache, "--silent"], { cwd: root, encoding: "utf8" }).trim();
		execFileSync("tar", ["xzf", path.join(cache, tgz), "-C", cache]);
	}
	cpSync(path.join(cache, "package"), path.join(target, NATIVE_PKG), { recursive: true });

	console.log(`Vendored koffi ${version} (+ ${NATIVE_PKG}) into ${path.relative(root, target)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	vendorKoffi();
}
