(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  const els = {
    titleHanja: $('#titleHanja'),
    titleKo: $('#titleKo'),
    subtitle: $('#subtitle'),
    mainQuote: $('#mainQuote'),
    explanation: $('#explanation'),
    copyGuide: $('#copyGuide'),
    question: $('#question'),
    source: $('#source'),
    verticalHanja: $('#verticalHanja'),
    currentNumber: $('#currentNumber'),

    copyText: $('#copyText'),
    memoText: $('#memoText'),

    doneCount: $('#doneCount'),
    progressBar: $('#progressBar'),
    lotusRow: $('#lotusRow'),

    contentList: $('#contentList'),
    listSheet: $('#listSheet'),
    sheetBackdrop: $('#sheetBackdrop'),

    completeOverlay: $('#completeOverlay')
  };

  if (!Array.isArray(window.COPY_CONTENTS) || !window.COPY_CONTENTS.length) {
    console.error('COPY_CONTENTS를 불러오지 못했습니다.');

    document.body.insertAdjacentHTML(
      'afterbegin',
      `
      <div style="
        padding:16px;
        background:#fff3cd;
        color:#5b4615;
        text-align:center;
        font-size:14px;
      ">
        필사 콘텐츠를 불러오지 못했습니다. contents.js를 확인해주세요.
      </div>
      `
    );

    return;
  }

  const contents = window.COPY_CONTENTS;

  const validIds = new Set(
    contents.map(item => Number(item.id))
  );

  const queryId = Number(
    new URLSearchParams(location.search).get('id')
  );

  let currentId = validIds.has(queryId)
    ? queryId
    : Number(contents[0].id);

  let listRenderedForSignature = '';
  let saveTimer = 0;

  /* =========================================================
     기본 유틸
  ========================================================= */

  function safeParse(raw) {
    if (!raw) return {};

    try {
      return JSON.parse(raw) || {};
    } catch (error) {
      return {};
    }
  }

  function currentContent() {
    return (
      contents.find(
        item => Number(item.id) === Number(currentId)
      ) || contents[0]
    );
  }

  function storageKey(id) {
    return `sansanote_copy_${id}`;
  }

  function getSaved(id) {
    return safeParse(
      localStorage.getItem(storageKey(id))
    );
  }

  function getCompletedIds() {
    const result = [];

    for (const content of contents) {
      const saved = getSaved(content.id);

      if (saved.completed) {
        result.push(Number(content.id));
      }
    }

    return result;
  }

  function updateUrl(id) {
    const url = new URL(location.href);

    url.searchParams.set('id', String(id));

    history.replaceState(
      { id },
      '',
      url.pathname + url.search
    );
  }

  /* =========================================================
     진행률 표시
  ========================================================= */

  function updateVisualProgress() {
    const completed = getCompletedIds();

    const done = completed.length;
    const total = contents.length;

    if (els.doneCount) {
      els.doneCount.textContent = String(done);
    }

    if (els.progressBar) {
      const percent = Math.max(
        0,
        Math.min(
          100,
          (done / total) * 100
        )
      );

      els.progressBar.style.width = `${percent}%`;
    }

    if (els.lotusRow) {
      const totalDots = 14;

      const filled = Math.round(
        (done / total) * totalDots
      );

      const frag = document.createDocumentFragment();

      for (let i = 0; i < totalDots; i++) {
        const span = document.createElement('span');

        span.className =
          'lotus-dot' +
          (i < filled ? ' done' : '');

        span.textContent = '🪷';

        frag.appendChild(span);
      }

      els.lotusRow.replaceChildren(frag);
    }
  }

  /* =========================================================
     현재 필사 렌더링
  ========================================================= */

  function renderContent({ scroll = false } = {}) {
    const content = currentContent();

    currentId = Number(content.id);

    if (els.titleHanja) {
      els.titleHanja.textContent =
        content.hanja || '';
    }

    if (els.titleKo) {
      els.titleKo.textContent =
        content.title || '';
    }

    if (els.subtitle) {
      els.subtitle.textContent =
        content.subtitle || '';
    }

    if (els.mainQuote) {
      els.mainQuote.textContent =
        content.quote || '';

      els.mainQuote.style.whiteSpace =
        'pre-line';
    }

    if (els.explanation) {
      els.explanation.textContent =
        content.explanation || '';
    }

    if (els.copyGuide) {
      els.copyGuide.textContent =
        Array.isArray(content.copyLines)
          ? content.copyLines.join('\n')
          : '';
    }

    if (els.question) {
      els.question.textContent =
        content.question || '';
    }

    if (els.source) {
      els.source.textContent =
        content.source || '';
    }

    if (els.verticalHanja) {
      els.verticalHanja.textContent =
        (content.hanja || '')
          .split('')
          .join('\n');
    }

    if (els.currentNumber) {
      els.currentNumber.textContent =
        String(content.id);
    }

    /* 저장된 작성 내용 불러오기 */

    const saved = getSaved(content.id);

    if (els.copyText) {
      els.copyText.value =
        saved.copyText || '';
    }

    if (els.memoText) {
      els.memoText.value =
        saved.memo || '';
    }

    updateUrl(content.id);

    updateVisualProgress();

    /*
      필사 번호가 바뀌면
      108 전체보기 목록은 다음에 열 때 다시 생성
    */
    listRenderedForSignature = '';

    if (scroll) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  /* =========================================================
     임시 저장
  ========================================================= */

  function saveDraftNow() {
    clearTimeout(saveTimer);

    const old = getSaved(currentId);
    const content = currentContent();

    const data = {
      ...old,

      id: Number(currentId),

      title:
        content.title || '',

      copyText:
        els.copyText?.value || '',

      memo:
        els.memoText?.value || '',

      updatedAt:
        Date.now()
    };

    try {
      localStorage.setItem(
        storageKey(currentId),
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn(
        '필사 임시 저장 실패',
        error
      );
    }
  }

  /*
    매 글자를 칠 때마다 localStorage 저장하면
    모바일에서 버벅일 수 있어서
    0.25초 후에 한 번만 저장
  */

  function scheduleSave() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(
      saveDraftNow,
      250
    );
  }

  /* =========================================================
     필사 완료
  ========================================================= */

  function completeCurrent() {
    clearTimeout(saveTimer);

    const content = currentContent();
    const old = getSaved(currentId);

    const data = {
      ...old,

      id:
        Number(currentId),

      title:
        content.title || '',

      copyText:
        els.copyText?.value || '',

      memo:
        els.memoText?.value || '',

      completed:
        true,

      completedAt:
        old.completedAt ||
        Date.now(),

      updatedAt:
        Date.now()
    };

    try {
      localStorage.setItem(
        storageKey(currentId),
        JSON.stringify(data)
      );
    } catch (error) {
      console.warn(
        '필사 완료 저장 실패',
        error
      );
    }

    updateVisualProgress();

    listRenderedForSignature = '';

    if (els.completeOverlay) {
      els.completeOverlay.hidden = false;
    }
  }

  /* =========================================================
     작성 내용 비우기
  ========================================================= */

  function clearCurrent() {
    const ok = confirm(
      '이 필사의 작성 내용을 비울까요?'
    );

    if (!ok) return;

    localStorage.removeItem(
      storageKey(currentId)
    );

    if (els.copyText) {
      els.copyText.value = '';
    }

    if (els.memoText) {
      els.memoText.value = '';
    }

    updateVisualProgress();

    listRenderedForSignature = '';
  }

  /* =========================================================
     108 전체 목록
  ========================================================= */

  function listSignature() {
    return (
      `${currentId}|` +
      getCompletedIds().join(',')
    );
  }

  function renderListIfNeeded() {
    if (!els.contentList) return;

    const signature =
      listSignature();

    /*
      내용이 바뀐 게 없으면
      108개 DOM을 다시 만들지 않음
    */

    if (
      signature ===
      listRenderedForSignature
    ) {
      return;
    }

    const completed = new Set(
      getCompletedIds()
    );

    const frag =
      document.createDocumentFragment();

    for (const content of contents) {
      const btn =
        document.createElement('button');

      btn.type = 'button';

      btn.className =
        'content-item' +
        (
          Number(content.id) ===
          Number(currentId)
            ? ' current'
            : ''
        );

      const num =
        document.createElement('span');

      num.className =
        'content-num';

      num.textContent =
        String(content.id)
          .padStart(3, '0');

      const main =
        document.createElement('span');

      main.className =
        'content-main';

      const title =
        document.createElement('b');

      title.textContent =
        content.title +
        (
          completed.has(
            Number(content.id)
          )
            ? ' · 완료'
            : ''
        );

      const sub =
        document.createElement('small');

      sub.textContent =
        content.subtitle || '';

      const arrow =
        document.createElement('span');

      arrow.className =
        'content-arrow';

      arrow.textContent = '›';

      main.append(
        title,
        sub
      );

      btn.append(
        num,
        main,
        arrow
      );

      btn.addEventListener(
        'click',
        () => {
          currentId =
            Number(content.id);

          closeSheet();

          renderContent({
            scroll: true
          });
        }
      );

      frag.appendChild(btn);
    }

    els.contentList.replaceChildren(
      frag
    );

    listRenderedForSignature =
      signature;
  }

  /* =========================================================
     전체보기 열기
  ========================================================= */

  function openSheet() {
    /*
      여기서 처음 108개 목록 생성
      초기 페이지 진입 속도 개선
    */

    renderListIfNeeded();

    if (els.sheetBackdrop) {
      els.sheetBackdrop.hidden =
        false;
    }

    requestAnimationFrame(() => {
      if (els.listSheet) {
        els.listSheet.classList.add(
          'open'
        );

        els.listSheet.setAttribute(
          'aria-hidden',
          'false'
        );
      }
    });
  }

  function closeSheet() {
    if (els.listSheet) {
      els.listSheet.classList.remove(
        'open'
      );

      els.listSheet.setAttribute(
        'aria-hidden',
        'true'
      );
    }

    setTimeout(() => {
      if (els.sheetBackdrop) {
        els.sheetBackdrop.hidden =
          true;
      }
    }, 240);
  }

  /* =========================================================
     다음 필사
  ========================================================= */

  function goNext() {
    const index =
      contents.findIndex(
        item =>
          Number(item.id) ===
          Number(currentId)
      );

    if (els.completeOverlay) {
      els.completeOverlay.hidden =
        true;
    }

    /*
      현재 항목 다음 항목으로 이동
    */

    if (
      index >= 0 &&
      index < contents.length - 1
    ) {
      currentId =
        Number(
          contents[index + 1].id
        );

      renderContent({
        scroll: true
      });

      return;
    }

    /*
      108번까지 완료하면
      1번으로 자동 회귀하지 않음
    */

    alert(
      '108 마음필사를 모두 마쳤습니다. 🙏'
    );

    updateVisualProgress();
  }

  /* =========================================================
     이벤트
  ========================================================= */

  els.copyText?.addEventListener(
    'input',
    scheduleSave
  );

  els.memoText?.addEventListener(
    'input',
    scheduleSave
  );

  $('#completeBtn')
    ?.addEventListener(
      'click',
      completeCurrent
    );

  $('#clearBtn')
    ?.addEventListener(
      'click',
      clearCurrent
    );

  $('#openListBtn')
    ?.addEventListener(
      'click',
      openSheet
    );

  $('#sideListBtn')
    ?.addEventListener(
      'click',
      openSheet
    );

  $('#closeListBtn')
    ?.addEventListener(
      'click',
      closeSheet
    );

  els.sheetBackdrop
    ?.addEventListener(
      'click',
      closeSheet
    );

  /*
    완료 팝업의 두 버튼 모두
    다음 필사로 이동
  */

  $('#closeCompleteBtn')
    ?.addEventListener(
      'click',
      goNext
    );

  $('#nextContentBtn')
    ?.addEventListener(
      'click',
      goNext
    );

  /*
    페이지를 나가기 직전
    마지막 입력 저장
  */

  window.addEventListener(
    'beforeunload',
    saveDraftNow
  );

  /* =========================================================
     시작
  ========================================================= */

  renderContent();

})();
