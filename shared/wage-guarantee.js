// 체불 임금등 대지급금(간이·도산) 예상액 계산 (severance/ 대지급금 탭)
// 근거: 임금채권보장법 제7조②(도산: 최종 6개월분 임금·최종 3년간 퇴직급여, 2026.8.20 시행 / 간이: 최종 3개월분 임금·최종 3년간 퇴직급여)
//       고용노동부고시 제2021-81호 체불 임금등 대지급금 상한액 (단위: 만원)
// 입력·반환 단위: 원
const WG_DOSAN_CAPS = [[30, 220], [40, 310], [50, 350], [60, 330], [Infinity, 230]]; // [만 나이 미만, 임금 1개월분·퇴직급여 1년분 상한]

function computeWageGuarantee({ type, age, unpaidWage, months, unpaidSeverance, tenureYears, after20260820 }) {
  const MAN = 10000;
  const wage = Math.max(0, unpaidWage || 0);
  const tenure = Math.max(0, tenureYears || 0);
  // 퇴직금은 최종 3년간분만 대상: 근속 3년 초과면 체불 퇴직금 중 3년 비율만 인정
  // shortcut: 퇴직금이 근속기간에 고르게 쌓였다고 가정. 공단은 최종 3년 평균임금으로 다시 산정하므로 실제와 약간 다를 수 있음
  const coveredSev = Math.max(0, unpaidSeverance || 0) * (tenure > 3 ? 3 / tenure : 1);

  let wagePart, sevPart, total;
  if (type === 'dosan') {
    const cap = WG_DOSAN_CAPS.find(([lt]) => age < lt)[1] * MAN;
    const m = Math.min(Math.max(1, months || 1), after20260820 ? 6 : 3);
    // shortcut: 매달 체불액이 같다고 보고 (상한 × 개월 수)로 비교. 달마다 체불액이 크게 다르면 월별 입력으로 바꿔야 정확
    wagePart = Math.min(wage, cap * m);
    // shortcut: 근속 3년 미만은 근속연수(소수) × 1년분 상한으로 비례 처리
    sevPart = Math.min(coveredSev, cap * Math.min(tenure, 3));
    total = wagePart + sevPart;
  } else {
    wagePart = Math.min(wage, 700 * MAN);
    sevPart = Math.min(coveredSev, 700 * MAN);
    total = Math.min(wagePart + sevPart, 1000 * MAN);
  }
  const claimed = wage + Math.max(0, unpaidSeverance || 0);
  return { wagePart, sevPart, total, uncovered: Math.max(0, claimed - total) };
}

// 체불이 시작된 뒤 k개월째 말에 퇴사하면(k=1..maxK) 대지급금·못 받는 돈·실업급여 자격이 어떻게 바뀌는지
// - 대지급금 임금분은 "퇴직 전 최종 3개월분"(도산 2026.8.20 이후 6개월분)만 대상 → 그보다 오래 버틴 달은 인정 범위 밖으로 밀려남
// - 실업급여: 이직일 전 1년 안에 임금체불이 2개월 이상이면 자진 퇴사도 정당한 이직 사유 (고용보험법 시행규칙 별표 2 제1호 나목)
// shortcut: 버티는 동안 퇴직금·근속이 늘어나는 효과는 빼고 퇴직금 체불액을 고정값으로 봄
function quitTimeline({ type, age, monthlyUnpaid, unpaidSeverance, tenureYears, after20260820, maxK = 8 }) {
  const win = type === "dosan" && after20260820 ? 6 : 3;
  const U = Math.max(0, monthlyUnpaid || 0);
  const sev = Math.max(0, unpaidSeverance || 0);
  const rows = [];
  for (let k = 1; k <= maxK; k++) {
    const inWin = Math.min(k, win);
    const r = computeWageGuarantee({ type, age, unpaidWage: inWin * U, months: inWin, unpaidSeverance: sev, tenureYears, after20260820 });
    rows.push({ k, accrued: k * U + sev, total: r.total, uncovered: Math.max(0, k * U + sev - r.total), unemployment: k >= 2 });
  }
  const maxTotal = Math.max(...rows.map((r) => r.total));
  const bestK = rows.find((r) => r.total === maxTotal).k; // 대지급금이 더 늘지 않기 시작하는 달
  return { rows, win, bestK, recommendK: Math.max(bestK, 2) };
}

