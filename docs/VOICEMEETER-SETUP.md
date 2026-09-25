# Voicemeeter Banana einrichten

Einmalige Einrichtung, damit Sounds vom Stream Deck im Meeting zu hören sind.
Basis für die spätere README/Setup-Anleitung für Kollegen.

## 1. Installieren

1. **Voicemeeter Banana** von <https://vb-audio.com/Voicemeeter/banana.htm> herunterladen und installieren
   (Donationware). Das normale „Voicemeeter“ reicht **nicht** – es hat keinen eingebauten Player.
2. Windows neu starten (Pflicht, damit die virtuellen Audiogeräte erscheinen).

## 2. Voicemeeter konfigurieren

1. **Hardware Input 1** (erste Spalte links): auf den Namen klicken → dein echtes Mikrofon wählen
   (WDM-Variante bevorzugen).
2. In derselben Spalte nur **B1** aktivieren, **A1** deaktivieren
   (sonst hörst du dich selbst im Kopfhörer).
3. **A1** (oben rechts, „Hardware Out“): deinen Kopfhörer wählen (WDM-Variante bevorzugen).
4. Menü → **Run on Windows Startup** aktivieren.
5. Optional: Menü → **System Tray (Run at Startup)** / „Minimize to tray“.

Den eingebauten Player routet das Plugin selbst (Standard: A1 + B1) – dort nichts einstellen.

## 3. Konferenz-App einstellen

| Einstellung | Gerät |
|---|---|
| Mikrofon | **Voicemeeter Out B1** (in manchen Versionen „VoiceMeeter Output“ bzw. „Voicemeeter Out B1 (VB-Audio Voicemeeter VAIO)“) |
| Lautsprecher | dein Kopfhörer (direkt) |

Gilt für Teams, Zoom, Webex, Discord usw.

## 4. Testen

1. In Teams „Testanruf“ bzw. in Zoom „Mikrofon testen“ starten → deine Stimme muss zu hören sein.
2. Später mit Plugin: Sound-Taste drücken → du hörst ihn im Kopfhörer, und in der Testaufnahme ist er ebenfalls drauf.

## Wenn Kopfhörer oder Mikro auf anderen Bussen liegen

Das Plugin routet standardmäßig auf **A1** (Kopfhörer) und **B1** (Konferenz-Mikro). Wer ein anderes Setup hat
(z. B. Kopfhörer auf A2), stellt das im Property Inspector einer Sound-Taste unter **Advanced** um (gilt global).

## Typische Probleme

- **Meeting hört mich nicht:** Konferenz-App nutzt nicht „Voicemeeter Out B1“, oder B1 ist bei Hardware Input 1 nicht aktiv.
- **Ich höre mich selbst:** A1 bei Hardware Input 1 deaktivieren.
- **Knacksen/Aussetzer:** Menü → System Settings → Buffering WDM erhöhen (z. B. 512); A1 auf WDM statt MME.
- **Taste zeigt Warndreieck:** Voicemeeter läuft nicht, ist die Standard-Version oder die Sounddatei wurde verschoben.
