<?php
// Skript na vytvorenie databázových tabuliek pre MarsTube
header("Content-Type: text/plain; charset=UTF-8");

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
    echo "Pripájam sa k databáze $db...\n";
    $pdo = new PDO($dsn, $user, $pass, $options);
    echo "Pripojenie úspešné!\n\n";

    echo "Vytváram tabuľku 'users'...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            verification_code VARCHAR(6) NULL,
            is_verified TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabuľka 'users' vytvorená (alebo už existuje).\n\n";

    echo "Vytváram tabuľku 'watch_history'...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS watch_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            video_id VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            thumbnail_url VARCHAR(500) NULL,
            watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabuľka 'watch_history' vytvorená (alebo už existuje).\n\n";

    echo "Vytváram tabuľku 'favorites'...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            video_id VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            thumbnail_url VARCHAR(500) NULL,
            uploader_name VARCHAR(255) NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_video (user_id, video_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabuľka 'favorites' vytvorená (alebo už existuje).\n\n";

    echo "Vytváram tabuľku 'playlists'...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS playlists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            playlist_id VARCHAR(100) NOT NULL,
            title VARCHAR(255) NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_playlist (user_id, playlist_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Tabuľka 'playlists' vytvorená (alebo už existuje).\n\n";

    echo "✅ VŠETKO HOTOVO! Tabuľky boli úspešne vytvorené.\n";
    echo "Teraz môžeš zavrieť túto stránku a vyskúšať prihlásenie/registráciu na tvojom webe.";

} catch (\PDOException $e) {
    echo "❌ CHYBA DATABÁZY:\n" . $e->getMessage();
}
?>
