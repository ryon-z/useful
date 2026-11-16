// 2026 연봉·월급 실수령액 계산 공통 로직 (salary/, salary-timer/ 공용)
// 근거: 국민연금(보건복지부 고시 제2026-31호), 건강·장기요양 2026 요율, 소득세법 제47·55·59·59조의2, 근로소득 간이세액표 산식
// 반환값 단위: 월(원). 비과세액은 월 기준.
function computeSalaryDetails(annualGross, nonTaxMonthly, familyCount, childCount) {
  const monthlyGross = Math.floor(annualGross / 12);
  const taxableMonthly = Math.max(0, monthlyGross - nonTaxMonthly);

  // 1. 국민연금 (2026 근로자 4.75%, 기준소득월액 상한 6,590,000원·하한 410,000원: 2026.7~2027.6 고시)
  const pensionBase = Math.min(6590000, Math.max(410000, taxableMonthly));
  const nationalPension = Math.floor((pensionBase * 0.0475) / 10) * 10;

  // 2. 건강보험 (2026 근로자 3.595%, 총 7.19%)
  const healthInsurance = Math.floor((taxableMonthly * 0.03595) / 10) * 10;

  // 3. 장기요양 (2026 소득 대비 0.9448% = 건보료의 약 13.14%)
  const longTermCare = Math.floor((healthInsurance * 0.1314) / 10) * 10;

  // 4. 고용보험 (0.9%)
  const employmentInsurance = Math.floor((taxableMonthly * 0.009) / 10) * 10;

  // 5. 근로소득세 (간이세액표 근사 공식)
  const annualTaxable = taxableMonthly * 12;
  let earnedIncomeDeduction = 0;
  if (annualTaxable <= 5000000) earnedIncomeDeduction = annualTaxable * 0.7;
  else if (annualTaxable <= 15000000) earnedIncomeDeduction = 3500000 + (annualTaxable - 5000000) * 0.4;
  else if (annualTaxable <= 45000000) earnedIncomeDeduction = 7500000 + (annualTaxable - 15000000) * 0.15;
  else if (annualTaxable <= 100000000) earnedIncomeDeduction = 12000000 + (annualTaxable - 45000000) * 0.05;
  else earnedIncomeDeduction = 14750000 + (annualTaxable - 100000000) * 0.02;

  const earnedIncomeAmount = Math.max(0, annualTaxable - earnedIncomeDeduction);
  const personalDeduction = familyCount * 1500000;
  const pensionDeduction = nationalPension * 12;
  
  let specialDeduction = (healthInsurance + longTermCare + employmentInsurance) * 12;
  if (annualTaxable <= 30000000) specialDeduction += 3100000 + annualTaxable * 0.04;
  else if (annualTaxable <= 45000000) specialDeduction += 3100000 + annualTaxable * 0.04 - (annualTaxable - 30000000) * 0.05;
  else if (annualTaxable <= 70000000) specialDeduction += 3100000 + annualTaxable * 0.015;
  else if (annualTaxable <= 120000000) specialDeduction += 3100000 + annualTaxable * 0.005; // 간이세액표 산식 7천만~1.2억 구간
  else specialDeduction += 3100000;

  const taxBase = Math.max(0, earnedIncomeAmount - personalDeduction - pensionDeduction - specialDeduction);
  
  // 종합소득세 기본세율 (소득세법 제55조)
  let calculatedTax = 0;
  if (taxBase <= 14000000) calculatedTax = taxBase * 0.06;
  else if (taxBase <= 50000000) calculatedTax = 840000 + (taxBase - 14000000) * 0.15;
  else if (taxBase <= 88000000) calculatedTax = 6240000 + (taxBase - 50000000) * 0.24;
  else if (taxBase <= 150000000) calculatedTax = 15360000 + (taxBase - 88000000) * 0.35;
  else if (taxBase <= 300000000) calculatedTax = 37060000 + (taxBase - 150000000) * 0.38;
  else if (taxBase <= 500000000) calculatedTax = 94060000 + (taxBase - 300000000) * 0.40;
  else if (taxBase <= 1000000000) calculatedTax = 174060000 + (taxBase - 500000000) * 0.42;
  else calculatedTax = 384060000 + (taxBase - 1000000000) * 0.45;

  let taxCredit = 0;
  if (calculatedTax <= 1300000) taxCredit = calculatedTax * 0.55;
  else taxCredit = 715000 + (calculatedTax - 1300000) * 0.3;

  // 근로소득세액공제 한도 (소득세법 제59조): 총급여 3,300만 이하 74만 / 7,000만 이하 66만 하한 / 1.2억 이하 50만 하한 / 초과 20만 하한
  let creditLimit = 740000;
  if (annualTaxable > 120000000) creditLimit = Math.max(200000, 500000 - (annualTaxable - 120000000) * 0.5);
  else if (annualTaxable > 70000000) creditLimit = Math.max(500000, 660000 - (annualTaxable - 70000000) * 0.5);
  else if (annualTaxable > 33000000) creditLimit = Math.max(660000, 740000 - (annualTaxable - 33000000) * 0.008);
  taxCredit = Math.min(taxCredit, creditLimit);

  // 자녀세액공제 (2025년 귀속 개정): 1명 25만 / 2명 55만 / 3명 이상 55만 + 초과 1명당 40만
  let childCredit = 0;
  if (childCount === 1) childCredit = 250000;
  else if (childCount === 2) childCredit = 550000;
  else if (childCount >= 3) childCredit = 550000 + (childCount - 2) * 400000;

  const annualIncomeTax = Math.max(0, calculatedTax - taxCredit - childCredit);
  const monthlyIncomeTax = Math.floor((annualIncomeTax / 12) / 10) * 10;
  const localIncomeTax = Math.floor((monthlyIncomeTax * 0.1) / 10) * 10;

  const totalDeductions = nationalPension + healthInsurance + longTermCare + employmentInsurance + monthlyIncomeTax + localIncomeTax;
  const netMonthly = Math.max(0, monthlyGross - totalDeductions);

  return {
    monthlyGross,
    netMonthly,
    totalDeductions,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    monthlyIncomeTax,
    localIncomeTax
  };
}
