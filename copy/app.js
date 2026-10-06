(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  /* =========================================================
     CONTENTS.JS 연결
  ========================================================= */

  const contents =
    (
      typeof COPY_CONTENTS !== 'undefined' &&
      Array.isArray(COPY_CONTENTS)
    )
      ? COPY_CONTENTS
      : (
          Array.isArray(window.COPY_CONTENTS)
            ? window.COPY_CONTENTS
            : []
        );

  if (!contents.length) {
    console.error('COPY_CONTENTS를 불러오지 못했습니다.');

    document.body.insertAdjacentHTML(
      'afterbegin',
      `
      <div style="
        padding:14px;
        background:#fff3cd;
        color:#5b4615;
        text-align:center;
        font-size:13px;
      ">
        필사 콘텐츠를 불러오지 못했습니다.
        contents.js를 확인해주세요.
      </div>
      `
    );

    return;
  }

  /* =========================================================
     DOM
  ========================================================= */

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

  /* =========================================================
     저장 키
  ========================================================= */

  const LAST_ID_KEY = 'sansanote_copy_last_id';

  function storageKey(id) {
    return `sansanote_copy_${id}`;
  }

  /* =========================================================
     유틸
  ========================================================= */

  function safeParse(raw) {
    if (!raw) return {};

    try {
      return JSON.parse(raw) || {};
    } catch (error) {
      return {};
    }
  }

  function getSaved(id) {
    try {
      return safeParse(
        localStorage.getItem(
          storageKey(id)
        )
      );
    } catch (error) {
      return {};
    }
  }

  function saveLastId(id) {
    try {
      localStorage.setItem(
        LAST_ID_KEY,
        String(id)
      );
    } catch (error) {}
  }

  function getLastId() {
    try {
      return Number(
        localStorage.getItem(
          LAST_ID_KEY
        )
      );
    } catch (error) {
      return 0;
    }
  }

  /* =========================================================
     현재 번호 결정
  ========================================================= */

  const validIds = new Set(
    contents.map(
      item => Number(item.id)
    )
  );

  const params =
    new URLSearchParams(
      location.search
    );

  const queryId =
    Number(
      params.get('id')
    );

  const rememberedId =
    getLastId();

  let currentId =
    validIds.has(queryId)
      ? queryId
      : (
          validIds.has(rememberedId)
            ? rememberedId
            : Number(contents[0].id)
        );

  let saveTimer = null;
  let listCache = '';

  /* =========================================================
     현재 콘텐츠
  ========================================================= */

  function currentContent() {
    return (
      contents.find(
        item =>
          Number(item.id) ===
          Number(currentId)
      ) ||
      contents[0]
    );
  }

  function setCurrentId(id) {
    const n =
      Number(id);

    if (!validIds.has(n)) {
      return false;
    }

    currentId = n;

    saveLastId(
      currentId
    );

    return true;
  }

  /* =========================================================
     URL 갱신
  ========================================================= */

  function updateUrl(id) {
    try {
      const url =
        new URL(
          location.href
        );

      url.searchParams.set(
        'id',
        String(id)
      );

      history.replaceState(
        { id },
        '',
        url.pathname +
        url.search
      );
    } catch (error) {}
  }

  /* =========================================================
     완료 목록
  ========================================================= */

  function getCompletedIds() {
    const result = [];

    for (const item of contents) {
      const saved =
        getSaved(item.id);

      if (
        saved.completed === true
      ) {
        result.push(
          Number(item.id)
        );
      }
    }

    return result;
  }

  /* =========================================================
     진행률
  ========================================================= */

  function updateProgress() {
    const completed =
      getCompletedIds();

    const done =
      completed.length;

    const total =
      contents.length;

    if (els.doneCount) {
      els.doneCount.textContent =
        String(done);
    }

    if (els.progressBar) {
      const pct =
        Math.max(
          0,
          Math.min(
            100,
            done / total * 100
          )
        );

      els.progressBar.style.width =
        `${pct}%`;
    }

    if (els.lotusRow) {
      const totalDots = 14;

      const filled =
        Math.round(
          done / total *
          totalDots
        );

      const frag =
        document.createDocumentFragment();

      for (
        let i = 0;
        i < totalDots;
        i++
      ) {
        const dot =
          document.createElement(
            'span'
          );

        dot.className =
          'lotus-dot' +
          (
            i < filled
              ? ' done'
              : ''
          );

        dot.textContent =
          '🪷';

        frag.appendChild(
          dot
        );
      }

      els.lotusRow.replaceChildren(
        frag
      );
    }
  }

  /* =========================================================
     화면 렌더링
  ========================================================= */

  function renderContent({
    scroll = false
  } = {}) {

    const item =
      currentContent();

    setCurrentId(
      item.id
    );

    if (els.titleHanja) {
      els.titleHanja.textContent =
        item.hanja || '';
    }

    if (els.titleKo) {
      els.titleKo.textContent =
        item.title || '';
    }

    if (els.subtitle) {
      els.subtitle.textContent =
        item.subtitle || '';
    }

    if (els.mainQuote) {
      els.mainQuote.textContent =
        item.quote || '';

      els.mainQuote.style.whiteSpace =
        'pre-line';
    }

    if (els.explanation) {
      els.explanation.textContent =
        item.explanation || '';
    }

    if (els.copyGuide) {
      els.copyGuide.textContent =
        Array.isArray(
          item.copyLines
        )
          ? item.copyLines.join('\n')
          : '';
    }

    if (els.question) {
      els.question.textContent =
        item.question || '';
    }

    if (els.source) {
      els.source.textContent =
        item.source || '';
    }

    if (els.currentNumber) {
      els.currentNumber.textContent =
        String(item.id);
    }

    if (els.verticalHanja) {
      els.verticalHanja.textContent =
        (item.hanja || '')
          .split('')
          .join('\n');
    }

    const saved =
      getSaved(item.id);

    if (els.copyText) {
      els.copyText.value =
        saved.copyText || '';
    }

    if (els.memoText) {
      els.memoText.value =
        saved.memo || '';
    }

    updateUrl(
      currentId
    );

    updateProgress();

    listCache = '';

    if (scroll) {
      window.scrollTo(
        0,
        0
      );
    }
  }

  /* =========================================================
     임시 저장
  ========================================================= */

  function saveDraftNow() {
    if (saveTimer) {
      clearTimeout(
        saveTimer
      );

      saveTimer = null;
    }

    const item =
      currentContent();

    const old =
      getSaved(
        currentId
      );

    const data = {
      ...old,

      id:
        Number(currentId),

      title:
        item.title || '',

      copyText:
        els.copyText
          ? els.copyText.value
          : '',

      memo:
        els.memoText
          ? els.memoText.value
          : '',

      updatedAt:
        Date.now()
    };

    try {
      localStorage.setItem(
        storageKey(
          currentId
        ),
        JSON.stringify(
          data
        )
      );

      saveLastId(
        currentId
      );
    } catch (error) {
      console.warn(
        '필사 저장 실패',
        error
      );
    }
  }

  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(
        saveTimer
      );
    }

    saveTimer =
      setTimeout(
        saveDraftNow,
        350
      );
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

    if (
      index >= 0 &&
      index <
      contents.length - 1
    ) {
      const nextId =
        Number(
          contents[
            index + 1
          ].id
        );

      setCurrentId(
        nextId
      );

      renderContent({
        scroll: true
      });

      return true;
    }

    alert(
      '108 마음필사를 모두 마쳤습니다. 🙏'
    );

    return false;
  }

  /* =========================================================
     완료 처리
  ========================================================= */

  function completeCurrent() {

    /*
      1. 현재 입력 즉시 저장
    */

    saveDraftNow();

    const item =
      currentContent();

    const old =
      getSaved(
        currentId
      );

    const data = {
      ...old,

      id:
        Number(currentId),

      title:
        item.title || '',

      copyText:
        els.copyText
          ? els.copyText.value
          : '',

      memo:
        els.memoText
          ? els.memoText.value
          : '',

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
        storageKey(
          currentId
        ),
        JSON.stringify(
          data
        )
      );
    } catch (error) {
      console.warn(
        '완료 저장 실패',
        error
      );
    }

    /*
      2. 진행률 갱신
    */

    updateProgress();

    listCache = '';

    /*
      3. 팝업은 사용하지 않고
         곧바로 다음 필사로 이동

      이렇게 하면
      PC / iPad / iPhone / Galaxy에서
      동작이 가장 안정적입니다.
    */

    if (els.completeOverlay) {
      els.completeOverlay.hidden =
        true;
    }

    setTimeout(
      () => {
        goNext();
      },
      180
    );
  }

  /* =========================================================
     작성 내용 비우기
  ========================================================= */

  function clearCurrent() {

    const ok =
      confirm(
        '이 필사의 작성 내용을 비울까요?'
      );

    if (!ok) return;

    try {
      localStorage.removeItem(
        storageKey(
          currentId
        )
      );
    } catch (error) {}

    if (els.copyText) {
      els.copyText.value = '';
    }

    if (els.memoText) {
      els.memoText.value = '';
    }

    updateProgress();

    listCache = '';
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

  function renderList() {
    if (!els.contentList) {
      return;
    }

    const signature =
      listSignature();

    if (
      signature ===
      listCache
    ) {
      return;
    }

    const completed =
      new Set(
        getCompletedIds()
      );

    const frag =
      document.createDocumentFragment();

    for (
      const item
      of contents
    ) {

      const button =
        document.createElement(
          'button'
        );

      button.type =
        'button';

      button.className =
        'content-item' +
        (
          Number(item.id) ===
          Number(currentId)
            ? ' current'
            : ''
        );

      const num =
        document.createElement(
          'span'
        );

      num.className =
        'content-num';

      num.textContent =
        String(
          item.id
        ).padStart(
          3,
          '0'
        );

      const main =
        document.createElement(
          'span'
        );

      main.className =
        'content-main';

      const title =
        document.createElement(
          'b'
        );

      title.textContent =
        item.title +
        (
          completed.has(
            Number(item.id)
          )
            ? ' · 완료'
            : ''
        );

      const sub =
        document.createElement(
          'small'
        );

      sub.textContent =
        item.subtitle || '';

      const arrow =
        document.createElement(
          'span'
        );

      arrow.className =
        'content-arrow';

      arrow.textContent =
        '›';

      main.append(
        title,
        sub
      );

      button.append(
        num,
        main,
        arrow
      );

      button.addEventListener(
        'click',
        () => {

          saveDraftNow();

          setCurrentId(
            item.id
          );

          closeSheet();

          setTimeout(
            () => {
              renderContent({
                scroll: true
              });
            },
            20
          );
        }
      );

      frag.appendChild(
        button
      );
    }

    els.contentList.replaceChildren(
      frag
    );

    listCache =
      signature;
  }

  /* =========================================================
     전체보기
  ========================================================= */

  function openSheet() {

    saveDraftNow();

    renderList();

    if (els.sheetBackdrop) {
      els.sheetBackdrop.hidden =
        false;
    }

    requestAnimationFrame(
      () => {
        if (!els.listSheet) {
          return;
        }

        els.listSheet.classList.add(
          'open'
        );

        els.listSheet.setAttribute(
          'aria-hidden',
          'false'
        );
      }
    );
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

    setTimeout(
      () => {
        if (els.sheetBackdrop) {
          els.sheetBackdrop.hidden =
            true;
        }
      },
      200
    );
  }

  /* =========================================================
     이벤트
  ========================================================= */

  if (els.copyText) {

    els.copyText.addEventListener(
      'input',
      scheduleSave
    );

    els.copyText.addEventListener(
      'blur',
      saveDraftNow
    );

    els.copyText.addEventListener(
      'change',
      saveDraftNow
    );
  }

  if (els.memoText) {

    els.memoText.addEventListener(
      'input',
      scheduleSave
    );

    els.memoText.addEventListener(
      'blur',
      saveDraftNow
    );

    els.memoText.addEventListener(
      'change',
      saveDraftNow
    );
  }

  /*
    핵심
    필사 완료 버튼 → 바로 다음 필사
  */

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
    예전 완료 팝업 버튼이 남아 있어도
    둘 다 다음 필사로 연결
  */

  $('#closeCompleteBtn')
    ?.addEventListener(
      'click',
      () => {
        if (els.completeOverlay) {
          els.completeOverlay.hidden =
            true;
        }

        goNext();
      }
    );

  $('#nextContentBtn')
    ?.addEventListener(
      'click',
      () => {
        if (els.completeOverlay) {
          els.completeOverlay.hidden =
            true;
        }

        goNext();
      }
    );

  /* =========================================================
     iOS / Android 저장 안정화
  ========================================================= */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        document.hidden
      ) {
        saveDraftNow();
      }
    }
  );

  window.addEventListener(
    'pagehide',
    saveDraftNow
  );

  /* =========================================================
     시작
  ========================================================= */

  saveLastId(
    currentId
  );

  renderContent();

})();
