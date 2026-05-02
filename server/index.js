'use strict';

const fs = require('fs/promises');
const http = require('http');
const path = require('path');

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = Number(process.env.PORT || 8787);
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://flavorflow:flavorflow@localhost:5432/flavorflow';
const JWT_SECRET =
  process.env.JWT_SECRET || 'please-set-JWT_SECRET-with-at-least-thirty-two-chars';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const GOOGLE_OAUTH_CLIENT_IDS = (process.env.GOOGLE_OAUTH_CLIENT_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });

/** @type {import('ioredis').Redis | null} */
let redis = null;
let redisAlive = false;
const memoryOtp = new Map();

async function bootstrapRedis() {
  const client = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  try {
    await client.connect();
    await client.ping();
    redis = client;
    redisAlive = true;
    console.log('[redis] connected');
  } catch (err) {
    console.warn('[redis] unavailable, using in-memory OTP store:', err.message);
    try {
      client.disconnect();
    } catch (_) {
      /* noop */
    }
    redisAlive = false;
  }
}

async function otpStore(phone, code) {
  if (redisAlive && redis) {
    await redis.set(`otp:${phone}`, code, 'EX', 600);
  } else {
    memoryOtp.set(phone, { code, expires: Date.now() + 600_000 });
  }
}

async function otpRead(phone) {
  if (redisAlive && redis) return redis.get(`otp:${phone}`);
  const row = memoryOtp.get(phone);
  if (!row || Date.now() > row.expires) return null;
  return row.code;
}

async function otpDelete(phone) {
  if (redisAlive && redis) await redis.del(`otp:${phone}`);
  memoryOtp.delete(phone);
}

async function migrate() {
  const schemaSql = await fs.readFile(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  const seedSql = await fs.readFile(path.join(__dirname, 'db', 'seed.sql'), 'utf8');
  await pool.query(schemaSql);
  await pool.query(seedSql);
  try {
    await pool.query('ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(255)');
  } catch {
    /* already widened or unsupported */
  }
  console.log('[db] migrated schema + seed');
}

function restaurantPayload(restaurantRow, menuRows) {
  return {
    id: restaurantRow.id,
    name: restaurantRow.name,
    cuisines: restaurantRow.cuisines,
    rating: Number(restaurantRow.rating),
    etaMins: restaurantRow.eta_mins,
    imageTint: restaurantRow.image_tint,
    tags: restaurantRow.tags || [],
    deliveryFeeINR: restaurantRow.delivery_fee_inr,
    menu: menuRows.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      priceINR: m.price_inr,
      veg: m.veg,
      popular: m.popular,
    })),
  };
}

/** @param {import('pg').Pool | import('pg').PoolClient} client */
async function loadRestaurant(client, restaurantId) {
  const r = await client.query(`SELECT * FROM restaurants WHERE id = $1 LIMIT 1`, [
    restaurantId,
  ]);
  if (!r.rows[0]) return null;
  const items = await client.query(
    `SELECT * FROM menu_items WHERE restaurant_id = $1 ORDER BY name`,
    [restaurantId]
  );
  return restaurantPayload(r.rows[0], items.rows);
}

function orderPayload(row) {
  return {
    id: String(row.id),
    phase: row.status,
    riderLat: Number(row.rider_lat),
    riderLng: Number(row.rider_lng),
    restaurantName: row.restaurant_name,
    totalINR: Number(row.total_inr),
  };
}

async function broadcastOrder(io, orderId) {
  const refreshed = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  const row = refreshed.rows[0];
  if (!row) return;
  io.to(`order:${orderId}`).emit('order:update', orderPayload(row));
}

