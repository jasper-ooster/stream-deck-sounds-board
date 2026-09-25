# Nächste Schritte

## 0. Vorbereitung (manuell)

- [ ] Repo auf das Windows-Dateisystem umziehen, z. B. `C:\dev\stream-deck-sounds-board`
      (Achtung: bei `git clone` statt Verschieben vorher committen/pushen, sonst fehlen diese Docs).
- [ ] Unter Windows installieren: Node.js 20+ (LTS), Git, Stream Deck App, Stream Deck CLI (`npm i -g @elgato/cli`).
- [ ] Voicemeeter Banana installieren und einrichten → [VOICEMEETER-SETUP.md](VOICEMEETER-SETUP.md).
- [ ] VS Code nativ unter Windows im neuen Ordner öffnen.

## 1. Spike: Voicemeeter Remote API (vor jedem Plugin-Code)

Ziel: Die riskanteste Annahme (D3) früh prüfen. Ein Wegwerf-Skript `spike/vm-spike.mjs` mit `koffi`:

1. DLL-Pfad aus Registry ermitteln (Fallback: Standardpfad) und laden.
2. `VBVMR_Login` → Rückgabewert loggen (mit laufendem und mit beendetem Voicemeeter).
3. `VBVMR_GetVoicemeeterType` → Variante loggen.
4. Routing setzen: `Recorder.A1=1`, `Recorder.B1=1`, übrige Busse 0.
5. `Recorder.Gain` setzen (z. B. −10 dB) → Wertebereich prüfen.
6. `Recorder.load` mit MP3 **und** WAV, auch Pfad mit Umlauten/Leerzeichen (A- vs. W-Variante).
7. Beobachten: Startet `load` bereits die Wiedergabe? Sonst `Recorder.play = 1`.
8. Nach 2 s `Recorder.stop = 1`; danach sofort anderen Sound laden + abspielen („ersetzen“-Szenario, D4).
9. Latenz messen: Zeit von Aufruf bis hörbarem Ton (grob per Gefühl/Stoppuhr reicht) – Ziel < 200 ms.
10. Player-Status abfragen (gibt es einen lesbaren „is playing“-Parameter?) – nice to know für später.
11. `VBVMR_Logout`.

**Ergebnis festhalten** in [VOICEMEETER-API.md](VOICEMEETER-API.md) (⚠️-Markierungen auflösen).

**Abbruchkriterium:** Wenn `load` zu langsam ist (> ~500 ms), Umlaute nicht gehen oder der Player sich nicht
zuverlässig steuern lässt → D3 neu bewerten; Fallback-Kandidat ist der C#-Helper mit NAudio.

## 2. Plugin scaffolden

- `streamdeck create` (TypeScript, SDK v2), Plugin-UUID z. B. `de.atacama-blooms.soundboard` (noch festlegen).
- `koffi` als Dependency; prüfen, dass es im gebauten Plugin (Rollup-Bundle) korrekt mitkommt
  (native `.node`-Datei darf nicht weggebundlet werden).
- Vitest einrichten.

## 3. Umsetzung (Reihenfolge)

1. `VoicemeeterClient`-Interface + echte Implementierung (koffi) + Fake für Tests.
2. Aktion **Play Sound** (`keyDown`): Status prüfen → Datei prüfen → stop → Routing → Gain → load → play;
   Fehler → `showAlert()` + Log.
3. Aktion **Stop Sound**.
4. Property Inspector Play Sound: Dateiauswahl (MP3/WAV), Lautstärke-Slider.
5. Globale Einstellungen (Busse A1–A3/B1–B2, Default A1+B1) im PI-Abschnitt „Advanced“.
6. Statuszeile im PI (connected / not running / standard version) + Link zur Anleitung.
7. Icons (Platzhalter reichen), README mit Setup-Anleitung, `streamdeck pack` → `.streamDeckPlugin`.
8. Manuelle Test-Checkliste (echtes Voicemeeter, Teams-Testanruf).

## Offene Punkte / Risiken

- **Recorder-Seiteneffekte:** Das Plugin überschreibt den Player-Zustand (geladene Datei, Routing, Gain).
  Wer den Voicemeeter-Recorder selbst nutzt, bemerkt das – in README erwähnen.
- **`koffi` im Stream-Deck-Node:** Stream Deck bringt eine eigene Node-Version mit; im Spike mit dieser Version testen
  (Node-Version in `manifest.json` → `Nodejs.Version`).
- **Gain-Semantik:** Slider in dB oder 0–100 %? Vorschlag: 0–100 % im UI, intern auf dB abbilden.
- **Plugin-UUID / Name** noch nicht festgelegt.
- **Verteilung an Kollegen:** Ablageort der `.streamDeckPlugin`-Datei (Teams-Kanal, GitHub Release …) noch offen.
