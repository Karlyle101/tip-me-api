import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { config } from '../config';

export async function getQrForHandle(req: Request, res: Response) {
  const { handle } = req.params;
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const tipUrl = `${config.baseUrl}/tips?toHandle=${encodeURIComponent(handle)}`;
  const pngBuffer = await QRCode.toBuffer(tipUrl, { type: 'png', width: 512, margin: 1 });

  res.setHeader('Content-Type', 'image/png');
  res.send(pngBuffer);
}