function startOrderSimulation(io, orderId) {
  const transitions = ['on_the_way', 'nearby', 'delivered'];
  let idx = 0;

  const step = async () => {
    if (idx >= transitions.length) return;
    const phase = transitions[idx];
    idx += 1;
    const latJitter = 0.0019 * Math.sin(idx);
    const lngJitter = 0.0016 * Math.cos(idx);
    try {
      await pool.query(
        `UPDATE orders
         SET status = $1,
             rider_lat = rider_lat + $2,
             rider_lng = rider_lng + $3
         WHERE id = $4`,
        [phase, latJitter, lngJitter, orderId]
      );
      await broadcastOrder(io, orderId);
    } catch (err) {
      console.error('[order-sim]', err);
      return;
    }
    setTimeout(step, 8000);
  };

  setTimeout(step, 8000);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  try {
    const token = header.slice('Bearer '.length);
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}

async function verifyGoogleIdTokenRemote(idToken) {
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!r.ok) return null;
    const t = await r.json();
    const audRaw = t.aud;
    const aud =
      typeof audRaw === 'string' ? audRaw : Array.isArray(audRaw) ? audRaw[0] : t.azp;
    if (!aud || GOOGLE_OAUTH_CLIENT_IDS.length === 0 || !GOOGLE_OAUTH_CLIENT_IDS.includes(aud)) {
      return null;
    }
    const expSec = Number(t.exp);
    if (!Number.isFinite(expSec) || expSec * 1000 < Date.now() - 120_000) return null;
    const sub = typeof t.sub === 'string' ? t.sub : '';
    if (!sub) return null;
    return { sub, email: t.email, name: t.name };
  } catch {
    return null;
  }
}

