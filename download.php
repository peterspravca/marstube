<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Smaž súbory staršie ako 24 hodín (86400 sekúnd)
$files = array_merge(glob('*_video.mp4'), glob('*_audio.m4a'), glob('*_audio.mp3'));
$now = time();
foreach ($files as $file) {
    if (is_file($file)) {
        if ($now - filemtime($file) >= 86400) {
            unlink($file);
        }
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : 'download';
$filename = isset($_GET['filename']) ? $_GET['filename'] : '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Chybajuci parameter filename."]);
    exit;
}

// Bezpečnostná kontrola názvu súboru
if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Neplatny format filename."]);
    exit;
}

if ($action === 'status') {
    if (file_exists($filename)) {
        echo json_encode([
            "status" => "ready",
            "url" => "https://marso.sk/play/" . $filename,
            "size" => filesize($filename)
        ]);
    } else {
        echo json_encode(["status" => "not_found"]);
    }
    exit;
}

$url = isset($_GET['url']) ? $_GET['url'] : '';
if (empty($url)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Chybajuci parameter url."]);
    exit;
}

if (file_exists($filename)) {
    if (filesize($filename) > 1000) {
        echo json_encode([
            "status" => "ready",
            "url" => "https://marso.sk/play/" . $filename,
            "size" => filesize($filename)
        ]);
        exit;
    } else {
        unlink($filename);
    }
}

// Začatie sťahovania na server
$fp = fopen($filename, 'w+');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(["error" => "Chyba: Nepodarilo sa otvorit lokalny subor na serveri pre zapis."]);
    exit;
}

$client = isset($_GET['client']) ? strtoupper($_GET['client']) : 'WEB';

// Výber správneho User-Agenta podľa klienta
$user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
if ($client === 'ANDROID') {
    $user_agent = 'com.google.android.youtube/19.14.36 (Linux; U; Android 12; en_US)';
} else if ($client === 'IOS') {
    $user_agent = 'com.google.ios.youtube/19.14.36 (iPhone; CPU iPhone OS 17_0 like Mac OS X; en_US)';
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minúty limit na stiahnutie
curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Range: bytes=0-',
    'Referer: https://www.youtube.com/',
    'Origin: https://www.youtube.com'
]);

$success = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);
fclose($fp);

if ($success && $http_code === 200) {
    echo json_encode([
        "status" => "ready",
        "url" => "https://marso.sk/play/" . $filename,
        "size" => filesize($filename)
    ]);
} else {
    $error_body = '';
    if (file_exists($filename)) {
        $error_body = file_get_contents($filename);
        unlink($filename);
    }
    http_response_code(500);
    echo json_encode([
        "error" => "Stiahnutie zlyhalo",
        "http_code" => $http_code,
        "curl_error" => $error,
        "response_body" => substr($error_body, 0, 1000)
    ]);
}
