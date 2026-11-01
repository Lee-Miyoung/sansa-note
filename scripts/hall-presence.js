/* Reads server aggregates only. Never downloads other users' UID/session lists. */
((root) => {
  'use strict';
  const HALLS = ['daewung','geungnak','gwanum','munsu','yaksa','jijang'];
  function validCounts(v, now) {
    return v?.schemaVersion === 1 && v.scope === 'google-unique' &&
      Number.isInteger(v.count) && v.count >= 0 && Number.isInteger(v.sessions) && v.sessions >= v.count &&
      Number.isFinite(v.asOf) && now - v.asOf < 90000 && v.asOf <= now + 5000;
  }
  function createPresence({ database, timestamp, now = Date.now, onChange = () => {}, schedule=setInterval, unschedule=clearInterval }) {
    let generation = 0, hall = null, user = null, config = null, counts = null, connected = false;
    let active = true, session = null, heartbeat = 0, freshness = 0, listeners = [], lastWrite = 0;
    function emit() {
      const live = connected && config?.enabled === true && validCounts(counts, now());
      onChange(live ? { state: 'live', count: counts.count, sessions: counts.sessions,
        metric: config.metric === 'sessions' ? 'sessions' : 'users', scope: counts.scope } : { state: 'unavailable' });
    }
    async function removeSession() {
      unschedule(heartbeat); heartbeat = 0;
      const previous = session; session = null;
      if (previous?.ref && previous.disconnect) {
        try { await previous.ref.transaction(value=>value?.id===previous.id?null:undefined); await previous.disconnect.cancel(); }
        catch (_) { /* Keep onDisconnect armed on denial; server TTL excludes stale sessions. */ }
      }
    }
    function watch(ref, fn) {
      const token=generation;ref.on('value', fn, () => { if(token!==generation)return;counts = null; emit(); void removeSession(); });
      listeners.push(() => ref.off('value', fn));
    }
    async function reconcile() {
      emit();
      const eligible = active && connected && config?.enabled === true && validCounts(counts, now()) && user?.google === true;
      if (!eligible) { await removeSession(); return; }
      if (session) return;
      const token = generation, id = root.crypto.randomUUID();
      const current = { id, ref: null, disconnect: null }; session = current;
      try {
        // Fixed private slots bound writes per Google UID; a reservation is not counted online.
        for (const slot of ['a','b','c']) {
          const ref = database.ref(`onlineSansaPresence/sessions/${hall}/${user.uid}/${slot}`);
          if (typeof ref.onDisconnect !== 'function') { session=null; return; }
          const result = await ref.transaction(value => value && value.phase!=='offline' && value.updatedAt>now()-120000 ? undefined : {id,phase:'reserved',updatedAt:timestamp});
          if (result.committed) { current.ref=ref; break; }
        }
        if (!current.ref) { if(session===current)session=null; return; }
        current.disconnect=current.ref.onDisconnect();
        // An old device's disconnect cannot erase a reclaimed slot: the rule checks the session ID.
        await current.disconnect.set({id,phase:'offline',updatedAt:timestamp});
        if (generation!==token || !active || session!==current) {
          await current.ref.transaction(v=>v?.id===id?null:undefined);await current.disconnect.cancel();return;
        }
        await current.ref.set({id,phase:'online',updatedAt:timestamp});
        if (generation!==token || !active || session!==current) {
          await current.ref.transaction(v=>v?.id===id?null:undefined);await current.disconnect.cancel();return;
        }
        lastWrite=now();
        heartbeat=schedule(async()=>{
          if(generation!==token || session!==current || !active || now()-lastWrite<40000)return;
          lastWrite=now();
          try { await current.ref.transaction(v=>v?.id===id?{id,phase:'online',updatedAt:timestamp}:undefined); }
          catch(_){if(generation===token&&session===current){counts=null;emit();await removeSession();}}
        },45000);
      } catch (_) { if(generation===token){if(session===current)session=null;counts=null;emit();} }
    }

    async function leave() {
      generation++; listeners.splice(0).forEach(off => off()); unschedule(freshness);
      hall = null; counts = null; config = null; connected = false; emit();await removeSession();
    }
    async function enter(id, identity) {
      const requested=generation+1;await leave(); if (generation!==requested||!HALLS.includes(id)) return;
      hall = id; user = identity; const token = generation;
      watch(database.ref('onlineSansaPresence/config'), s => { if (generation !== token) return; config = s.val(); void reconcile(); });
      watch(database.ref(`onlineSansaPresence/aggregates/${id}/public`), s => { if (generation !== token) return; counts = s.val(); void reconcile(); });
      watch(database.ref('.info/connected'), s => { if (generation !== token) return; connected = s.val() === true; void reconcile(); });
      freshness = schedule(() => { emit(); if (!validCounts(counts, now())) void removeSession(); }, 15000);
    }
    return { enter, leave, setActive(value) { active = value; void reconcile(); },
      get state() { return { hall, registered: !!session, connected }; } };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { createPresence, validCounts }; return; }
  root.SansaPresence = { createPresence, validCounts };
  const hallNode = document.getElementById('dharmaHallOverlay'); if (!hallNode) return;
  const label = document.createElement('p'); label.id = 'hallPresence'; label.className = 'hall-presence';label.setAttribute('aria-description','Google 로그인 고유 참여자만 집계합니다. 비로그인 이용자는 포함하지 않으며 계정당 최대 3개 활성 접속 세션(탭·브라우저)을 집계합니다. 화면을 숨기거나 10분간 조작하지 않으면 집계에서 빠집니다.'); label.setAttribute('role','status'); label.textContent = '참여 인원 확인 중';
  hallNode.querySelector('.hall-mode-line').after(label);
  // Keep production closed until live ancestor rules, demo security tests and billing limits are verified.
  const PRODUCTION_READY = false;
  if(!PRODUCTION_READY)return;
  let client, identity = null, key = '', authGeneration = 0, lastActivity=Date.now();
  const refreshActivity=()=>{lastActivity=Date.now();client?.setActive(!document.hidden);};
  hallNode.addEventListener('pointerdown',refreshActivity,{passive:true});hallNode.addEventListener('keydown',refreshActivity);
  let idleTimer;function startIdleTimer(){clearInterval(idleTimer);idleTimer=setInterval(()=>client?.setActive(!document.hidden&&Date.now()-lastActivity<600000),15000);}
  startIdleTimer();
  function update() {
    if (!client) return;
    const state = root.SansaDharmaHall.state, visible = hallNode.classList.contains('show') && !state.completed;
    const next = visible && state.hallId ? `${root.SansaDharmaHall.experience.serial}:${state.hallId}:${identity?.uid || 'guest'}` : '';
    if (next === key) return; key = next;
    if (next){lastActivity=Date.now();void client.enter(state.hallId,identity);client.setActive(!document.hidden);}else void client.leave();
  }
  Promise.resolve(root.sansaFirebaseReady).then(() => {
    if (!root.firebase?.apps?.length) return;
    client = createPresence({ database: firebase.database(), timestamp: firebase.database.ServerValue.TIMESTAMP,
      now: () => root.SansaClock?.now() ?? Date.now(), onChange(value) {
        label.dataset.state = value.state;
        label.textContent = value.state === 'live' ? value.metric === 'sessions' ? `지금 함께하는 로그인 접속 세션 ${value.sessions}개 · 고유 참여자 ${value.count}명` : `지금 함께하는 로그인 참여자 ${value.count}명 · 접속 세션 ${value.sessions}개` : '참여 인원 확인 중';
      }
    });
    firebase.auth().onAuthStateChanged(async user => {
      const token = ++authGeneration; identity = null; key = ''; update();
      if (user) { try { const result = await user.getIdTokenResult(); if (token !== authGeneration) return;
        identity = { uid: user.uid, google: result.claims.email_verified === true && result.claims.firebase?.sign_in_provider === 'google.com' };
      } catch (_) { /* Guest prayer remains available. */ } }
      if (token === authGeneration) { key = ''; update(); }
    });
    const original = root.SansaHallUX.render; root.SansaHallUX.render = () => { original(); update(); };
    update();
  }).catch(() => {});
  new MutationObserver(update).observe(hallNode, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', () => {if(!document.hidden)lastActivity=Date.now();client?.setActive(!document.hidden);});
  root.addEventListener('pagehide', () => { clearInterval(idleTimer);key = ''; void client?.leave(); });
  root.addEventListener('pageshow', () => { startIdleTimer();lastActivity=Date.now();key = ''; update(); });
})(typeof window === 'undefined' ? globalThis : window);
