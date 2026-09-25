# Entscheidungen

Ergebnis der Grill-Session vom 2026-09-25. Jede Entscheidung mit Begründung und verworfenen Alternativen,
damit man später nachvollziehen kann, *warum* etwas so ist.

## D1 – Plattform: nur Windows

- **Entscheidung:** Nur Windows wird unterstützt.
- **Warum:** Die Stream Deck Software gibt es nur für Windows/macOS. Ziel ist der eigene Windows-Rechner
  und die Rechner der Kollegen. macOS würde den Audio-Teil verdoppeln (CoreAudio/BlackHole statt Voicemeeter).
- **Konsequenz:** Das Plugin läuft als Node-Prozess der Windows-Stream-Deck-App, nicht in WSL.

## D2 – Audio-Routing: Voicemeeter mischt

- **Entscheidung:** Voicemeeter mischt das echte Mikrofon und den Sound. Die Konferenz-App
  (Teams/Zoom/…) verwendet „Voicemeeter Out B1“ als Mikrofon.
- **Warum:** Robust, niedrige Latenz. Stürzt das Plugin ab, funktioniert das Mikrofon trotzdem weiter.
- **Verworfen:**
  - *Plugin mischt selbst* (Mikro per WASAPI aufnehmen, mischen, in VB-Cable schreiben): native Audio-Bindings,
    Dauer-Streaming im Plugin, Mikro stumm bei Absturz.
  - *VB-Cable + Windows „Dieses Gerät abhören“*: spürbare Latenz, kein Mixing, manuelle Windows-Konfiguration.

## D3 – Wiedergabe: eingebauter Voicemeeter-Player über die Remote API

- **Entscheidung:** Das Plugin spielt nicht selbst ab, sondern steuert den eingebauten Player (Recorder)
  von Voicemeeter über `VoicemeeterRemote64.dll` (FFI via `koffi`): Datei laden → abspielen.
- **Warum:** Kein eigener Audio-Code, MP3/WAV werden von Voicemeeter dekodiert, Routing auf
  Kopfhörer + virtuelles Mikro erledigt Voicemeeter.
- **Bewusst in Kauf genommen:** Immer nur **ein Sound gleichzeitig**; harte Abhängigkeit von Voicemeeter.
- **Verworfen:**
  - *C#-Helper mit NAudio*: flexibler (Überlagerung, beliebige Geräte), aber zweite Toolchain und zweites Artefakt.
  - *Native Node-Addon (PortAudio)*: muss exakt zur Node-Version von Stream Deck passen – fragil.
  - *mpv/ffplay pro Tastendruck*: ~30 MB mitliefern, zwei Prozesse asynchron, Startverzögerung.

## D4 – Verhalten bei Tastendruck: immer ersetzen

- **Entscheidung:** Jeder Druck auf eine Sound-Taste stoppt einen laufenden Sound und startet den eigenen von vorn –
  auch bei derselben Taste.
- **Verworfen:** Toggle (gleiche Taste stoppt), Ignorieren während Wiedergabe, reines Toggle.

## D5 – Stop: eigene Aktion

- **Entscheidung:** Das Plugin hat zwei Aktionen: **Play Sound** und **Stop Sound**.
- **Verworfen:** Long-Press stoppt (unintuitiv, Start verzögert sich bis zum Loslassen), Kombination aus beidem.

## D6 – Routing wird vom Plugin erzwungen

- **Entscheidung:** Vor jedem Play setzt das Plugin die Bus-Zuordnung des Players (z. B. `Recorder.A1=1`, `Recorder.B1=1`)
  gemäß globaler Einstellung (siehe D10).
- **Warum:** Voicemeeter-Presets oder versehentliche Klicks können das Routing sonst unbemerkt zerstören
  („ich höre es, das Meeting nicht“).
- **Verworfen:** Manuelle Einstellung in Voicemeeter; Routing pro Taste.

## D7 – Fehlerfall: Warndreieck + Log

- **Entscheidung:** Vor dem Play prüft das Plugin, ob Voicemeeter läuft und die Variante einen Player hat.
  Wenn nicht (oder die Datei fehlt): `showAlert()` auf der Taste + Log-Eintrag. **Kein** Auto-Start von Voicemeeter.
- **Verworfen:** Voicemeeter automatisch starten (Sekunden Verzögerung, Audio-Setup ändert sich mitten im Call);
  Fallback-Wiedergabe lokal (zweiter Wiedergabeweg, Meeting hört es trotzdem nicht).

## D8 – Einstellungen pro Taste: Datei + Lautstärke

