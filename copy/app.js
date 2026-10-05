const qs = (s) => document.querySelector(s);

const els = {
  titleHanja: qs('#titleHanja'),
  titleKo: qs('#titleKo'),
  subtitle: qs('#subtitle'),
  mainQuote: qs('#mainQuote'),
  explanation: qs('#explanation'),
  copyGuide: qs('#copyGuide'),
  question: qs('#question'),
  source: qs('#source'),
  verticalHanja: qs('#verticalHanja'),

  copyText: qs('#copyText'),
  memoText: qs('#memoText'),

  doneCount: qs('#doneCount'),
  lotusRow: qs('#lotusRow'),

  contentList: qs('#contentList'),
  listSheet: qs('#listSheet'),
  sheetBackdrop: qs('#sheetBackdrop'),

  completeOverlay: qs('#completeOverlay')
};


/* =========================================
   현재 필사 번호
========================================= */

let currentId =
  Number(
    new URLSearchParams(location.search).get('id')
  ) || 1;


/* =========================================
   현재 콘텐츠 가져오기
========================================= */

function currentContent() {
  return (
    COPY_CONTENTS.find(
      item => item.id === currentId
    ) ||
    COPY_CONTENTS[0]
  );
}


/* =========================================
   저장 키
========================================= */

function storageKey(id) {
  return `sansanote_copy_${id}`;
}


/* =========================================
   필사 화면 표시
========================================= */

function renderContent() {

  const c = currentContent();

  currentId = c.id;

  if (els.titleHanja) {
    els.titleHanja.textContent = c.hanja || '';
  }

  if (els.titleKo) {
    els.titleKo.textContent = c.title || '';
  }

  if (els.subtitle) {
    els.subtitle.textContent = c.subtitle || '';
  }

  if (els.mainQuote) {
    els.mainQuote.innerHTML =
      (c.quote || '').replace(/\n/g, '<br>');
  }

  if (els.explanation) {
    els.explanation.textContent =
      c.explanation || '';
  }

  if (els.copyGuide) {
    els.copyGuide.textContent =
      Array.isArray(c.copyLines)
        ? c.copyLines.join('\n')
        : '';
  }

  if (els.question) {
    els.question.textContent =
      c.question || '';
  }

  if (els.source) {
    els.source.textContent =
      c.source || '';
  }

  if (els.verticalHanja) {
    els.verticalHanja.textContent =
      (c.hanja || '')
        .split('')
        .join('\n');
  }


  /* 저장된 작성 내용 불러오기 */

  const saved =
    JSON.parse(
      localStorage.getItem(
        storageKey(c.id)
      ) || '{}'
    );

  if (els.copyText) {
    els.copyText.value =
      saved.copyText || '';
  }

  if (els.memoText) {
    els.memoText.value =
      saved.memo || '';
  }


  /* 주소 업데이트 */

  history.replaceState(
    null,
    '',
    `?id=${c.id}`
  );


  renderProgress();
  renderList();
}


/* =========================================
   작성 중 자동 저장
========================================= */

