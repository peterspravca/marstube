<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

// Smaž súbory staršie ako 1 hodinu (3600 sekúnd)
$files = array_merge(glob('*_video.mp4'), glob('*_audio.m4a'), glob('*_audio.mp3'));
$now = time();
foreach ($files as $file) {
    if (is_file($file)) {
        if ($now - filemtime($file) >= 3600) {
            unlink($file);
        }
    }
}

// Logovací pomocník
function log_msg($msg) {
    file_put_contents('download_log.txt', date('[Y-m-d H:i:s] ') . $msg . "\n", FILE_APPEND);
}

function get_mime_type($filename) {
    if (str_ends_with($filename, '.mp4')) {
        return 'video/mp4';
    } else if (str_ends_with($filename, '.m4a')) {
        return 'audio/mp4';
    } else if (str_ends_with($filename, '.mp3')) {
        return 'audio/mpeg';
    }
    return 'application/octet-stream';
}

function download_local_ffmpeg() {
    $local_ffmpeg = __DIR__ . '/ffmpeg';
    log_msg("Local FFmpeg missing. Attempting to download static binary...");
    
    // Direct link to static Linux amd64 binary of ffmpeg
    $url = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64';
    
    $fp = @fopen($local_ffmpeg, 'w+');
    if ($fp === false) {
        log_msg("CHYBA: Nepodarilo sa otvorit local ffmpeg pre zapis.");
        return false;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minutes max
    $success = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);
    
    if ($success && $http_code === 200) {
        @chmod($local_ffmpeg, 0755);
        log_msg("Local FFmpeg downloaded successfully. Chmod 755 set.");
        return true;
    } else {
        log_msg("CHYBA: Stiahnutie local FFmpeg zlyhalo. HTTP kód: $http_code");
        if (file_exists($local_ffmpeg)) {
            @unlink($local_ffmpeg);
        }
        return false;
    }
}

function get_ffmpeg_path() {
    // 1. Check if ffmpeg is in system path
    $ffmpeg_out = [];
    $ffmpeg_ret = -1;
    @exec('ffmpeg -version', $ffmpeg_out, $ffmpeg_ret);
    if ($ffmpeg_ret === 0) {
        return 'ffmpeg';
    }
    
    // 2. Check if local ffmpeg exists
    $local_ffmpeg = __DIR__ . '/ffmpeg';
    if (file_exists($local_ffmpeg)) {
        if (!is_executable($local_ffmpeg)) {
            @chmod($local_ffmpeg, 0755);
        }
        return $local_ffmpeg;
    }
    
    // 3. Try to download it dynamically
    if (download_local_ffmpeg()) {
        return $local_ffmpeg;
    }
    
    return null;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'download';
$filename = isset($_GET['filename']) ? $_GET['filename'] : '';
$title = isset($_GET['title']) ? $_GET['title'] : '';

function get_attachment_filename($filename, $title) {
    if (empty($title)) {
        return $filename;
    }
    // Povolime len bezpecne znaky pre nazov suboru (pismena, cisla, medzery, pomlcky, bodky, zatvorky)
    $safe_title = preg_replace('/[^\p{L}\p{N}\s\-\_\.\(\)\[\]]+/u', '', $title);
    $safe_title = trim($safe_title);
    if (empty($safe_title)) {
        return $filename;
    }
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    return $safe_title . '.' . $ext;
}

log_msg("=== ZACATOK REQ === Action: $action, Filename: $filename");

if ($action === 'version') {
    $ffmpeg_path = get_ffmpeg_path();
    echo json_encode([
        "version" => "2.3.0",
        "supported_params" => ["ua"],
        "ffmpeg" => ($ffmpeg_path !== null),
        "ffmpeg_path" => $ffmpeg_path,
        "php_os" => PHP_OS,
        "uname" => php_uname()
    ]);
    exit;
}

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

$is_mp3 = str_ends_with($filename, '.mp3');
$download_target = $filename;
if ($is_mp3) {
    $download_target = str_replace('.mp3', '.m4a', $filename);
}

// 1. Skontrolujeme, či už výsledný požadovaný súbor existuje na FTP
if (file_exists($filename)) {
    if (filesize($filename) > 1000) {
        log_msg("Súbor $filename existuje a je väčší ako 1000B, preskakujem sťahovanie/konverziu.");
        if ($action === 'save') {
            log_msg("SAVE ACTION: Subor existuje, zacinam odosielanie...");
            header("Content-Description: File Transfer");
            header("Content-Type: " . get_mime_type($filename));
            $out_name = get_attachment_filename($filename, $title);
            header("Content-Disposition: attachment; filename=\"" . $out_name . "\"");
            header("Access-Control-Expose-Headers: Content-Disposition");
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
            exit;
        }
    } else {
        log_msg("Súbor $filename existuje ale je príliš malý, mažem ho.");
        unlink($filename);
    }
}

// 2. Skontrolujeme, či potrebujeme sťahovať zdrojový stream
$need_download = true;
if ($is_mp3 && file_exists($download_target) && filesize($download_target) > 1000) {
    log_msg("Lokalny M4A subor uz existuje ($download_target). Preskakujem stahovanie streamu, prechadzam na konverziu.");
    $need_download = false;
}

if ($action === 'save' && !$is_mp3) {
    // Toto je fallback, keby z nejakého dôvodu zlyhal check pred stiahnutím
    log_msg("SAVE ACTION: Subor neexistuje, pokracujem stiahnutim...");
}

$url = isset($_GET['url']) ? $_GET['url'] : '';
if ($need_download && empty($url)) {
    http_response_code(400);
    echo json_encode(["error" => "Chyba: Chybajuci parameter url."]);
    log_msg("CHYBA: Chyba parameter url");
    exit;
}

if ($need_download) {
    log_msg("URL: " . substr($url, 0, 100) . "...");

    // Začatie sťahovania na server do download_target
    log_msg("Otváram súbor pre zápis: $download_target");
    $fp = fopen($download_target, 'w+');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(["error" => "Chyba: Nepodarilo sa otvorit lokalny subor na serveri pre zapis."]);
        log_msg("CHYBA: fopen zlyhal");
        exit;
    }

    $client = isset($_GET['client']) ? strtoupper($_GET['client']) : 'WEB';
    log_msg("Vybraný klient: $client");

    // Výber správneho User-Agenta podľa parametra alebo fallbacku
    $user_agent = isset($_GET['ua']) ? $_GET['ua'] : '';
    if (empty($user_agent)) {
        $user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        if ($client === 'ANDROID') {
            $user_agent = 'com.google.android.youtube/21.03.36(Linux; U; Android 16; en_US; SM-S908E Build/TP1A.220624.014) gzip';
        } else if ($client === 'IOS') {
            $user_agent = 'com.google.ios.youtube/20.11.6 (iPhone10,4; U; CPU iOS 16_7_7 like Mac OS X)';
        }
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
        log_msg("SŤAHOVANIE HOTOVÉ. Veľkosť: " . filesize($download_target) . " bajtov.");
    } else {
        $error_body = '';
        if (file_exists($download_target)) {
            $error_body = file_get_contents($download_target);
            log_msg("Sťahovanie zlyhalo. Mazem lokalny subor. Prvých 200B odpovede: " . substr($error_body, 0, 200));
            unlink($download_target);
        } else {
            log_msg("Sťahovanie zlyhalo. Súbor nebol vytvorený.");
        }
        http_response_code(500);
        echo json_encode([
            "error" => "Stiahnutie zlyhalo",
            "http_code" => $http_code,
            "curl_error" => $error,
            "used_user_agent" => $user_agent,
            "target_url" => $url,
            "response_body" => substr($error_body, 0, 1000)
        ]);
        exit;
    }
}

