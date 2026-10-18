/* Firebase emulator only. Full merged rules; no real identities or production credentials. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const req = require('node:module').createRequire(path.join(
  process.env.SANSA_FIREBASE_DEPS || '/tmp/sansa-firebase', 'package.json'));
const { initializeTestEnvironment, assertSucceeds, assertFails } = req('@firebase/rules-unit-testing');
const { ref, set, get, update, remove, runTransaction } = req('firebase/database');
const PROJECT = 'demo-sansa-note';
assert(PROJECT.startsWith('demo-'));
assert.equal(process.env.FIREBASE_DATABASE_EMULATOR_HOST, '127.0.0.1:9900', 'Run through emulators:exec on loopback only');
assert.equal(process.env.GCLOUD_PROJECT || PROJECT, PROJECT);
assert(!process.env.GOOGLE_APPLICATION_CREDENTIALS, 'Production credential files must not be used');
assert(!process.env.FIREBASE_TOKEN, 'Firebase credentials must not be used');
const fullRules = path.resolve(__dirname, '../firebase/production-with-secret-atlas.rules.json');
const rules = fs.readFileSync(fullRules, 'utf8');
if (process.env.SANSA_FIREBASE_DEPS) {
  assert.equal(fs.readFileSync(path.join(process.env.SANSA_FIREBASE_DEPS, 'merged.rules.json'), 'utf8'), rules,
    'CLI must load a byte-identical copy of the full merged rules');
}
console.log('Rules SHA256 ' + createHash('sha256').update(rules).digest('hex'));
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log('PASS ' + name); return true; }
  catch (error) {
    console.error('FAIL ' + name);
    if (process.env.CI) {
      const detail = (name + ': ' + error.stack).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
      console.error('::error title=Firebase rules assertion::' + detail);
    }
    failures.push({ name, message: error.message });
    return false;
  }
}
async function diagnoseCompleted() {
  const variants = [
    ['original', () => {}],
    ['capturing-group', c => { c.completed.$scene['.validate'] = c.completed.$scene['.validate'].replace('(?:', '('); }],
    ['without-key-regex', c => { const v = c.completed.$scene['.validate']; c.completed.$scene['.validate'] = v.slice(v.indexOf(' && ') + 4); }],
    ['without-child-validation', c => { c.completed.$scene['.validate'] = 'true'; }],
    ['without-container-validation', c => { c.completed['.validate'] = 'true'; }]
  ];
  const results = [];
  for (const [index, [name, change]] of variants.entries()) {
    const copy = JSON.parse(rules);
    change(copy.rules.users.$uid.secretAtlas['haeinsa-001']);
    const diagnostic = await initializeTestEnvironment({
      projectId: PROJECT + '-diag-' + index,
      database: { host: '127.0.0.1', port: 9900, rules: JSON.stringify(copy) }
    });
    try {
      const db = diagnostic.authenticatedContext('alice', { email: 'alice@example.test' }).database();
      const at = Date.now();
      try {
        const base = 'users/alice/secretAtlas/haeinsa-001';
        const patch = {};
        for (let i = 1; i <= 12; i++) patch['completed/' + i] = at;
        await update(ref(db, base), patch);
        if (name === 'capturing-group') {
          await assertFails(set(ref(db, base + '/completed/0'), at));
          await assertFails(set(ref(db, base + '/completed/13'), at));
          for (let i = 1; i <= 3; i++) await assertSucceeds(set(ref(db, base + '/cards/' + String(i).padStart(3, '0')), at));
        }
        results.push({ variant: name, completedWrite: 'accepted', ...(name === 'capturing-group' ? { cardsAcquired: 3, outOfRangeDenied: true } : {}) });
      } catch (error) { results.push({ variant: name, completedWrite: 'rejected', code: error.code }); }
    } finally { await diagnostic.cleanup(); }
  }
  console.log('DIAGNOSTIC in-memory full-rules clones only; original files unchanged: ' + JSON.stringify(results));
  if (process.env.CI) console.log('::notice title=Completed-rule diagnosis::' + JSON.stringify(results));
}
(async () => {
  const env = await initializeTestEnvironment({
    projectId: PROJECT, database: { host: '127.0.0.1', port: 9900, rules }
  });
  try {
    await env.clearDatabase();
    const legacy = { name: '조계사', stage: 1, visits: { visited: { verified: true, ts: 123 } },
      photos: { photo: { url: 'https://example.invalid/legacy.jpg' } } };
    await env.withSecurityRulesDisabled(async ctx =>
      set(ref(ctx.database(), 'users/alice/destinations/legacy108'), legacy));
    const alice = env.authenticatedContext('alice', { email: 'alice@example.test' }).database();
    const bob = env.authenticatedContext('bob', { email: 'bob@example.test' }).database();
    const admin = env.authenticatedContext('admin', { email: 'song4mi12@gmail.com' }).database();
    const guest = env.unauthenticatedContext().database();
    const base = 'users/alice/secretAtlas/haeinsa-001';
    const other = 'users/bob/secretAtlas/haeinsa-001';
    const stamp = Date.now();
    const note = text => ({ text, at: stamp });

    await check('A and B own progress/note save and restore', async () => {
      for (const [db, location, scene, text] of [[alice, base, 5, 'A 기록'], [bob, other, 7, 'B 기록']]) {
        await assertSucceeds(update(ref(db, location), {
          version: 1, position: { scene, at: stamp }, note: note(text), lastReadAt: stamp
        }));
        assert.equal((await get(ref(db, location + '/position/scene'))).val(), scene);
        assert.equal((await get(ref(db, location + '/note/text'))).val(), text);
      }
    });
    await check('Both directions of cross-account read/write denied; guest denied', async () => {
      for (const [db, location] of [[bob, base], [alice, other], [guest, base]]) {
        await assertFails(get(ref(db, location)));
        await assertFails(set(ref(db, location + '/note'), note('intrusion')));
      }
      await assertFails(get(ref(alice, 'users')));
    });
    await check('Existing admin read exception retained without cross-user write', async () => {
      await assertSucceeds(get(ref(admin, 'users')));
      await assertSucceeds(get(ref(admin, base)));
      await assertFails(set(ref(admin, base + '/note'), note('admin cross-write')));
      await assertSucceeds(set(ref(alice, 'users/alice/profile'), { nickname: 'legacy-preserved' }));
      await assertFails(set(ref(bob, 'users/alice/profile'), { nickname: 'intrusion' }));
    });
    await check('Invalid scene, timestamp, types, note length and unknown fields rejected', async () => {
      const bad = [
        ['/version', 2], ['/position', { scene: 12, at: stamp }],
        ['/position', { scene: 1.5, at: stamp }], ['/position', { scene: 0, at: -1 }],
        ['/lastReadAt', stamp + 172800000], ['/unknown', 'no'], ['/completed', 42],
        ['/completed/0', stamp], ['/cards', 'invalid'], ['/answers', 'invalid'],
        ['/note', { text: 'x'.repeat(10001), at: stamp }], ['/note', { at: stamp }],
        ['/answers/q1', { selection: 'invalid', correct: true, at: stamp, attempts: 1 }],
        ['/answers/q1', { selection: { 0: 1, 2: 0 }, correct: true, at: stamp, attempts: 1 }],
        ['/answers/q1', { selection: [9], correct: true, at: stamp, attempts: 1 }],
        ['/answers/q7', { selection: [1], correct: true, at: stamp, attempts: 1 }]
      ];
      for (const [suffix, value] of bad) {
        try { await assertFails(set(ref(alice, base + suffix), value)); }
        catch (error) { throw new Error('Invalid data unexpectedly accepted at ' + suffix + ': ' + JSON.stringify(value).slice(0, 120), { cause: error }); }
      }
      await assertSucceeds(set(ref(alice, base + '/note'), note('')));
      await assertSucceeds(set(ref(alice, base + '/note'), note('A 기록')));
    });
    const acquisitionPassed = await check('All three cards require four completed scenes and retain first timestamp', async () => {
      for (let part = 1; part <= 3; part++) {
        const id = String(part).padStart(3, '0');
        await assertFails(set(ref(alice, base + '/cards/' + id), stamp));
        const patch = {};
        for (let i = (part - 1) * 4 + 1; i <= part * 4; i++) patch['completed/' + i] = stamp;
        // Match store.flush(): persist completed scenes before acquiring the card.
        try { await assertSucceeds(update(ref(alice, base), patch)); }
        catch (cause) { throw new Error('Part ' + part + ' valid completed-scene write rejected', { cause }); }
        try { await assertSucceeds(set(ref(alice, base + '/cards/' + id), stamp)); }
        catch (cause) { throw new Error('Part ' + part + ' card rejected after completed scenes persisted', { cause }); }
        await assertSucceeds(set(ref(alice, base + '/cards/' + id), stamp));
        await assertFails(set(ref(alice, base + '/cards/' + id), stamp + 1));
      }
      assert.equal(Object.keys((await get(ref(alice, base + '/cards'))).val()).length, 3);
    });
    if (!acquisitionPassed) await diagnoseCompleted();
    // Independent existing-card fixtures: do not turn a failed acquisition into a pass.
    await env.withSecurityRulesDisabled(async ctx => {
      const patch = {};
      for (let i = 1; i <= 12; i++) patch['completed/' + i] = stamp;
      for (let i = 1; i <= 3; i++) patch['cards/' + String(i).padStart(3, '0')] = stamp;
      await update(ref(ctx.database(), base), patch);
    });
    await check('Existing-card fixture concurrent transactions remain idempotent', async () => {
      const second = env.authenticatedContext('alice', { email: 'alice@example.test' }).database();
      await Promise.all([
        runTransaction(ref(alice, base + '/cards/001'), old => old || stamp + 1),
        runTransaction(ref(second, base + '/cards/001'), old => old || stamp + 2)
      ]);
      assert.equal((await get(ref(alice, base + '/cards/001'))).val(), stamp);
    });
    await check('Answers save; fresh emulator session restores progress and note', async () => {
      await assertSucceeds(set(ref(alice, base + '/answers/q1'), {
        selection: [1, 2, 0], correct: true, at: stamp, attempts: 2
      }));
      const fresh = env.authenticatedContext('alice', { email: 'alice@example.test' }).database();
      assert.equal((await get(ref(fresh, base + '/note/text'))).val(), 'A 기록');
      assert.equal((await get(ref(fresh, base + '/position/scene'))).val(), 5);
      assert.deepEqual((await get(ref(fresh, base + '/answers/q1/selection'))).val(), [1, 2, 0]);
    });
    await check('Field stamp references only same-owner existing verified Haeinsa visit', async () => {
      const field = { templeId: 'h', visitId: 'v', at: 123 };
      await assertFails(set(ref(alice, base + '/fieldVerification'), field));
      await env.withSecurityRulesDisabled(async ctx => set(ref(ctx.database(), 'users/alice/destinations/h'), {
        name: '해인사', visits: { v: { verified: true, ts: 123 }, no: { verified: false, ts: 124 } }
      }));
      await assertSucceeds(set(ref(alice, base + '/fieldVerification'), field));
      await assertFails(set(ref(alice, base + '/fieldVerification'), { ...field, visitId: 'no' }));
      await assertFails(set(ref(alice, base + '/fieldVerification'), { ...field, templeId: 'legacy108', visitId: 'visited' }));
      await assertFails(set(ref(bob, other + '/fieldVerification'), field));
    });
    await check('Shared lyric, verification point and photo control permissions preserved', async () => {
      for (const item of ['photoUploadControl', 'lyricSync', 'templeVerifyPoints']) {
        await assertSucceeds(set(ref(admin, 'shared/' + item), { test: true }));
        await assertFails(set(ref(alice, 'shared/' + item), { test: false }));
        await assertSucceeds(get(ref(alice, 'shared/' + item)));
      }
      await assertSucceeds(get(ref(guest, 'shared/lyricSync')));
      await assertSucceeds(get(ref(guest, 'shared/templeVerifyPoints')));
      await assertFails(get(ref(guest, 'shared/photoUploadControl')));
    });
    await check('Community post/comment ownership and report/admin rules preserved', async () => {
      await assertSucceeds(set(ref(alice, 'community/posts/test'), { uid: 'alice', text: 'post' }));
      await assertFails(set(ref(bob, 'community/posts/test'), { uid: 'bob', text: 'intrusion' }));
      await assertSucceeds(update(ref(alice, 'community/posts/test'), { text: 'edited' }));
      await assertSucceeds(update(ref(admin, 'community/posts/test'), { text: 'moderated' }));
      await assertSucceeds(get(ref(guest, 'community/posts')));
      await assertSucceeds(set(ref(alice, 'community/comments/test/comment'), { uid: 'alice', text: 'comment' }));
      await assertFails(set(ref(bob, 'community/comments/test/comment'), { uid: 'bob', text: 'intrusion' }));
      await assertSucceeds(update(ref(admin, 'community/comments/test/comment'), { text: 'moderated' }));
      await assertSucceeds(get(ref(guest, 'community/comments')));
      await assertSucceeds(set(ref(alice, 'community/reports/report'), { reason: 'test' }));
      await assertFails(get(ref(alice, 'community/reports')));
      await assertSucceeds(get(ref(admin, 'community/reports')));
      await assertFails(set(ref(guest, 'community/reports/report2'), { reason: 'test' }));
    });
    await check('Leaderboard authenticated read and owner-only score writes preserved', async () => {
      await assertSucceeds(set(ref(alice, 'leaderboards/beatShooter/alice'), { score: 42 }));
      await assertFails(set(ref(bob, 'leaderboards/beatShooter/alice'), { score: 99 }));
      await assertSucceeds(get(ref(bob, 'leaderboards/beatShooter')));
      await assertFails(get(ref(guest, 'leaderboards/beatShooter')));
    });
    await check('Partial card/dependency deletion denied while optional-node deletion allowed', async () => {
      await assertFails(remove(ref(alice, base + '/cards/001')));
      await assertFails(remove(ref(alice, base + '/cards')));
      await assertFails(remove(ref(alice, base + '/completed/1')));
      await assertFails(remove(ref(alice, base + '/note/text')));
      await assertSucceeds(remove(ref(alice, base + '/answers/q1')));
      await assertSucceeds(remove(ref(alice, base + '/fieldVerification')));
      await assertSucceeds(remove(ref(alice, base + '/note')));
    });
    await check('Future episode not blocked; existing visit/photo/108 source record untouched', async () => {
      const future = 'users/alice/secretAtlas/future-test';
      await assertSucceeds(set(ref(alice, future), { schemaNotDefinedYet: true }));
      await assertFails(get(ref(bob, future)));
      await assertFails(set(ref(bob, future), { intrusion: true }));
      assert.deepEqual((await get(ref(alice, 'users/alice/destinations/legacy108'))).val(), legacy);
    });
    await check('Whole-episode deletion allowed by inherited owner write, denied to other user', async () => {
      await assertFails(remove(ref(bob, base)));
      await assertSucceeds(remove(ref(alice, base)));
      assert.equal((await get(ref(alice, base))).val(), null);
      assert.deepEqual((await get(ref(alice, 'users/alice/destinations/legacy108'))).val(), legacy);
      assert.equal((await get(ref(bob, other + '/note/text'))).val(), 'B 기록');
    });
    if (failures.length) {
      console.error('FAIL full-rules suite: ' + failures.length + '/14 scenario(s): ' + JSON.stringify(failures));
      process.exitCode = 1;
    } else console.log('PASS all 14 full-rules emulator scenarios; no production access or deployment');
  } finally { await env.cleanup(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
