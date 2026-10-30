/**
 * GoModo Universal In-App WebView Compatibility Layer (inapp-webview.js)
 * 
 * [지원 및 최적화 대상 환경]
 * - 카카오톡 인앱 브라우저 (KakaoTalk / KAKAOTALK)
 * - 인스타그램 인앱 브라우저 (Instagram)
 * - 페이스북 / 메신저 웹뷰 (FBAV, FBAN, FB_IAB)
 * - 라인 (LINE)
 * - 네이버 인앱 브라우저 (NAVER in-app)
 * - 기타 안드로이드/iOS 임베디드 웹뷰
 * 
 * [핵심 기능]
 * 1. 클립보드 복사(navigator.clipboard.writeText) 100% 무중단 폴백:
 *    - 웹뷰의 Document is not focused / NotAllowedError 완벽 방어
 *    - execCommand('copy') 임시 텍스트에어리어 폴백
 *    - navigator.clipboard.writeText 자동 래핑 & window.GoModoCopy 제공
 * 2. 인앱 브라우저 감지 및 스마트 외부 브라우저(Chrome/Safari) 탈출 안내:
 *    - 안드로이드: Chrome 인텐트(intent://) 및 카카오톡 외부 브라우저(kakaotalk://web/openExternal) 원클릭 연동
 *    - iOS: 우측 상단 ⋯(더보기) ➔ 'Safari로 열기' 직관적 툴팁 가이드
 *    - 오늘 하루 보지 않기(localStorage) 보존
 * 3. 뷰포트 높이(dvh) 및 모바일 Safe Area(아이폰 홈바/노치, 카톡 하단 툴바 가림 방지) 자동 CSS 보정
 * 4. 범용 Web Share API 및 링크 공유 헬퍼(window.GoModoShare)
 */

