<?php
// Povoliť CORS - prístup z webstránky
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Ak ide len o OPTIONS požiadavku (CORS preflight), vráť OK a skonči
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Nastavenia Databázy (upravené podľa teba)
$host = 'db1.usr.sk';
$db   = 'marso';
$user = 'marso.sk';
$pass = '6KmKiW1V8QV_TaHZ';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(["error" => "Chyba spojenia s databázou: " . $e->getMessage()]);
    exit;
}

// Získanie dát z požiadavky (vždy v JSON)
$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data->action) ? $data->action : '');

if (!$action) {
    echo json_encode(["error" => "Žiadna akcia (action) nebola špecifikovaná."]);
    exit;
}

// --- JEDNODUCHÁ IMPLEMENTÁCIA JWT TOKENU ---
$SECRET_KEY = "mars_tube_tajny_kluc_super_bezpecny_123456";

function createToken($user_id, $email) {
    global $SECRET_KEY;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['user_id' => $user_id, 'email' => $email, 'exp' => time() + (86400 * 30)]); // platnosť 30 dní
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken($token) {
    global $SECRET_KEY;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    
    $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], $SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if (hash_equals($base64UrlSignature, $parts[2])) {
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])));
        if ($payload->exp >= time()) {
            return $payload;
        }
    }
    return false;
}

