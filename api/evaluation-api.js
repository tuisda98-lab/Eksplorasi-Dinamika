const mysql = require('mysql2/promise');
const crypto = require('crypto');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const VALID_CLASSES = ['7A', '7B', '7C', '7D', '7E', '7F'];

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function ensureDbConfig() {
  const required = ['MYSQL_HOST', 'MYSQL_DATABASE', 'MYSQL_USER', 'MYSQL_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Konfigurasi MySQL belum lengkap. Missing: ${missing.join(', ')}`);
  }
}

function getPool() {
  ensureDbConfig();

  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function createTeacherToken(username, secret) {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + (8 * 60 * 60 * 1000)
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyTeacherToken(token, secret) {
  if (!token) return null;
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expectedSignature.length) return null;

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
  } catch (error) {
    return null;
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(payload));
    if (!decoded.username || Number(decoded.expiresAt) <= Date.now()) return null;
    return decoded.username;
  } catch (error) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, { ok: true });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method tidak diizinkan. Gunakan POST.' });
    return;
  }

  let body = {};
  if (typeof req.body === 'string') {
    try {
      body = JSON.parse(req.body);
    } catch (error) {
      sendJson(res, 400, { error: 'Body request tidak valid JSON.' });
      return;
    }
  } else if (req.body && typeof req.body === 'object') {
    body = req.body;
  }

  const authSecret = process.env.MYSQL_AUTH_SECRET || process.env.EDGE_AUTH_SECRET;
  if (!authSecret) {
    sendJson(res, 500, { error: 'MYSQL_AUTH_SECRET belum dikonfigurasi.' });
    return;
  }

  try {
    const pool = getPool();
    const action = String(body.action || '').trim();

    if (action === 'login') {
      const username = String(body.username || '').trim();
      const passwordHash = String(body.passwordHash || '').trim();

      if (!username || !passwordHash) {
        sendJson(res, 400, { error: 'Username dan passwordHash wajib diisi.' });
        return;
      }

      const [rows] = await pool.execute(
        'SELECT username FROM teacher_accounts WHERE username = ? AND password_hash = ? LIMIT 1',
        [username, passwordHash]
      );

      if (!rows.length) {
        sendJson(res, 401, { error: 'Username atau password salah.' });
        return;
      }

      sendJson(res, 200, { token: createTeacherToken(username, authSecret) });
      return;
    }

    if (action === 'submit') {
      const name = String(body.name || '').trim();
      const studentClass = String(body.studentClass || '').trim();
      const score = Number(body.score);

      if (!name || name.length > 120) {
        sendJson(res, 400, { error: 'Nama siswa wajib diisi dan maksimal 120 karakter.' });
        return;
      }

      if (!VALID_CLASSES.includes(studentClass)) {
        sendJson(res, 400, { error: 'Kelas siswa tidak valid.' });
        return;
      }

      if (!Number.isInteger(score) || score < 0 || score > 100) {
        sendJson(res, 400, { error: 'Nilai harus bilangan bulat 0-100.' });
        return;
      }

      await pool.execute(
        'INSERT INTO evaluation_results (name, student_class, score, completed_at) VALUES (?, ?, ?, NOW())',
        [name, studentClass, score]
      );

      sendJson(res, 200, { saved: true });
      return;
    }

    const token = req.headers.authorization || '';
    const teacherName = verifyTeacherToken(token.replace(/^Bearer\s+/i, ''), authSecret);
    if (!teacherName) {
      sendJson(res, 401, { error: 'Akses guru diperlukan.' });
      return;
    }

    if (action === 'list') {
      const [rows] = await pool.execute(
        'SELECT id, name, student_class AS studentClass, score, completed_at AS completedAt FROM evaluation_results ORDER BY completed_at DESC'
      );
      sendJson(res, 200, rows);
      return;
    }

    if (action === 'delete') {
      await pool.execute('DELETE FROM evaluation_results');
      sendJson(res, 200, { deleted: true });
      return;
    }

    sendJson(res, 400, { error: 'Operasi tidak dikenal.' });
  } catch (error) {
    console.error('[evaluation-api]', error);
    sendJson(res, 500, {
      error: 'Terjadi kesalahan pada server MySQL.',
      details: error.message || 'Unknown error'
    });
  }
};