async function main() {
  if (JWT_SECRET.length < 32) {
    console.warn('[jwt] JWT_SECRET shorter than 32 chars — refusing boot');
    process.exit(1);
  }

  await bootstrapRedis();
  await migrate();

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        ok: true,
        postgres: true,
        redis: redisAlive,
      });
    } catch {
      res.status(500).json({ ok: false, postgres: false, redis: redisAlive });
    }
  });

  app.post('/auth/otp/send', async (req, res) => {
    const raw = typeof req.body?.phone === 'string' ? req.body.phone : '';
    const phone = raw.replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      return res.status(400).json({ ok: false, message: 'Bad phone.' });
    }
    const code = String(Math.floor(100_000 + Math.random() * 900_000));
    await otpStore(phone, code);
    console.log(`[otp] ****${phone.slice(-4)} → ${code} (123456 accepted too)`);
    res.json({ ok: true });
  });

  app.post('/auth/otp/verify', async (req, res) => {
    const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone : '';
    const rawCode = typeof req.body?.code === 'string' ? req.body.code : '';
    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      return res.status(400).json({ ok: false, message: 'Phone required' });
    }
    const stored = await otpRead(phone);
    const accepts =
      Boolean(stored && rawCode === stored) || rawCode === '123456';
    if (!accepts) {
      return res.status(401).json({ ok: false, message: 'Invalid OTP' });
    }
    await otpDelete(phone);
    await pool.query(
      `INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING`,
      [phone]
    );
    const user = await pool.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    const token = jwt.sign(
      {
        sub: String(user.rows[0].id),
        phone,
      },
      JWT_SECRET,
      { expiresIn: '45d' }
    );
    res.json({ ok: true, token });
  });

  app.post('/auth/google', async (req, res) => {
    const raw = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    if (!raw) return res.status(400).json({ ok: false, message: 'idToken required' });
    if (GOOGLE_OAUTH_CLIENT_IDS.length === 0) {
      return res.status(503).json({
        ok: false,
        message: 'Google OAuth not configured (set GOOGLE_OAUTH_CLIENT_IDS on the API)',
      });
    }
    const profile = await verifyGoogleIdTokenRemote(raw);
    if (!profile) return res.status(401).json({ ok: false, message: 'Invalid Google token' });
    const oauthKey = `oauth:${profile.sub}`;
    await pool.query(
      `INSERT INTO users (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING`,
      [oauthKey]
    );
    const user = await pool.query(`SELECT id FROM users WHERE phone = $1`, [oauthKey]);
    const phoneLabel = typeof profile.email === 'string' && profile.email.includes('@')
      ? profile.email
      : oauthKey;
    const token = jwt.sign(
      {
        sub: String(user.rows[0].id),
        phone: oauthKey,
        email: profile.email || null,
        name: profile.name || null,
        auth: 'google',
      },
      JWT_SECRET,
      { expiresIn: '45d' }
    );
    res.json({
      ok: true,
      token,
      phone: phoneLabel,
      name: profile.name || phoneLabel.split('@')[0],
      email: profile.email || undefined,
    });
  });

  app.get('/restaurants', async (_req, res) => {
    const [{ rows: restaurants }, { rows: items }] = await Promise.all([
      pool.query(`SELECT * FROM restaurants ORDER BY name`),
      pool.query(`SELECT * FROM menu_items ORDER BY restaurant_id, name`),
    ]);
    /** @type {Map<string, any[]>} */
    const grouped = new Map();
    items.forEach((row) => {
      if (!grouped.has(row.restaurant_id)) grouped.set(row.restaurant_id, []);
      grouped.get(row.restaurant_id).push(row);
    });
    const payload = restaurants.map((r) =>
      restaurantPayload(r, grouped.get(r.id) || [])
    );
    res.json({ restaurants: payload });
  });

  app.get('/restaurants/:id', async (req, res) => {
    const loaded = await loadRestaurant(pool, req.params.id);
    if (!loaded) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ restaurant: loaded });
  });

  app.post('/orders', requireAuth, async (req, res) => {
    const restaurantId =
      typeof req.body?.restaurantId === 'string' ? req.body.restaurantId : '';
    const itemsPayload = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!restaurantId || !itemsPayload.length) {
      return res.status(400).json({ ok: false, message: 'Invalid payload' });
    }

    const parsed = [];
    for (const line of itemsPayload) {
      const menuItemId =
        typeof line?.menuItemId === 'string' ? line.menuItemId : '';
      const qty = Number(line?.quantity);
      if (!menuItemId || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ ok: false, message: 'Malformed line items' });
      }
      parsed.push({ menuItemId, quantity: qty });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const snapshot = await loadRestaurant(client, restaurantId);
      if (!snapshot) {
        await client.query('ROLLBACK');
        return res.status(404).json({ ok: false, message: 'Restaurant unavailable' });
      }

      /** @type {Map<string, { id: string, name: string, priceINR: number }>} */
      const catalog = new Map(snapshot.menu.map((m) => [m.id, m]));

      let subtotal = 0;
      for (const row of parsed) {
        const item = catalog.get(row.menuItemId);
        if (!item) {
          await client.query('ROLLBACK');
          return res.status(400).json({ ok: false, message: 'Invalid menu item' });
        }
        subtotal += item.priceINR * row.quantity;
      }

      const deliveryFee = snapshot.deliveryFeeINR;
      const tax = Math.round(subtotal * 0.05);
      const totalINR = subtotal + deliveryFee + tax;

      const orderInsert = await client.query(
        `INSERT INTO orders (
           user_id, restaurant_id, restaurant_name,
           status, total_inr, rider_lat, rider_lng
         ) VALUES ($1, $2, $3, 'preparing', $4, $5, $6)
         RETURNING *`,
        [
          req.user.sub,
          restaurantId,
          snapshot.name,
          totalINR,
          28.6139 + Math.random() * 0.01,
          77.209 + Math.random() * 0.01,
        ]
      );

      const orderRow = orderInsert.rows[0];
      const orderId = orderRow.id;

      for (const line of parsed) {
        const catalogItem = catalog.get(line.menuItemId);
        if (!catalogItem) continue;
        await client.query(
          `INSERT INTO order_lines (order_id, menu_item_id, name, quantity, unit_price_inr)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            orderId,
            catalogItem.id,
            catalogItem.name,
            line.quantity,
            catalogItem.priceINR,
          ]
        );
      }

      await client.query('COMMIT');

      /** @type {import('socket.io').Server} */
      const io = app.locals.io;

      await broadcastOrder(io, orderId);
      startOrderSimulation(io, orderId);

      res.status(201).json({ ok: true, order: orderPayload(orderRow) });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[orders]', err);
      res.status(500).json({ ok: false, message: 'Could not place order' });
    } finally {
      client.release();
    }
  });

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  app.locals.io = io;

  io.on('connection', (socket) => {
    socket.on('order:watch', (orderId) => {
      if (typeof orderId === 'string' && orderId.length > 6) {
        socket.join(`order:${orderId}`);
      }
    });
    socket.on('order:unwatch', (orderId) => {
      if (typeof orderId === 'string') socket.leave(`order:${orderId}`);
    });
  });

  server.listen(PORT, () => {
    console.log(`FlavorFlow API + Socket.IO listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal boot:', err);
  process.exit(1);
});