// Funkcia na získanie tokenu z hlavičky Authorization
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Funkcia na odoslanie e-mailu priamo cez SMTP server so zadanými heslami
function send_mail_smtp($to, $subject, $body) {
    $smtp_host = "ssl://mail.usr.sk";
    $smtp_port = 465;
    $smtp_user = "noreply@marso.sk";
    $smtp_pass = "Neviem0950400203";

    $socket = fsockopen($smtp_host, $smtp_port, $errno, $errstr, 15);
    if (!$socket) {
        throw new Exception("Nepodarilo sa pripojiť na SMTP server: $errno $errstr");
    }

    $read_res = function($sock) {
        $res = "";
        while ($str = fgets($sock, 515)) {
            $res .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        return $res;
    };

    $read_res($socket);

    fputs($socket, "EHLO marso.sk\r\n");
    $read_res($socket);

    fputs($socket, "AUTH LOGIN\r\n");
    $read_res($socket);

    fputs($socket, base64_encode($smtp_user) . "\r\n");
    $read_res($socket);

    fputs($socket, base64_encode($smtp_pass) . "\r\n");
    $auth_res = $read_res($socket);
    
    if (substr($auth_res, 0, 3) != "235") {
        throw new Exception("Chyba overenia SMTP (zlé heslo alebo e-mail): $auth_res");
    }

    fputs($socket, "MAIL FROM: <$smtp_user>\r\n");
    $read_res($socket);

    fputs($socket, "RCPT TO: <$to>\r\n");
    $read_res($socket);

    fputs($socket, "DATA\r\n");
    $read_res($socket);

    $headers = "From: MarsTube <$smtp_user>\r\n";
    $headers .= "To: $to\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    
    fputs($socket, $headers . $body . "\r\n.\r\n");
    $read_res($socket);

    fputs($socket, "QUIT\r\n");
    fclose($socket);
}

// ========================
// SPRACOVANIE AKCIÍ
// ========================

try {
    switch ($action) {
    
    // 1. REGISTRÁCIA
    case 'register':
        if (!isset($data->email) || !isset($data->password)) {
            echo json_encode(["error" => "Chýba email alebo heslo"]);
            exit;
        }
        $email = trim($data->email);
        $password = $data->password;
        
        // Zisti, či existuje
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["error" => "Tento email už je zaregistrovaný."]);
            exit;
        }
        
        // Vygenerovanie 6-miestneho kódu
        $code = sprintf("%06d", mt_rand(1, 999999));
        $hash = password_hash($password, PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, verification_code) VALUES (?, ?, ?)");
        if ($stmt->execute([$email, $hash, $code])) {
            // Poslať email cez SMTP
            $subject = "Overenie registracie do MarsTube";
            $message = "Vítame vás v MarsTube!\n\nVáš overovací kód je: $code\n\nZadajte tento kód do aplikácie pre dokončenie registrácie.";
            
            try {
                send_mail_smtp($email, $subject, $message);
                echo json_encode(["success" => true, "message" => "Registrácia úspešná, bol odoslaný overovací e-mail."]);
            } catch (Exception $mailError) {
                // E-mail zlyhal
                echo json_encode(["error" => "Účet vytvorený, ale nastala chyba pri odosielaní emailu: " . $mailError->getMessage()]);
            }
        } else {
            echo json_encode(["error" => "Chyba pri ukladaní do databázy."]);
        }
        break;

    // 2. OVERENIE EMAILU (VERIFY)
    case 'verify':
        if (!isset($data->email) || !isset($data->code)) {
            echo json_encode(["error" => "Chýbajú údaje"]);
            exit;
        }
        $email = trim($data->email);
        $code = trim($data->code);
        
        $stmt = $pdo->prepare("SELECT id, verification_code FROM users WHERE email = ? AND is_verified = 0");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(["error" => "Účet sa nenašiel alebo je už overený."]);
            exit;
        }
        
        if ($user['verification_code'] === $code) {
            $stmt = $pdo->prepare("UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Vygenerujeme rovno token aby bol prihlásený
            $token = createToken($user['id'], $email);
            echo json_encode(["success" => true, "token" => $token, "email" => $email]);
        } else {
            echo json_encode(["error" => "Neplatný overovací kód."]);
        }
        break;

    // 3. PRIHLÁSENIE
    case 'login':
        if (!isset($data->email) || !isset($data->password)) {
            echo json_encode(["error" => "Chýba email alebo heslo"]);
            exit;
        }
        $email = trim($data->email);
        $password = $data->password;
        
        $stmt = $pdo->prepare("SELECT id, password_hash, is_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            if ($user['is_verified'] == 0) {
                echo json_encode(["error" => "E-mail ešte nebol overený.", "needsVerification" => true]);
                exit;
            }
            
            $token = createToken($user['id'], $email);
            echo json_encode(["success" => true, "token" => $token, "email" => $email]);
        } else {
            echo json_encode(["error" => "Nesprávny e-mail alebo heslo."]);
        }
        break;

    // 4. ULOŽIŤ HISTÓRIU
    case 'save_history':
        $tokenRaw = getBearerToken();
        $payload = verifyToken($tokenRaw);
        if (!$payload) {
            echo json_encode(["error" => "Neplatný alebo chýbajúci token"]);
            http_response_code(401);
            exit;
        }
        
        if (!isset($data->video_id) || !isset($data->title)) {
            echo json_encode(["error" => "Chýba video_id alebo title"]);
            exit;
        }
        
        // Odstránime predchádzajúci záznam tohto istého videa, aby sme ho mohli vložiť na vrch histórie
        $stmt = $pdo->prepare("DELETE FROM watch_history WHERE user_id = ? AND video_id = ?");
        $stmt->execute([$payload->user_id, $data->video_id]);
        
        $stmt = $pdo->prepare("INSERT INTO watch_history (user_id, video_id, title, thumbnail_url) VALUES (?, ?, ?, ?)");
        $stmt->execute([$payload->user_id, $data->video_id, $data->title, isset($data->thumbnail_url) ? $data->thumbnail_url : null]);
        
        // Zmazať všetko okrem posledných 50 záznamov pre daného používateľa
        $stmt = $pdo->prepare("DELETE FROM watch_history WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (
                SELECT id FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT 50
            ) as t
        )");
        $stmt->execute([$payload->user_id, $payload->user_id]);
        
        echo json_encode(["success" => true]);
        break;

    case 'get_favorites':
        $tokenRaw = getBearerToken();
        $payload = verifyToken($tokenRaw);
        if (!$payload) {
            echo json_encode(["error" => "Neplatný alebo chýbajúci token"]);
            http_response_code(401);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC");
        $stmt->execute([$payload->user_id]);
        $favorites = $stmt->fetchAll();
        
        echo json_encode($favorites);
        break;

    case 'add_favorite':
        $tokenRaw = getBearerToken();
        $payload = verifyToken($tokenRaw);
        if (!$payload) {
            echo json_encode(["error" => "Neplatný alebo chýbajúci token"]);
            http_response_code(401);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->video_id) || !isset($data->title)) {
            echo json_encode(["error" => "Chýbajúce dáta"]);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("INSERT IGNORE INTO favorites (user_id, video_id, title, thumbnail_url, uploader_name) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$payload->user_id, $data->video_id, $data->title, isset($data->thumbnail_url) ? $data->thumbnail_url : null, isset($data->uploader_name) ? $data->uploader_name : null]);
            echo json_encode(["success" => true]);
        } catch (\PDOException $e) {
            echo json_encode(["error" => "Chyba pri ukladaní do obľúbených"]);
        }
        break;

    case 'remove_favorite':
        $tokenRaw = getBearerToken();
        $payload = verifyToken($tokenRaw);
        if (!$payload) {
            echo json_encode(["error" => "Neplatný alebo chýbajúci token"]);
            http_response_code(401);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"));
        if (!isset($data->video_id)) {
            echo json_encode(["error" => "Chýbajúce dáta"]);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND video_id = ?");
        $stmt->execute([$payload->user_id, $data->video_id]);
        echo json_encode(["success" => true]);
        break;

    // 5. ZÍSKAŤ HISTÓRIU
    case 'get_history':
        $tokenRaw = getBearerToken();
        $payload = verifyToken($tokenRaw);
        if (!$payload) {
            echo json_encode(["error" => "Neplatný alebo chýbajúci token"]);
            http_response_code(401);
            exit;
        }
        
        $stmt = $pdo->prepare("SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT 50");
        $stmt->execute([$payload->user_id]);
        $history = $stmt->fetchAll();
        
        echo json_encode(["success" => true, "data" => $history]);
        break;

        default:
            echo json_encode(["error" => "Neznáma akcia"]);
            break;
    }
} catch (Exception $e) {
    // Zachytenie chýb (napr. ak chýbajú tabuľky v databáze)
    http_response_code(500);
    echo json_encode(["error" => "Chyba na serveri: " . $e->getMessage()]);
}
?>
