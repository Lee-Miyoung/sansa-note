# Palman lyrics and one music player

The uploaded `haeinsa-palman.mp3` is now accompanied by all 78 nonblank lines of the owner's lyrics (including section headings). The readable original is in `music/lyrics/haeinsa-palman.txt`; the music catalog carries the same lines. No unverified timestamps are invented: new lines remain `t: null` until the administrator captures their start times.

All six registered songs use the existing playlist's song list, lyric window, seek and play/previous/next controls. Nested music rooms, tab switches, duplicate play controls and separate share/copy buttons are removed. Opening a temple song shows its lyrics immediately; reopening the same song preserves playback. Share and temple-detail links remain. No audio is fetched by merely visiting home.

The timing panel starts hidden in HTML. Only the existing Google administrator sees editable lyric buttons, start-time capture, next-line selection, full-song offset and save/retry. Guest/member/logout states have no visible timing tools. A captured line changes only that line; adjusting the global offset preserves all captured line times.

## Compatible public synchronization

Existing `shared/lyricSync/<song title>` numeric offsets remain numeric for already-open older clients. Per-line base timestamps are added under `shared/lyricSync/__lineTimesV1/<song title>/<line index>`, within the same existing administrator-protected subtree. New clients combine both records and apply them to authenticated and anonymous listeners. No Firebase rules, administrator identity, user records, visit data or photo data are changed. Existing pending-revision merging, serialized writes, server acknowledgement status and explicit error/retry are retained. Timing storage is browser-tested with Firebase fixtures; no production administrator credentials were used.

## Verified media and checks

- Original audio unchanged: SHA256 `56c53e3e1cd31b228d4a97358bcaf7d4abd96d370e858aa2a58a7b82e93778f4`; MP3, 269.4 seconds, stereo/48kHz. FFmpeg decodes the complete audio stream without errors.
- `tests/unified-music.cjs`: real Palman and legacy playback, real duration/time progress, complete lyrics, one player/list and zero music tabs, no public timing tools, sharing/deep links/detail links, no reset on reopen and no initial audio requests.
- `tests/palman-admin-lyrics.cjs`: original lyric text match; guest/member/admin/logout access; per-line capture/next; independent edits; global offset compatibility; rejected save/retry; separate anonymous view receiving the same public timing and highlight. Its audio route supports byte-range responses like the production server.
- `tests/music-sync-layout.cjs`: existing numeric offsets and save-race protection, live public updates, retry, header bounds and preserved course order.
- `tests/atlas-temple-music.cjs`: temple-specific story/music links and catalog lyrics with a fixture song.

Initial Palman lyric text is available to everyone. Exact line timing is set by the administrator against the real recording; until then untimed lines remain readable without an inaccurate moving highlight.
