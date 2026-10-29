/**
 * GoModo Single Source of Truth (SSOT) 공용 부품 동기화 스크립트 (sync-common.js)
 * 
 * [기능]
 * 1. shared/tools.json 기반으로 국가별(한국/일본/미국) 도구 목록을 헤더 드롭다운에 자동 생성 및 동기화
 * 2. 현재 도구 페이지를 자동으로 감지하여 활성(Active) 하이라이트 적용
 * 3. 24개 전 페이지의 Google AdSense 스크립트(ca-pub-4528673716962845) 및 테마 파일 경로 일관성 보장
 * 4. tools.json에 신규 도구 추가 시 sitemap.xml 누락 여부 자동 점검 및 동기화
 * 5. 마커(<!-- SHARED:... -->) 기반으로 안전하게 치환하여 고유 비즈니스 로직 보존
 * 
 * [실행 방법]
 * node scripts/sync-common.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const toolsJsonPath = path.join(rootDir, 'shared', 'tools.json');

if (!fs.existsSync(toolsJsonPath)) {
  console.error(`[ERROR] tools.json not found at ${toolsJsonPath}`);
  process.exit(1);
}

const toolsData = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf8'));
const adsenseClientId = toolsData.meta.adsenseClientId;

// AdSense 스니펫
const adsenseSnippet = `  <!-- SHARED:ADSENSE -->\n  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}" crossorigin="anonymous"></script>\n  <!-- /SHARED:ADSENSE -->`;

function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['useful-docs', '.git', 'node_modules', 'scratch', 'shared'].includes(entry.name)) {
        results.push(...findHtmlFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getCountryKey(relDir) {
  const norm = relDir.replace(/\\/g, '/');
  if (norm.startsWith('ja') || norm === 'ja') return 'ja';
  if (norm.startsWith('en') || norm === 'en') return 'en';
  return 'ko';
}

function getRelativeLink(fromDir, toDir) {
  let link = path.relative(fromDir, toDir).replace(/\\/g, '/');
  if (link === '') return './';
  if (!link.startsWith('.')) link = './' + link;
  if (!link.endsWith('/')) link += '/';
  return link;
}

function generateDropdownHtml(countryKey, currentRelDir) {
  const country = toolsData.countries[countryKey];
  if (!country) return '';

  const dropdownCfg = country.dropdown;
  const tools = country.tools;

  // Hub link calculation
  const targetHubDir = (country.hubPath === '/' || country.hubPath === '') ? '.' : country.hubPath.replace(/\/$/, '');
  const hubLink = getRelativeLink(currentRelDir, targetHubDir);

  const toolLinksHtml = tools.map(tool => {
    const targetToolDir = tool.path.replace(/\/$/, '');
    const link = getRelativeLink(currentRelDir, targetToolDir);
    const isActive = (currentRelDir === targetToolDir);
    const containerClasses = isActive
      ? `flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/80 text-${tool.color}-400 transition group`
      : `flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition group`;

    const titleClasses = `text-xs font-bold text-white group-hover:text-${tool.color}-300 transition truncate`;

    return `              <a href="${link}" class="${containerClasses}">
                <div class="w-7 h-7 rounded-lg bg-${tool.color}-500/20 text-${tool.color}-400 flex items-center justify-center text-xs font-black">
                  <i class="fa-solid ${tool.icon}"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="${titleClasses}">${tool.name}</div>
                  <div class="text-[10px] text-slate-400 truncate">${tool.desc}</div>
                </div>
              </a>`;
  }).join('\n\n');

  return `<!-- SHARED:TOOL_DROPDOWN -->
        <div class="relative" id="tool-dropdown-container">
          <button type="button" onclick="toggleToolDropdown(event)" id="tool-dropdown-btn" class="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-700/80 transition active:scale-95 shadow-sm whitespace-nowrap flex-shrink-0" aria-expanded="false" aria-label="${dropdownCfg.buttonText}">
            <i class="fa-solid fa-shapes ${dropdownCfg.iconColor} text-xs sm:text-sm"></i>
            <span class="hidden sm:inline font-bold">${dropdownCfg.buttonText}</span>
            <span class="sm:hidden font-bold">${dropdownCfg.buttonTextMobile}</span>
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200" id="tool-dropdown-arrow"></i>
          </button>

          <!-- 드롭다운 메뉴 (${country.name} 특화 도구 ${tools.length}개) -->
          <div id="tool-dropdown-menu" class="hidden absolute right-0 mt-2 w-64 sm:w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800">
            <div class="px-3 py-2 text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>${dropdownCfg.title} (${tools.length})</span>
              <a href="${hubLink}" class="text-[10px] ${dropdownCfg.homeLinkColor} font-semibold hover:underline">${dropdownCfg.homeLabel}</a>
            </div>
            
            <div class="pt-1 space-y-1">
${toolLinksHtml}
            </div>
          </div>
        </div>
        <!-- /SHARED:TOOL_DROPDOWN -->`;
}

function generateFooterHtml(countryKey, currentRelDir) {
  const country = toolsData.countries[countryKey];
  if (!country) return '';

  const meta = toolsData.meta;
  const footerCfg = country.footer;
  const tools = country.tools;

  // Legal page links
  const aboutLink = getRelativeLink(currentRelDir, footerCfg.aboutPath.replace(/\/$/, ''));
  const termsLink = getRelativeLink(currentRelDir, footerCfg.termsPath.replace(/\/$/, ''));
  const privacyLink = getRelativeLink(currentRelDir, footerCfg.privacyPath.replace(/\/$/, ''));

  // Global hub links
  const krHubLink = getRelativeLink(currentRelDir, '.');
  const jaHubLink = getRelativeLink(currentRelDir, 'ja');
  const enHubLink = getRelativeLink(currentRelDir, 'en');

  // Determine disclaimer text (tool specific or default)
  const currentTool = tools.find(t => t.path.replace(/\/$/, '') === currentRelDir);
  const disclaimerText = (currentTool && currentTool.disclaimer) ? currentTool.disclaimer : footerCfg.defaultDisclaimer;

  return `<!-- SHARED:FOOTER -->
  <footer class="border-t border-slate-800 bg-slate-950 text-slate-400 py-8 text-xs text-center mt-auto">
    <div class="max-w-5xl mx-auto px-4 space-y-4">
      <!-- 1. 법적 고지 및 소개 링크 -->
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-400">
        <a href="${aboutLink}" class="hover:text-${footerCfg.accentColor}-400 transition">${footerCfg.aboutLabel}</a>
        <span>•</span>
        <a href="${termsLink}" class="hover:text-${footerCfg.accentColor}-400 transition">${footerCfg.termsLabel}</a>
        <span>•</span>
        <a href="${privacyLink}" class="hover:text-${footerCfg.accentColor}-400 transition">${footerCfg.privacyLabel}</a>
      </div>

      <!-- 2. 글로벌 포털 허브 바로가기 -->
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
        <span class="text-slate-600">${footerCfg.globalLabel}:</span>
        <a href="${krHubLink}" class="${countryKey === 'ko' ? 'text-slate-300 font-bold' : 'hover:text-slate-300 transition'}">🇰🇷 한국어</a>
        <span>|</span>
        <a href="${jaHubLink}" class="${countryKey === 'ja' ? 'text-slate-300 font-bold' : 'hover:text-slate-300 transition'}">🇯🇵 日本語</a>
        <span>|</span>
        <a href="${enHubLink}" class="${countryKey === 'en' ? 'text-slate-300 font-bold' : 'hover:text-slate-300 transition'}">🇺🇸 English</a>
      </div>

      <!-- 3. 면책 조항 -->
      <div class="max-w-3xl mx-auto text-[11px] text-slate-500 leading-relaxed border-t border-slate-900 pt-3">
        ${disclaimerText}
      </div>

      <!-- 4. 저작권 & E-E-A-T 지원 이메일 -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-[11px] text-slate-500">
        <span>${meta.copyright}</span>
        <span class="hidden sm:inline">•</span>
        <span>Contact: <a href="mailto:${meta.supportEmail}" class="hover:text-slate-400 underline">${meta.supportEmail}</a></span>
      </div>
    </div>
  </footer>
  <!-- /SHARED:FOOTER -->`;
}

function syncFile(filePath) {
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const relDir = path.dirname(relPath).replace(/\\/g, '/');
  const countryKey = getCountryKey(relDir);

  let raw = fs.readFileSync(filePath, 'utf8');
  const isCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  let modified = false;

  // 1. Google AdSense Sync
  if (content.includes('<!-- SHARED:ADSENSE -->')) {
    const adsenseRegex = /<!-- SHARED:ADSENSE -->[\s\S]*?<!-- \/SHARED:ADSENSE -->/;
    if (adsenseRegex.test(content)) {
      const updated = content.replace(adsenseRegex, adsenseSnippet.trim());
      if (updated !== content) {
        content = updated;
        modified = true;
      }
    }
  } else if (content.includes(adsenseClientId)) {
    // Wrap existing script with markers
    const existingAdRegex = new RegExp(`(\\s*<!--[^>]*애드센스[^>]*-->\\s*)?<script async src="https://pagead2\\.googlesyndication\\.com/pagead/js/adsbygoogle\\.js\\?client=${adsenseClientId}" crossorigin="anonymous"></script>`);
    if (existingAdRegex.test(content)) {
      content = content.replace(existingAdRegex, '\n' + adsenseSnippet);
      modified = true;
    }
  } else if (content.includes('</head>')) {
    // Missing AdSense - inject right before </head>
    content = content.replace('</head>', adsenseSnippet + '\n</head>');
    modified = true;
  }

  // 2. Tool Dropdown Sync
  const newDropdown = generateDropdownHtml(countryKey, relDir);
  
  if (content.includes('<!-- SHARED:TOOL_DROPDOWN -->')) {
    const markerRegex = /<!-- SHARED:TOOL_DROPDOWN -->[\s\S]*?<!-- \/SHARED:TOOL_DROPDOWN -->/;
    const updated = content.replace(markerRegex, newDropdown);
    if (updated !== content) {
      content = updated;
      modified = true;
    }
  } else if (content.includes('id="tool-dropdown-container"')) {
    const unMarkedRegex = /(<!--[^\n]*도구[^\n]*드롭다운[^\n]*-->\s*)?<div class="relative" id="tool-dropdown-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    if (unMarkedRegex.test(content)) {
      content = content.replace(unMarkedRegex, newDropdown);
      modified = true;
    }
  }

  // 3. Footer Sync
  const newFooter = generateFooterHtml(countryKey, relDir);
  if (content.includes('<!-- SHARED:FOOTER -->')) {
    const footerMarkerRegex = /<!-- SHARED:FOOTER -->[\s\S]*?<!-- \/SHARED:FOOTER -->/;
    const updated = content.replace(footerMarkerRegex, newFooter);
    if (updated !== content) {
      content = updated;
      modified = true;
    }
  } else if (content.includes('<footer')) {
    const rawFooterRegex = /<footer[\s\S]*?<\/footer>/;
    if (rawFooterRegex.test(content)) {
      content = content.replace(rawFooterRegex, newFooter);
      modified = true;
    }
  }

  if (modified) {
    const finalContent = isCRLF ? content.replace(/\n/g, '\r\n') : content;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    return { relPath, status: 'UPDATED' };
  }

  return { relPath, status: 'UP_TO_DATE' };
}

function verifySitemap() {
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;

  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const allToolPaths = [];

  for (const cKey of Object.keys(toolsData.countries)) {
    const c = toolsData.countries[cKey];
    for (const t of c.tools) {
      allToolPaths.push(t.path);
    }
  }

  const missing = allToolPaths.filter(p => !sitemap.includes(p));
  if (missing.length > 0) {
    console.warn(`[WARN] The following tools are missing from sitemap.xml:`, missing);
  } else {
    console.log(`[OK] All ${allToolPaths.length} tools from tools.json are registered in sitemap.xml!`);
  }
}

// Main execution
console.log('=== GoModo SSOT Common Component Sync ===');
const files = findHtmlFiles(rootDir);
console.log(`Auditing and synchronizing ${files.length} HTML files...\n`);

let updatedCount = 0;
let upToDateCount = 0;

for (const f of files) {
  const res = syncFile(f);
  if (res.status === 'UPDATED') {
    console.log(`[UPDATED]    ${res.relPath}`);
    updatedCount++;
  } else {
    upToDateCount++;
  }
}

console.log(`\nSync Summary: ${updatedCount} files updated, ${upToDateCount} files up-to-date.`);
verifySitemap();
console.log('=== Sync Complete ===\n');
