const mysql = require('mysql2/promise');

async function setup() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  console.log('Creating database "comissionhub"...');
  await connection.query('CREATE DATABASE IF NOT EXISTS comissionhub');
  await connection.query('USE comissionhub');

  console.log('Creating tables...');

  // Users Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Commissions Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS comissions (
      order_id VARCHAR(50) PRIMARY KEY,
      client_id INT,
      service_type VARCHAR(50),
      payment_method VARCHAR(50),
      budget_tier VARCHAR(50),
      budget_amount DECIMAL(10,2),
      deadline DATE,
      description TEXT,
      status ENUM('pending', 'completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Notifications Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      message TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // E-Wallet Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`e-wallet\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(50),
      amount DECIMAL(10,2),
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES comissions(order_id) ON DELETE CASCADE
    )
  `);

  console.log('Database setup complete!');
  await connection.end();
}

setup().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});
