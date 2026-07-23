Mailtrap quick setup (development)

1) Create an account at https://mailtrap.io and log in.
2) Create an "Inbox" (default appears after signup).
3) Click on the Inbox, then choose "SMTP" credentials or "Integrations" -> "SMTP".
4) Copy the host, port, username and password.

5) On your machine, open `server/.env` and paste the values:

EMAIL_SMTP_HOST=smtp.mailtrap.io
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=<copied_user>
EMAIL_SMTP_PASS=<copied_pass>
EMAIL_FROM="no-reply@escola.com"

6) Restart the backend:

PowerShell commands:

cd c:\Users\user\Documents\projeto-f\site_escola\server
& "C:\Program Files\nodejs\npm.cmd" start

Or directly:
& "C:\Program Files\nodejs\node.exe" index.js

7) Test the endpoint (PowerShell):

Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/send-code' -Method Post -Body (@{ email='you@example.com'} | ConvertTo-Json) -ContentType 'application/json'

8) Open Mailtrap inbox to inspect received email. The app responds with a `code` in JSON when SMTP isn't configured or for dev fallback; once SMTP works, check Mailtrap instead.

Security notes:
- Do NOT commit `server/.env` to version control. Add it to `.gitignore`.
- Use Mailtrap only for development testing; use a secure provider for production.
