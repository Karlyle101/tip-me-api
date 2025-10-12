import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { config } from '../config';

const createTipSchema = z.object({
  toHandle: z.string().min(3),
  amountCents: z.number().int().positive().max(1000000),
  message: z.string().max(280).optional(),
  fromEmail: z.string().email().optional() // optional for anonymous tippers
});

export async function createTip(req: Request, res: Response) {
  const parsed = createTipSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { toHandle, amountCents, message, fromEmail } = parsed.data;
  const toUser = await prisma.user.findUnique({ where: { handle: toHandle } });
  if (!toUser) return res.status(404).json({ error: 'Recipient not found' });

  const feeCents = Math.floor((amountCents * config.serviceFeeBps) / 10000);
  const netCents = amountCents - feeCents;

  const tip = await prisma.tip.create({
    data: {
      toUserId: toUser.id,
      amountCents,
      feeCents,
      netCents,
      message: message || null,
      status: 'PENDING',
      fromEmail: fromEmail || null
    }
  });

  // TODO: Integrate with payment provider (Stripe, PayPal, or Azure Payments) to capture payment.
  // For now, mark as COMPLETED immediately for demo purposes.
  const completed = await prisma.tip.update({ where: { id: tip.id }, data: { status: 'COMPLETED' } });

  res.status(201).json({ tip: completed });
}

export async function getIncomingTips(req: Request, res: Response) {
  // @ts-ignore
  const user = req.user;
  const tips = await prisma.tip.findMany({ where: { toUserId: user.id }, orderBy: { createdAt: 'desc' } });
  res.json({ tips });
}

export async function getOutgoingTips(req: Request, res: Response) {
  // @ts-ignore
  const user = req.user;
  const tips = await prisma.tip.findMany({ where: { fromUserId: user.id }, orderBy: { createdAt: 'desc' } });
  res.json({ tips });
}
