# Voicemeeter Remote API – Wissensstand

> ⚠️ Alles hier stammt aus dem Gedächtnis bzw. der öffentlichen Doku von VB-Audio und ist **noch nicht verifiziert**.
> Der Spike ([NEXT-STEPS.md](NEXT-STEPS.md)) soll jeden Punkt bestätigen oder korrigieren.
> Nach dem Spike diese Datei aktualisieren und die ⚠️-Markierungen entfernen.

## Verifiziert (2026-09-25, Stream Deck 7.5.1, Node 24, koffi 3.3.1)

- `koffi` 3.3.1 lädt im Node 24 der Stream Deck App (Windows-Binary aus `@koromix/koffi-win32-x64`).
- DLL liegt unter `C:\Program Files (x86)\VB\Voicemeeter\VoicemeeterRemote64.dll`.
- Prototypen im C-Stil (`long __stdcall VBVMR_Login(void)`, `_Out_ long *`, `const char16_t *`) werden von koffi akzeptiert.
- Voicemeeter **nicht** gestartet: `VBVMR_Login` → `1`, `VBVMR_GetVoicemeeterType` → `-2`.
- Logout + erneuter Login dauert ~0,5 s (passiert nur, solange Voicemeeter nicht läuft).

Noch offen: alles rund um den Player (`Recorder.*`) – braucht laufendes Voicemeeter.

Referenz: „VoicemeeterRemoteAPI.pdf“ und `VoicemeeterRemote.h` im Voicemeeter-Installationsordner bzw. im
Remote-API-Paket auf vb-audio.com.

## DLL finden

- 64-bit-DLL: `VoicemeeterRemote64.dll` im Voicemeeter-Installationsordner
  (typisch `C:\Program Files (x86)\VB\Voicemeeter\`).
- Robuster Weg: Installationspfad aus der Registry lesen ⚠️
  `HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\VB:Voicemeeter {17359A74-1236-5467}`
  → Wert `UninstallString`, Verzeichnis davon nehmen. Fallback: Standardpfad.
- Die Node-Runtime von Stream Deck ist 64-bit → immer die 64-bit-DLL laden.

## Relevante Funktionen (C, `__stdcall`)

| Funktion | Zweck | Notizen |
|---|---|---|
| `long VBVMR_Login(void)` | Verbindung aufbauen | 0 = OK, 1 = OK aber Voicemeeter läuft nicht, <0 = Fehler ⚠️ |
| `long VBVMR_Logout(void)` | Verbindung beenden | beim Plugin-Shutdown aufrufen |
| `long VBVMR_GetVoicemeeterType(long *pType)` | Variante abfragen | 1 = Standard, 2 = Banana, 3 = Potato (evtl. 6 = Potato x64) ⚠️; Rückgabe ≠ 0 → Voicemeeter läuft nicht |
| `long VBVMR_IsParametersDirty(void)` | Parameter-Cache aktualisieren | vor `GetParameter*` aufrufen, sonst veraltete Werte ⚠️ |
| `long VBVMR_GetParameterFloat(char *name, float *value)` | Parameter lesen | z. B. Player-Status |
| `long VBVMR_SetParameterFloat(char *name, float value)` | Parameter setzen | z. B. `Recorder.play` = 1 |
| `long VBVMR_SetParameterStringA/W(char *name, char/wchar *value)` | String-Parameter setzen | für `Recorder.load`; **W-Variante** wegen Umlauten in Pfaden bevorzugen ⚠️ |
| `long VBVMR_SetParameters(char *script)` | mehrere Parameter als Skript | z. B. `"Recorder.A1=1;Recorder.B1=1;"` – spart Einzelaufrufe ⚠️ |
| `long VBVMR_RunVoicemeeter(long type)` | Voicemeeter starten | **nicht nutzen** (Entscheidung D7) |

## Relevante Parameter (Player/Recorder)

| Parameter | Typ | Bedeutung |
|---|---|---|
| `Recorder.load` | string | Datei laden. ⚠️ Offen: startet das schon die Wiedergabe? |
| `Recorder.play` | 0/1 | Wiedergabe starten |
| `Recorder.stop` | 0/1 | Wiedergabe stoppen |
| `Recorder.A1` … `Recorder.A3` (Potato: A5) | 0/1 | Player auf Hardware-Bus routen |
| `Recorder.B1` … `Recorder.B2` (Potato: B3) | 0/1 | Player auf virtuellen Bus routen |
| `Recorder.Gain` | float (dB) | Player-Lautstärke ⚠️ Name und Wertebereich prüfen (vermutlich −60 … +12 dB) |

Parameter-Namen sind case-insensitive ⚠️.

## Geplante Nutzung im Plugin

```
connect():  Login (einmal beim Plugin-Start), bei Rückgabe 1 → Status "not running"
status():   GetVoicemeeterType → notRunning | standard (kein Player) | banana | potato
play(file, gainDb, buses):
            stop → Routing setzen (alle Busse explizit 0/1) → Gain setzen → load(file) → play
stop():     Recorder.stop = 1
shutdown(): Logout
```

## FFI mit koffi (Skizze, unverifiziert)

```ts
import koffi from "koffi";
const lib = koffi.load(dllPath);
const Login = lib.func("__stdcall", "VBVMR_Login", "long", []);
const GetType = lib.func("__stdcall", "VBVMR_GetVoicemeeterType", "long", [koffi.out("long *")]);
const SetFloat = lib.func("__stdcall", "VBVMR_SetParameterFloat", "long", ["str", "float"]);
const SetStringW = lib.func("__stdcall", "VBVMR_SetParameterStringW", "long", ["str", "str16"]);
```

Hinweis: In der 64-bit-ABI wird `__stdcall` ignoriert; die Angabe schadet aber nicht.