(function () {
  'use strict';

  // ==========================================
  // 1. Safe Area & 100dvh Dynamic CSS Injection
  // ==========================================
  try {
    var style = document.createElement('style');
    style.id = 'gomodo-inapp-style';
    style.textContent = [
      '@supports (min-height: 100dvh) {',
      '  body { min-height: 100dvh !important; }',
      '}',
      'body {',
      '  padding-bottom: env(safe-area-inset-bottom, 0px);',
      '  -webkit-overflow-scrolling: touch;',
      '}',
      '#gomodo-inapp-banner {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  z-index: 99999;',
      '  background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);',
      '  border-bottom: 1px solid rgba(99, 102, 241, 0.3);',
      '  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);',
      '  color: #f8fafc;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Pretendard", Roboto, sans-serif;',
      '  font-size: 13px;',
      '  line-height: 1.4;',
      '  animation: gomodoSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);',
      '}',
      '@keyframes gomodoSlideDown {',
      '  from { transform: translateY(-100%); }',
      '  to { transform: translateY(0); }',
      '}',
      '#gomodo-inapp-tooltip {',
      '  position: fixed;',
      '  top: 60px;',
      '  right: 16px;',
      '  z-index: 100000;',
      '  background: #0f172a;',
      '  border: 1px solid #6366f1;',
      '  border-radius: 16px;',
      '  padding: 14px 16px;',
      '  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);',
      '  color: #fff;',
      '  max-width: 280px;',
      '  font-size: 12px;',
      '  animation: gomodoFadeIn 0.2s ease-out;',
      '}',
      '@keyframes gomodoFadeIn {',
      '  from { opacity: 0; transform: scale(0.95); }',
      '  to { opacity: 1; transform: scale(1); }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  } catch (e) {}

  // ==========================================
  // 2. Multi-tier Robust Clipboard Copy Fallback
  // ==========================================
  function fallbackExecCopy(text) {
    return new Promise(function (resolve, reject) {
      try {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        textarea.style.opacity = '0.001';
        textarea.style.fontSize = '16px'; // Prevent iOS viewport auto-zoom

        document.body.appendChild(textarea);

        // iOS Safari & In-App WebView Range Selection
        if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
          textarea.contentEditable = true;
          textarea.readOnly = false;
          var range = document.createRange();
          range.selectNodeContents(textarea);
          var selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          textarea.setSelectionRange(0, 999999);
        } else {
          textarea.focus();
          textarea.select();
        }

        var success = false;
        try {
          success = document.execCommand('copy');
        } catch (e) {
          success = false;
        }

        document.body.removeChild(textarea);

        if (success) {
          resolve(true);
        } else {
          // 3rd Priority Fallback: Manual Prompt
          try {
            window.prompt('아래 내용을 길게 눌러 복사하세요:', text);
            resolve(true);
          } catch (promptErr) {
            reject(new Error('execCommand and prompt failed'));
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function universalCopy(text) {
    if (typeof text !== 'string') text = String(text || '');

    // 1st Priority: Native Navigator Clipboard (if available and secure context)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function' && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        // Fallback to execCommand on WebView focus error
        return fallbackExecCopy(text);
      });
    }

    // 2nd Priority: Fallback execCommand
    return fallbackExecCopy(text);
  }

  // Intercept & Polyfill navigator.clipboard.writeText for existing 34 pages
  try {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: universalCopy },
        writable: true,
        configurable: true
      });
    } else {
      var originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function (text) {
        return originalWriteText(text).catch(function () {
          return fallbackExecCopy(text);
        });
      };
    }
  } catch (e) {
    // If navigator.clipboard is strictly read-only in this engine, provide window.GoModoCopy
  }

  window.GoModoCopy = universalCopy;

  // ==========================================
  // 3. Universal Web Share & Fallback
  // ==========================================
  window.GoModoShare = function (shareData) {
    var data = shareData || {};
    var title = data.title || document.title || 'GoModo';
    var text = data.text || '';
    var url = data.url || window.location.href;

    if (navigator.share && typeof navigator.share === 'function') {
      return navigator.share({
        title: title,
        text: text,
        url: url
      }).catch(function (err) {
        // User aborted share dialog is not an error that needs fallback
        if (err && err.name === 'AbortError') return;
        return universalCopy(url);
      });
    } else {
      // Fallback: copy URL to clipboard
      return universalCopy(url);
    }
  };

  // ==========================================
  // 4. In-App WebView Detection & Outlink Helper
  // ==========================================
  var ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  var isKakao = ua.indexOf('kakaotalk') > -1;
  var isInstagram = ua.indexOf('instagram') > -1;
  var isFacebook = (ua.indexOf('fbav') > -1 || ua.indexOf('fban') > -1 || ua.indexOf('fb_iab') > -1);
  var isLine = ua.indexOf('line/') > -1;
  var isNaver = ua.indexOf('naver(inapp') > -1;
  var isAndroid = ua.indexOf('android') > -1;
  var isIOS = /iphone|ipad|ipod/.test(ua);

  var isInApp = isKakao || isInstagram || isFacebook || isLine || isNaver || (isAndroid && ua.indexOf('wv') > -1);

  window.GoModoInApp = {
    isInApp: isInApp,
    isKakao: isKakao,
    isInstagram: isInstagram,
    isFacebook: isFacebook,
    isLine: isLine,
    isNaver: isNaver,
    isAndroid: isAndroid,
    isIOS: isIOS,
    openExternal: openExternalBrowser
  };

  function getAppName() {
    if (isKakao) return '카카오톡';
    if (isInstagram) return '인스타그램';
    if (isFacebook) return '페이스북';
    if (isLine) return '라인';
    if (isNaver) return '네이버 앱';
    return '인앱 브라우저';
  }

  function openExternalBrowser() {
    var fullUrl = window.location.href;

    if (isAndroid) {
      // Android Chrome Intent Scheme
      var cleanUrl = fullUrl.replace(/^https?:\/\//i, '');
      var intentUrl = 'intent://' + cleanUrl + '#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end';

      // KakaoTalk specific fallback scheme
      if (isKakao) {
        window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(fullUrl);
        setTimeout(function () {
          window.location.href = intentUrl;
        }, 500);
      } else {
        window.location.href = intentUrl;
      }
    } else if (isIOS) {
      // iOS: Show clear user guide tooltip
      showIOSTooltip();
    }
  }

  function showIOSTooltip() {
    var existing = document.getElementById('gomodo-inapp-tooltip');
    if (existing) {
      existing.remove();
      return;
    }

    var tip = document.createElement('div');
    tip.id = 'gomodo-inapp-tooltip';
    tip.innerHTML = [
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">',
      '  <span style="font-weight:bold; color:#a5b4fc; font-size:13px;">💡 Safari로 열기 안내</span>',
      '  <button type="button" id="gomodo-close-tip" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:0 4px;">&times;</button>',
      '</div>',
      '<div style="line-height:1.5; color:#cbd5e1; font-size:12px;">',
      '  화면 <b>우측 상단 ⋯(더보기)</b> 또는 <b>우측 하단 공유 아이콘</b>을 누른 뒤, <b>[Safari로 열기]</b>를 선택하시면 훨씬 빠르고 쾌적하게 이용하실 수 있습니다.',
      '</div>'
    ].join('');

    document.body.appendChild(tip);

    document.getElementById('gomodo-close-tip').onclick = function () {
      tip.remove();
    };

    setTimeout(function () {
      if (document.body.contains(tip)) {
        tip.remove();
      }
    }, 8000);
  }

  // ==========================================
  // 5. In-App Smart Notice Bar Rendering
  // ==========================================
  function initInAppBanner() {
    if (!isInApp) return;

    // Check dismissed today
    var todayKey = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem('gomodo_inapp_dismissed') === todayKey) {
        return;
      }
    } catch (e) {}

    var appName = getAppName();
    var banner = document.createElement('div');
    banner.id = 'gomodo-inapp-banner';

    var btnHtml = isAndroid
      ? '<button type="button" id="gomodo-btn-open-ext" style="background:#4f46e5; hover:background:#4338ca; color:#fff; border:none; border-radius:8px; padding:5px 10px; font-weight:bold; font-size:11px; cursor:pointer; margin-left:8px; white-space:nowrap;">Chrome으로 열기</button>'
      : '<button type="button" id="gomodo-btn-open-ext" style="background:#4f46e5; hover:background:#4338ca; color:#fff; border:none; border-radius:8px; padding:5px 10px; font-weight:bold; font-size:11px; cursor:pointer; margin-left:8px; white-space:nowrap;">Safari로 열기</button>';

    banner.innerHTML = [
      '<div style="max-w: 1200px; margin: 0 auto; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">',
      '  <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">',
      '    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#818cf8; flex-shrink:0;"></span>',
      '    <span style="color:#e2e8f0; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">',
      '      <b>' + appName + '</b> 웹뷰 환경입니다. 기본 브라우저에서 최적의 속도로 동작합니다.',
      '    </span>',
      '  </div>',
      '  <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">',
      btnHtml,
      '    <button type="button" id="gomodo-btn-close-banner" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:2px 6px; line-height:1;" aria-label="닫기">&times;</button>',
      '  </div>',
      '</div>'
    ].join('');

    // Wait until body exists
    function attachBanner() {
      if (document.body) {
        document.body.prepend(banner);

        // Adjust body padding top so content is not hidden by fixed banner
        var bannerHeight = banner.offsetHeight || 38;
        document.body.style.paddingTop = bannerHeight + 'px';

        document.getElementById('gomodo-btn-open-ext').onclick = function () {
          openExternalBrowser();
        };

        document.getElementById('gomodo-btn-close-banner').onclick = function () {
          banner.remove();
          document.body.style.paddingTop = '';
          try {
            localStorage.setItem('gomodo_inapp_dismissed', todayKey);
          } catch (e) {}
        };
      } else {
        setTimeout(attachBanner, 50);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachBanner);
    } else {
      attachBanner();
    }
  }

  initInAppBanner();
})();
