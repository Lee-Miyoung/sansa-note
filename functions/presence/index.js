/* Deploy separately after merging and emulator-testing the additive rules. */
'use strict';
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { HALLS, TTL_MS, countSessions, shouldAggregate } = require('./count.cjs');
initializeApp();
const REGION = 'asia-southeast1';
async function aggregate(hallId, eventTime = Date.now()) {
  if (!HALLS.includes(hallId)) return;
  const database = getDatabase(), now = Date.now();
  const snapshot = await database.ref(`onlineSansaPresence/sessions/${hallId}`).get();
  const counts = countSessions(snapshot.val(), now);
  // Newer trigger snapshots win over delayed retries. UID/session details never enter this path.
  await database.ref(`onlineSansaPresence/aggregates/${hallId}`).transaction(current => {
    if ((current?.version || 0) > eventTime) return;
    return { version: eventTime, public: counts };
  });
}
exports.sansaPresenceChanged = onValueWritten({
  ref: '/onlineSansaPresence/sessions/{hallId}/{uid}/{sessionId}/phase',
  region: REGION, maxInstances: 2, concurrency: 1, retry: false
}, event => {
  // Heartbeat timestamp changes do not trigger fan-out to every viewer.
  if (!shouldAggregate(event.data.before.val(),event.data.after.val())) return;
  return aggregate(event.params.hallId,Date.parse(event.time));
});
exports.sansaPresenceCleanup = onSchedule({
  schedule: 'every 1 minutes', region: REGION, maxInstances: 1, timeoutSeconds: 60, retryCount: 0
}, async () => {
  const db = getDatabase(), now = Date.now();
  for (const hallId of HALLS) {
    const snapshot = await db.ref(`onlineSansaPresence/sessions/${hallId}`).get(), updates = {};
    for (const [uid, sessions] of Object.entries(snapshot.val() || {})) {
      for (const [id, s] of Object.entries(sessions || {})) {
        if (!s || !Number.isFinite(s.updatedAt) || s.updatedAt <= now - TTL_MS || s.updatedAt > now + 5000)
          updates[`${uid}/${id}`] = null;
      }
    }
    if (Object.keys(updates).length) await snapshot.ref.update(updates);
    await aggregate(hallId, now);
  }
});
