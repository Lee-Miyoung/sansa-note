# Music header, durable shared lyric offsets and temple links

The playlist opens beneath the visible Sansanote brand/navigation. Its companion/title/close header stays in place while the music panel scrolls; reopen starts the panel at the top without resetting playback.

Administrator lyric changes are held in a pending revision map. Shared snapshots merge pending edits instead of overwriting them. Writes are serialized and patch only changed song keys at the existing `shared/lyricSync` path. An acknowledgement clears only its matching revision, so a later adjustment survives an earlier save. Explicit save/retry and persisted-in-session status distinguish pending, acknowledged and failed writes. The offset range is ±120 seconds (formerly ±8); selected admin lines stop automatic lyric-window scrolling. Firebase schema/rules, administrator identity and account records are unchanged. Production Firebase administrator writes were not performed; persistence/races/reload/error retry were verified with the browser Firebase fixture.

The six 37-place/region routes now follow all existing courses. Public course source/discrepancy notes and repeated “reference” labels are removed. Research provenance remains in `data/cnn-temple-reference.json`; no verified CNN endorsement is asserted in the UI. All 108 official names and old course definitions remain intact.

Music catalog entries can now carry timed `{t,text}` lyrics, feeding the same existing player. Published, rights-confirmed songs linked to an episode's temple appear on both its public landing and reader; links open the main music room in a new tab so the reader stays open. No audio is downloaded or played from merely opening the story. Existing temple-detail song buttons continue to use the same catalog.

## Missing production asset

“팔만의 바람” audio and lyrics are not in this repository, current attachments or latest `main`. Other chat threads are unavailable here. No placeholder song, copied legacy audio, guessed lyrics or false production registration was added. With the supplied original audio/lyrics, register `haeinsa-palman` against `temple:해인사`, the existing Haeinsa watercolor cover, and the confirmed rights metadata in `music/catalog.json`. Then test the actual file's decoding/playback and the supplied lyrics before reporting the song as published. The automated temple-link test uses explicitly named fixture-only metadata, not this missing song.

## Validation

- `tests/music-sync-layout.cjs`: 320/390/1440 brand/logo bounds before and after scrolling; six routes at end and no source clutter; delayed snapshots, edits during in-flight save, per-song patch isolation, >8-second alignment, failure/retry and public reload.
- `tests/atlas-temple-music.cjs`: matching episode landing + reader links, no reader audio requests, catalog timed lyrics, shared music-room/playlist state (fixture only).
- `tests/unified-music.cjs`: existing real audio playback, pause/share/deep-link/tabs, shared single player, no autoplay and detail-song connection.
- `tests/cnn-reference.cjs`: all 37 destinations and artwork/tips, unchanged official108 and original courses.
