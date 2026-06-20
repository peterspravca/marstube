<?php
echo "<h3>Sťahovanie FFmpeg na server</h3>";

$local_ffmpeg = __DIR__ . '/ffmpeg';
$url = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64';

echo "<b>Pripravujem sťahovanie z GitHubu...</b><br>";

$fp = @fopen($local_ffmpeg, 'w+');
if ($fp === false) {
    echo "<span style='color:red'>CHYBA: Zložka nemá práva na zápis (fopen zlyhal). Nemôžem vytvoriť súbor ffmpeg.</span><br>";
    exit;
}

echo "Súbor úspešne vytvorený, začínam sťahovať (môže to chvíľu trvať)...<br>";
ob_flush(); flush();

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
curl_setopt($ch, CURLOPT_TIMEOUT, 300);

$success = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);
fclose($fp);

if ($success && $http_code === 200) {
    echo "<span style='color:green'>Sťahovanie úspešné! HTTP kód: $http_code</span><br>";
    
    // Skúsime pridať práva na spustenie
    if (chmod($local_ffmpeg, 0755)) {
        echo "<span style='color:green'>Práva na spustenie úspešne pridané (chmod 755).</span><br>";
    } else {
        echo "<span style='color:orange'>Nepodarilo sa pridať práva na spustenie cez PHP. Skúste to cez FTP (nastavte súboru ffmpeg práva 755).</span><br>";
    }
    
    // Skúsime ho spustiť
    $out = [];
    $ret = -1;
    exec($local_ffmpeg . ' -version 2>&1', $out, $ret);
    if ($ret === 0) {
        echo "<br><b style='color:green'>VŠETKO FUNGUJE! Server má odteraz plne funkčný FFmpeg.</b><br>";
    } else {
        echo "<br><span style='color:red'>Chyba pri skúšobnom spustení: $ret</span><br>";
    }
} else {
    echo "<span style='color:red'>Sťahovanie ZLYHALO! HTTP kód: $http_code</span><br>";
    echo "Chyba CURL: $error<br>";
    if (file_exists($local_ffmpeg)) {
        @unlink($local_ffmpeg);
    }
}
?>
