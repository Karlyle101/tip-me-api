import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function renderTipPortal(req: Request, res: Response) {
  const { handle } = req.params;
  const user = await prisma.user.findUnique({ where: { handle } });
  if (!user) return res.status(404).send('User not found');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tip ${user.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; max-width: 640px; }
    h1 { margin-bottom: 0.25rem; }
    form { display: grid; gap: 0.75rem; margin-top: 1rem; }
    label { display: grid; gap: 0.25rem; }
    input, textarea, button { font-size: 1rem; padding: 0.5rem; }
    .success { color: green; margin-top: 1rem; }
    .error { color: red; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Send a tip to ${user.name}</h1>
  <p>@${user.handle}</p>
  <form id="tip-form">
    <label>
      Amount (USD)
      <input required type="number" step="0.01" min="0.01" id="amount" placeholder="5.00" />
    </label>
    <label>
      Optional message
      <textarea id="message" maxlength="280" placeholder="Thanks for the great service!"></textarea>
    </label>
    <label>
      Optional email (for receipt)
      <input type="email" id="fromEmail" placeholder="you@example.com" />
    </label>
    <button type="submit">Send Tip :)</button>
  </form>
  <div id="result"></div>

  <script>
    const form = document.getElementById('tip-form');
    const result = document.getElementById('result');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      result.textContent = '';
      const amount = document.getElementById('amount').value;
      const cents = Math.round(parseFloat(amount) * 100);
      if (!isFinite(cents) || cents <= 0) {
        result.textContent = 'Please enter a valid amount.';
        result.className = 'error';
        return;
      }
      const body = {
        toHandle: ${JSON.stringify(user.handle)},
        amountCents: cents,
        message: document.getElementById('message').value || undefined,
        fromEmail: document.getElementById('fromEmail').value || undefined
      };
      try {
        const resp = await fetch('/tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await resp.json();
        if (!resp.ok) {
          result.textContent = data.error ? JSON.stringify(data.error) : 'Failed to send tip';
          result.className = 'error';
          return;
        }
        result.textContent = 'Tip sent! Thank you.';
        result.className = 'success';
        form.reset();
      } catch (err) {
        result.textContent = 'Network error.';
        result.className = 'error';
      }
    });
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}