# Payslip Sender

A web application that lets you manage employees and **send payslips via email** to them. Upload a PDF payslip, pick an employee, and the app emails it to their registered address.

## Features

- **Employee management**: Add employees with name, email, and optional department. List and remove employees.
- **Send payslips**: Select an employee, attach a PDF payslip, and send it to their email. The email includes a short message and the PDF attachment.
- **Persistent storage**: Employee list is stored in a local JSON file (`data/employees.json`). No database required for small teams.

## Prerequisites

- Node.js 18+
- An SMTP account (e.g. Gmail with App Password, SendGrid, Mailgun, or your company SMTP server)

## Setup

1. **Install dependencies**

   ```bash
   cd payslip-sender
   npm install
   ```

2. **Configure email (SMTP)**

   Copy the example env file and fill in your SMTP details:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your SMTP settings. Example for **Gmail**:

   - Go to [Google Account → Security → 2-Step Verification](https://myaccount.google.com/security) and enable 2-Step Verification.
   - Create an [App Password](https://myaccount.google.com/apppasswords) for “Mail”.
   - Use that 16-character password as `SMTP_PASS`.

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   SMTP_FROM=your-email@gmail.com
   ```

   For **other providers** (SendGrid, Mailgun, etc.), use their SMTP host, port, and credentials in the same variables.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Add employees, then use “Send payslip” to email a PDF to an employee.

## Usage

1. **Add employees**: Fill in name, email, and optional department, then click “Add employee”.
2. **Send a payslip**: Click “Send payslip” next to an employee, choose a PDF file, and click “Send payslip”. The employee receives an email with the PDF attached.
3. **Remove an employee**: Click “Remove” next to their name (this only removes them from the list; it does not affect emails already sent).

## Tech stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Nodemailer** for sending email via SMTP
- **File-based storage** for employees (`data/employees.json`)

## Security notes

- Keep `.env.local` out of version control (it’s in `.gitignore`). Never commit SMTP passwords.
- For production, use HTTPS, restrict access (e.g. login), and consider a proper database and file storage (e.g. S3) for payslips.
- The app does not store payslip files; they are streamed to the email and not saved on the server.

## Vercel / Production migrations (Neon)

The Vercel build runs `prisma migrate deploy` so migrations apply on each deploy. If you see **P3005** (“The database schema is not empty”), Neon already has tables but no migration history. Baseline it **once** from your machine:

```bash
# Use the same DATABASE_URL as in Vercel (your Neon connection string)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" npm run db:baseline
```

Or: `DATABASE_URL="your-neon-url" npx prisma migrate resolve --applied "20250130120000_init"`

Then commit, push, and redeploy. The build will succeed and future deploys will run new migrations automatically.

## License

MIT
