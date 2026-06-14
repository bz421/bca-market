import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = process.env.EMAIL_FROM!

export function chunk<T>(arr: T[], size = 100): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, (i + 1) * size)
    )
}

export function emailHtml(title: string, body: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;padding:40px 24px;color:#18181b;background:#fff;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#a1a1aa;">BCA Market</p>
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#09090b;">${title}</h1>
  <div style="font-size:15px;line-height:1.65;color:#3f3f46;">${body}</div>
  <hr style="margin:36px 0;border:none;border-top:1px solid #e4e4e7;">
  <p style="margin:0;font-size:12px;color:#a1a1aa;">You received this because you have an account on BCA Market. This is an automated message.</p>
</body>
</html>`
}