// 3. Ak je cieľom MP3, vykonáme konverziu pomocou FFmpeg (s fallbackom)
if ($is_mp3) {
    log_msg("Spustam konverziu z M4A do MP3...");

    if (!file_exists($download_target) || filesize($download_target) <= 1000) {
        log_msg("CHYBA: Zdrojovy M4A subor neexistuje alebo je prilis maly pre konverziu.");
        http_response_code(500);
        echo json_encode(["error" => "Chyba: Zdrojovy subor pre konverziu neexistuje."]);
        exit;
    }

    $ffmpeg_path = get_ffmpeg_path();
    if ($ffmpeg_path !== null) {
        $ffmpeg_cmd = escapeshellarg($ffmpeg_path) . " -y -i " . escapeshellarg($download_target) . " -codec:a libmp3lame -b:a 128k " . escapeshellarg($filename) . " 2>&1";
        log_msg("Spustam prikaz: $ffmpeg_cmd");

        $ffmpeg_out = [];
        $ffmpeg_ret = -1;
        exec($ffmpeg_cmd, $ffmpeg_out, $ffmpeg_ret);

        log_msg("FFmpeg vysledok - Navratovy kod: $ffmpeg_ret");
        log_msg("FFmpeg prve riadky vystupu: " . (isset($ffmpeg_out[0]) ? implode("\n", array_slice($ffmpeg_out, 0, 5)) : 'ziadny vystup'));
    } else {
        log_msg("CHYBA: FFmpeg nebol najdeny a jeho stiahnutie zlyhalo.");
        $ffmpeg_ret = -1;
    }

    if ($ffmpeg_ret === 0 && file_exists($filename) && filesize($filename) > 1000) {
        log_msg("Konverzia na MP3 bola uspesna. Velkost: " . filesize($filename) . " bajtov.");
    } else {
        log_msg("FFmpeg zlyhal alebo nevytvoril platny MP3 subor. Pouzivam fallback (kopirovanie M4A na MP3).");
        if (copy($download_target, $filename)) {
            log_msg("Fallback uspesny, M4A subor bol skopirovany ako MP3.");
        } else {
            log_msg("CHYBA: Fallback kopirovanie zlyhalo.");
            http_response_code(500);
            echo json_encode(["error" => "Chyba pri konverzii a kopirovani na MP3."]);
            exit;
        }
    }
}

// 4. Odoslanie súboru alebo vrátenie statusu ready
if ($action === 'save') {
    log_msg("SAVE ACTION: Spustam odosielanie...");
    header("Content-Description: File Transfer");
    header("Content-Type: " . get_mime_type($filename));
    $out_name = get_attachment_filename($filename, $title);
    header("Content-Disposition: attachment; filename=\"" . $out_name . "\"");
    header("Access-Control-Expose-Headers: Content-Disposition");
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
