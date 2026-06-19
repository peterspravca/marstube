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

// Logovací pomocník
function log_msg($msg) {
    file_put_contents('download_log.txt', date('[Y-m-d H:i:s] ') . $msg . "\n", FILE_APPEND);
}

$action = isset($_GET['action']) ? $_GET['action'] : 'download';
$filename = isset($_GET['filename']) ? $_GET['filename'] : '';

log_msg("=== ZACATOK REQ === Action: $action, Filename: $filename");

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Chybajuci parameter filename."]);
    log_msg("CHYBA: Chyba parameter filename");
    exit;
}

// Bezpečnostná kontrola názvu súboru
if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $filename)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Neplatny format filename."]);
    log_msg("CHYBA: Neplatny format filename");
    exit;
}

if ($action === 'status') {
    if (file_exists($filename)) {
        log_msg("STATUS CHECK: Ready (size: " . filesize($filename) . ")");
        echo json_encode([
            "status" => "ready",
            "url" => "https://marso.sk/play/" . $filename,
            "size" => filesize($filename)
        ]);
    } else {
        log_msg("STATUS CHECK: Not found");
        echo json_encode(["status" => "not_found"]);
    }
    exit;
}

if ($action === 'save') {
    log_msg("SAVE ACTION: Starting for $filename");
    if (file_exists($filename) && filesize($filename) > 1000) {
        log_msg("SAVE ACTION: Subor existuje, zacinam odosielanie...");
        header("Content-Description: File Transfer");
        header("Content-Type: application/octet-stream");
        header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
        header("Expires: 0");
        header("Cache-Control: must-revalidate");
        header("Pragma: public");
        header("Content-Length: " . filesize($filename));
        readfile($filename);
        log_msg("SAVE ACTION: Súbor úspešne odoslaný.");
        exit;
    }
    log_msg("SAVE ACTION: Subor neexistuje, pokracujem stiahnutim...");
}

$url = isset($_GET['url']) ? $_GET['url'] : '';
if (empty($url)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Chybajuci parameter url."]);
    log_msg("CHYBA: Chyba parameter url");
    exit;
}

log_msg("URL: " . substr($url, 0, 100) . "...");

if (file_exists($filename)) {
    if (filesize($filename) > 1000) {
        log_msg("Súbor existuje a je väčší ako 1000B, preskakujem sťahovanie.");
        echo json_encode([
            "status" => "ready",
            "url" => "https://marso.sk/play/" . $filename,
            "size" => filesize($filename)
        ]);
        exit;
    } else {
        log_msg("Súbor existuje ale je príliš malý, mažem ho a budem sťahovať znova.");
        unlink($filename);
    }
}

// Začatie sťahovania na server
log_msg("Otváram súbor pre zápis: $filename");
$fp = fopen($filename, 'w+');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(["error" => "Chyba: Nepodarilo sa otvorit lokalny subor na serveri pre zapis."]);
    log_msg("CHYBA: fopen zlyhal");
    exit;
}

$client = isset($_GET['client']) ? strtoupper($_GET['client']) : 'WEB';
log_msg("Vybraný klient: $client");

// Výber správneho User-Agenta podľa klienta
$user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
if ($client === 'ANDROID') {
    $user_agent = 'com.google.android.youtube/19.14.36 (Linux; U; Android 12; en_US)';
} else if ($client === 'IOS') {
    $user_agent = 'com.google.ios.youtube/19.14.36 (iPhone; CPU iPhone OS 17_0 like Mac OS X; en_US)';
}

log_msg("Inicializujem CURL s UA: $user_agent");
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 120); // 2 minúty limit na stiahnutie
curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);
$headers = [
    'Range: bytes=0-'
];
if ($client === 'WEB') {
    $headers[] = 'Referer: https://www.youtube.com/';
    $headers[] = 'Origin: https://www.youtube.com';
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

log_msg("Spúšťam curl_exec...");
$success = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
log_msg("CURL dokončený. Success: " . ($success ? "Áno" : "Nie") . ", HTTP kód: $http_code, Chyba: $error");
curl_close($ch);
fclose($fp);

if ($success && ($http_code === 200 || $http_code === 206)) {
    log_msg("SŤAHOVANIE HOTOVÉ. Veľkosť: " . filesize($filename) . " bajtov.");
    if ($action === 'save') {
        log_msg("SAVE ACTION: Sťahovanie dokončené, zacinam odosielanie...");
        header("Content-Description: File Transfer");
        header("Content-Type: application/octet-stream");
        header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
        header("Expires: 0");
        header("Cache-Control: must-revalidate");
        header("Pragma: public");
        header("Content-Length: " . filesize($filename));
        readfile($filename);
        log_msg("SAVE ACTION: Súbor úspešne odoslaný.");
        exit;
    } else {
        echo json_encode([
            "status" => "ready",
            "url" => "https://marso.sk/play/" . $filename,
            "size" => filesize($filename)
        ]);
    }
} else {
    $error_body = '';
    if (file_exists($filename)) {
        $error_body = file_get_contents($filename);
        log_msg("Sťahovanie zlyhalo. Mazem lokalny subor. Prvých 200B odpovede: " . substr($error_body, 0, 200));
        unlink($filename);
    } else {
        log_msg("Sťahovanie zlyhalo. Súbor nebol vytvorený.");
    }
    http_response_code(500);
    echo json_encode([
        "error" => "Stiahnutie zlyhalo",
        "http_code" => $http_code,
        "curl_error" => $error,
        "response_body" => substr($error_body, 0, 1000)
    ]);
}
