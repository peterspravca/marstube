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

// ========================
// SPRACOVANIE AKCIÍ
// ========================

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
            // Poslať email
            $subject = "Overenie registracie do MarsTube";
            $message = "Vítame vás v MarsTube!\n\nVáš overovací kód je: $code\n\nZadajte tento kód do aplikácie pre dokončenie registrácie.";
            $headers = "From: noreply@marso.sk\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            
            mail($email, $subject, $message, $headers);
            
            echo json_encode(["success" => true, "message" => "Registrácia úspešná, bol odoslaný overovací e-mail."]);
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
        
        $stmt = $pdo->prepare("INSERT INTO watch_history (user_id, video_id, title, thumbnail_url) VALUES (?, ?, ?, ?)");
        $stmt->execute([$payload->user_id, $data->video_id, $data->title, isset($data->thumbnail_url) ? $data->thumbnail_url : null]);
        
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
?>
