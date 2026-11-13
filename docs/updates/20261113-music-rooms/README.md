# Separate music spaces and public lyric synchronization

The original five-song 극락왕생 playlist and the temple-song 산사 음악방 again have distinct home entries, overlay screens and filtered song lists. They share the existing visual layout and a single audio engine/control tree, so there are no extra tabs, duplicate IDs or overlapping audio. Previous/next stays inside the current collection, and the mini player reopens the current song's own screen. The temple room clearly labels both its selected song and row as `해인사 · 팔만의 바람`. Story/detail/deep links select the temple room; legacy-song links select the playlist. Navigation restores the corresponding controls.

## Root cause and compatibility

Firebase Realtime Database may return numeric-key maps as arrays in a snapshot, including `null` holes. The prior `normalizeSharedLyricSync` explicitly rejected arrays under `__lineTimesV1`, so a fresh public viewer could discard captured line times even though administrator-local pending edits worked. It now accepts array and object forms, keeps valid numeric times (including zero), ignores null holes, and preserves line indices. Existing administrator saves are read without rewriting data or changing rules.

The public timing listener starts as soon as Firebase is ready, without waiting for the authentication callback. Shared timing updates immediately refresh either visible screen, and media timeupdate/seek/metadata events update highlighting and lyric-window scrolling. Administrator timing controls remain hidden from guests and ordinary members. No timings are guessed for uncaptured lines.

## Validation

- `tests/separate-music-live-sync.cjs`: 320/390/1440 separate home entries/screens, five-vs-one song counts, temple identity, same layout and visible header, no music tabs, single audio/control IDs; Firebase array/object/null forms; anonymous moving lyric highlights and live remote correction; mini reopening and actual Back/Forward restore.
- `tests/palman-admin-lyrics.cjs`: saved administrator line times are serialized as a Firebase-style array before a separate anonymous page reads them; real media play/seek/highlight, permissions, error/retry and original lyrics.
- `tests/unified-music.cjs`: real 269.4-second Palman and legacy playback; collection separation, no reset on same-song reopen, share/deep-link/detail, no autoplay or initial audio requests.
- `tests/music-sync-layout.cjs`: existing numeric offsets, concurrent saves/retry, public updates, logo bounds and course order.
- `tests/atlas-temple-music.cjs`: corresponding episode-to-temple music link and lyric rendering.

Tests use browser Firebase fixtures, including the server's array serialization behavior; no administrator production credentials or database writes are used. Main audio/catalog/lyrics files and existing saved timing records are unchanged. Screenshots show both separate screens at 390/1440.
