import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['BARISTA', 'CUSTOMER', 'ADMIN']).default('CUSTOMER'),
  handle: z.string().min(3).max(32).regex(/^[a-z0-9\-_]+$/i)
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password, name, role, handle } = parsed.data;
  const existsEmail = await prisma.user.findUnique({ where: { email } });
  if (existsEmail) return res.status(409).json({ error: 'Email already in use' });
  const existsHandle = await prisma.user.findUnique({ where: { handle } });
  if (existsHandle) return res.status(409).json({ error: 'Handle already taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name, role, handle } });

  const token = jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle } });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle } });
}

export async function me(req: Request, res: Response) {
  // populated by auth middleware
  const user = req.user;
  res.json({ user });
}
