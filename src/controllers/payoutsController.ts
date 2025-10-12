import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const requestSchema = z.object({ amountCents: z.number().int().positive().max(10_000_000) });

export async function requestPayout(req: Request, res: Response) {
  const user = req.user!;

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const payout = await prisma.payout.create({
    data: {
      userId: user.id,
      amountCents: parsed.data.amountCents,
      // status defaults to REQUESTED via schema
    }
  });

  res.status(201).json({ payout });
}

export async function listMyPayouts(req: Request, res: Response) {
  const user = req.user!;

  const payouts = await prisma.payout.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  res.json({ payouts });
}