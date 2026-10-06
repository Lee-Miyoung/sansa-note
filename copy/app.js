(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  /* =========================================================
     CONTENTS.JS 호환
  ========================================================= */

  const contentSource =
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

  if (!contentSource.length) {
    console.error('COPY_CONTENTS를 불러오지 못했습니다.');

    document.body.insertAdjacentHTML(
      'afterbegin',
      `
      <div style="
        padding:14px 16px;
        background:#fff3cd;
        color:#5b4615;
        text-align:center;
        font-size:13px;
        line-height:1.6;
      ">
        필사 콘텐츠를 불러오지 못했습니다.<br>
        contents.js 파일을 확인해주세요.
      </div>
      `
    );

    return;
  }

  const contents = contentSource;

  /* =========================================================
     저장 키
  ========================================================= */

  const LAST_ID_KEY =
    'sansanote_copy_last_id';

  function storageKey(id) {
    return `sansanote_copy_${id}`;
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
     시작 번호 결정
  ========================================================= */

  const validIds = new Set(
    contents.map(item => Number(item.id))
  );

  const params =
    new URLSearchParams(
      location.search
    );

  const queryId =
    Number(params.get('id'));

  const rememberedId =
    getLastId();

  /*
    우선순위

    1. 주소에 ?id=가 있으면 그 번호
    2. 없으면 마지막으로 보던 번호
    3. 그것도 없으면 1번
  */

  let currentId =
    validIds.has(queryId)
      ? queryId
      : (
          validIds.has(rememberedId)
            ? rememberedId
            : Number(contents[0].id)
        );

  let saveTimer = null;
  let listSignatureCache = '';

  /* =========================================================
     현재 콘텐츠
  ========================================================= */

  function currentContent() {
    return (
      contents.find(
        item =>
          Number(item.id) ===
          Number(currentId)
      ) || contents[0]
    );
  }

  function setCurrentId(id) {
    const numberId =
      Number(id);

    if (!validIds.has(numberId)) {
      return;
    }

    currentId =
      numberId;

    saveLastId(
      currentId
    );
  }

  /* =========================================================
     URL
  ========================================================= */

  function updateUrl(id) {
    try {
      const url =
        new URL(location.href);

      url.searchParams.set(
        'id',
        String(id)
      );

      history.replaceState(
        { id },
        '',
        url.pathname + url.search
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
      contents.length || 108;

    if (els.doneCount) {
      els.doneCount.textContent =
        String(done);
    }

    if (els.progressBar) {
      const percent =
        Math.max(
          0,
          Math.min(
            100,
            done / total * 100
          )
        );

      els.progressBar.style.width =
        `${percent}%`;
    }

    if (els.lotusRow) {
      const totalDots = 14;

      const filled =
        Math.round(
          done / total *
          totalDots
        );

      const fragment =
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

        fragment.appendChild(
          dot
        );
      }

      els.lotusRow.replaceChildren(
        fragment
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
      Number(item.id)
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

    /*
      저장된 글 복원
    */

    const saved =
      getSaved(item.id);

    if (els.copyText) {
      els.copyText.value =
        typeof saved.copyText ===
        'string'
          ? saved.copyText
          : '';
    }

    if (els.memoText) {
      els.memoText.value =
        typeof saved.memo ===
        'string'
          ? saved.memo
          : '';
    }

    saveLastId(
      currentId
    );

    updateUrl(
      currentId
    );

    updateProgress();

    listSignatureCache = '';

    if (scroll) {
      window.scrollTo(
        0,
        0
      );
    }
  }

  /* =========================================================
     저장
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
      getSaved(currentId);

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
        storageKey(currentId),
        JSON.stringify(data)
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
        400
      );
  }

  /* =========================================================
     완료
  ========================================================= */

  function completeCurrent() {

    saveDraftNow();

    const item =
      currentContent();

    const old =
      getSaved(currentId);

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
        storageKey(currentId),
        JSON.stringify(data)
      );

      saveLastId(
        currentId
      );
    } catch (error) {
      console.warn(
        '완료 저장 실패',
        error
      );
    }

    updateProgress();

    listSignatureCache = '';

    if (els.completeOverlay) {
      els.completeOverlay.hidden =
        false;
    }
  }

  /* =========================================================
     현재 작성 내용 삭제
  ========================================================= */

  function clearCurrent() {

    const ok =
      confirm(
        '이 필사의 작성 내용을 비울까요?'
      );

    if (!ok) return;

    try {
      localStorage.removeItem(
        storageKey(currentId)
      );
    } catch (error) {}

    if (els.copyText) {
      els.copyText.value = '';
    }

    if (els.memoText) {
      els.memoText.value = '';
    }

    updateProgress();

    listSignatureCache = '';
  }

  /* =========================================================
     108 목록
  ========================================================= */

  function makeListSignature() {
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
      makeListSignature();

    if (
      signature ===
      listSignatureCache
    ) {
      return;
    }

    const completed =
      new Set(
        getCompletedIds()
      );

    const fragment =
      document.createDocumentFragment();

    for (const item of contents) {

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
        String(item.id)
          .padStart(
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

          /*
            중요:
            기존 필사 먼저 저장하고
            번호 이동
          */

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
            30
          );
        }
      );

      fragment.appendChild(
        button
      );
    }

    els.contentList.replaceChildren(
      fragment
    );

    listSignatureCache =
      signature;
  }

  /* =========================================================
     전체보기 열기/닫기
  ========================================================= */

  function openSheet() {

    saveDraftNow();

    renderList();

    if (
      els.sheetBackdrop
    ) {
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
        if (
          els.sheetBackdrop
        ) {
          els.sheetBackdrop.hidden =
            true;
        }
      },
      220
    );
  }

  /* =========================================================
     다음 필사
  ========================================================= */

  function goNext() {

    /*
      현재 작성내용을
      먼저 확실하게 저장
    */

    saveDraftNow();

    if (
      els.completeOverlay
    ) {
      els.completeOverlay.hidden =
        true;
    }

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

      return;
    }

    alert(
      '108 마음필사를 모두 마쳤습니다. 🙏'
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
      'change',
      saveDraftNow
    );

    els.copyText.addEventListener(
      'blur',
      saveDraftNow
    );
  }

  if (els.memoText) {

    els.memoText.addEventListener(
      'input',
      scheduleSave
    );

    els.memoText.addEventListener(
      'change',
      saveDraftNow
    );

    els.memoText.addEventListener(
      'blur',
      saveDraftNow
    );
  }

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

  if (
    els.sheetBackdrop
  ) {
    els.sheetBackdrop
      .addEventListener(
        'click',
        closeSheet
      );
  }

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
    iPhone / iPad Safari 대응
  */

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
     최초 실행
  ========================================================= */

  saveLastId(
    currentId
  );

  renderContent();

})();