// 자체 검증: node shared/wage-guarantee.js
if (typeof module !== 'undefined' && require.main === module) {
  const assert = require('assert');
  const M = 10000;
  // 간이: 임금·퇴직금 각 700만, 합계 1,000만
  let r = computeWageGuarantee({ type: 'simple', unpaidWage: 900 * M, unpaidSeverance: 900 * M, tenureYears: 2 });
  assert.deepStrictEqual([r.wagePart, r.sevPart, r.total, r.uncovered], [700 * M, 700 * M, 1000 * M, 800 * M]);
  r = computeWageGuarantee({ type: 'simple', unpaidWage: 300 * M, unpaidSeverance: 0, tenureYears: 1 });
  assert.strictEqual(r.total, 300 * M);
  // 간이: 근속 6년이면 퇴직금의 3/6만 인정
  r = computeWageGuarantee({ type: 'simple', unpaidWage: 0, unpaidSeverance: 1200 * M, tenureYears: 6 });
  assert.strictEqual(r.sevPart, 600 * M);
  // 도산 최대(40대): 개정 전 350×3 + 350×3 = 2,100만 / 개정 후 350×6 + 350×3 = 3,150만 (보도자료 상한과 일치)
  const big = { type: 'dosan', age: 45, unpaidWage: 1e9, months: 6, unpaidSeverance: 1e9, tenureYears: 10 };
  assert.strictEqual(computeWageGuarantee({ ...big, after20260820: false }).total, 2100 * M);
  assert.strictEqual(computeWageGuarantee({ ...big, after20260820: true }).total, 3150 * M);
  // 도산 나이 경계: 29세 220, 30세 310, 60세 230
  assert.strictEqual(computeWageGuarantee({ type: 'dosan', age: 29, unpaidWage: 1e9, months: 1 }).wagePart, 220 * M);
  assert.strictEqual(computeWageGuarantee({ type: 'dosan', age: 30, unpaidWage: 1e9, months: 1 }).wagePart, 310 * M);
  assert.strictEqual(computeWageGuarantee({ type: 'dosan', age: 60, unpaidWage: 1e9, months: 1 }).wagePart, 230 * M);
  // 30대·개정 전: 1개월분 임금 300만(상한 310만 안) + 근속 5년 퇴직금 600만 중 3년분
  r = computeWageGuarantee({ type: 'dosan', age: 33, unpaidWage: 300 * M, months: 1, unpaidSeverance: 600 * M, tenureYears: 5, after20260820: false });
  assert.strictEqual(r.total, 300 * M + 360 * M); // 퇴직금 600만 × 3/5 = 360만
  // 퇴사 시점: 간이·월 300만 체불 → 3개월째에 700만 상한 도달, 이후 버틴 달은 전부 못 받는 돈
  let t = quitTimeline({ type: "simple", monthlyUnpaid: 300 * M, unpaidSeverance: 0, tenureYears: 2, maxK: 6 });
  assert.deepStrictEqual(t.rows.map((x) => x.total / M), [300, 600, 700, 700, 700, 700]);
  assert.deepStrictEqual([t.bestK, t.recommendK], [3, 3]);
  assert.deepStrictEqual(t.rows.map((x) => x.uncovered / M), [0, 0, 200, 500, 800, 1100]);
  // 간이·월 800만 체불 → 1개월째에 이미 상한, 실업급여 자격은 2개월째부터라 권장 2개월째
  t = quitTimeline({ type: "simple", monthlyUnpaid: 800 * M, unpaidSeverance: 0, tenureYears: 2 });
  assert.deepStrictEqual([t.bestK, t.recommendK, t.rows[0].unemployment, t.rows[1].unemployment], [1, 2, false, true]);
  // 도산·40대·개정 후 → 6개월째까지 늘어남 / 개정 전 → 3개월째에 멈춤
  t = quitTimeline({ type: "dosan", age: 45, monthlyUnpaid: 300 * M, unpaidSeverance: 0, tenureYears: 2, after20260820: true });
  assert.deepStrictEqual([t.win, t.bestK, t.rows[5].total / M, t.rows[7].total / M], [6, 6, 1800, 1800]);
  t = quitTimeline({ type: "dosan", age: 45, monthlyUnpaid: 300 * M, unpaidSeverance: 0, tenureYears: 2, after20260820: false });
  assert.deepStrictEqual([t.win, t.bestK, t.rows[2].total / M, t.rows[3].uncovered / M], [3, 3, 900, 300]);
  // 간이: 퇴직금이 합계 1,000만 상한을 먼저 채우면 임금분 여유가 줄어 더 일찍 멈춤 (퇴직금 700 → 임금 300까지만)
  t = quitTimeline({ type: "simple", monthlyUnpaid: 200 * M, unpaidSeverance: 700 * M, tenureYears: 3 });
  assert.deepStrictEqual([t.bestK, t.rows[1].total / M], [2, 1000]);
  console.log('wage-guarantee: all checks passed');
}
