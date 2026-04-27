const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'], // Allow both Live Server and the Node server itself
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'commissionhub_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ success: false, message: 'All fields are required.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    
    req.session.userId = result.insertId;
    req.session.userName = name;
    req.session.userEmail = email;

    res.json({ 
      success: true, 
      message: 'Account created!', 
      user: { id: result.insertId, name, email } 
    });
  } catch (error) {
    res.json({ success: false, message: 'Registration failed.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password required.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      res.json({ 
        success: true, 
        message: 'Login successful!', 
        user: { id: user.id, name: user.name, email: user.email } 
      });
    } else {
      res.json({ success: false, message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.json({ success: false, message: 'Login failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out.' });
});

app.get('/api/auth/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      success: true,
      user: {
        name: req.session.userName,
        email: req.session.userEmail
      }
    });
  } else {
    res.json({ success: false });
  }
});

// --- COMMISSION ROUTES ---

app.post('/api/commissions/create', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'Please login to submit a request.' });

  const { id, service, payment, budget, amount, deadline, details } = req.body;
  try {
    await db.query(
      'INSERT INTO comissions (order_id, client_id, service_type, payment_method, budget_tier, budget_amount, deadline, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.session.userId, service, payment, budget, amount, deadline || null, details, 'pending']
    );
    res.json({ success: true, message: 'Commission request submitted!' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to save request.', error: error.message });
  }
});

app.get('/api/commissions/list', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'Unauthorized.' });

  try {
    const [rows] = await db.query('SELECT * FROM comissions WHERE client_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch commissions.' });
  }
});

// --- NOTIFICATION ROUTES ---

app.get('/api/notifications/list', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'Unauthorized.' });

  try {
    const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

app.post('/api/notifications/clear', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'Unauthorized.' });

  try {
    await db.query('DELETE FROM notifications WHERE user_id = ?', [req.session.userId]);
    res.json({ success: true, message: 'Notifications cleared.' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to clear notifications.' });
  }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/all_requests', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, 
      IFNULL(u.name, 'Unknown User') as client_name, 
      IFNULL(u.email, 'N/A') as client_email
      FROM comissions c 
      LEFT JOIN users u ON c.client_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch requests.' });
  }
});

app.post('/api/admin/update_status', async (req, res) => {
  const { id, status, amount } = req.body;
  try {
    await db.query('UPDATE comissions SET status = ? WHERE order_id = ?', [status, id]);

    if (status === 'completed') {
      await db.query('INSERT INTO `e-wallet` (order_id, amount) VALUES (?, ?)', [id, amount]);

      const [commRows] = await db.query('SELECT client_id, service_type FROM comissions WHERE order_id = ?', [id]);
      if (commRows.length > 0) {
        const { client_id, service_type } = commRows[0];
        const msg = `Your commission request for '${service_type}' has been completed! ✅`;
        await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [client_id, msg]);
      }
    }
    res.json({ success: true, message: `Order marked as ${status}.` });
  } catch (error) {
    res.json({ success: false, message: 'Update failed.' });
  }
});

app.post('/api/admin/delete_commission', async (req, res) => {
  const { id } = req.query;
  try {
    await db.query('DELETE FROM comissions WHERE order_id = ?', [id]);
    res.json({ success: true, message: 'Request deleted.' });
  } catch (error) {
    res.json({ success: false, message: 'Delete failed.' });
  }
});

app.post('/api/admin/clear_all', async (req, res) => {
  try {
    await db.query('DELETE FROM comissions');
    res.json({ success: true, message: 'All requests cleared.' });
  } catch (error) {
    res.json({ success: false, message: 'Clear failed.' });
  }
});

app.get('/api/admin/wallet_history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT h.*, c.service_type as service, 
      IFNULL(u.name, 'Unknown User') as client_name, 
      IFNULL(u.email, 'N/A') as client_email 
      FROM \`e-wallet\` h 
      JOIN comissions c ON h.order_id = c.order_id 
      LEFT JOIN users u ON c.client_id = u.id 
      ORDER BY h.processed_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch wallet history.' });
  }
});

app.get('/api/admin/get_users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, created_at FROM users ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch users.' });
  }
});

app.post('/api/admin/delete_user', async (req, res) => {
  const { id } = req.query;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to delete user.' });
  }
});

app.post('/api/admin/update_user', async (req, res) => {
  const { id, name, email } = req.body;
  try {
    await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    res.json({ success: false, message: 'Update failed.' });
  }
});

// --- ANALYTICS ROUTES ---

// General Summary using subqueries
app.get('/api/admin/stats/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM comissions) as total_requests,
        (SELECT IFNULL(AVG(budget_amount), 0) FROM comissions WHERE status = 'completed') as avg_order_value,
        (SELECT service_type FROM comissions GROUP BY service_type ORDER BY COUNT(*) DESC LIMIT 1) as top_service,
        (SELECT COUNT(DISTINCT client_id) FROM comissions) as active_clients
    `);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch summary stats.', error: error.message });
  }
});

// Calculate Total Revenue per service type (using SUM, GROUP BY, and a subquery for share)
app.get('/api/admin/stats/revenue', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        service_type, 
        SUM(budget_amount) as total_revenue, 
        COUNT(*) as order_count,
        (SUM(budget_amount) / (SELECT NULLIF(SUM(budget_amount), 0) FROM comissions WHERE status = 'completed') * 100) as share_percentage
      FROM comissions 
      WHERE status = 'completed' 
      GROUP BY service_type
      ORDER BY total_revenue DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch revenue stats.' });
  }
});

// Count pending orders per user (using COUNT, LEFT JOIN, and GROUP BY)
app.get('/api/admin/stats/pending_summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.name, COUNT(c.order_id) as pending_count 
      FROM users u 
      LEFT JOIN comissions c ON u.id = c.client_id AND c.status = 'pending' 
      GROUP BY u.id, u.name
      HAVING pending_count > 0
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch pending summary.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
