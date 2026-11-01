'use strict';
const HALLS = ['daewung', 'geungnak', 'gwanum', 'munsu', 'yaksa', 'jijang'];
const TTL_MS = 120000;
function countSessions(records, now) {
  let count = 0, sessions = 0;
  for (const entries of Object.values(records || {})) {
    const live = Object.values(entries || {}).filter(s => s && s.phase === 'online' &&
      Number.isFinite(s.updatedAt) && s.updatedAt <= now + 5000 && s.updatedAt > now - TTL_MS);
    if (live.length) count++;
    sessions += live.length;
  }
  return { schemaVersion: 1, scope: 'google-unique', count, sessions, asOf: now };
}
function shouldAggregate(before,after){return before!==after&&(before==='online'||after==='online');}
module.exports = { HALLS, TTL_MS, countSessions, shouldAggregate };
