/**
 * scripts/fetch-lotto.js
 * 
 * 동행복권 공식 사이트에서 최신 로또 6/45 당첨 번호를 수집하여
 * data/latest.json 파일로 저장하는 스크립트입니다.
 * 외부 의존성(npm 패키지) 없이 Node.js 18+ 네이티브 fetch 및 fs 모듈만 사용합니다.
 */

const fs = require('fs');
const path = require('path');

// 1회차 기준일: 2002년 12월 7일 21:00 KST (UTC+9)
const FIRST_DRAW_TIME = new Date('2002-12-07T21:00:00+09:00').getTime();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function calculateCurrentDrawNo() {
  const now = Date.now();
  const diff = now - FIRST_DRAW_TIME;
  return Math.max(1, 1 + Math.floor(diff / ONE_WEEK_MS));
}

async function fetchDrawFromApi(drwNo) {
  // 최신 동행복권 내부 JSON API 엔드포인트
  const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${drwNo}&_=${Date.now()}`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': 'https://www.dhlottery.co.kr/',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
  };

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  const item = json?.data?.list?.[0];

  if (!item || !item.ltEpsd) {
    throw new Error(`회차 ${drwNo}의 유효한 당첨 데이터가 없습니다.`);
  }

  // YYYYMMDD -> YYYY-MM-DD 포맷팅
  const rawDate = String(item.ltRflYmd || '');
  const formattedDate = rawDate.length === 8 
    ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
    : rawDate;

  return {
    returnValue: 'success',
    drwNo: Number(item.ltEpsd),
    drwNoDate: formattedDate,
    drwtNo1: Number(item.tm1WnNo),
    drwtNo2: Number(item.tm2WnNo),
    drwtNo3: Number(item.tm3WnNo),
    drwtNo4: Number(item.tm4WnNo),
    drwtNo5: Number(item.tm5WnNo),
    drwtNo6: Number(item.tm6WnNo),
    bnusNo: Number(item.bnsWnNo),
    firstPrzwnerCo: Number(item.rnk1WnNope || 0),
    firstWinamnt: Number(item.rnk1WnAmt || 0),
    firstAccumamnt: Number(item.rnk1SumWnAmt || 0),
    totSellamnt: Number(item.wholEpsdSumNtslAmt || 0),
    // 등위별 상세 정보 보존
    ranks: [
      { rank: 1, winners: Number(item.rnk1WnNope || 0), prizePerPerson: Number(item.rnk1WnAmt || 0), totalPrize: Number(item.rnk1SumWnAmt || 0) },
      { rank: 2, winners: Number(item.rnk2WnNope || 0), prizePerPerson: Number(item.rnk2WnAmt || 0), totalPrize: Number(item.rnk2SumWnAmt || 0) },
      { rank: 3, winners: Number(item.rnk3WnNope || 0), prizePerPerson: Number(item.rnk3WnAmt || 0), totalPrize: Number(item.rnk3SumWnAmt || 0) },
      { rank: 4, winners: Number(item.rnk4WnNope || 0), prizePerPerson: Number(item.rnk4WnAmt || 0), totalPrize: Number(item.rnk4SumWnAmt || 0) },
      { rank: 5, winners: Number(item.rnk5WnNope || 0), prizePerPerson: Number(item.rnk5WnAmt || 0), totalPrize: Number(item.rnk5SumWnAmt || 0) }
    ],
    updatedAt: new Date().toISOString()
  };
}

async function main() {
  const estimatedDraw = calculateCurrentDrawNo();
  console.log(`[INFO] 추정 최신 회차: ${estimatedDraw}회`);

  let finalData = null;

  // 최신 회차가 아직 미추첨/미공개일 수 있으므로 이전 3회차까지 순차 탐색
  for (let drw = estimatedDraw; drw >= Math.max(1, estimatedDraw - 3); drw--) {
    try {
      console.log(`[FETCH] ${drw}회차 조회 시도 중...`);
      finalData = await fetchDrawFromApi(drw);
      console.log(`[SUCCESS] ${drw}회차 데이터 수신 성공! (추첨일: ${finalData.drwNoDate})`);
      break;
    } catch (err) {
      console.warn(`[WARN] ${drw}회차 조회 실패: ${err.message}`);
    }
  }

  if (!finalData) {
    console.error('[ERROR] 최신 회차 데이터를 가져올 수 없습니다.');
    process.exit(1);
  }

  const outputDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');
  console.log(`[DONE] 파일 저장 완료: ${outputPath}`);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
