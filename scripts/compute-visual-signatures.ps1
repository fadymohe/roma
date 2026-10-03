Add-Type -AssemblyName System.Drawing

$productsJsonPath = "$PSScriptRoot/../artifacts/roma-store/public/products.json"
$publicDir = "$PSScriptRoot/../artifacts/roma-store/public"
$outputPath = "$PSScriptRoot/../artifacts/roma-store/src/lib/product-visual-signatures.json"

$products = Get-Content -Raw -Path $productsJsonPath -Encoding UTF8 | ConvertFrom-Json

$signatures = @()
$seenFiles = @{}

Write-Output "Processing all images (main + all gallery images) for $($products.Count) products..."

function Get-Luminance($r, $g, $b) {
    return ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
}

$processedCount = 0

foreach ($p in $products) {
    $imgList = @()
    if ($p.imageUrl) { $imgList += $p.imageUrl }
    if ($p.additionalImages) {
        foreach ($ai in $p.additionalImages) {
            if ($ai -and $imgList -notcontains $ai) {
                $imgList += $ai
            }
        }
    }

    foreach ($imgRel in $imgList) {
        $fullPath = Join-Path $publicDir ($imgRel.TrimStart('/'))
        if (-not (Test-Path $fullPath)) { continue }

        $fileName = [System.IO.Path]::GetFileName($fullPath)
        $uniqueKey = "$($p.id)|$fileName"
        if ($seenFiles.ContainsKey($uniqueKey)) { continue }
        $seenFiles[$uniqueKey] = $true

        try {
            $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
            $sha256 = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($fileBytes)).Replace('-', '').ToLower()
            $md5 = [System.BitConverter]::ToString([System.Security.Cryptography.MD5]::Create().ComputeHash($fileBytes)).Replace('-', '').ToLower()
            $fileSize = $fileBytes.Length

            $ms = New-Object System.IO.MemoryStream(,$fileBytes)
            $srcBmp = [System.Drawing.Image]::FromStream($ms)
            $origW = $srcBmp.Width
            $origH = $srcBmp.Height
            $aspect = [Math]::Round(($origW / [Math]::Max(1, $origH)), 3)

            # 1. 16x16 thumbnail for avg color
            $thumb16 = New-Object System.Drawing.Bitmap 16, 16
            $g = [System.Drawing.Graphics]::FromImage($thumb16)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
            $g.DrawImage($srcBmp, 0, 0, 16, 16)
            $g.Dispose()

            $rSum = 0; $gSum = 0; $bSum = 0
            for ($y = 0; $y -lt 16; $y++) {
                for ($x = 0; $x -lt 16; $x++) {
                    $px = $thumb16.GetPixel($x, $y)
                    $rSum += $px.R
                    $gSum += $px.G
                    $bSum += $px.B
                }
            }
            $avgR = [Math]::Round($rSum / 256)
            $avgG = [Math]::Round($gSum / 256)
            $avgB = [Math]::Round($bSum / 256)

            # 2. 9x8 dHash
            $thumb9x8 = New-Object System.Drawing.Bitmap 9, 8
            $g2 = [System.Drawing.Graphics]::FromImage($thumb9x8)
            $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
            $g2.DrawImage($srcBmp, 0, 0, 9, 8)
            $g2.Dispose()

            $dhashBits = ""
            for ($y = 0; $y -lt 8; $y++) {
                for ($x = 0; $x -lt 8; $x++) {
                    $p1 = $thumb9x8.GetPixel($x, $y)
                    $p2 = $thumb9x8.GetPixel($x + 1, $y)
                    $b1 = Get-Luminance $p1.R $p1.G $p1.B
                    $b2 = Get-Luminance $p2.R $p2.G $p2.B
                    if ($b1 -gt $b2) { $dhashBits += "1" } else { $dhashBits += "0" }
                }
            }

            # 3. 8x8 aHash
            $thumb8x8 = New-Object System.Drawing.Bitmap 8, 8
            $g3 = [System.Drawing.Graphics]::FromImage($thumb8x8)
            $g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g3.DrawImage($srcBmp, 0, 0, 8, 8)
            $g3.Dispose()

            $lums = @()
            $totalLum = 0
            for ($y = 0; $y -lt 8; $y++) {
                for ($x = 0; $x -lt 8; $x++) {
                    $pxColor = $thumb8x8.GetPixel($x, $y)
                    $lum = Get-Luminance $pxColor.R $pxColor.G $pxColor.B
                    $lums += $lum
                    $totalLum += $lum
                }
            }
            $avgLum = $totalLum / 64
            $ahashBits = ""
            foreach ($l in $lums) {
                if ($l -gt $avgLum) { $ahashBits += "1" } else { $ahashBits += "0" }
            }

            $srcBmp.Dispose()
            $thumb16.Dispose()
            $thumb9x8.Dispose()
            $thumb8x8.Dispose()
            $ms.Dispose()

            $signatures += [PSCustomObject]@{
                productId = [string]$p.id
                nameAr = $p.nameAr
                imageUrl = $imgRel
                fileName = $fileName
                sha256 = $sha256
                md5 = $md5
                fileSize = $fileSize
                aspectRatio = $aspect
                avgR = $avgR
                avgG = $avgG
                avgB = $avgB
                dhash = $dhashBits
                ahash = $ahashBits
            }

            $processedCount++
            if ($processedCount % 200 -eq 0) {
                Write-Output "Processed $processedCount images..."
            }
        }
        catch {
            Write-Warning "Error processing $imgRel for $($p.id): $_"
        }
    }
}

