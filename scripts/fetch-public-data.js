/**
 * scripts/fetch-public-data.js
 * 
 * GoModo 글로벌 및 국내 공공데이터 자동 수집 파이프라인
 * 
 * [수집 대상]
 * 1. 🇺🇸 미국 로또 (Powerball & Mega Millions 실시간 당첨 번호) - 인증키 불필요 (NY Open Data)
 * 2. 🇯🇵 일본 공휴일 및 연호 캘린더 (내각부 공휴일 API) - 인증키 불필요
 * 3. 🇰🇷 한국 금융감독원 예·적금 최고 금리 순위 - GitHub Secret: FSS_API_KEY 필요 (미설정 시 기본 템플릿 유지)
 * 4. 🇺🇸 미국 연준(FRED) 30년 모기지 금리 - GitHub Secret: FRED_API_KEY 필요 (미설정 시 기본 템플릿 유지)
 * 5. 🇰🇷 한국은행 ECOS 원/달러 종가(15:30) 일별 - GitHub Secret: ECOS_API_KEY 필요 (미설정 시 기존 파일 유지)
 * 
 * 외부 의존성(npm 패키지) 없이 Node.js 18+ 네이티브 fetch 및 fs 모듈만 사용합니다.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// data 디렉토리 존재 확인
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 1. 🇺🇸 미국 복권 실시간 당첨 번호 수집 (Powerball & Mega Millions)
 * New York State Open Data (Socrata API) - 무료 / 인증키 불필요
 */
async function fetchUSLottery() {
  console.log('[1/4] 🇺🇸 Fetching US Lottery Data (Powerball & Mega Millions)...');
  try {
    const [pbRes, mmRes] = await Promise.all([
      fetch('https://data.ny.gov/resource/d6yy-54nr.json?%24limit=10'),
      fetch('https://data.ny.gov/resource/5xaw-6ayf.json?%24limit=10')
    ]);

    if (!pbRes.ok || !mmRes.ok) {
      throw new Error(`US Lottery fetch failed: PB=${pbRes.status}, MM=${mmRes.status}`);
    }

    const pbData = await pbRes.json();
    const mmData = await mmRes.json();

    const result = {
      updatedAt: new Date().toISOString(),
      powerball: pbData.map(item => ({
        drawDate: (item.draw_date || '').split('T')[0],
        winningNumbers: (item.winning_numbers || '').split(' ').slice(0, 5).map(Number),
        powerball: Number((item.winning_numbers || '').split(' ')[5]),
        multiplier: item.multiplier || '1'
      })),
      megaMillions: mmData.map(item => ({
        drawDate: (item.draw_date || '').split('T')[0],
        winningNumbers: (item.winning_numbers || '').split(' ').map(Number),
        megaBall: Number(item.mega_ball),
        multiplier: item.multiplier || '1'
      }))
    };

    const filePath = path.join(DATA_DIR, 'us-lottery.json');
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`  ✅ Saved ${result.powerball.length} Powerball & ${result.megaMillions.length} Mega Millions records to data/us-lottery.json`);
  } catch (err) {
    console.error('  ❌ Error fetching US Lottery data:', err.message);
  }
}

/**
 * 2. 🇯🇵 일본 공휴일 및 연호 캘린더 수집
 * 내각부 국민의 축일 API - 무료 / 인증키 불필요
 */
async function fetchJapanCalendar() {
  console.log('[2/4] 🇯🇵 Fetching Japan National Holidays & Era Data...');
  try {
    const year = 2026;
    const res = await fetch(`https://api.national-holidays.jp/${year}`);
    if (!res.ok) {
      throw new Error(`Japan Holidays HTTP error: ${res.status}`);
    }
    const holidays = await res.json();

    const result = {
      updatedAt: new Date().toISOString(),
      year: year,
      reiwaYear: year - 2018, // 2026년 = 令和8年
      eraMapping: {
        Reiwa: { kanji: '令和', startYear: 2019 },
        Heisei: { kanji: '平成', startYear: 1989, endYear: 2019 },
        Showa: { kanji: '昭和', startYear: 1926, endYear: 1989 },
        Taisho: { kanji: '大正', startYear: 1912, endYear: 1926 }
      },
      holidays: holidays.map(h => ({
        date: h.date,
        name: h.name,
        type: h.type
      }))
    };

    const filePath = path.join(DATA_DIR, 'jp-calendar.json');
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`  ✅ Saved ${result.holidays.length} Japan holidays for ${year} to data/jp-calendar.json`);
  } catch (err) {
    console.error('  ❌ Error fetching Japan calendar data:', err.message);
  }
}

