# Nächste Schritte

## Stand 2026-09-25

Erledigt: Vorbereitung (0), Grundgerüst, Deploy-Skript, Umsetzung 1–7 (Plugin v0.1, `npm run pack` funktioniert).
Spike-Punkte 1–3 verifiziert (siehe [VOICEMEETER-API.md](VOICEMEETER-API.md)); statt einer eigenen Spike-Aktion loggt
`src/voicemeeter/remote.ts` jeden API-Aufruf mit Rückgabecode – das Plugin-Log ist das Spike-Protokoll.

**Als Nächstes – manueller End-to-End-Test** (Voicemeeter Banana muss laufen):

- [ ] Voicemeeter-Setup gemäß [VOICEMEETER-SETUP.md](VOICEMEETER-SETUP.md), Voicemeeter starten.
- [ ] Play-Sound-Taste anlegen: Statuszeile zeigt „✔ Voicemeeter Banana connected“.
- [ ] Datei per `…` wählen – landet der echte Pfad im Feld (nicht `C:\fakepath\…`)?
- [ ] MP3 und WAV abspielen; Sound im Kopfhörer **und** im Teams-Testanruf hörbar?
- [ ] Log prüfen: Rückgabecodes von `Recorder.Gain`, `Recorder.load`, `Recorder.play` (0 = OK).
- [ ] Startet `Recorder.load` schon selbst? (Falls doppelt/abgehackt: `play()` nach `load` entfernen.)
- [ ] Zweite Taste während Wiedergabe → ersetzt? Stop-Taste → stoppt?
- [ ] Pfad mit Umlauten/Leerzeichen.
- [ ] Lautstärke 50 % hörbar leiser? Bus-Checkboxen wirken?
- [ ] Voicemeeter beenden → Warndreieck; wieder starten → Taste funktioniert ohne Plugin-Neustart.
- [ ] Latenz Tastendruck → Ton subjektiv ok (< ~200 ms)?

Ergebnisse in [VOICEMEETER-API.md](VOICEMEETER-API.md) eintragen.

---

Ursprünglicher Plan (zur Referenz):

## 0. Vorbereitung (manuell)

- [ ] Unter Windows: Stream Deck App installieren (kein Git, kein Node unter Windows).
- [ ] Voicemeeter Banana installieren und einrichten → [VOICEMEETER-SETUP.md](VOICEMEETER-SETUP.md).
- [ ] In WSL: Node.js 20+ (LTS) und Stream Deck CLI (`npm i -g @elgato/cli`).

## 1. Spike: Mini-Plugin gegen die Voicemeeter Remote API

Ziel: Die riskanteste Annahme (D3) früh prüfen – direkt im Node der Stream Deck App (prüft gleich die koffi-Kompatibilität).

Vorarbeit (gleichzeitig Grundgerüst fürs echte Plugin):
- `streamdeck create` in WSL (TypeScript, SDK v2), `koffi` als Dependency.
- Deploy-Skript: Build → `*.sdPlugin` nach `/mnt/c/Users/jasper.ooster/AppData/Roaming/Elgato/StreamDeck/Plugins/` kopieren
  → Neustart per Windows-Interop. Prüfen, dass koffis `win32_x64`-Binary im Bundle/Ordner landet.
- Logs lesen aus `.../Plugins/<uuid>.sdPlugin/logs/` (bzw. Stream-Deck-Log-Ordner).

Eine Spike-Aktion „Spike“ führt bei Tastendruck nacheinander aus und loggt jedes Ergebnis:

1. DLL-Pfad aus Registry ermitteln (Fallback: Standardpfad) und laden.
2. `VBVMR_Login` → Rückgabewert loggen (mit laufendem und mit beendetem Voicemeeter).
3. `VBVMR_GetVoicemeeterType` → Variante loggen.
4. Routing setzen: `Recorder.A1=1`, `Recorder.B1=1`, übrige Busse 0.
5. `Recorder.Gain` setzen (z. B. −10 dB) → Wertebereich prüfen.
6. `Recorder.load` mit MP3 **und** WAV, auch Pfad mit Umlauten/Leerzeichen (A- vs. W-Variante).
7. Beobachten: Startet `load` bereits die Wiedergabe? Sonst `Recorder.play = 1`.
8. Nach 2 s `Recorder.stop = 1`; danach sofort anderen Sound laden + abspielen („ersetzen“-Szenario, D4).
9. Latenz messen: Zeit von Aufruf bis hörbarem Ton (grob reicht) – Ziel < 200 ms.
10. Player-Status abfragen (gibt es einen lesbaren „is playing“-Parameter?) – nice to know für später.
11. `VBVMR_Logout` beim Plugin-Shutdown.

**Ergebnis festhalten** in [VOICEMEETER-API.md](VOICEMEETER-API.md) (⚠️-Markierungen auflösen).

**Abbruchkriterium:** Wenn `load` zu langsam ist (> ~500 ms), Umlaute nicht gehen, koffi im Stream-Deck-Node nicht lädt
oder der Player sich nicht zuverlässig steuern lässt → D3 neu bewerten; Fallback-Kandidat ist der C#-Helper mit NAudio
(ließe sich ebenfalls in WSL bauen: `dotnet publish -r win-x64 --self-contained` cross-kompiliert eine Windows-Exe).

## 2. Plugin-Grundgerüst vervollständigen

- Plugin-UUID festlegen, z. B. `de.atacama-blooms.soundboard`.
- Spike-Aktion entfernen, Vitest einrichten.

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
- **`koffi` im Stream-Deck-Node:** Stream Deck bringt eine eigene Node-Version mit (`manifest.json` → `Nodejs.Version`);
  wird durch den Spike als Plugin automatisch mitgetestet.
- **Neustart aus WSL:** Wie startet das Deploy-Skript das Plugin neu, ohne Windows-CLI? (Deep-Link vs. App-Neustart per PowerShell)
- **Gain-Semantik:** Slider in dB oder 0–100 %? Vorschlag: 0–100 % im UI, intern auf dB abbilden.
- **Plugin-UUID / Name** noch nicht festgelegt.
- **Verteilung an Kollegen:** Ablageort der `.streamDeckPlugin`-Datei (Teams-Kanal, GitHub Release …) noch offen.
