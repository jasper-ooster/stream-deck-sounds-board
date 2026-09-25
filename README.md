# Soundboard – Stream Deck Plugin

Spielt pro Stream-Deck-Taste eine MP3- oder WAV-Datei ab – auf deinem Kopfhörer **und** auf deinem Mikrofon.
Teilnehmer in Teams, Zoom & Co. hören den Sound also mit, ohne dass du Systemsound teilen musst.

Technisch nutzt das Plugin den eingebauten Player von **Voicemeeter Banana** (oder Potato), der dein Mikrofon und den Sound zusammenmischt.

## Installation

1. **Voicemeeter Banana** installieren und einrichten → [docs/VOICEMEETER-SETUP.md](docs/VOICEMEETER-SETUP.md)
2. `de.atacama-blooms.soundboard.streamDeckPlugin` doppelklicken → Stream Deck installiert das Plugin.
3. In der Stream Deck App unter **Soundboard** die Aktionen auf Tasten ziehen.

## Benutzung

| Aktion | Was sie tut |
|---|---|
| **Play Sound** | Spielt die hinterlegte Datei ab. Läuft schon ein Sound, wird er ersetzt. |
| **Stop Sound** | Stoppt den laufenden Sound. |

Einstellungen einer **Play Sound**-Taste:

- **File** – Datei per `…` auswählen oder den vollständigen Pfad einfügen (z. B. `C:\Sounds\applaus.mp3`).
  Gespeichert wird nur der Pfad – Datei also nicht verschieben.
- **Volume** – Lautstärke dieses Sounds (100 % = Originallautstärke).
- **Advanced → Output to** – auf welche Voicemeeter-Busse der Player spielt. Gilt für **alle** Tasten.
  Standard: **A1** (Kopfhörer) + **B1** (Konferenz-Mikrofon).

Oben im Einstellungsfenster zeigt eine Statuszeile, ob Voicemeeter verbunden ist.

## Wenn etwas nicht geht

- **Warndreieck auf der Taste:** Voicemeeter läuft nicht, es ist die Standard-Version (ohne Player), keine Datei gewählt
  oder die Datei existiert nicht mehr. Die Statuszeile in den Tasten-Einstellungen sagt, was los ist.
- **Ich höre den Sound, das Meeting nicht:** In der Konferenz-App muss das Mikrofon „Voicemeeter Out B1“ sein.
- **Hinweis:** Das Plugin steuert den Voicemeeter-Player (lädt Dateien, setzt Routing und Lautstärke).
  Wer den Voicemeeter-Recorder/Player selbst nutzt, bekommt dort die Einstellungen des Plugins.
- Logs: `%APPDATA%\Elgato\StreamDeck\Plugins\de.atacama-blooms.soundboard.sdPlugin\logs\`

## Entwicklung

Entwickelt wird in **WSL** – unter Windows braucht es nur die Stream Deck App und Voicemeeter (kein Node, kein Git).

```bash
npm install
npm test            # Unit-Tests (Vitest, gegen einen Voicemeeter-Fake)
npm run typecheck
npm run deploy      # bauen, nach %APPDATA%\Elgato\StreamDeck\Plugins kopieren, Plugin neu starten
npm run watch       # wie deploy, bei jeder Änderung
npm run pack        # dist/de.atacama-blooms.soundboard.streamDeckPlugin zum Weitergeben
```

Aufbau:

| Pfad | Inhalt |
|---|---|
| `src/sound-service.ts` | Aktionslogik (ersetzen, Routing erzwingen, Fehlerfälle) – ohne Stream-Deck-/DLL-Abhängigkeit |
| `src/voicemeeter/remote.ts` | Anbindung an `VoicemeeterRemote64.dll` per [koffi](https://koffi.dev) |
| `src/actions/` | Stream-Deck-Aktionen Play Sound / Stop Sound |
| `de.atacama-blooms.soundboard.sdPlugin/` | Manifest, Icons, Property Inspector (`ui/`) |
| `scripts/vendor-koffi.mjs` | legt koffi + Windows-Binary in `bin/node_modules` (koffi bleibt beim Bundling extern) |
| `scripts/deploy.mjs` | Deploy aus WSL nach Windows über `/mnt/c` und `streamdeck://`-Deep-Links |

Hintergrund und Entscheidungen: [docs/DECISIONS.md](docs/DECISIONS.md), API-Details: [docs/VOICEMEETER-API.md](docs/VOICEMEETER-API.md).
