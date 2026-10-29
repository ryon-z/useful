/**
 * GoModo (고모도) 테마 관리 모듈 (theme.js)
 * - 라이트 / 다크 모드 전환 & 로컬 저장소(localStorage) 영구 기억
 * - 깜빡임(FOUC) 없는 즉시 렌더링 지원
 */

(function() {
  // 1. 저장된 테마 확인 및 즉시 적용 (FOUC 방지)
  const savedTheme = localStorage.getItem('gomodo-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  // 사용자가 명시적으로 'light'를 선택했거나 시스템 설정이 light인 경우 적용 (기본: dark)
  if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }

  // 2. 테마 전환 함수
  window.toggleTheme = function() {
    const isLight = document.documentElement.classList.toggle('light');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('gomodo-theme', newTheme);

    updateThemeIcons(isLight);

    if (window.showToast) {
      window.showToast(isLight ? '☀️ 라이트 모드로 전환되었습니다.' : '🌙 다크 모드로 전환되었습니다.');
    }
  };

  // 3. UI 아이콘 갱신 (해/달)
  function updateThemeIcons(isLight) {
    const sunIcons = document.querySelectorAll('.theme-icon-sun');
    const moonIcons = document.querySelectorAll('.theme-icon-moon');

    sunIcons.forEach(icon => {
      if (isLight) {
        icon.classList.remove('hidden');
      } else {
        icon.classList.add('hidden');
      }
    });

    moonIcons.forEach(icon => {
      if (isLight) {
        icon.classList.add('hidden');
      } else {
        icon.classList.remove('hidden');
      }
    });
  }

  // 5. 도구 드롭다운 메뉴 토글 & 바깥 영역 클릭 시 닫기 (공용)
  window.toggleToolDropdown = function(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('tool-dropdown-menu');
    const arrow = document.getElementById('tool-dropdown-arrow');
    const btn = document.getElementById('tool-dropdown-btn');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !isHidden);
    if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    if (btn) btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  };

  document.addEventListener('click', function(e) {
    const container = document.getElementById('tool-dropdown-container');
    const menu = document.getElementById('tool-dropdown-menu');
    const arrow = document.getElementById('tool-dropdown-arrow');
    const btn = document.getElementById('tool-dropdown-btn');
    if (container && !container.contains(e.target) && menu && !menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });

  // 6. DOMContentLoaded 시 아이콘 상태 동기화
  window.addEventListener('DOMContentLoaded', () => {
    const isLight = document.documentElement.classList.contains('light');
    updateThemeIcons(isLight);
  });

  // 7. 타 탭 간 테마 동기화
  window.addEventListener('storage', (e) => {
    if (e.key === 'gomodo-theme') {
      const isLight = e.newValue === 'light';
      if (isLight) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      updateThemeIcons(isLight);
    }
  });
})();
