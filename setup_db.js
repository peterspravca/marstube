const mysql = require('mysql2/promise');

async function main() {
  console.log("Connecting to db1.usr.sk...");
  const connection = await mysql.createConnection({
    host: 'db1.usr.sk',
    user: 'marso.sk',
    password: '6KmKiW1V8QV_TaHZ',
    database: 'marso'
  });

  console.log("Connected. Creating users table...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        verification_code VARCHAR(6) NULL,
        is_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Creating watch_history table...");
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS watch_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        thumbnail_url VARCHAR(500) NULL,
        watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("Tables created successfully.");
  await connection.end();
}

main().catch(console.error);
