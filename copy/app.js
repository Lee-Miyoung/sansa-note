(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);

  /* =========================================================
     CONTENTS.JS 호환
     const COPY_CONTENTS / window.COPY_CONTENTS 둘 다 지원
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
     현재 번호
  ========================================================= */

  const validIds = new Set(
    contents.map(item => Number(item.id))
  );

  const params =
    new URLSearchParams(location.search);

  const queryId =
    Number(params.get('id'));

  let currentId =
    validIds.has(queryId)
      ? queryId
      : Number(contents[0].id);

  let saveTimer = null;
  let listSignatureCache = '';

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

  function storageKey(id) {
    return `sansanote_copy_${id}`;
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

  function currentContent() {
    return (
      contents.find(
        item =>
          Number(item.id) ===
          Number(currentId)
      ) || contents[0]
    );
  }

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
    } catch (error) {
      // 구형 브라우저에서도 필사는 계속 작동
    }
  }

  /* =========================================================
     완료 기록
  ========================================================= */

  function getCompletedIds() {
    const result = [];

    for (const item of contents) {
      const saved =
        getSaved(item.id);

      if (saved.completed === true) {
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
        Math.min(
          100,
          Math.max(
            0,
            done / total * 100
          )
        );

      els.progressBar.style.width =
        `${percent}%`;
    }

    /*
      연꽃 108개를 모두 그리지 않고
      진행 표시용 14개만 사용
      → 아이폰/아이패드 렌더링 부담 감소
    */

    if (els.lotusRow) {
      const totalDots = 14;

      const filled =
        Math.round(
          done / total * totalDots
        );

      const fragment =
        document.createDocumentFragment();

      for (
        let i = 0;
        i < totalDots;
        i++
      ) {
        const dot =
          document.createElement('span');

        dot.className =
          'lotus-dot' +
          (
            i < filled
              ? ' done'
              : ''
          );

        dot.textContent = '🪷';

        fragment.appendChild(dot);
      }

      els.lotusRow.replaceChildren(
        fragment
      );
    }
  }

  /* =========================================================
     필사 화면 렌더링
  ========================================================= */

  function renderContent({
    scroll = false
  } = {}) {

    const item =
      currentContent();

    currentId =
      Number(item.id);

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
        Array.isArray(item.copyLines)
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

    updateUrl(item.id);
    updateProgress();

    listSignatureCache = '';

    if (scroll) {
      /*
        iOS Safari에서 smooth 스크롤이
        버벅이는 경우가 있어 즉시 이동
      */
      window.scrollTo(0, 0);
    }
  }

  /* =========================================================
     임시 저장
  ========================================================= */

  function saveDraftNow() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    const old =
      getSaved(currentId);

    const item =
      currentContent();

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
    } catch (error) {
      console.warn(
        '필사 저장 실패',
        error
      );
    }
  }

  /*
    키 입력마다 저장하면
    iOS에서 매우 느려질 수 있음.
    350ms 멈췄을 때만 저장.
  */

  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer =
      setTimeout(
        saveDraftNow,
        350
      );
  }

  /* =========================================================
     완료
  ========================================================= */

  function completeCurrent() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }

    const old =
      getSaved(currentId);

    const item =
      currentContent();

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
    } catch (error) {
      console.warn(
        '필사 완료 저장 실패',
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
     작성 내용 삭제
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
     108 전체 목록
  ========================================================= */

  function makeListSignature() {
    return (
      `${currentId}|` +
      getCompletedIds().join(',')
    );
  }

  function renderList() {
    if (!els.contentList) return;

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
        document.createElement('span');

      num.className =
        'content-num';

      num.textContent =
        String(item.id)
          .padStart(3, '0');

      const main =
        document.createElement('span');

      main.className =
        'content-main';

      const title =
        document.createElement('b');

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
        document.createElement('small');

      sub.textContent =
        item.subtitle || '';

      const arrow =
        document.createElement('span');

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

          currentId =
            Number(item.id);

          closeSheet();

          /*
            닫히는 애니메이션과
            렌더링이 동시에 겹치지 않게
            약간 늦춰 iPad 성능 개선
          */

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
     전체보기
  ========================================================= */

  function openSheet() {
    /*
      처음 페이지 열 때는
      108개 목록을 만들지 않음.

      사용자가 '전체보기'를 눌렀을 때만
      108개 생성.
    */

    renderList();

    if (els.sheetBackdrop) {
      els.sheetBackdrop.hidden =
        false;
    }

    requestAnimationFrame(() => {
      if (!els.listSheet) return;

      els.listSheet.classList.add(
        'open'
      );

      els.listSheet.setAttribute(
        'aria-hidden',
        'false'
      );
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
    }, 220);
  }

  /* =========================================================
     다음 필사
  ========================================================= */

  function goNext() {
    if (els.completeOverlay) {
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
      currentId =
        Number(
          contents[index + 1].id
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
      scheduleSave,
      { passive: true }
    );
  }

  if (els.memoText) {
    els.memoText.addEventListener(
      'input',
      scheduleSave,
      { passive: true }
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

  if (els.sheetBackdrop) {
    els.sheetBackdrop.addEventListener(
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
    iOS에서는 beforeunload가
    항상 안정적으로 실행되지 않아서
    visibilitychange도 같이 사용
  */

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
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

  renderContent();

})();
