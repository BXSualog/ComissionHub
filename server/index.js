

const http = require('http');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const PORT = 3000;

// Supported file types for serving static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg':  'image/svg+xml'
};

// ============================================================
// SIMPLE SESSION MANAGEMENT
// ============================================================
// An in-memory Map to keep track of logged-in users.
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getSession(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  const sessionId = cookies['session_id'];
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }
  return null;
}

function createSession(res, userData) {
  const sessionId = generateSessionId();
  sessions.set(sessionId, userData);
  // Set cookie for 24 hours
  res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);
  return sessionId;
}

function destroySession(req, res) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    const sessionId = cookies['session_id'];
    if (sessionId) {
      sessions.delete(sessionId);
    }
  }
  // Clear the cookie by setting it to expire instantly
  res.setHeader('Set-Cookie', `session_id=; HttpOnly; Path=/; Max-Age=0`);
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Send a JSON response back to the browser
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Read the body of an incoming POST request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Ensure the browser is allowed to communicate with this server (CORS)
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Serve standard files (HTML, CSS, JS, Images) to the browser
function serveStatic(req, res) {
  // If the URL is exactly "/", serve the homepage
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query strings for static files (e.g. style.css?v=1)
  urlPath = urlPath.split('?')[0];

  let filePath = path.join(__dirname, '..', urlPath);
  
  // Prevent path traversal attacks
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(path.join(__dirname, '..'))) {
    res.writeHead(403);
    return res.end('403 Forbidden');
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// ============================================================
// MAIN SERVER LOGIC
// ============================================================
const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  // The browser sends an "OPTIONS" request before a POST to check CORS rules
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle all API routes
  if (req.url.startsWith('/api/')) {
    // Split the URL to handle query parameters (e.g. /api/path?id=123)
    const urlParts = req.url.split('?');
    const pathName = urlParts[0];
    const query = new URLSearchParams(urlParts[1] || '');

    const session = getSession(req);

    try {
      // --------------------------------------------------------
      // AUTH ROUTES
      // --------------------------------------------------------
      if (req.method === 'POST' && pathName === '/api/auth/signup') {
        const { firstName, lastName, email, password } = await parseBody(req);
        if (!firstName || !lastName || !email || !password) return sendJson(res, 200, { success: false, message: 'All fields are required.' });
        
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return sendJson(res, 200, { success: false, message: 'Email already registered.' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [firstName, lastName, email, hashedPassword]);
        
        createSession(res, { userId: result.insertId, firstName, lastName, userEmail: email });
        return sendJson(res, 200, { success: true, message: 'Account created!', user: { id: result.insertId, firstName, lastName, email } });
      }

      if (req.method === 'POST' && pathName === '/api/auth/login') {
        const { email, password } = await parseBody(req);
        if (!email || !password) return sendJson(res, 200, { success: false, message: 'Email and password required.' });
        
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        
        if (user && await bcrypt.compare(password, user.password)) {
          createSession(res, { userId: user.id, firstName: user.first_name, lastName: user.last_name, userEmail: user.email });
          return sendJson(res, 200, { success: true, message: 'Login successful!', user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email } });
        }
        return sendJson(res, 200, { success: false, message: 'Invalid email or password.' });
      }

      if (req.method === 'POST' && pathName === '/api/auth/logout') {
        destroySession(req, res);
        return sendJson(res, 200, { success: true, message: 'Logged out.' });
      }

      if (req.method === 'POST' && pathName === '/api/auth/check-email') {
        const { email } = await parseBody(req);
        if (!email) return sendJson(res, 200, { success: false, message: 'Email is required.' });
        
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        return sendJson(res, 200, { success: true, exists: users.length > 0 });
      }

      if (req.method === 'GET' && pathName === '/api/auth/session') {
        if (session) {
          return sendJson(res, 200, { success: true, user: { firstName: session.firstName, lastName: session.lastName, email: session.userEmail } });
        }
        return sendJson(res, 200, { success: false });
      }

      // --------------------------------------------------------
      // COMMISSION ROUTES
      // --------------------------------------------------------
      if (req.method === 'POST' && pathName === '/api/commissions/create') {
        if (!session) return sendJson(res, 200, { success: false, message: 'Please login to submit a request.' });
        const { id, service, payment, budget, amount, deadline, details } = await parseBody(req);
        
        async function getOrCreateId(table, name) {
          const [rows] = await db.query(`SELECT id FROM \`${table}\` WHERE name = ?`, [name]);
          if (rows.length > 0) return rows[0].id;
          const [res] = await db.query(`INSERT INTO \`${table}\` (name) VALUES (?)`, [name]);
          return res.insertId;
        }

        const service_id = await getOrCreateId('services', service);
        const payment_method_id = await getOrCreateId('payment_methods', payment);
        const budget_tier_id = await getOrCreateId('budget_tiers', budget);

        await db.query(
          `INSERT INTO comissions (order_id, client_id, service_id, payment_method_id, budget_tier_id, budget_amount, deadline, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, session.userId, service_id, payment_method_id, budget_tier_id, amount, deadline || null, details, 'pending']
        );
        return sendJson(res, 200, { success: true, message: 'Commission request submitted!' });
      }

      if (req.method === 'GET' && pathName === '/api/commissions/list') {
        if (!session) return sendJson(res, 200, { success: false, message: 'Unauthorized.' });
        const [rows] = await db.query(`
          SELECT c.*, s.name as service_type, p.name as payment_method, b.name as budget_tier 
          FROM comissions c
          LEFT JOIN services s ON c.service_id = s.id
          LEFT JOIN payment_methods p ON c.payment_method_id = p.id
          LEFT JOIN budget_tiers b ON c.budget_tier_id = b.id
          WHERE c.client_id = ? ORDER BY c.created_at DESC`, [session.userId]);
        return sendJson(res, 200, { success: true, data: rows });
      }

      // --------------------------------------------------------
      // NOTIFICATION ROUTES
      // --------------------------------------------------------
      if (req.method === 'GET' && pathName === '/api/notifications/list') {
        if (!session) return sendJson(res, 200, { success: false, message: 'Unauthorized.' });
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);
        return sendJson(res, 200, { success: true, data: rows });
      }

      if (req.method === 'POST' && pathName === '/api/notifications/clear') {
        if (!session) return sendJson(res, 200, { success: false, message: 'Unauthorized.' });
        await db.query('DELETE FROM notifications WHERE user_id = ?', [session.userId]);
        return sendJson(res, 200, { success: true, message: 'Notifications cleared.' });
      }

      // --------------------------------------------------------
      // ADMIN ROUTES
      // --------------------------------------------------------
      if (req.method === 'GET' && pathName === '/api/admin/all_requests') {
        const [rows] = await db.query(`
          SELECT c.*, s.name as service_type, p.name as payment_method, b.name as budget_tier, 
                 IFNULL(CONCAT(u.first_name, ' ', u.last_name), 'Unknown User') AS client_name, IFNULL(u.email, 'N/A') AS client_email 
          FROM comissions c 
          LEFT JOIN users u ON c.client_id = u.id 
          LEFT JOIN services s ON c.service_id = s.id
          LEFT JOIN payment_methods p ON c.payment_method_id = p.id
          LEFT JOIN budget_tiers b ON c.budget_tier_id = b.id
          ORDER BY c.created_at DESC`);
        return sendJson(res, 200, { success: true, data: rows });
      }

      if (req.method === 'POST' && pathName === '/api/admin/update_status') {
        const { id, status, amount } = await parseBody(req);
        await db.query('UPDATE comissions SET status = ? WHERE order_id = ?', [status, id]);
        
        if (status === 'completed') {
          await db.query('INSERT INTO `e-wallet` (order_id, amount) VALUES (?, ?)', [id, amount]);
          const [commRows] = await db.query(`
            SELECT c.client_id, s.name as service_type 
            FROM comissions c 
            LEFT JOIN services s ON c.service_id = s.id 
            WHERE c.order_id = ?`, [id]);
          if (commRows.length > 0) {
            await db.query('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [commRows[0].client_id, `Your commission request for '${commRows[0].service_type}' has been completed! ✅`]);
          }
        }
        return sendJson(res, 200, { success: true, message: `Order marked as ${status}.` });
      }

      if (req.method === 'POST' && pathName === '/api/admin/delete_commission') {
        await db.query('DELETE FROM comissions WHERE order_id = ?', [query.get('id')]);
        return sendJson(res, 200, { success: true, message: 'Request deleted.' });
      }

      if (req.method === 'POST' && pathName === '/api/admin/clear_all') {
        await db.query('DELETE FROM comissions');
        return sendJson(res, 200, { success: true, message: 'All requests cleared.' });
      }

      if (req.method === 'GET' && pathName === '/api/admin/wallet_history') {
        const [rows] = await db.query(`
          SELECT h.*, s.name AS service, IFNULL(CONCAT(u.first_name, ' ', u.last_name), 'Unknown User') AS client_name, IFNULL(u.email, 'N/A') AS client_email 
          FROM \`e-wallet\` h 
          JOIN comissions c ON h.order_id = c.order_id 
          LEFT JOIN services s ON c.service_id = s.id
          LEFT JOIN users u ON c.client_id = u.id 
          ORDER BY h.processed_at DESC`);
        return sendJson(res, 200, { success: true, data: rows });
      }

      if (req.method === 'GET' && pathName === '/api/admin/get_users') {
        const [rows] = await db.query('SELECT id, first_name, last_name, email, created_at FROM users ORDER BY id ASC');
        return sendJson(res, 200, { success: true, data: rows });
      }

      if (req.method === 'POST' && pathName === '/api/admin/delete_user') {
        await db.query('DELETE FROM users WHERE id = ?', [query.get('id')]);
        return sendJson(res, 200, { success: true, message: 'User deleted successfully.' });
      }

      if (req.method === 'POST' && pathName === '/api/admin/update_user') {
        const { id, firstName, lastName, email } = await parseBody(req);
        await db.query('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?', [firstName, lastName, email, id]);
        return sendJson(res, 200, { success: true, message: 'User updated successfully.' });
      }

      // --------------------------------------------------------
      // ANALYTICS ROUTES
      // --------------------------------------------------------
      if (req.method === 'GET' && pathName === '/api/admin/stats/summary') {
        const [rows] = await db.query(`
          SELECT (SELECT COUNT(*) FROM comissions) AS total_requests, 
                 (SELECT IFNULL(AVG(budget_amount), 0) FROM comissions WHERE status = 'completed') AS avg_order_value, 
                 (SELECT s.name FROM comissions c JOIN services s ON c.service_id = s.id GROUP BY s.name ORDER BY COUNT(*) DESC LIMIT 1) AS top_service, 
                 (SELECT COUNT(DISTINCT client_id) FROM comissions) AS active_clients`);
        return sendJson(res, 200, { success: true, data: rows[0] });
      }

      if (req.method === 'GET' && pathName === '/api/admin/stats/revenue') {
        const [rows] = await db.query(`
          SELECT s.name as service_type, SUM(c.budget_amount) AS total_revenue, COUNT(*) AS order_count, 
                 (SUM(c.budget_amount) / (SELECT NULLIF(SUM(budget_amount), 0) FROM comissions WHERE status = 'completed') * 100) AS share_percentage 
          FROM comissions c
          JOIN services s ON c.service_id = s.id
          WHERE c.status = 'completed' 
          GROUP BY s.name 
          ORDER BY total_revenue DESC`);
        return sendJson(res, 200, { success: true, data: rows });
      }

      if (req.method === 'GET' && pathName === '/api/admin/stats/pending_summary') {
        const [rows] = await db.query(`SELECT CONCAT(u.first_name, ' ', u.last_name) as name, COUNT(c.order_id) AS pending_count FROM users u LEFT JOIN comissions c ON u.id = c.client_id AND c.status = 'pending' GROUP BY u.id, u.first_name, u.last_name HAVING pending_count > 0`);
        return sendJson(res, 200, { success: true, data: rows });
      }

      // If no API route matches, return a 404
      return sendJson(res, 404, { success: false, message: 'API route not found' });

    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { success: false, message: 'Server error', error: error.message });
    }
  }

  // Not an API route? Then serve it as a static file (like index.html or css/style.css)
  serveStatic(req, res);
});

// Start listening for connections
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
