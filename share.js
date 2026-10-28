/**
 * GoModo (고모도) 공통 소셜 공유 모듈 (share.js)
 * - 카카오톡 SDK 연동 & Web Share API (모바일 네이티브) & 네이버/밴드/클립보드
 * - 별도의 앱 키 없이도 모바일 카카오톡 및 메신저 완벽 공유 지원
 */

// 카카오 디벨로퍼스 JavaScript 키 (발급 시 아래 따옴표 안에 입력)
const KAKAO_JAVASCRIPT_KEY = '';

(function() {
  // 1. 카카오 SDK 동적 로드 및 초기화
  if (KAKAO_JAVASCRIPT_KEY && typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    try {
      Kakao.init(KAKAO_JAVASCRIPT_KEY);
    } catch (e) {
      console.warn('Kakao init warning:', e);
    }
  }

  // 2. 현재 공유 데이터 상태
  let currentShareData = {
    title: 'GoModo (고모도) - 일상 생활 유틸리티 포털',
    text: '로또 번호 추천, 만 나이 계산, 예적금 이자 계산, D-Day 음력 변환기 무료 웹앱',
    url: window.location.href
  };

  // 3. 토스트 알림 표시 함수
  window.showToast = function(msg, duration = 2500) {
    let toast = document.getElementById('gomodo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gomodo-toast';
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 text-white border border-amber-500/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm sm:text-base font-bold pointer-events-none transition-all duration-300 opacity-0 translate-y-4';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-amber-400"></i> <span>${msg}</span>`;
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
    }, duration);
  };

  // 4. 모달 DOM 동적 생성
  function ensureModal() {
    if (document.getElementById('gomodo-share-modal')) return;

    const isJa = document.documentElement.lang === 'ja';
    const modalTitle = isJa ? '共有する' : '공유하기';
    const defaultSiteTitle = isJa ? 'GoModo ツール' : 'GoModo 생활 도구';
    const defaultSiteDesc = isJa ? '便利で使いやすい無料Webツール' : '편리하고 유용한 무료 생활 웹앱';
    const copyLabel = isJa ? 'コピー' : '복사';
    const moreLabel = isJa ? 'その他' : '더보기';

    const modal = document.createElement('div');
    modal.id = 'gomodo-share-modal';
    modal.className = 'fixed inset-0 z-[9998] hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 text-slate-100" onclick="event.stopPropagation()">
        <!-- 헤더 -->
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-black">
              <i class="fa-solid fa-share-nodes"></i>
            </div>
            <h3 class="text-lg sm:text-xl font-black text-white">${modalTitle}</h3>
          </div>
          <button type="button" onclick="window.closeShareModal()" class="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- 공유 대상 미리보기 카드 -->
        <div class="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-2xl flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-md">
            G
          </div>
          <div class="min-w-0 flex-1">
            <h4 id="share-modal-preview-title" class="font-bold text-white text-sm truncate">${defaultSiteTitle}</h4>
            <p id="share-modal-preview-text" class="text-xs text-slate-400 truncate">${defaultSiteDesc}</p>
          </div>
        </div>

        <!-- 공유 채널 그리드 (6대 핵심 채널: 카톡, 라인, X, 네이버, 밴드, 시스템공유) -->
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 text-center">
          <!-- 1) LINE (라인 - 일본 및 글로벌 1위) -->
          <button type="button" onclick="window.shareTarget('line')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-[#06C755] hover:bg-[#05b34c] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 text-white">
              <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.589.39.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.973z"/></svg>
            </div>
            <span class="text-[11px] font-bold text-slate-200">LINE</span>
          </button>

          <!-- 2) X (트위터) -->
          <button type="button" onclick="window.shareTarget('x')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-black border border-slate-700 hover:border-slate-500 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 text-white">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </div>
            <span class="text-[11px] font-bold text-slate-200">X</span>
          </button>

          <!-- 3) 카카오톡 -->
          <button type="button" onclick="window.shareTarget('kakao')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-[#fee500] hover:bg-[#fedd00] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="#3A1D1D"><path d="M12 3c-5.52 0-10 3.58-10 8 0 2.87 1.88 5.39 4.73 6.78-.21.77-.76 2.81-.88 3.25-.14.54.2.53.42.38.17-.11 2.37-1.6 3.32-2.25.79.11 1.6.17 2.41.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
            </div>
            <span class="text-[11px] font-bold text-slate-200">${isJa ? 'Kakao' : '카카오톡'}</span>
          </button>

          <!-- 4) 네이버 (블로그/카페) -->
          <button type="button" onclick="window.shareTarget('naver')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-[#03c75a] hover:bg-[#02b350] flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-105">
              N
            </div>
            <span class="text-[11px] font-bold text-slate-200">${isJa ? 'Naver' : '네이버'}</span>
          </button>

          <!-- 5) 밴드 (BAND) -->
          <button type="button" onclick="window.shareTarget('band')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-[#00d33e] hover:bg-[#00be37] flex items-center justify-center text-white font-black text-lg shadow-lg transition-transform group-hover:scale-105">
              b
            </div>
            <span class="text-[11px] font-bold text-slate-200">BAND</span>
          </button>

          <!-- 6) 전체 메신저 / 시스템 공유 -->
          <button type="button" onclick="window.shareTarget('native')" class="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-base shadow-lg transition-transform group-hover:scale-105">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <span class="text-[11px] font-bold text-slate-200">${moreLabel}</span>
          </button>
        </div>

        <!-- 하단 URL 직접 복사 입력 바 -->
        <div class="pt-2">
          <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1.5 pl-3">
            <input id="share-modal-url-input" type="text" readonly class="bg-transparent text-xs text-slate-400 flex-1 outline-none font-mono truncate" />
            <button type="button" onclick="window.shareTarget('copy')" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow">
              <i class="fa-regular fa-copy"></i>
              <span>${copyLabel}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // 바깥 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.closeShareModal();
      }
    });

    document.body.appendChild(modal);
  }

  // 5. 모달 열기 함수
  window.openShareModal = function(data = {}) {
    ensureModal();
    currentShareData = {
      title: data.title || document.title,
      text: data.text || 'GoModo 일상 생활 유틸리티 도구를 무료로 확인해보세요!',
      url: data.url || window.location.href
    };

    const previewTitle = document.getElementById('share-modal-preview-title');
    const previewText = document.getElementById('share-modal-preview-text');
    const urlInput = document.getElementById('share-modal-url-input');

    if (previewTitle) previewTitle.textContent = currentShareData.title;
    if (previewText) previewText.textContent = currentShareData.text;
    if (urlInput) urlInput.value = currentShareData.url;

    const modal = document.getElementById('gomodo-share-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }
  };

  // 6. 모달 닫기
  window.closeShareModal = function() {
    const modal = document.getElementById('gomodo-share-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  };

  // ESC 키로 닫기
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeShareModal();
    }
  });

  // 7. 채널별 공유 실행 핸들러
  window.shareTarget = function(channel) {
    const { title, text, url } = currentShareData;

    // A. 카카오톡
    if (channel === 'kakao') {
      // 1) 만약 카카오 SDK 키가 등록되어 있고 SDK가 초기화된 경우 공식 피드 전송
      if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
        try {
          Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: title,
              description: text,
              imageUrl: 'https://www.gomodo.cloud/og-image.png',
              link: {
                mobileWebUrl: url,
                webUrl: url,
              },
            },
            buttons: [
              {
                title: 'GoModo에서 확인하기',
                link: {
                  mobileWebUrl: url,
                  webUrl: url,
                },
              },
            ],
          });
          window.closeShareModal();
          return;
        } catch (err) {
          console.warn('Kakao share fallback:', err);
        }
      }

      // 2) 모바일 환경인 경우 Web Share API로 카카오톡 직접 선택 유도
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        navigator.share({
          title: title,
          text: `${title}\n${text}`,
          url: url
        }).then(() => {
          window.closeShareModal();
        }).catch(() => {});
        return;
      }

      // 3) PC 환경 또는 미지원 브라우저: 클립보드에 카톡 공유용 전체 문구 복사
      const copyPayload = `[${title}]\n${text}\n\n👉 바로가기: ${url}`;
      navigator.clipboard.writeText(copyPayload).then(() => {
        window.showToast('카톡 공유 문구가 복사되었습니다! 채팅방에 붙여넣기(Ctrl+V)하세요.');
        window.closeShareModal();
      }).catch(() => {
        fallbackCopyText(copyPayload);
      });
      return;
    }

    // B. LINE (라인 - 일본 및 글로벌)
    if (channel === 'line') {
      const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
      window.open(lineUrl, 'shareLine', 'width=500,height=550,resizable=yes');
      window.closeShareModal();
      return;
    }

    // C. X (구 트위터)
    if (channel === 'x') {
      const xText = `${title}\n${text}`;
      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(url)}`;
      window.open(xUrl, 'shareX', 'width=550,height=420,resizable=yes');
      window.closeShareModal();
      return;
    }

    // D. 네이버 (블로그/카페)
    if (channel === 'naver') {
      const naverUrl = `https://share.naver.com/web/shareView.nhn?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - ' + text)}`;
      window.open(naverUrl, 'shareNaver', 'width=500,height=500,resizable=yes');
      window.closeShareModal();
      return;
    }

    // E. 밴드 (BAND)
    if (channel === 'band') {
      const bandBody = `${title}\n${text}\n${url}`;
      const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(bandBody)}&route=${encodeURIComponent(url)}`;
      window.open(bandUrl, 'shareBand', 'width=500,height=550,resizable=yes');
      window.closeShareModal();
      return;
    }

    // F. 시스템 네이티브 공유 (Web Share API)
    if (channel === 'native') {
      if (navigator.share) {
        navigator.share({
          title: title,
          text: `${title}\n${text}`,
          url: url
        }).then(() => {
          window.closeShareModal();
        }).catch(() => {});
      } else {
        // 데스크탑 미지원 시 링크 복사
        window.shareTarget('copy');
      }
      return;
    }

    // E. 링크 복사
    if (channel === 'copy') {
      const isJa = document.documentElement.lang === 'ja';
      navigator.clipboard.writeText(url).then(() => {
        window.showToast(isJa ? 'リンクをクリップボードにコピーしました！🎉' : '링크가 클립보드에 복사되었습니다! 🎉');
        window.closeShareModal();
      }).catch(() => {
        fallbackCopyText(url);
      });
    }
  };

  // 폴백 복사 (구형 브라우저 대응)
  function fallbackCopyText(text) {
    const isJa = document.documentElement.lang === 'ja';
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      window.showToast(isJa ? 'リンクをコピーしました！' : '클립보드에 복사되었습니다!');
      window.closeShareModal();
    } catch (e) {
      alert(isJa ? 'コピーに失敗しました。URLを直接コピーしてください。' : '복사에 실패했습니다. 주소를 직접 복사해주세요.');
    }
    document.body.removeChild(tempInput);
  }

  // 6. URL 파라미터 양방향 동기화 및 복원 헬퍼 (상태 보존형 공유)
  window.updateUrlParams = function(params) {
    try {
      const url = new URL(window.location.href);
      Object.entries(params).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') {
          url.searchParams.delete(k);
        } else {
          url.searchParams.set(k, String(v));
        }
      });
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      if (typeof currentShareData !== 'undefined') {
        currentShareData.url = window.location.href;
        const urlInput = document.getElementById('share-modal-url-input');
        if (urlInput) urlInput.value = window.location.href;
      }
    } catch (e) {
      console.warn('URL sync failed:', e);
    }
  };

  window.getUrlParams = function() {
    try {
      return Object.fromEntries(new URLSearchParams(window.location.search).entries());
    } catch (e) {
      return {};
    }
  };

  // 7. 공통 도구 드롭다운 토글 및 바깥 클릭 감지
  window.toggleToolDropdown = function(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('tool-dropdown-menu');
    const arrow = document.getElementById('tool-dropdown-arrow');
    const btn = document.getElementById('tool-dropdown-btn');
    if (!menu) return;
    const isExpanded = !menu.classList.contains('hidden');
    if (isExpanded) {
      menu.classList.add('hidden');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
      if (btn) btn.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.remove('hidden');
      if (arrow) arrow.style.transform = 'rotate(180deg)';
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  };

  // 바깥 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    const container = document.getElementById('tool-dropdown-container');
    const menu = document.getElementById('tool-dropdown-menu');
    const arrow = document.getElementById('tool-dropdown-arrow');
    const btn = document.getElementById('tool-dropdown-btn');
    if (menu && !menu.classList.contains('hidden')) {
      if (container && !container.contains(e.target)) {
        menu.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    }
  });
})();
