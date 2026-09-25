// Runs a script on Windows with the newest Node.js bundled in the Stream Deck app (no Node install on Windows needed).
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const wsl = (winPath) => execFileSync("wslpath", ["-u", winPath], { encoding: "utf8" }).trim();
const win = (wslPath) => execFileSync("wslpath", ["-w", wslPath], { encoding: "utf8" }).trim();
const appData = wsl(execFileSync("cmd.exe", ["/c", "echo %APPDATA%"], { encoding: "utf8", cwd: "/mnt/c" }).trim());
const localAppData = wsl(execFileSync("cmd.exe", ["/c", "echo %LOCALAPPDATA%"], { encoding: "utf8", cwd: "/mnt/c" }).trim());

const nodeRoot = path.join(appData, "Elgato", "StreamDeck", "NodeJS");
const newest = readdirSync(nodeRoot).filter((d) => /^\d/.test(d)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).at(-1);
const node = path.join(nodeRoot, newest, "node.exe");

// Windows Node can't reliably run scripts from \\wsl$, so copy the script to %LOCALAPPDATA%\Temp first.
const tmp = path.join(localAppData, "Temp", "soundboard-scripts");
mkdirSync(tmp, { recursive: true });
const script = path.join(tmp, path.basename(process.argv[2]));
copyFileSync(process.argv[2], script);

execFileSync(node, [win(script), ...process.argv.slice(3)], { stdio: "inherit", cwd: "/mnt/c" });
