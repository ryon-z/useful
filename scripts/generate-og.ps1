Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bmp = [System.Drawing.Bitmap]::new($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background: dark slate #0f172a
$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 23, 42))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Amber accent & border
$amberColor = [System.Drawing.Color]::FromArgb(245, 158, 11)
$amberBrush = [System.Drawing.SolidBrush]::new($amberColor)
$borderPen = [System.Drawing.Pen]::new($amberColor, 4)
$g.DrawRectangle($borderPen, 24, 24, 1152, 582)

# Top Bar Glow Line
$g.FillRectangle($amberBrush, 24, 24, 1152, 8)

# Brand Icon: Circle with 'G'
$iconBg = [System.Drawing.SolidBrush]::new($amberColor)
$g.FillEllipse($iconBg, 75, 65, 86, 86)

$sfCenter = [System.Drawing.StringFormat]::new()
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$gFont = [System.Drawing.Font]::new('Arial', [single]48, [System.Drawing.FontStyle]::Bold)
$darkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 23, 42))
$g.DrawString('G', $gFont, $darkBrush, [System.Drawing.RectangleF]::new(75, 65, 86, 86), $sfCenter)

# Title: GoModo
$titleFont = [System.Drawing.Font]::new('Arial', [single]52, [System.Drawing.FontStyle]::Bold)
$whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$g.DrawString('GoModo', $titleFont, $whiteBrush, 180, 60)

# Domain pill badge
$pillFont = [System.Drawing.Font]::new('Segoe UI', [single]16, [System.Drawing.FontStyle]::Bold)
$pillBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 41, 59))
$pillPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(71, 85, 105), 2)
$g.FillRectangle($pillBg, 420, 80, 180, 38)
$g.DrawRectangle($pillPen, 420, 80, 180, 38)
$g.DrawString('gomodo.cloud', $pillFont, $amberBrush, [System.Drawing.RectangleF]::new(420, 80, 180, 38), $sfCenter)

# Subtitle / Tagline
$subFont = [System.Drawing.Font]::new('Malgun Gothic', [single]22, [System.Drawing.FontStyle]::Bold)
$grayBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(203, 213, 225))
$g.DrawString('일상의 편리함을 더하는 생활 밀착형 웹 도구 모음 포털', $subFont, $grayBrush, 75, 172)

# 4 Tool Feature Cards (2x2 Grid)
$cards = @(
    @{ title = '로또 6/45 번호 추첨 & 통계 분석'; desc = '동행복권 최신 회차 데이터 · 홀짝/고저 통계 · 추천 번호 생성' },
    @{ title = '만 나이 & 띠·천간지지 계산기'; desc = '만 나이 통일법 완벽 적용 · 연 나이 · 60갑자 띠 간편 계산' },
    @{ title = '예적금 & 복리 이자 계산기'; desc = '정기예금 · 적금 단리/복리 · 일반과세/비과세 실수령액 비교' },
    @{ title = 'D-Day & 음력 변환 기념일 계산기'; desc = '생일·결혼·시험 디데이 카운터 · 양력/음력 상호 변환 지원' }
)

$cardW = 505
$cardH = 115
$cardBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 41, 59))
$cardBorderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(51, 65, 85), 2)
$cardTitleFont = [System.Drawing.Font]::new('Malgun Gothic', [single]18, [System.Drawing.FontStyle]::Bold)
$cardDescFont = [System.Drawing.Font]::new('Malgun Gothic', [single]13, [System.Drawing.FontStyle]::Regular)
$cardDescBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(148, 163, 184))

for ($i = 0; $i -lt 4; $i++) {
    $row = [Math]::Floor($i / 2)
    $col = $i % 2
    $x = 75 + ($col * 545)
    $y = 235 + ($row * 145)
    
    $g.FillRectangle($cardBg, $x, $y, $cardW, $cardH)
    $g.DrawRectangle($cardBorderPen, $x, $y, $cardW, $cardH)
    
    # Left amber accent bar
    $g.FillRectangle($amberBrush, $x, $y, 6, $cardH)
    
    $g.DrawString($cards[$i].title, $cardTitleFont, $whiteBrush, ($x + 20), ($y + 18))
    $g.DrawString($cards[$i].desc, $cardDescFont, $cardDescBrush, ($x + 20), ($y + 62))
}

# Bottom Guarantee Banner
$footerFont = [System.Drawing.Font]::new('Malgun Gothic', [single]15, [System.Drawing.FontStyle]::Regular)
$footerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(148, 163, 184))
$g.DrawString('100% 브라우저 로컬 안전 연산   ·   완전 무료 & 무설치 웹앱   ·   모바일 / PC 반응형 최적화', $footerFont, $footerBrush, [System.Drawing.RectangleF]::new(75, 550, 1050, 30), $sfCenter)

# Save
$outPath = Join-Path (Get-Location) 'og-image.png'
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
Write-Output "Generated og-image.png successfully: $outPath"
