/* ================================================================
   LIFESAVING — main.js  v3
================================================================ */

/* ----------------------------------------------------------------
   1. Custom Cursor
---------------------------------------------------------------- */
const cursor         = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');

if (cursor && cursorFollower) {
  let mouseX = -100, mouseY = -100;
  let fX = -100, fY = -100;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  const animateFollower = () => {
    fX += (mouseX - fX) * 0.1;
    fY += (mouseY - fY) * 0.1;
    cursorFollower.style.left = fX + 'px';
    cursorFollower.style.top  = fY + 'px';
    requestAnimationFrame(animateFollower);
  };
  animateFollower();

  document.querySelectorAll('a, button, .gallery__item, .comp-card, .news-slide, .photo-lead__item').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* ----------------------------------------------------------------
   2. スクロール連動
     - ヒーローtitleフェード → 写真一枚ずつ表示
     - 動画グレーアウト / nav切り替え
---------------------------------------------------------------- */
const nav           = document.getElementById('nav');
const heroOverlay   = document.getElementById('heroOverlay');
const heroVideo     = document.getElementById('heroVideo');
const siteContent   = document.getElementById('siteContent');
const pageBody      = document.getElementById('pageBody');
const heroNameBlock = document.querySelector('.hero__name-block');
const heroControls  = document.getElementById('heroControls');
const heroScrollInd = document.getElementById('heroScrollInd');

const photoTrack = document.querySelector('.photo-lead__track');
const photoItems = document.querySelectorAll('.photo-lead__item');
/* 各写真が現れるスクロール進度 (0〜1) */
const PHOTO_THRESHOLDS        = [0.10, 0.45, 0.75]; // desktop
const PHOTO_THRESHOLDS_MOBILE = [0.28, 0.55, 0.82]; // mobile: しっかりスクロール後に表示

const onScroll = () => {
  const scrollY = window.scrollY;
  const vh      = window.innerHeight;

  /* ---- A: 動画グレーアウト (0 → 80vh) ---- */
  const p = Math.min(scrollY / (vh * 0.8), 1);
  if (heroOverlay) {
    heroOverlay.style.background = `
      linear-gradient(
        to bottom,
        rgba(10,30,61,${0.10 + p * 0.52}) 0%,
        rgba(10,30,61,${0.00 + p * 0.42}) 35%,
        rgba(10,30,61,${0.35 + p * 0.38}) 70%,
        rgba(10,30,61,${0.80 + p * 0.18}) 100%
      )
    `;
  }
  if (heroVideo) {
    heroVideo.style.filter = `grayscale(${p * 35}%) brightness(${1 - p * 0.2})`;
  }

  /* ---- B: ヒーロータイトル フェードアウト (0 → 45vh) ---- */
  if (heroNameBlock) {
    const tp = Math.min(scrollY / (vh * 0.45), 1);
    heroNameBlock.style.opacity = String(Math.max(0, 1 - tp * tp * 1.2));
  }

  /* ---- C: 音量ボタン & スクロールインジケーター — page-body が近づいたらフェードアウト ---- */
  if (pageBody) {
    const pbTop = pageBody.getBoundingClientRect().top;
    const uiP   = Math.max(0, Math.min(1, (vh - pbTop) / (vh * 0.3)));
    if (heroControls)  heroControls.style.opacity  = String(1 - uiP);
    if (heroScrollInd) heroScrollInd.style.opacity = String(1 - uiP);
  }

  /* ---- D: 写真 scroll-reveal (全幅 — モバイルとデスクトップで閾値を分ける) ---- */
  if (photoTrack && photoItems.length) {
    const rect      = photoTrack.getBoundingClientRect();
    const scrolled  = -rect.top;
    const trackDist = photoTrack.offsetHeight - vh;
    const sp        = Math.max(0, Math.min(1, scrolled / Math.max(trackDist, 1)));
    const thr       = window.innerWidth <= 768 ? PHOTO_THRESHOLDS_MOBILE : PHOTO_THRESHOLDS;

    photoItems.forEach((item, i) => {
      item.classList.toggle('revealed', sp >= (thr[i] ?? 1));
    });
  }

  /* ---- E: nav モード ---- */
  const trigger = pageBody || siteContent;
  if (trigger && nav) {
    const top = trigger.getBoundingClientRect().top;
    nav.classList.toggle('on-content', top <= nav.offsetHeight + 8);
  }
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ----------------------------------------------------------------
   3. ハンバーガーメニュー
---------------------------------------------------------------- */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

navLinks?.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ----------------------------------------------------------------
   4. 音声トグル — バグ修正版
   ミュート時: icon--muted を表示、icon--unmuted を非表示
   音声オン時: icon--muted を非表示、icon--unmuted を表示
---------------------------------------------------------------- */
const soundBtn   = document.getElementById('soundBtn');
const iconMuted  = soundBtn?.querySelector('.icon--muted');
const iconUnmuted = soundBtn?.querySelector('.icon--unmuted');

const updateSoundIcon = () => {
  if (!heroVideo) return;
  const muted = heroVideo.muted;
  iconMuted?.classList.toggle('hidden', !muted);   // ミュート中だけ表示
  iconUnmuted?.classList.toggle('hidden', muted);  // 音声オン中だけ表示
};

soundBtn?.addEventListener('click', () => {
  if (!heroVideo) return;
  heroVideo.muted = !heroVideo.muted;
  updateSoundIcon();
});

// 初期状態を同期（動画は muted=true でロード）
updateSoundIcon();

/* ----------------------------------------------------------------
   5. Highlight Video — 音声トグル & サムネイル切替
---------------------------------------------------------------- */
(function () {
  const hlVid      = document.getElementById('hlVid');
  const hlSoundBtn = document.getElementById('hlSoundBtn');
  const hlLabel    = document.getElementById('hlLabel');
  const hlThumbs   = document.querySelectorAll('.hl-thumb[data-src]');

  if (!hlVid) return;

  /* 音声トグル */
  const hlMutedIcon   = hlSoundBtn?.querySelector('.icon--muted');
  const hlUnmutedIcon = hlSoundBtn?.querySelector('.icon--unmuted');

  const syncHlSound = () => {
    hlMutedIcon?.classList.toggle('hidden', !hlVid.muted);
    hlUnmutedIcon?.classList.toggle('hidden', hlVid.muted);
  };

  hlSoundBtn?.addEventListener('click', () => {
    hlVid.muted = !hlVid.muted;
    syncHlSound();
  });
  syncHlSound();

  /* サムネイル切替 */
  hlThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src   = thumb.dataset.src;
      const title = thumb.dataset.title || '';
      if (!src) return;
      hlVid.src = src;
      hlVid.play();
      hlThumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const titleEl = hlLabel?.querySelector('.hl-main__label-title');
      if (titleEl) titleEl.textContent = title;
    });
  });
})();

