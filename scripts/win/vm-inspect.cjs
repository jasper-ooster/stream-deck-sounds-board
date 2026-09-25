// Prints Voicemeeter devices and current routing. Runs on Windows with the Node bundled in Stream Deck:
//   npm run vm:inspect   (from WSL)
// Uses koffi from the deployed plugin, so run `npm run deploy` once first.
const { createRequire } = require("module");
const req = createRequire(process.env.APPDATA + "\\Elgato\\StreamDeck\\Plugins\\de.atacama-blooms.soundboard.sdPlugin\\bin\\x.js");
const koffi = req("koffi");
const lib = koffi.load("C:\\Program Files (x86)\\VB\\Voicemeeter\\VoicemeeterRemote64.dll");
const f = (p) => lib.func(p);
const login = f("long __stdcall VBVMR_Login(void)");
const logout = f("long __stdcall VBVMR_Logout(void)");
const dirty = f("long __stdcall VBVMR_IsParametersDirty(void)");
const getF = f("long __stdcall VBVMR_GetParameterFloat(const char *n, _Out_ float *v)");
const getS = f("long __stdcall VBVMR_GetParameterStringW(const char *n, void *buf)");
const inN = f("long __stdcall VBVMR_Input_GetDeviceNumber(void)");
const inD = f("long __stdcall VBVMR_Input_GetDeviceDescW(long i, _Out_ long *t, void *name, void *hw)");
const outN = f("long __stdcall VBVMR_Output_GetDeviceNumber(void)");
const outD = f("long __stdcall VBVMR_Output_GetDeviceDescW(long i, _Out_ long *t, void *name, void *hw)");
const str = (b) => { const s = b.toString("utf16le"); const i = s.indexOf("\0"); return i < 0 ? s : s.slice(0, i); };
const T = { 1: "MME", 3: "WDM", 4: "KS", 5: "ASIO" };
console.log("login", login());
const wait = (ms) => { const end = Date.now() + ms; while (Date.now() < end) {} };
for (let i = 0; i < 20 && dirty() !== 0; i++) wait(50);
wait(300); dirty();
const gf = (n) => { const v = [0]; const rc = getF(n, v); return rc === 0 ? v[0] : `rc${rc}`; };
const gs = (n) => { const b = Buffer.alloc(1024); const rc = getS(n, b); return rc === 0 ? str(b) : `rc${rc}`; };
console.log("== Inputs");
for (let i = 0; i < inN(); i++) { const t = [0], n = Buffer.alloc(1024), h = Buffer.alloc(1024); inD(i, t, n, h); console.log(`${T[t[0]] || t[0]}\t${str(n)}`); }
console.log("== Outputs");
for (let i = 0; i < outN(); i++) { const t = [0], n = Buffer.alloc(1024), h = Buffer.alloc(1024); outD(i, t, n, h); console.log(`${T[t[0]] || t[0]}\t${str(n)}`); }
console.log("== Current config");
for (let s = 0; s < 5; s++) console.log(`Strip[${s}]`, JSON.stringify(gs(`Strip[${s}].Label`)), "device:", JSON.stringify(gs(`Strip[${s}].device.name`)), ["A1","A2","A3","B1","B2"].map(b => `${b}=${gf(`Strip[${s}].${b}`)}`).join(" "), "mute=" + gf(`Strip[${s}].Mute`), "gain=" + gf(`Strip[${s}].Gain`));
for (let b = 0; b < 5; b++) console.log(`Bus[${b}]`, "device:", JSON.stringify(gs(`Bus[${b}].device.name`)), "mute=" + gf(`Bus[${b}].Mute`), "gain=" + gf(`Bus[${b}].Gain`));
console.log("Recorder", ["A1","A2","A3","B1","B2"].map(b => `${b}=${gf(`Recorder.${b}`)}`).join(" "), "Gain=" + gf("Recorder.Gain"), "play=" + gf("Recorder.play"));
console.log("logout", logout());
