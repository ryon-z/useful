# 도구별 OG 이미지(1200x630) 생성: <도구경로>/og.png
# 사용법: powershell -NoProfile -File scripts/generate-og-tools.ps1   (저장소 루트에서 실행)
# 도구 추가 시 $tools 배열에 항목만 추가. 폰트: ko=Noto Sans KR, ja=Yu Gothic (미설치 시 GDI+가 대체 폰트로 조용히 렌더링하므로 결과 이미지 육안 확인 필수)
Add-Type -AssemblyName System.Drawing

$tools = @(
    @{ path = 'stock-tax'; font = 'Noto Sans KR'; badge = '2026 연말 절세 시즌'
       title = '해외주식 양도소득세 계산기'; sub = '250만 원 기본공제 · 손익통산 절세 시뮬레이터'
       chips = @('양도세 22% 자동 계산', '필요 손절액 역산', '연말 매도 마감 카운트다운') },
    @{ path = 'salary'; font = 'Noto Sans KR'; badge = '2026 최신 요율'
       title = '연봉 실수령액 계산기'; sub = '4대보험 · 소득세 공제 후 월 실수령액 즉시 계산'
       chips = @('연봉별 조견표', '부양가족 · 비과세 반영', '공제 항목 상세 내역') },
    @{ path = 'ja/warikan'; font = 'Yu Gothic'; badge = '忘年会・新年会シーズン'
       title = '飲み会 割り勘計算機'; sub = '上司・先輩の傾斜配分 & LINE精算文を自動作成'
       chips = @('傾斜配分', '端数の自動調整', 'LINEでそのまま送信') },
    @{ path = 'ja/lottery'; font = 'Yu Gothic'; badge = '2026 吉日カレンダー'
       title = 'ロト6・ロト7予想 & 宝くじ吉日'; sub = '一粒万倍日・天赦日から購入日を選ぶ'
       chips = @('ロト6 / ロト7 番号生成', '吉日カレンダー', '購入吉日ガイド') }
)

function C($r, $g, $b) { [System.Drawing.Color]::FromArgb($r, $g, $b) }
$amber = C 245 158 11
$W = 1200; $H = 630

foreach ($t in $tools) {
    $bmp = [System.Drawing.Bitmap]::new($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'

    $amberB = [System.Drawing.SolidBrush]::new($amber)
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $gray = [System.Drawing.SolidBrush]::new((C 203 213 225))
    $dark = [System.Drawing.SolidBrush]::new((C 15 23 42))
    $panel = [System.Drawing.SolidBrush]::new((C 30 41 59))
    $line = [System.Drawing.Pen]::new((C 71 85 105), 2)
    $center = [System.Drawing.StringFormat]::new(); $center.Alignment = 'Center'; $center.LineAlignment = 'Center'
    # Yu Gothic은 하단 여백(descent)이 커서 세로 중앙 정렬 시 글자가 위로 뜸 → 아래로 보정
    $dy = if ($t.font -eq 'Yu Gothic') { 7 } else { 0 }

    # 배경·테두리 (기본 og-image.png와 동일 톤)
    $g.FillRectangle($dark, 0, 0, $W, $H)
    $g.DrawRectangle([System.Drawing.Pen]::new($amber, 4), 24, 24, 1152, 582)
    $g.FillRectangle($amberB, 24, 24, 1152, 8)

    # 브랜드 행
    $g.FillEllipse($amberB, 75, 65, 70, 70)
    $g.DrawString('G', [System.Drawing.Font]::new('Arial', 38, [System.Drawing.FontStyle]::Bold), $dark, [System.Drawing.RectangleF]::new(75, 65, 70, 70), $center)
    $g.DrawString('GoModo', [System.Drawing.Font]::new('Arial', 40, [System.Drawing.FontStyle]::Bold), $white, 160, 70)
    $g.DrawString('gomodo.cloud', [System.Drawing.Font]::new('Arial', 18, [System.Drawing.FontStyle]::Bold), $amberB, 400, 86)

    # 시즌 배지 (우상단)
    $badgeFont = [System.Drawing.Font]::new($t.font, 18, [System.Drawing.FontStyle]::Bold)
    $bw = [int]$g.MeasureString($t.badge, $badgeFont).Width + 40
    $g.FillRectangle($amberB, (1125 - $bw), 78, $bw, 46)
    $g.DrawString($t.badge, $badgeFont, $dark, [System.Drawing.RectangleF]::new((1125 - $bw), (78 + $dy), $bw, 46), $center)

    # 제목·부제 (제목은 폭에 맞춰 자동 축소)
    $size = 64
    do { $tf = [System.Drawing.Font]::new($t.font, $size, [System.Drawing.FontStyle]::Bold); $size -= 2 } while ($g.MeasureString($t.title, $tf).Width -gt 1050)
    $g.DrawString($t.title, $tf, $white, 70, 190)
    $g.DrawString($t.sub, [System.Drawing.Font]::new($t.font, 26, [System.Drawing.FontStyle]::Bold), $gray, 75, 300)

    # 기능 칩 3개
    $chipFont = [System.Drawing.Font]::new($t.font, 20, [System.Drawing.FontStyle]::Bold)
    $x = 75
    foreach ($c in $t.chips) {
        $cw = [int]$g.MeasureString($c, $chipFont).Width + 44
        $g.FillRectangle($panel, $x, 400, $cw, 64)
        $g.DrawRectangle($line, $x, 400, $cw, 64)
        $g.FillRectangle($amberB, $x, 400, 6, 64)
        $g.DrawString($c, $chipFont, $white, [System.Drawing.RectangleF]::new(($x + 6), (400 + $dy), ($cw - 6), 64), $center)
        $x += $cw + 20
    }
    if ($x - 20 -gt 1125) { throw "chips overflow: $($t.path) (width $x)" }

    # 하단 URL
    $g.DrawString("www.gomodo.cloud/$($t.path)/", [System.Drawing.Font]::new('Arial', 18), $gray, [System.Drawing.RectangleF]::new(75, 530, 1050, 40), $center)

    $out = Join-Path (Get-Location) "$($t.path)/og.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "Generated $out"
}
