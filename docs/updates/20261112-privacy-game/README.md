# Privacy welcome, playlist crop and sustained-fire fixes

- Always-visible home welcome, Google login panel, member-action prompt and photo notices explain why new personal photos are stored only in this device's browser: to protect privacy. Most browsing/music/rest is public; personal writing, saved records and guardian collection use Google login.
- Expandable details distinguish account/record synchronization from local image files, explain manual backup and retain the historical cloud-photo exception. No account fields, Firebase rules, existing records or stored photos were changed.
- Music companion now uses the exact 3 × 4 atlas cell and a circular clip; neighboring character hands/feet no longer leak into the playlist logo.
- The meditation observer previously reloaded its closed audio element on every class change, including game effects. A 50-iteration sustained-fire probe observed 196 media loads. It now reacts only to closing meditation or opening another overlay while meditation is open; the same probe observed zero loads.
- Guaranteed-hit shards reuse the existing canvas instead of creating twelve animated DOM elements per hit. Restart cancels the previous simulation frame. AudioContext construction failure returns no audio rather than throwing out of the defense-line frame. No new frame is scheduled after game over.

## Validation

- `tests/playlist-game-privacy.cjs`: public welcome and circular sprite CSS at 390/1440; 100 sustained-fire iterations, 154 kills and level 7 without stopping; zero unrelated audio reloads; locked targets resolve; injected AudioContext construction failure does not stop gameplay; restart/close; member-only collection/login prompt.
- `tests/game-viewport.cjs`: seven viewport sizes 320–1440, all six touch controls, rotation/toolbar resizing, saved run and exit behavior.
- `tests/unified-photos.cjs`: current member policy; device photos and historical cloud photos, gallery interactions, account isolation and existing notes preserved.
- `tests/integrated-tabs-meditation.cjs`: close/reopen/navigation, saved state, eight real MP3 play/pause/resume/stop, exclusive playback and timer at 390/820/412/1440. `tests/unified-music.cjs`: real playlist playback, shared player, tabs, pause/share/deep link, no autoplay.
- The historical `tests/device-photos.cjs` expects guest photo uploads, which current pre-existing member-only policy rejects. It is superseded for this check by `tests/unified-photos.cjs`; no storage behavior was changed to satisfy the old test.

Screenshots: `playlist-mobile.png`, `playlist-room-mobile.png`, `welcome-mobile.png`. The meditation preview check now waits for actual completion with a bounded timeout instead of sampling once at 12.1 seconds (the audio play promise can resolve later under load). `SANSA_WIDTHS` permits isolated viewport reruns. Browser verification uses Chromium; no physical iPhone or Android device was available.
