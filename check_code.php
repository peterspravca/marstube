<?php
// Skript na zobrazenie overovacích kódov z databázy (pre testovacie účely)
header("Content-Type: text/html; charset=UTF-8");

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

echo "<h2>Zoznam nevybavených registrácií a ich kódov:</h2>";

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $stmt = $pdo->query("SELECT email, verification_code, created_at FROM users WHERE is_verified = 0 ORDER BY created_at DESC");
    $users = $stmt->fetchAll();

    if (count($users) > 0) {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
        echo "<tr style='background: #eee;'><th>E-mail</th><th>Overovací kód</th><th>Čas registrácie</th></tr>";
        foreach ($users as $u) {
            echo "<tr>";
            echo "<td><b>" . htmlspecialchars($u['email']) . "</b></td>";
            echo "<td><b style='color: red; font-size: 1.2em;'>" . htmlspecialchars($u['verification_code']) . "</b></td>";
            echo "<td>" . htmlspecialchars($u['created_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>Žiadne čakajúce kódy - všetci používatelia sú už overení, alebo nikto nebol zaregistrovaný.</p>";
    }

} catch (\PDOException $e) {
    echo "❌ CHYBA DATABÁZY: " . $e->getMessage();
}
?>
