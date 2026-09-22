Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\app-icon.jpg"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($src, $w, $h, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $destPath"
}

Resize-Image $srcImg 512 512 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\icon-512.png"
Resize-Image $srcImg 512 512 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\icon-maskable-512.png"
Resize-Image $srcImg 192 192 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\icon-192.png"
Resize-Image $srcImg 180 180 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\apple-touch-icon.png"
Resize-Image $srcImg 512 512 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\app\icon.png"
Resize-Image $srcImg 180 180 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\app\apple-icon.png"
Resize-Image $srcImg 512 512 "c:\Users\abc\Downloads\Dhotiaale\Dhotiaale-1\public\app-logo.png"

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
