/* Entry points reuse the existing rooms and their storage/authentication policies. */
(() => {
  'use strict';
  const room = document.createElement('section');
  room.id = 'mindRestOverlay'; room.className = 'overlay'; room.setAttribute('aria-hidden', 'true');
  room.innerHTML = `<div class="modal mind-rest-modal" role="dialog" aria-modal="true" aria-labelledby="mindRestTitle"><header class="modal-head"><div><h2 id="mindRestTitle">마음 쉬어가기</h2><p>지금 필요한 작은 쉼을 골라보세요.</p></div><button type="button" class="close-x" id="mindRestClose" aria-label="마음 쉬어가기 닫기">×</button></header><div class="modal-body"><nav id="mindRestChoices" aria-label="마음 돌봄 기능"></nav><p class="mind-rest-note">기존 명상과 기록을 그대로 이용합니다. 개인 기록 저장에는 Google 로그인이 필요합니다.</p></div></div>`;
  document.body.append(room);
  let opener;
  function close() { room.classList.remove('show'); room.setAttribute('aria-hidden', 'true'); if (opener?.isConnected) opener.focus(); }
  const actions = [
    ['마음고민처방', '고민을 고르거나 직접 이야기해요', () => window.openOracleOverlay()],
    ['호흡 명상', '편안하게 들이쉬고 내쉬어요', () => window.openBreathOverlay('counting')],
    ['필사', '한 문장을 천천히 옮겨 적어요', null, '/copy/index.html'],
    ['목탁', '한 번씩 두드리며 마음을 모아요', () => window.openMoktakOverlay()],
    ['염주', '기존 염불·염주 계수로 함께해요', () => window.openMantraOverlay()],
    ['마음 기록', '기존 나의 발원문에 마음을 남겨요', () => window.openVowOverlay()],
    ['명상 소리', '호흡 공간에서 소리를 직접 골라요', () => { window.openBreathOverlay('counting'); document.getElementById('meditationSound')?.focus(); }],
    ['음악방', '기존 음악과 플레이리스트를 들어요', () => window.openPlaylistOverlay()]
  ];
  for (const [title, description, action, href] of actions) {
    const b = document.createElement(href ? 'a' : 'button');
    if (href) b.href = href; else b.type = 'button';
    const h = document.createElement('b'), p = document.createElement('span');
    h.textContent = title; p.textContent = description; b.append(h, p);
    if (action) b.onclick = () => { close(); action(); };
    document.getElementById('mindRestChoices').append(b);
  }
  window.openMindRest = () => {
    opener = document.activeElement;
    room.classList.add('show'); room.setAttribute('aria-hidden', 'false');
    document.getElementById('mindRestClose').focus();
  };
  document.getElementById('mindRestClose').onclick = close;
  room.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') {
      const nodes = [...room.querySelectorAll('button,a')], first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first || !e.shiftKey && document.activeElement === last) {
        e.preventDefault(); (e.shiftKey ? last : first).focus();
      }
    }
  });
  const left = document.querySelector('.sansa-home-rest');
  if (left) { left.onclick = () => window.openMindRest(); left.querySelector('small').textContent = '명상 · 마음고민처방 · 필사 · 마음 기록'; }
  document.querySelector('.sansa-home-temple small').textContent = '법당에 들어가 합장하고 마음을 모으는 시간';

  // Courtyard onboarding stays compact and can always be reopened.
  const courtyard = document.getElementById('onlineSansaOverlay'), body = courtyard.querySelector('.modal-body');
  const welcome = document.createElement('section'); welcome.id = 'sansaFirstVisit';
  welcome.innerHTML = `<h3>처음 오셨나요?</h3><p>먼저 법당을 고르고 자리에 앉아보세요. 합장과 염불을 함께하며 천천히 마음을 모을 수 있습니다.</p><div><button type="button" id="sansaFirstPractice">처음 예불 체험하기</button><button type="button" id="sansaFindWish">염원에 맞는 법당 찾기</button><button type="button" id="sansaBrowse">법당 둘러보기</button></div>`;
  body.prepend(welcome);
  const again = document.createElement('button'); again.id = 'sansaWelcomeAgain'; again.type = 'button'; again.textContent = '? 처음 이용 안내';
  courtyard.querySelector('.modal-head>div').append(again);
  again.onclick = () => { welcome.hidden = false; body.scrollTop = 0; };
  document.getElementById('sansaFirstPractice').onclick = async () => { await SansaOnlineSansa.ready; SansaOnlineSansa.enter('daewung', { kind: 'free', duration: null }); };
  document.getElementById('sansaFindWish').onclick = () => { welcome.hidden = true; document.getElementById('sansaByWish').click(); document.getElementById('sansaWishes').querySelector('button')?.focus(); };
  document.getElementById('sansaBrowse').onclick = () => { welcome.hidden = true; document.getElementById('sansaByHall').click(); courtyard.querySelector('.sansa-building')?.focus(); };

  const summary = document.getElementById('hallSummary');
  const links = document.createElement('div'); links.className = 'hall-after-actions';
  for (const [label, action] of [
    ['잠시 더 머물기', () => { const h = SansaDharmaHall.experience.hall; if (h) SansaDharmaHall.openHall(h, { kind: 'free', duration: null }); }],
    ['마음고민처방 받기', () => { SansaDharmaHall.close(); window.openOracleOverlay(); }],
    ['오늘의 마음 기록하기', () => { SansaDharmaHall.close(); window.openVowOverlay(); }]
  ]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = action; links.append(b); }
  summary.append(links);
})();
