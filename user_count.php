<?php
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
    
    // Zistenie celkového počtu užívateľov
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $row = $stmt->fetch();
    $total_users = $row['count'];
    
    // Zistenie počtu overených užívateľov
    $stmt_verified = $pdo->query("SELECT COUNT(*) as count FROM users WHERE is_verified = 1");
    $row_verified = $stmt_verified->fetch();
    $verified_users = $row_verified['count'];

    // Získanie zoznamu užívateľov
    $stmt_users = $pdo->query("SELECT id, email, is_verified, created_at FROM users ORDER BY created_at DESC");
    $users_list = $stmt_users->fetchAll();

    // Vykreslenie jednoduchej HTML stránky
    echo "<!DOCTYPE html>";
    echo "<html lang='sk'>";
    echo "<head>";
    echo "<meta charset='UTF-8'>";
    echo "<title>Štatistika užívateľov</title>";
    echo "<style>";
    echo "body { font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 50px; text-align: center; }";
    echo ".container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: inline-block; max-width: 800px; width: 100%; }";
    echo "h1 { color: #333; }";
    echo ".number { font-size: 48px; font-weight: bold; color: #007bff; margin: 10px 0; }";
    echo ".verified { color: #28a745; font-size: 24px; }";
    echo "table { width: 100%; border-collapse: collapse; margin-top: 30px; text-align: left; }";
    echo "th, td { padding: 12px; border-bottom: 1px solid #ddd; }";
    echo "th { background-color: #f8f9fa; color: #333; }";
    echo ".status-yes { color: #28a745; font-weight: bold; }";
    echo ".status-no { color: #dc3545; font-weight: bold; }";
    echo "</style>";
    echo "</head>";
    echo "<body>";
    echo "<div class='container'>";
    echo "<h1>Štatistika užívateľov</h1>";
    echo "<p>Celkový počet registrovaných:</p>";
    echo "<div class='number'>" . htmlspecialchars($total_users) . "</div>";
    echo "<p class='verified'>Z toho overených: <strong>" . htmlspecialchars($verified_users) . "</strong></p>";
    
    echo "<h2>Zoznam používateľov</h2>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Email</th><th>Overený</th><th>Dátum registrácie</th></tr>";
    foreach ($users_list as $u) {
        $status = $u['is_verified'] ? "<span class='status-yes'>Áno</span>" : "<span class='status-no'>Nie</span>";
        $date = date('d.m.Y H:i', strtotime($u['created_at']));
        echo "<tr>";
        echo "<td>" . htmlspecialchars($u['id']) . "</td>";
        echo "<td>" . htmlspecialchars($u['email']) . "</td>";
        echo "<td>" . $status . "</td>";
        echo "<td>" . htmlspecialchars($date) . "</td>";
        echo "</tr>";
    }
    echo "</table>";

    echo "</div>";
    echo "</body>";
    echo "</html>";

} catch (\PDOException $e) {
    echo "Chyba databázy: " . $e->getMessage();
}
?>