# Hero images
$heroDir = Join-Path $publicDir "hero"
if (Test-Path $heroDir) {
    Get-ChildItem $heroDir -Filter "*.jpg" | ForEach-Object {
        try {
            $fileBytes = [System.IO.File]::ReadAllBytes($_.FullName)
            $sha256 = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($fileBytes)).Replace('-', '').ToLower()
            $md5 = [System.BitConverter]::ToString([System.Security.Cryptography.MD5]::Create().ComputeHash($fileBytes)).Replace('-', '').ToLower()

            $ms = New-Object System.IO.MemoryStream(,$fileBytes)
            $srcBmp = [System.Drawing.Image]::FromStream($ms)

            $thumb9x8 = New-Object System.Drawing.Bitmap 9, 8
            $g2 = [System.Drawing.Graphics]::FromImage($thumb9x8)
            $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
            $g2.DrawImage($srcBmp, 0, 0, 9, 8)
            $g2.Dispose()

            $dhashBits = ""
            for ($y = 0; $y -lt 8; $y++) {
                for ($x = 0; $x -lt 8; $x++) {
                    $p1 = $thumb9x8.GetPixel($x, $y)
                    $p2 = $thumb9x8.GetPixel($x + 1, $y)
                    $b1 = Get-Luminance $p1.R $p1.G $p1.B
                    $b2 = Get-Luminance $p2.R $p2.G $p2.B
                    if ($b1 -gt $b2) { $dhashBits += "1" } else { $dhashBits += "0" }
                }
            }

            $thumb8x8 = New-Object System.Drawing.Bitmap 8, 8
            $g3 = [System.Drawing.Graphics]::FromImage($thumb8x8)
            $g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g3.DrawImage($srcBmp, 0, 0, 8, 8)
            $g3.Dispose()

            $lums = @()
            $totalLum = 0
            for ($y = 0; $y -lt 8; $y++) {
                for ($x = 0; $x -lt 8; $x++) {
                    $pxColor = $thumb8x8.GetPixel($x, $y)
                    $lum = Get-Luminance $pxColor.R $pxColor.G $pxColor.B
                    $lums += $lum
                    $totalLum += $lum
                }
            }
            $avgLum = $totalLum / 64
            $ahashBits = ""
            foreach ($l in $lums) {
                if ($l -gt $avgLum) { $ahashBits += "1" } else { $ahashBits += "0" }
            }

            $srcBmp.Dispose()
            $thumb9x8.Dispose()
            $thumb8x8.Dispose()
            $ms.Dispose()

            $heroName = $_.Name
            $matchedProdId = "1790730558992"
            if ($heroName -eq "hero-1.jpg") { $matchedProdId = "1790730700107" }
            elseif ($heroName -eq "hero-2.jpg") { $matchedProdId = "1790730558992" }
            elseif ($heroName -eq "hero-3.jpg") { $matchedProdId = "1790732886854" }
            elseif ($heroName -eq "hero-4.jpg") { $matchedProdId = "1790732032135" }

            $signatures += [PSCustomObject]@{
                productId = $matchedProdId
                nameAr = "Roma Collection Feature"
                imageUrl = "/hero/$heroName"
                fileName = $heroName
                sha256 = $sha256
                md5 = $md5
                fileSize = $fileBytes.Length
                aspectRatio = 1.0
                avgR = 180
                avgG = 140
                avgB = 140
                dhash = $dhashBits
                ahash = $ahashBits
            }
        }
        catch {
            Write-Warning "Error processing hero $($_.Name): $_"
        }
    }
}

$jsonOut = $signatures | ConvertTo-Json -Depth 5 -Compress
[System.IO.File]::WriteAllText($outputPath, $jsonOut, [System.Text.Encoding]::UTF8)

# Copy to all distribution paths
$publicOut = "$PSScriptRoot/../artifacts/roma-store/public/product-visual-signatures.json"
[System.IO.File]::WriteAllText($publicOut, $jsonOut, [System.Text.Encoding]::UTF8)

$distOut = "$PSScriptRoot/../dist/product-visual-signatures.json"
if (Test-Path (Split-Path $distOut)) {
    [System.IO.File]::WriteAllText($distOut, $jsonOut, [System.Text.Encoding]::UTF8)
}

$apiDistOut = "$PSScriptRoot/../artifacts/api-server/dist/product-visual-signatures.json"
if (Test-Path (Split-Path $apiDistOut)) {
    [System.IO.File]::WriteAllText($apiDistOut, $jsonOut, [System.Text.Encoding]::UTF8)
}

Write-Output "Successfully generated $($signatures.Count) signatures (main + gallery images) to $outputPath!"
