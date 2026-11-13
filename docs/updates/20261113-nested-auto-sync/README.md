# Nested temple music room and one-cue approximate synchronization

The home screen again exposes only 극락왕생 플레이리스트. Inside that screen, an entry opens 산사 음악방; the child screen provides a clear return to 극락왕생 플레이리스트. The original five songs and temple songs retain separate lists, matching visual design and the existing single audio engine. No category tab bar is added. Haeinsa remains explicit in the child song row and selected title.

## Automatic timing

The administrator selects any lyric line at its real playback start and uses “이 줄 기준으로 전체 자동 맞춤”. The application fills the whole timeline, automatically saves it publicly, and retains an explicit save/retry button. One cue is sufficient; additional cues refine the intervals while retaining compatible previous manual cues. Impossible conflicting old cues are discarded in favor of the newly selected cue, keeping the result chronological.

This is approximate arithmetic alignment, not speech recognition. Fully timed legacy lyrics supply their existing baseline. Untimed lyrics use track duration, visible lyric length and small section-heading weights; start/end bounds limit the result to the track. Piecewise interpolation between manual cues and track endpoints generates the remaining starts. Captured cue values remain exact; generated times round to tenths of a second. Regular listeners only see moving lyrics, not administrator controls or estimation diagnostics.

Numeric offsets remain in the existing `shared/lyricSync/<title>` path. The complete generated table remains in `__lineTimesV1/<title>` for compatibility, with manual cues separately stored in `__lineAnchorsV1/<title>` inside the same administrator-protected subtree. Both arrays and objects are supported. Saving these fields uses one atomic multi-location update and preserves the existing pending-revision/serialized-write/retry behavior. No database rules or existing records are migrated. Previously saved sparse manual cues also yield a read-only inferred timeline for current viewers without rewriting server data.

## Validation

- `tests/lyric-timing.cjs`: one cue fills all lines, exact cues and piecewise refinement, chronological bounds, conflicting-cue repair, offsets, weighted lyrics, empty/sparse input.
- `tests/auto-lyric-sync.cjs`: playlist→temple room→parent; one Palman cue fills 78 starts; second cue retains the first and refines intervening lines; atomic manual/generated storage, Firebase array snapshots, anonymous moving highlights and old sparse-cue fallback.
- `tests/palman-admin-lyrics.cjs`: real media play/seek, admin/guest/member/logout access, retry, exact source lyrics and anonymous public timing.
- `tests/separate-music-live-sync.cjs`: nested entry, separate lists, 320/390/1440 bounds, live public updates, Back/Forward and independent auth/public subscription.
- `tests/unified-music.cjs`: real Palman/legacy playback, no home audio request/autoplay, share/deep links/detail links and same-song reopen.

Production administrator writes were not performed; persistence uses the browser Firebase fixture. Runtime deployment verification separately compares published files. Audio and source lyrics are unchanged.