/* ----------------------------------------------------------------
   6. スクロールリビール (汎用 IntersectionObserver)
---------------------------------------------------------------- */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

// 汎用リビール
document.querySelectorAll('.reveal-up, .reveal-right, .reveal-scale').forEach(el => {
  revealObs.observe(el);
});

// photo-fade — 写真セクションのふわっと出現
document.querySelectorAll('.photo-fade').forEach(el => {
  revealObs.observe(el);
});

// photo-lead の scroll-reveal は onScroll 内の section D で処理（PC・モバイル共通）

/* ----------------------------------------------------------------
   7. カウンターアニメーション
---------------------------------------------------------------- */
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      if (!target) return;
      counterObs.unobserve(el);
      animateCounter(el, target);
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

function animateCounter(el, target) {
  const duration = 1800;
  const start    = performance.now();
  const step = (ts) => {
    const p = Math.min((ts - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(e * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

/* ----------------------------------------------------------------
   8. ギャラリーライトボックス
---------------------------------------------------------------- */
document.querySelectorAll('.gallery__item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('.gallery__img');
    if (!img || !img.naturalWidth) return;
    openLightbox(img.src);
  });
});

function openLightbox(src) {
  const lb = document.createElement('div');
  lb.style.cssText = `
    position:fixed; inset:0; z-index:9000;
    background:rgba(10,30,61,0.95);
    display:flex; align-items:center; justify-content:center;
    cursor:zoom-out; animation:lbFadeIn .3s ease;
  `;
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width:90vw; max-height:90vh;
    object-fit:contain; border-radius:2px;
    animation:lbScale .35s cubic-bezier(0.16,1,0.3,1);
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
    @keyframes lbScale  { from{transform:scale(0.9)} to{transform:scale(1)} }
  `;
  lb.append(style, img);
  document.body.appendChild(lb);
  document.body.style.overflow = 'hidden';
  const close = () => { lb.remove(); document.body.style.overflow = ''; };
  lb.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });
}

/* ----------------------------------------------------------------
   9. Gallery — LOAD MORE
---------------------------------------------------------------- */
(function () {
  const grid     = document.getElementById('galleryGrid');
  const btn      = document.getElementById('galleryMoreBtn');
  const wrap     = document.getElementById('galleryMoreWrap');
  if (!grid || !btn || !wrap) return;

  btn.addEventListener('click', () => {
    grid.classList.add('expanded');
    wrap.style.display = 'none';
    /* scroll-reveal 再トリガー */
    grid.querySelectorAll('.reveal-scale:not(.in-view)').forEach(el => {
      revealObs.observe(el);
    });
  });
})();

/* ----------------------------------------------------------------
   10. スムーズスクロール (旧9)
---------------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - 72,
      behavior: 'smooth'
    });
  });
});

/* ----------------------------------------------------------------
   10. Ticker — 縦スライド自動再生
---------------------------------------------------------------- */
(function () {
  const track = document.getElementById('tickerVTrack');
  if (!track) return;
  const items = track.querySelectorAll('.ticker__vitem');
  if (!items.length) return;
  const ITEM_H = 48;
  let current = 0;
  setInterval(() => {
    current = (current + 1) % items.length;
    track.style.transform = `translateY(-${current * ITEM_H}px)`;
  }, 4000);
})();


/* ----------------------------------------------------------------
   11. 画像ロード時にプレースホルダーを非表示
---------------------------------------------------------------- */
document.querySelectorAll('.gallery__img, .photo-lead__img, .news-card__img').forEach(img => {
  const hide = () => {
    const next = img.nextElementSibling;
    if (next && /placeholder/i.test(next.className)) next.style.display = 'none';
  };
  if (img.complete && img.naturalWidth) hide();
  else img.addEventListener('load', hide);
});
