import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, handle: true, createdAt: true }
  });
  res.json({ users });
}

export async function listTips(req: Request, res: Response) {
  const { status } = req.query as { status?: string };
  const where: any = {};
  if (status) where.status = status as any;
  const tips = await prisma.tip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      toUser: { select: { id: true, email: true, name: true, handle: true } },
      fromUser: { select: { id: true, email: true, name: true, handle: true } }
    }
  });
  res.json({ tips });
}

const updateTipSchema = z.object({ status: z.enum(['PENDING', 'COMPLETED', 'FAILED']) });

export async function updateTipStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updateTipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const tip = await prisma.tip.update({ where: { id }, data: { status: parsed.data.status } });
  res.json({ tip });
}

export async function listPayouts(_req: Request, res: Response) {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true, name: true, handle: true } } }
  });
  res.json({ payouts });
}

const updatePayoutSchema = z.object({ status: z.enum(['REQUESTED', 'PROCESSING', 'PAID', 'FAILED']) });

export async function updatePayoutStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parsed = updatePayoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payout = await prisma.payout.update({ where: { id }, data: { status: parsed.data.status } });
  res.json({ payout });
}