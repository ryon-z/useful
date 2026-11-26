// 달러로 본 자산 가치 (dollar-value/)
// 두 시점의 원화 금액을 그날의 원/달러 환율로 나눠 원화·달러 기준 상승률을 비교한다.
// 관계: (1 + 원화 상승률) = (1 + 달러 상승률) × (환율2 / 환율1)

// 입력이 올바르지 않으면 null (금액·환율 ≤ 0, 날짜 역전)
function computeDollarValue({ krw1, krw2, fx1, fx2, d1, d2 }) {
  if (!(krw1 > 0 && krw2 > 0 && fx1 > 0 && fx2 > 0)) return null;
  const days = (Date.parse(d2) - Date.parse(d1)) / 86400000;
  if (!(days > 0)) return null;
  const usd1 = krw1 / fx1;
  const usd2 = krw2 / fx2;
  const years = days / 365.25;
  const cagr = (ratio) => (years >= 1 ? Math.pow(ratio, 1 / years) - 1 : null);
  return {
    usd1, usd2, years,
    krwRet: krw2 / krw1 - 1,
    usdRet: usd2 / usd1 - 1,
    fxRet: fx2 / fx1 - 1, // 원/달러 환율 변화
    wonRet: fx1 / fx2 - 1, // 달러 대비 원화 가치 변화
    krwCagr: cagr(krw2 / krw1),
    usdCagr: cagr(usd2 / usd1),
  };
}

// 날짜의 환율. 주말·공휴일이면 최대 10일 전까지 직전 영업일 값을 찾는다. 없으면 null
function rateOn(rates, dateStr) {
  const t = Date.parse(dateStr);
  if (!rates || isNaN(t)) return null;
  for (let i = 0; i <= 10; i++) {
    const key = new Date(t - i * 86400000).toISOString().slice(0, 10);
    if (rates[key] > 0) return { date: key, rate: rates[key] };
  }
  return null;
}

if (typeof module !== 'undefined' && require.main === module) {
  const assert = require('assert');
  const pct = (x) => Math.round(x * 1000) / 10;
  const base = { d1: '2016-06-01', d2: '2026-06-01', fx1: 1160, fx2: 1450 };
  // 아파트 5억 → 9억: 원화 +80%, 달러 $431,034 → $620,690 (+44%)
  let r = computeDollarValue({ ...base, krw1: 5e8, krw2: 9e8 });
  assert.deepStrictEqual([pct(r.krwRet), pct(r.usdRet), Math.round(r.usd1), Math.round(r.usd2)], [80, 44, 431034, 620690]);
  assert.deepStrictEqual([pct(r.fxRet), pct(r.wonRet)], [25, -20]);
  // 분해 관계
  assert.ok(Math.abs((1 + r.krwRet) - (1 + r.usdRet) * (1 + r.fxRet)) < 1e-12);
  // 금 1,000만 → 2,500만: +150% / +100%
  r = computeDollarValue({ ...base, krw1: 1e7, krw2: 2.5e7 });
  assert.deepStrictEqual([pct(r.krwRet), pct(r.usdRet)], [150, 100]);
  // 연봉 3,600만 → 4,800만: +33.3% / +6.7%, 10년 CAGR 2.9% / 0.6%
  r = computeDollarValue({ ...base, krw1: 3.6e7, krw2: 4.8e7 });
  assert.deepStrictEqual([pct(r.krwRet), pct(r.usdRet), pct(r.krwCagr), pct(r.usdCagr)], [33.3, 6.7, 2.9, 0.6]);
  // 원화로는 올랐지만 달러로는 내림
  r = computeDollarValue({ krw1: 1e8, krw2: 1.1e8, fx1: 1000, fx2: 1200, d1: '2020-01-01', d2: '2020-07-01' });
  assert.deepStrictEqual([pct(r.krwRet), pct(r.usdRet), r.krwCagr], [10, -8.3, null]); // 1년 미만은 CAGR 없음
  // 경계: 0원, 날짜 역전·같은 날, 환율 0
  assert.strictEqual(computeDollarValue({ ...base, krw1: 0, krw2: 1 }), null);
  assert.strictEqual(computeDollarValue({ ...base, krw1: 1, krw2: 1, d2: '2016-06-01' }), null);
  assert.strictEqual(computeDollarValue({ ...base, krw1: 1, krw2: 1, d1: '2027-01-01' }), null);
  assert.strictEqual(computeDollarValue({ ...base, krw1: 1, krw2: 1, fx2: 0 }), null);
  // 환율 조회: 주말(일) → 금요일 값, 10일 넘게 비면 null, 잘못된 날짜 null
  const rates = { '2026-11-20': 1440.5, '2026-11-23': 1450 };
  assert.deepStrictEqual(rateOn(rates, '2026-11-22'), { date: '2026-11-20', rate: 1440.5 });
  assert.deepStrictEqual(rateOn(rates, '2026-11-23'), { date: '2026-11-23', rate: 1450 });
  assert.strictEqual(rateOn(rates, '2026-12-10'), null);
  assert.strictEqual(rateOn(rates, ''), null);
  console.log('dollar-value: all checks passed');
}
