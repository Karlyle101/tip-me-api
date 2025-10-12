import request from 'supertest';
import { buildApp } from '../app';
import { prisma } from '../lib/prisma';

const app = buildApp();

// Test users for different scenarios
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  handle: 'testuser',
  name: 'Test User',
  role: 'BARISTA'
};

const adminUser = {
  email: 'admin@example.com',
  password: 'adminpassword123',
  handle: 'admin',
  name: 'Admin User',
  role: 'CUSTOMER'
};

let userToken: string;
let adminToken: string;
let userId: string;
let adminUserId: string;

describe('Tip Me API Endpoints', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.payout.deleteMany({ where: { user: { email: { contains: 'example.com' } } } });
    await prisma.tip.deleteMany({ where: { OR: [
      { fromEmail: { contains: 'example.com' } },
      { toUser: { email: { contains: 'example.com' } } }
    ] } });
    await prisma.user.deleteMany({ where: { email: { contains: 'example.com' } } });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.payout.deleteMany({ where: { user: { email: { contains: 'example.com' } } } });
    await prisma.tip.deleteMany({ where: { OR: [
      { fromEmail: { contains: 'example.com' } },
      { toUser: { email: { contains: 'example.com' } } }
    ] } });
    await prisma.user.deleteMany({ where: { email: { contains: 'example.com' } } });
    await prisma.$disconnect();
  });

  describe('Health Check', () => {
    it('GET /health - should return ok status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('Authentication Routes', () => {
    it('POST /auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.handle).toBe(testUser.handle);
      
      userToken = response.body.token;
      userId = response.body.user.id;
    });

    it('POST /auth/register - should register admin user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      adminToken = response.body.token;
      adminUserId = response.body.user.id;
      
      // Update user role to admin (this would normally be done via admin interface)
      await prisma.user.update({
        where: { id: adminUserId },
        data: { role: 'ADMIN' }
      });
    });

    it('POST /auth/register - should reject duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /auth/register - should reject invalid data', async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email' })
        .expect(400);
    });

    it('POST /auth/login - should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('POST /auth/login - should reject invalid credentials', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('GET /auth/me - should return user info when authenticated', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.handle).toBe(testUser.handle);
    });

    it('GET /auth/me - should reject unauthenticated requests', async () => {
      await request(app)
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Users Routes', () => {
    it('GET /users/me - should return user info when authenticated', async () => {
      const response = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.handle).toBe(testUser.handle);
    });

    it('GET /users/me - should reject unauthenticated requests', async () => {
      await request(app)
        .get('/users/me')
        .expect(401);
    });
  });

  describe('Tips Routes', () => {
    let tipId: string;

    it('POST /tips - should create a tip (public endpoint)', async () => {
      const response = await request(app)
        .post('/tips')
        .send({
          toHandle: testUser.handle,
          amountCents: 1000, // $10.00 in cents
          fromEmail: 'customer@example.com',
          message: 'Great service!'
        })
        .expect(201);

      expect(response.body).toHaveProperty('tip');
      expect(response.body.tip.amountCents).toBe(1000);
      expect(response.body.tip.message).toBe('Great service!');
      tipId = response.body.tip.id;
    });

    it('POST /tips - should reject invalid tip data', async () => {
      await request(app)
        .post('/tips')
        .send({
          toHandle: testUser.handle,
          amountCents: -100 // negative amount
        })
        .expect(400);
    });

    it('GET /tips/incoming - should return incoming tips for authenticated user', async () => {
      const response = await request(app)
        .get('/tips/incoming')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(Array.isArray(response.body.tips)).toBe(true);
      expect(response.body.tips.length).toBeGreaterThan(0);
      expect(response.body.tips[0]).toHaveProperty('amountCents');
      expect(response.body.tips[0]).toHaveProperty('message');
    });

    it('GET /tips/outgoing - should return empty array for user with no outgoing tips', async () => {
      const response = await request(app)
        .get('/tips/outgoing')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(Array.isArray(response.body.tips)).toBe(true);
    });

    it('GET /tips/* - should reject unauthenticated requests', async () => {
      await request(app)
        .get('/tips/incoming')
        .expect(401);

      await request(app)
        .get('/tips/outgoing')
        .expect(401);
    });
  });

  describe('QR Routes', () => {
    it('GET /qr/:handle - should return QR code for valid handle', async () => {
      const response = await request(app)
        .get(`/qr/${testUser.handle}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image/);
    }, 15000);

    it('GET /qr/:handle - should handle invalid handle', async () => {
      await request(app)
        .get('/qr/nonexistenthandle')
        .expect(404);
    });
  });

  describe('Portal Routes', () => {
    it('GET /portal/:handle - should return tip portal for valid handle', async () => {
      const response = await request(app)
        .get(`/portal/${testUser.handle}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain(testUser.name);
    });

    it('GET /portal/:handle - should handle invalid handle', async () => {
      await request(app)
        .get('/portal/nonexistenthandle')
        .expect(404);
    });
  });

  describe('Payouts Routes', () => {
    it('POST /payouts/request - should create payout request when authenticated', async () => {
      const response = await request(app)
        .post('/payouts/request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amountCents: 500 // $5.00 in cents
        })
        .expect(201);

      expect(response.body).toHaveProperty('payout');
      expect(response.body.payout.amountCents).toBe(500);
      expect(response.body.payout.status).toBe('REQUESTED');
    });

    it('POST /payouts/request - should reject unauthenticated requests', async () => {
      await request(app)
        .post('/payouts/request')
        .send({ amountCents: 500 })
        .expect(401);
    });

    it('GET /payouts - should return user payouts when authenticated', async () => {
      const response = await request(app)
        .get('/payouts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payouts');
      expect(Array.isArray(response.body.payouts)).toBe(true);
      expect(response.body.payouts.length).toBeGreaterThan(0);
    });

    it('GET /payouts - should reject unauthenticated requests', async () => {
      await request(app)
        .get('/payouts')
        .expect(401);
    });
  });

  describe('Admin Routes', () => {
    it('GET /admin/users - should return users list for admin', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /admin/tips - should return tips list for admin', async () => {
      const response = await request(app)
        .get('/admin/tips')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(Array.isArray(response.body.tips)).toBe(true);
    });

    it('GET /admin/payouts - should return payouts list for admin', async () => {
      const response = await request(app)
        .get('/admin/payouts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payouts');
      expect(Array.isArray(response.body.payouts)).toBe(true);
    });

    it('PATCH /admin/tips/:id/status - should update tip status for admin', async () => {
      // First get a tip ID
      const tipsResponse = await request(app)
        .get('/admin/tips')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (tipsResponse.body.tips.length > 0) {
        const tipId = tipsResponse.body.tips[0].id;
        const response = await request(app)
          .patch(`/admin/tips/${tipId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'COMPLETED' })
          .expect(200);

        expect(response.body.tip.status).toBe('COMPLETED');
      }
    });

    it('PATCH /admin/payouts/:id/status - should update payout status for admin', async () => {
      // First get a payout ID
      const payoutsResponse = await request(app)
        .get('/admin/payouts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (payoutsResponse.body.payouts.length > 0) {
        const payoutId = payoutsResponse.body.payouts[0].id;
        const response = await request(app)
          .patch(`/admin/payouts/${payoutId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'PAID' })
          .expect(200);

        expect(response.body.payout.status).toBe('PAID');
      }
    });

    it('GET /admin/* - should reject non-admin requests', async () => {
      await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('GET /admin/* - should reject unauthenticated requests', async () => {
      await request(app)
        .get('/admin/users')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/auth/register')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });
});