/**
 * 3. 🇰🇷 한국 금융감독원 예·적금 실시간 금리 순위 수집
 * GitHub Secret: FSS_API_KEY 필요
 */
async function fetchKoreaDepositRates() {
  console.log('[3/4] 🇰🇷 Fetching Korea Deposit & Savings Rates (FSS API)...');
  const apiKey = process.env.FSS_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.log('  ℹ️ [Notice] FSS_API_KEY secret is not configured in GitHub Secrets yet.');
    console.log('  ℹ️ Skipping live FSS API query. Maintaining existing/sample data.');
    
    const filePath = path.join(DATA_DIR, 'korea-rates.json');
    if (!fs.existsSync(filePath)) {
      const sample = {
        updatedAt: new Date().toISOString(),
        status: 'sample_template',
        note: 'GitHub Secrets에 FSS_API_KEY 등록 시 실시간 은행 공시 금리로 자동 갱신됩니다.',
        topDeposits: [
          { bankName: '케이뱅크', productName: '코드K 정기예금', termMonths: 12, baseRate: 3.55, maxRate: 3.55 },
          { bankName: '카카오뱅크', productName: '카카오뱅크 정기예금', termMonths: 12, baseRate: 3.50, maxRate: 3.50 },
          { bankName: '토스뱅크', productName: '토스뱅크 먼저 이자 받는 예금', termMonths: 12, baseRate: 3.40, maxRate: 3.40 },
          { bankName: 'SH수협은행', productName: 'Sh첫만남우대예금', termMonths: 12, baseRate: 3.10, maxRate: 4.15 },
          { bankName: 'IBK기업은행', productName: '1석7조통장(정기예금)', termMonths: 12, baseRate: 3.35, maxRate: 3.85 }
        ]
      };
      fs.writeFileSync(filePath, JSON.stringify(sample, null, 2), 'utf-8');
      console.log('  ✅ Created initial sample data in data/korea-rates.json');
    }
    return;
  }

  try {
    const url = `https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json?auth=${encodeURIComponent(apiKey)}&topFinGrpNo=020000&pageNo=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FSS API HTTP error: ${res.status}`);
    
    const json = await res.json();
    const baseList = json?.result?.baseList || [];
    const optionList = json?.result?.optionList || [];

    // 12개월 만기 기준 최고 금리 순으로 매핑
    const products = baseList.map(base => {
      const opt = optionList.find(o => o.fin_prdt_cd === base.fin_prdt_cd && String(o.save_trm) === '12');
      return {
        bankName: base.kor_co_nm,
        productName: base.fin_prdt_nm,
        termMonths: 12,
        baseRate: opt ? Number(opt.intr_rate || 0) : 0,
        maxRate: opt ? Number(opt.intr_rate2 || 0) : 0,
        joinWay: base.join_way
      };
    }).filter(p => p.baseRate > 0).sort((a, b) => b.maxRate - a.maxRate).slice(0, 10);

    if (products.length > 0) {
      const result = {
        updatedAt: new Date().toISOString(),
        status: 'live_fss_api',
        topDeposits: products
      };

      const filePath = path.join(DATA_DIR, 'korea-rates.json');
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`  ✅ Successfully updated ${products.length} live bank deposit rates from FSS!`);
    } else {
      console.warn(`  ⚠️ FSS API returned 0 products or response issue:`, json?.result?.err_cd || json?.result?.err_msg || 'No matching items');
    }
  } catch (err) {
    console.error('  ❌ Error querying FSS API:', err.message);
  }
}

/**
 * 4. 🇺🇸 미국 연준(FRED) 30년 모기지 금리 수집
 * GitHub Secret: FRED_API_KEY 필요
 */
