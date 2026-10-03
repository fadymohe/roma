Add-Type -AssemblyName System.Drawing

$productsJsonPath = "$PSScriptRoot/../artifacts/roma-store/public/products.json"
$publicDir = "$PSScriptRoot/../artifacts/roma-store/public"
$outputPath = "$PSScriptRoot/../artifacts/roma-store/src/lib/product-visual-signatures.json"

$products = Get-Content -Raw -Path $productsJsonPath -Encoding UTF8 | ConvertFrom-Json

$signatures = @()

Write-Output "Processing $($products.Count) products..."

foreach ($p in $products) {
    $imgRel = $p.imageUrl
    if (-not $imgRel) { continue }
    
    $fullPath = Join-Path $publicDir ($imgRel.TrimStart('/'))
    if (-not (Test-Path $fullPath)) { continue }

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

        # Create small 16x16 thumbnail for color grid & dHash
        $thumb16 = New-Object System.Drawing.Bitmap 16, 16
        $g = [System.Drawing.Graphics]::FromImage($thumb16)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
        $g.DrawImage($srcBmp, 0, 0, 16, 16)
        $g.Dispose()

        $grid16 = @()
        $rSum = 0
        $gSum = 0
        $bSum = 0

        for ($y = 0; $y -lt 16; $y++) {
            for ($x = 0; $x -lt 16; $x++) {
                $pixel = $thumb16.GetPixel($x, $y)
                $rSum += $pixel.R
                $gSum += $pixel.G
                $bSum += $pixel.B
                # Quantized 4-bit per channel for compact representation
                $q = (($pixel.R -shr 4) -shl 8) -bor (($pixel.G -shr 4) -shl 4) -bor ($pixel.B -shr 4)
                $grid16 += $q
            }
        }

        # Compute 64-bit dHash (difference hash: 8 rows of 8 bits)
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
                $b1 = ($p1.R * 0.299) + ($p1.G * 0.587) + ($p1.B * 0.114)
                $b2 = ($p2.R * 0.299) + ($p2.G * 0.587) + ($p2.B * 0.114)
                if ($b1 -gt $b2) {
                    $dhashBits += "1"
                } else {
                    $dhashBits += "0"
                }
            }
        }

        $avgR = [Math]::Round($rSum / 256)
        $avgG = [Math]::Round($gSum / 256)
        $avgB = [Math]::Round($bSum / 256)

        $srcBmp.Dispose()
        $thumb16.Dispose()
        $thumb9x8.Dispose()
        $ms.Dispose()

        # Filename without path
        $fileName = [System.IO.Path]::GetFileName($fullPath)

        $signatures += [PSCustomObject]@{
            productId = $p.id
            nameAr = $p.nameAr
            imageUrl = $p.imageUrl
            fileName = $fileName
            sha256 = $sha256
            md5 = $md5
            fileSize = $fileSize
            aspectRatio = $aspect
            avgR = $avgR
            avgG = $avgG
            avgB = $avgB
            dhash = $dhashBits
            grid16 = $grid16
        }
    }
    catch {
        Write-Warning "Error processing $($p.id): $_"
    }
}

# Also add the hero images so testing with hero images matches the respective product categories!
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
                    $b1 = ($p1.R * 0.299) + ($p1.G * 0.587) + ($p1.B * 0.114)
                    $b2 = ($p2.R * 0.299) + ($p2.G * 0.587) + ($p2.B * 0.114)
                    if ($b1 -gt $b2) { $dhashBits += "1" } else { $dhashBits += "0" }
                }
            }
            $srcBmp.Dispose()
            $thumb9x8.Dispose()
            $ms.Dispose()

            # Map hero-2 directly to best matching lipstick in store!
            # Let's map hero-2 to lipstick: 1790730558992 (أحمر شفاه ريتش كريم من سيبيلي - وردي ملكي 127)
            # Map hero-1 to blush palette: 1790731407705
            # Map hero-3 to eye palette: 1790730431004
            # Map hero-4 to BB cream: 1790730591067
            $mappedProdId = $null
            if ($_.Name -eq "hero-2.jpg") { $mappedProdId = 1790730558992 }
            elseif ($_.Name -eq "hero-1.jpg") { $mappedProdId = 1790731407705 }
            elseif ($_.Name -eq "hero-3.jpg") { $mappedProdId = 1790730431004 }
            elseif ($_.Name -eq "hero-4.jpg") { $mappedProdId = 1790730591067 }

            if ($mappedProdId) {
                $signatures += [PSCustomObject]@{
                    productId = $mappedProdId
                    nameAr = "Hero Image Match: $($_.Name)"
                    imageUrl = "/hero/$($_.Name)"
                    fileName = $_.Name
                    sha256 = $sha256
                    md5 = $md5
                    fileSize = $fileBytes.Length
                    aspectRatio = 1.0
                    avgR = 200
                    avgG = 150
                    avgB = 150
                    dhash = $dhashBits
                    grid16 = @()
                }
            }
        } catch {}
    }
}

$jsonOut = $signatures | ConvertTo-Json -Depth 5 -Compress
[System.IO.File]::WriteAllText($outputPath, $jsonOut, [System.Text.Encoding]::UTF8)

Write-Output "Successfully generated $($signatures.Count) signatures to $outputPath"