function saveDraft() {

  const old =
    JSON.parse(
      localStorage.getItem(
        storageKey(currentId)
      ) || '{}'
    );

  const data = {
    ...old,

    id: currentId,

    title:
      currentContent().title,

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

  localStorage.setItem(
    storageKey(currentId),
    JSON.stringify(data)
  );
}


/* =========================================
   현재 필사 완료
========================================= */

function completeCurrent() {

  const c =
    currentContent();

  const data = {

    id:
      c.id,

    title:
      c.title,

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
      Date.now(),

    updatedAt:
      Date.now()
  };


  localStorage.setItem(
    storageKey(currentId),
    JSON.stringify(data)
  );


  renderProgress();
  renderList();


  if (els.completeOverlay) {
    els.completeOverlay.hidden =
      false;
  }
}


/* =========================================
   작성 내용 비우기
========================================= */

function clearCurrent() {

  const ok =
    confirm(
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


  renderProgress();
  renderList();
}


/* =========================================
   완료된 필사 번호
========================================= */

function getCompletedIds() {

  return COPY_CONTENTS

    .filter(c => {

      const saved =
        JSON.parse(
          localStorage.getItem(
            storageKey(c.id)
          ) || '{}'
        );

      return !!saved.completed;
    })

    .map(c => c.id);
}


/* =========================================
   진행상황 표시
========================================= */

function renderProgress() {

  const completed =
    getCompletedIds();


  if (els.doneCount) {

    els.doneCount.textContent =
      completed.length;
  }


  if (!els.lotusRow) return;


  els.lotusRow.innerHTML = '';


  /*
    화면에는 14개 정도만 표시
    완료된 개수 비율로 채움
  */

  const totalDots = 14;

  const ratio =
    COPY_CONTENTS.length
      ? completed.length /
        COPY_CONTENTS.length
      : 0;

  const doneDots =
    Math.round(
      ratio * totalDots
    );


  for (
    let i = 0;
    i < totalDots;
    i++
  ) {

    const span =
      document.createElement(
        'span'
      );

    span.className =
      'lotus-dot' +
      (
        i < doneDots
          ? ' done'
          : ''
      );

    span.textContent =
      '🪷';

    els.lotusRow.appendChild(
      span
    );
  }
}


/* =========================================
   108 필사 목록
========================================= */

function renderList() {

  if (!els.contentList) return;


  const completed =
    new Set(
      getCompletedIds()
    );


  els.contentList.innerHTML = '';


  COPY_CONTENTS.forEach(
    c => {

      const btn =
        document.createElement(
          'button'
        );


      btn.className =
        'content-item';


      if (c.id === currentId) {
        btn.classList.add(
          'current'
        );
      }


      const doneLabel =
        completed.has(c.id)
          ? ' · 완료'
          : '';


      btn.innerHTML = `
        <span class="content-num">
          ${String(c.id).padStart(3,'0')}
        </span>

        <span class="content-main">

          <b>
            ${c.title}${doneLabel}
          </b>

          <small>
            ${c.subtitle || ''}
          </small>

        </span>

        <span class="content-arrow">
          ›
        </span>
      `;


      btn.addEventListener(
        'click',
        () => {

          currentId =
            c.id;

          closeSheet();

          renderContent();

          window.scrollTo({
            top: 0,
            behavior:
              'smooth'
          });
        }
      );


      els.contentList.appendChild(
        btn
      );
    }
  );
}


/* =========================================
   목록 열기
========================================= */

function openSheet() {

  if (
    !els.listSheet ||
    !els.sheetBackdrop
  ) return;


  els.sheetBackdrop.hidden =
    false;


  requestAnimationFrame(
    () => {

      els.listSheet
        .classList
        .add('open');

      els.listSheet
        .setAttribute(
          'aria-hidden',
          'false'
        );
    }
  );
}


/* =========================================
   목록 닫기
========================================= */

function closeSheet() {

  if (
    !els.listSheet ||
    !els.sheetBackdrop
  ) return;


  els.listSheet
    .classList
    .remove('open');


  els.listSheet
    .setAttribute(
      'aria-hidden',
      'true'
    );


  setTimeout(
    () => {

      els.sheetBackdrop.hidden =
        true;

    },
    250
  );
}


/* =========================================
   다음 필사로 이동
========================================= */

function goNext() {

  const idx =
    COPY_CONTENTS.findIndex(
      x =>
        x.id === currentId
    );


  /*
    마지막이 아니면
  */

  if (
    idx >= 0 &&
    idx <
      COPY_CONTENTS.length - 1
  ) {

    const next =
      COPY_CONTENTS[
        idx + 1
      ];


    if (els.completeOverlay) {
      els.completeOverlay.hidden =
        true;
    }


    currentId =
      next.id;


    renderContent();


    window.scrollTo({
      top: 0,
      behavior:
        'smooth'
    });


    return;
  }


  /*
    108번까지 완료한 경우
  */

  if (els.completeOverlay) {
    els.completeOverlay.hidden =
      true;
  }


  alert(
    '108 마음필사를 모두 마쳤습니다. 🙏\n\n수고하셨습니다.'
  );


  renderProgress();
  renderList();
}


/* =========================================
   자동으로 다음 미완료 필사 찾기
========================================= */

function goToNextUnfinished() {

  const completed =
    new Set(
      getCompletedIds()
    );


  const next =
    COPY_CONTENTS.find(
      c =>
        !completed.has(c.id)
    );


  if (!next) {

    alert(
      '108 마음필사를 모두 마쳤습니다. 🙏'
    );

    return;
  }


  currentId =
    next.id;


  renderContent();


  window.scrollTo({
    top: 0,
    behavior:
      'smooth'
  });
}


/* =========================================
   이벤트 연결
========================================= */

if (els.copyText) {

  els.copyText.addEventListener(
    'input',
    saveDraft
  );
}


if (els.memoText) {

  els.memoText.addEventListener(
    'input',
    saveDraft
  );
}


const completeBtn =
  qs('#completeBtn');

if (completeBtn) {

  completeBtn.addEventListener(
    'click',
    completeCurrent
  );
}


const clearBtn =
  qs('#clearBtn');

if (clearBtn) {

  clearBtn.addEventListener(
    'click',
    clearCurrent
  );
}


const openListBtn =
  qs('#openListBtn');

if (openListBtn) {

  openListBtn.addEventListener(
    'click',
    openSheet
  );
}


const closeListBtn =
  qs('#closeListBtn');

if (closeListBtn) {

  closeListBtn.addEventListener(
    'click',
    closeSheet
  );
}


if (els.sheetBackdrop) {

  els.sheetBackdrop.addEventListener(
    'click',
    closeSheet
  );
}


/*
  완료창의 메인 버튼
  → 바로 다음 필사 이동
*/

const closeCompleteBtn =
  qs('#closeCompleteBtn');

if (closeCompleteBtn) {

  closeCompleteBtn.addEventListener(
    'click',
    goNext
  );


  /*
    버튼 문구도 자동 변경
  */

  closeCompleteBtn.textContent =
    '다음 필사로 이어가기 →';
}


/*
  기존 두 번째 버튼이 있으면
  역시 다음 필사로 이동
*/

const nextContentBtn =
  qs('#nextContentBtn');

if (nextContentBtn) {

  nextContentBtn.addEventListener(
    'click',
    goNext
  );


  nextContentBtn.textContent =
    '다음 필사 보기';
}


/* =========================================
   페이지 시작
========================================= */

renderContent();
