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
            <h3 class="text-lg sm:text-xl font-black text-white">공유하기</h3>
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
            <h4 id="share-modal-preview-title" class="font-bold text-white text-sm truncate">GoModo 생활 도구</h4>
            <p id="share-modal-preview-text" class="text-xs text-slate-400 truncate">편리하고 유용한 무료 생활 웹앱</p>
          </div>
        </div>

        <!-- 공유 채널 그리드 (4개 핵심 채널) -->
        <div class="grid grid-cols-4 gap-2.5 sm:gap-3 text-center">
          <!-- 1) 카카오톡 -->
          <button type="button" onclick="window.shareTarget('kakao')" class="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#fee500] hover:bg-[#fedd00] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="#3A1D1D"><path d="M12 3c-5.52 0-10 3.58-10 8 0 2.87 1.88 5.39 4.73 6.78-.21.77-.76 2.81-.88 3.25-.14.54.2.53.42.38.17-.11 2.37-1.6 3.32-2.25.79.11 1.6.17 2.41.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg>
            </div>
            <span class="text-xs font-bold text-slate-200">카카오톡</span>
          </button>

          <!-- 2) 네이버 (블로그/카페) -->
          <button type="button" onclick="window.shareTarget('naver')" class="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#03c75a] hover:bg-[#02b350] flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-105">
              N
            </div>
            <span class="text-xs font-bold text-slate-200">네이버</span>
          </button>

          <!-- 3) 밴드 (BAND) -->
          <button type="button" onclick="window.shareTarget('band')" class="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#00d33e] hover:bg-[#00be37] flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-105">
              b
            </div>
            <span class="text-xs font-bold text-slate-200">밴드</span>
          </button>

          <!-- 4) 전체 메신저 / 시스템 공유 -->
          <button type="button" onclick="window.shareTarget('native')" class="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl hover:bg-slate-800/60 active:scale-95 transition group">
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-105">
              <i class="fa-solid fa-paper-plane"></i>
            </div>
            <span class="text-xs font-bold text-slate-200">더보기</span>
          </button>
        </div>

        <!-- 하단 URL 직접 복사 입력 바 -->
        <div class="pt-2">
          <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1.5 pl-3">
            <input id="share-modal-url-input" type="text" readonly class="bg-transparent text-xs text-slate-400 flex-1 outline-none font-mono truncate" />
            <button type="button" onclick="window.shareTarget('copy')" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow">
              <i class="fa-regular fa-copy"></i>
              <span>복사</span>
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

    // B. 네이버 (블로그/카페)
    if (channel === 'naver') {
      const naverUrl = `https://share.naver.com/web/shareView.nhn?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' - ' + text)}`;
      window.open(naverUrl, 'shareNaver', 'width=500,height=500,resizable=yes');
      window.closeShareModal();
      return;
    }

    // C. 밴드 (BAND)
    if (channel === 'band') {
      const bandBody = `${title}\n${text}\n${url}`;
      const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(bandBody)}&route=${encodeURIComponent(url)}`;
      window.open(bandUrl, 'shareBand', 'width=500,height=550,resizable=yes');
      window.closeShareModal();
      return;
    }

    // D. 시스템 네이티브 공유 (Web Share API)
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
      navigator.clipboard.writeText(url).then(() => {
        window.showToast('링크가 클립보드에 복사되었습니다! 🎉');
        window.closeShareModal();
      }).catch(() => {
        fallbackCopyText(url);
      });
    }
  };

  // 폴백 복사 (구형 브라우저 대응)
  function fallbackCopyText(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      window.showToast('클립보드에 복사되었습니다!');
      window.closeShareModal();
    } catch (e) {
      alert('복사에 실패했습니다. 주소를 직접 복사해주세요.');
    }
    document.body.removeChild(tempInput);
  }
})();
