import { Request, Response } from 'express';

export async function getMe(req: Request, res: Response) {
  const user = req.user; // populated by auth middleware
  res.json({ user });
}
