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

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minúty limit na stiahnutie

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
    if (file_exists($filename)) {
        unlink($filename);
    }
    http_response_code(500);
    echo json_encode([
        "error" => "Stiahnutie zlyhalo",
        "http_code" => $http_code,
        "curl_error" => $error
    ]);
}
