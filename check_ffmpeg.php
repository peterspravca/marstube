<?php
echo "<h3>Diagnostika FFmpeg na serveri</h3>";

// 1. Kontrola PHP funkcii
echo "<b>1. Sú povolené funkcie exec/system?</b><br>";
$disabled = explode(',', ini_get('disable_functions'));
if (in_array('exec', $disabled) || in_array('shell_exec', $disabled)) {
    echo "<span style='color:red'>NIE (sú zablokované v php.ini). FFmpeg nikdy nepôjde.</span><br>";
} else {
    echo "<span style='color:green'>ÁNO</span><br>";
}

// 2. Skúška stiahnutého FFmpeg
echo "<br><b>2. Skúška lokálneho FFmpeg súboru:</b><br>";
$local_ffmpeg = __DIR__ . '/ffmpeg';
if (file_exists($local_ffmpeg)) {
    echo "Súbor existuje. Veľkosť: " . round(filesize($local_ffmpeg) / 1024 / 1024, 2) . " MB<br>";
    if (is_executable($local_ffmpeg)) {
        echo "Súbor má práva na spustenie.<br>";
        
        $out = [];
        $ret = -1;
        exec($local_ffmpeg . ' -version 2>&1', $out, $ret);
        if ($ret === 0) {
            echo "<span style='color:green'>FFmpeg funguje! Výstup:</span><br>";
            echo "<pre>" . implode("\n", array_slice($out, 0, 3)) . "</pre>";
        } else {
            echo "<span style='color:red'>FFmpeg sa nedá spustiť! (Zrejme zlý operačný systém alebo architektúra)</span><br>";
            echo "Návratový kód: $ret<br>";
            echo "Výstup: <pre>" . implode("\n", $out) . "</pre>";
        }
    } else {
        echo "<span style='color:red'>Súbor nemá práva na spustenie (chmod).</span><br>";
    }
} else {
    echo "<span style='color:red'>Lokálny súbor ffmpeg nebol nájdený.</span><br>";
}

// 3. Info o serveri
echo "<br><b>3. Informácie o serveri:</b><br>";
echo "Operačný systém: " . php_uname() . "<br>";
echo "Verzia PHP: " . phpversion() . "<br>";
?>
