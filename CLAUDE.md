# Stream Deck Soundboard

Stream-Deck-Plugin (Windows), das pro Taste eine MP3/WAV-Datei abspielt – gleichzeitig auf dem
Kopfhörer **und** im Mikrofonkanal, damit Teilnehmer in Videokonferenzen den Sound hören.

## Stand

Version 0.1 implementiert (2026-09-25): Play Sound, Stop Sound, Property Inspector, Deploy aus WSL, Packaging.
Verifiziert: koffi lädt im Stream-Deck-Node 24, DLL wird gefunden, Login funktioniert.
**Offen:** End-to-End-Test mit laufendem Voicemeeter (Audio, Latenz, `Recorder.Gain`, Umlaute) –
siehe [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md). Befehle und Aufbau: [README.md](README.md).

## Dokumente

- [docs/DECISIONS.md](docs/DECISIONS.md) – alle Architektur- und Produktentscheidungen inkl. verworfener Alternativen
- [docs/VOICEMEETER-API.md](docs/VOICEMEETER-API.md) – was wir über die Voicemeeter Remote API wissen bzw. annehmen
- [docs/VOICEMEETER-SETUP.md](docs/VOICEMEETER-SETUP.md) – Einrichtungsanleitung für Nutzer (Basis für die spätere README)
- [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md) – Spike-Plan, Umsetzungsreihenfolge, offene Risiken

## Kurzfassung der Architektur

- Stream Deck SDK v2 (`@elgato/streamdeck`), TypeScript, Node.js-Plugin.
- Kein eigener Audio-Code: Das Plugin steuert per FFI (`koffi`) die `VoicemeeterRemote64.dll`
  und nutzt den eingebauten Player (Recorder) von **Voicemeeter Banana/Potato**.
- Voicemeeter mischt Mikrofon + Player; Konferenz-App nutzt „Voicemeeter Out B1“ als Mikrofon.

## Konventionen

- Entwicklung in **WSL** (Git, Node, Build, Tests). Unter Windows ist **kein Git und kein Node** installiert – das gebaute
  `*.sdPlugin` wird per Deploy-Skript nach `%APPDATA%\Elgato\StreamDeck\Plugins\` (`/mnt/c/Users/jasper.ooster/AppData/Roaming/...`)
  kopiert und läuft im Node der Stream Deck App. Windows-Befehle nur via Interop (`cmd.exe`, `powershell.exe`).
- UI-Texte (Aktionsnamen, Property Inspector, Fehlermeldungen) auf **Englisch**; Doku darf Deutsch sein.
- Nach Änderungen: `npm test && npm run typecheck`, dann `npm run deploy`; Plugin-Log unter
  `/mnt/c/Users/jasper.ooster/AppData/Roaming/Elgato/StreamDeck/Plugins/de.atacama-blooms.soundboard.sdPlugin/logs/`.
- TypeScript auf 5.x pinnen – TS 7 (native) bricht `@rollup/plugin-typescript`.
- Voicemeeter-Zugriff nur über ein schmales Interface, damit die Aktionslogik mit Vitest gegen einen Fake testbar ist.