- **Entscheidung:** Property Inspector der Play-Taste: Dateiauswahl (MP3/WAV) + Lautstärke-Slider
  (wird vor dem Play als Player-Gain gesetzt). Titel/Icon über Stream-Deck-Standardmittel.
- **Nicht jetzt:** Fortschrittsanzeige auf der Taste, Trim (Start/Endzeit).

## D9 – Dateien: nur absoluter Pfad

- **Entscheidung:** In den Tasten-Settings wird nur der absolute Pfad gespeichert (z. B. `C:\Sounds\applaus.mp3`).
  Fehlt die Datei → Warndreieck (D7).
- **Verworfen:** Datei in Plugin-Ordner kopieren (Duplikate, Verlust bei Neuinstallation); fester Sound-Ordner mit Dropdown.

## D10 – Bus-Konfiguration: global, Default A1 + B1

- **Entscheidung:** Globale Plugin-Einstellung (Stream Deck `globalSettings`) mit Checkboxen A1–A3 / B1–B2,
  vorbelegt mit **A1 + B1**. Gilt für alle Tasten, einmal pro Rechner einstellbar, im Property Inspector
  unter „Advanced“ erreichbar.
- **Warum:** Kollegen haben unterschiedliche Setups (Kopfhörer auf A2, Mikro auf B2 …).
- **Verworfen:** Hart codiert A1+B1; pro Taste.

## D11 – Variante: Voicemeeter Banana (Potato ebenfalls unterstützt)

- **Entscheidung:** Referenz-Setup ist **Voicemeeter Banana**. Potato wird gleich behandelt.
  Standard-Voicemeeter hat keinen Player → klare Fehlermeldung.
- **Status:** Voicemeeter ist beim Entwickler noch nicht installiert → siehe [VOICEMEETER-SETUP.md](VOICEMEETER-SETUP.md).

## D12 – Zielgruppe: Team / Kollegen

- **Entscheidung:** Verteilung als gepackte `.streamDeckPlugin`-Datei mit README + Setup-Anleitung. Kein Marketplace (vorerst).
- **Konsequenz:** Klare Fehlermeldungen, Statusanzeige im Property Inspector (D14), globale Bus-Konfiguration (D10).
  Die Voicemeeter-DLL wird **nicht** mitgeliefert, sondern aus der Voicemeeter-Installation geladen.

## D13 – Sprache: Englisch

- **Entscheidung:** Aktionsnamen, Property Inspector und Fehlermeldungen nur auf Englisch
  („Play Sound“, „Stop Sound“, „Voicemeeter not running“). README/Doku darf Deutsch sein.

## D14 – Onboarding: Statuszeile im Property Inspector

- **Entscheidung:** Der Property Inspector zeigt eine Statuszeile, z. B.
  „✔ Voicemeeter Banana connected“ / „✖ Voicemeeter not found“ / „✖ Voicemeeter Standard has no player“,
  plus Link zur Setup-Anleitung.
- **Verworfen:** Nur README; Setup-Assistent, der Voicemeeter automatisch konfiguriert (aufwendig, greift ungefragt ein).

## D15 – Entwicklung komplett unter Windows

- **Entscheidung:** Repo auf dem Windows-Dateisystem (z. B. `C:\dev\stream-deck-sounds-board`), Node.js + Stream Deck CLI
  unter Windows, VS Code nativ unter Windows (nicht Remote-WSL).
- **Warum:** Plugin lädt eine Windows-DLL und wird von der Windows-Stream-Deck-App gestartet; `streamdeck link` und
  Watch-Mode funktionieren so direkt.
- **Verworfen:** Code in WSL + Sync nach Windows; WSL + `/mnt/c` mit Windows-Node.

## D16 – Tests: Unit-Tests gegen Fake

- **Entscheidung:** Voicemeeter-Zugriff hinter einem schmalen Interface (connect, status, load, play, stop, setGain, setRouting).
  Aktionslogik (Ersetzen, Stop, Warndreieck, Routing erzwingen, Gain) mit **Vitest** gegen einen Fake.
  Echte DLL-Anbindung per manueller Checkliste.
- **Verworfen:** Nur manuell; zusätzliche Integrationstests gegen echtes Voicemeeter (nicht CI-fähig, flaky).

## D17 – Vorgehen: Spike zuerst

- **Entscheidung:** Bevor gescaffoldet wird, klärt ein kleines Node-Skript unter Windows die Unsicherheiten der Remote API.
  Details: [NEXT-STEPS.md](NEXT-STEPS.md).
