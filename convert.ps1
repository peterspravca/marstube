Add-Type -AssemblyName System.Drawing
$imagePath = "c:\Coding\youtube\public\og-image.png"
$savePath = "c:\Coding\youtube\public\og-image.jpg"
$bmp = [System.Drawing.Image]::FromFile($imagePath)

$encoder = [System.Drawing.Imaging.Encoder]::Quality
$jpegCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]75)

$bmp.Save($savePath, $jpegCodecInfo, $encoderParams)
$bmp.Dispose()
Write-Output "Converted to jpg"