async function fetchUSFredMortgage() {
  console.log('[4/4] 🇺🇸 Fetching US FRED Economic Data (30-Yr Mortgage Rate)...');
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.log('  ℹ️ [Notice] FRED_API_KEY secret is not configured in GitHub Secrets yet.');
    const filePath = path.join(DATA_DIR, 'us-economic.json');
    if (!fs.existsSync(filePath)) {
      const sample = {
        updatedAt: new Date().toISOString(),
        status: 'sample_template',
        note: 'GitHub Secrets에 FRED_API_KEY 등록 시 실시간 미국 30년 모기지 금리로 자동 갱신됩니다.',
        mortgage30YearRate: 6.45,
        fedFundsRate: 5.33
      };
      fs.writeFileSync(filePath, JSON.stringify(sample, null, 2), 'utf-8');
      console.log('  ✅ Created initial sample data in data/us-economic.json');
    }
    return;
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${encodeURIComponent(apiKey)}&file_type=json&sort_order=desc&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED API HTTP error: ${res.status}`);

    const json = await res.json();
    const latestObs = json?.observations?.[0];

    if (latestObs && latestObs.value && latestObs.value !== '.') {
      const result = {
        updatedAt: new Date().toISOString(),
        status: 'live_fred_api',
        latestDate: latestObs.date,
        mortgage30YearRate: Number(latestObs.value)
      };

      const filePath = path.join(DATA_DIR, 'us-economic.json');
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
      console.log(`  ✅ Successfully updated FRED 30-Yr Mortgage Rate: ${result.mortgage30YearRate}%`);
    } else {
      console.warn(`  ⚠️ FRED API observation not available:`, json?.error_message || 'Missing value');
    }
  } catch (err) {
    console.error('  ❌ Error querying FRED API:', err.message);
  }
}

/**
 * 5. 🇰🇷 한국은행 ECOS 원/달러 종가 15:30 (일별, 731Y003 — 작성기관 한국은행) — /dollar-value/ 용
 * GitHub Secret: ECOS_API_KEY 필요. 파일이 없거나 출처(source)가 바뀌었으면 전체 백필(1990-03~, 1회 요청), 있으면 최근 40일만 받아 병합.
 * 키가 들어간 URL은 로그에 찍지 않는다.
 */
const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

// ECOS StatisticSearch 응답 행 → { 'YYYY-MM-DD': 환율 } (값이 숫자가 아닌 행은 버림)
function parseEcosRows(rows) {
  const out = {};
  for (const r of rows || []) {
    const t = String(r.TIME || '');
    const v = Number(String(r.DATA_VALUE || '').replace(/,/g, ''));
    if (/^\d{8}$/.test(t) && v > 0) out[`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}`] = Math.round(v * 10) / 10;
  }
  return out;
}

async function fetchUsdKrw() {
  console.log('[5/5] 🇰🇷 Fetching USD/KRW daily rates (Bank of Korea ECOS)...');
  const apiKey = (process.env.ECOS_API_KEY || '').trim();
  const filePath = path.join(DATA_DIR, 'usdkrw.json');
  if (!apiKey) {
    console.log('  ℹ️ [Notice] ECOS_API_KEY is not configured. Keeping existing data/usdkrw.json.');
    return;
  }

  const SOURCE = 'ecos_731Y003_0000003';
  const prev = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : null;
  const existing = prev?.source === SOURCE ? prev : null; // 출처가 바뀌면 섞지 않고 새로 백필
  const rates = { ...(existing?.rates || {}) };
  const today = new Date();
  // 실측(2026-11-26): 1회 요청으로 1990-03~ 전체 9,079행이 내려옴
  const from = existing ? new Date(today.getTime() - 40 * 86400000) : new Date(Date.UTC(1990, 0, 1));

  try {
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${encodeURIComponent(apiKey)}/json/kr/1/100000/731Y003/D/${ymd(from)}/${ymd(today)}/0000003`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ECOS HTTP error: ${res.status}`);
    const json = await res.json();
    if (json.RESULT && json.RESULT.CODE !== 'INFO-200') throw new Error(`ECOS ${json.RESULT.CODE}: ${json.RESULT.MESSAGE}`);
    const parsed = parseEcosRows(json?.StatisticSearch?.row);
    const added = Object.keys(parsed).length;
    Object.assign(rates, parsed);
    const keys = Object.keys(rates).sort();
    if (keys.length === 0) throw new Error('ECOS returned no rows');
    const sorted = Object.fromEntries(keys.map((k) => [k, rates[k]]));
    const result = { updatedAt: new Date().toISOString(), source: SOURCE, latestDate: keys[keys.length - 1], rates: sorted };
    fs.writeFileSync(filePath, JSON.stringify(result), 'utf-8');
    console.log(`  ✅ ${added} rows fetched, ${keys.length} days total (${keys[0]} ~ ${result.latestDate}) → data/usdkrw.json`);
  } catch (err) {
    // 실패 시 기존 파일을 건드리지 않음
    console.error('  ❌ Error querying ECOS API:', err.message);
  }
}

async function main() {
  console.log('====================================================');
  console.log(' GoModo Global & Domestic Public Data Pipeline');
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log('====================================================');

  await fetchUSLottery();
  await fetchJapanCalendar();
  await fetchKoreaDepositRates();
  await fetchUSFredMortgage();
  await fetchUsdKrw();

  console.log('====================================================');
  console.log(' Pipeline execution completed successfully!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
