import request from 'supertest';
import { buildApp } from './app';

async function run() {
  const app = buildApp();

  // 1) Health
  await request(app).get('/health').expect(200);

  // 2) Portal page for demo barista
  const portalRes = await request(app).get('/portal/demo-barista').expect(200);
  if (!portalRes.text.includes('Send a tip')) throw new Error('Portal HTML unexpected');

  // 3) Anonymous tip to demo-barista
  const tipRes = await request(app)
    .post('/tips')
    .send({ toHandle: 'demo-barista', amountCents: 1234, message: 'Thanks!', fromEmail: 'anon@example.com' })
    .set('Content-Type', 'application/json')
    .expect(201);
  const tipId = tipRes.body?.tip?.id;
  if (!tipId) throw new Error('Missing tip id');

  // 4) Admin login
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpassword123' })
    .set('Content-Type', 'application/json')
    .expect(200);
  const adminToken = adminLogin.body?.token as string;
  if (!adminToken) throw new Error('Missing admin token');

  // 5) Admin list tips
  const adminTips = await request(app)
    .get('/admin/tips')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  if (!Array.isArray(adminTips.body?.tips)) throw new Error('Admin tips not array');

  // 6) Barista login
  const baristaLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'barista@example.com', password: 'password123' })
    .set('Content-Type', 'application/json')
    .expect(200);
  const baristaToken = baristaLogin.body?.token as string;
  if (!baristaToken) throw new Error('Missing barista token');

  // 7) Request payout
  const payoutRes = await request(app)
    .post('/payouts/request')
    .send({ amountCents: 500 })
    .set('Authorization', `Bearer ${baristaToken}`)
    .set('Content-Type', 'application/json')
    .expect(201);
  const payoutId = payoutRes.body?.payout?.id as string;
  if (!payoutId) throw new Error('Missing payout id');

  // 8) Barista list payouts
  const myPayouts = await request(app)
    .get('/payouts')
    .set('Authorization', `Bearer ${baristaToken}`)
    .expect(200);
  if (!Array.isArray(myPayouts.body?.payouts)) throw new Error('My payouts not array');

  // 9) Admin update payout status -> PROCESSING -> PAID
  await request(app)
    .patch(`/admin/payouts/${payoutId}/status`)
    .send({ status: 'PROCESSING' })
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Content-Type', 'application/json')
    .expect(200);

  await request(app)
    .patch(`/admin/payouts/${payoutId}/status`)
    .send({ status: 'PAID' })
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Content-Type', 'application/json')
    .expect(200);

  console.log('SMOKE_OK');
}

run().catch((err) => {
  console.error('SMOKE_FAILED', err);
  process.exit(1);
});