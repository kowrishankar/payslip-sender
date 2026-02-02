import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15000,
    socketTimeout: 30000,
  });
}

export async function sendAddedAsEmployeeEmail({
  to,
  employeeName,
  businessName,
  loginLink,
}: {
  to: string;
  employeeName: string;
  businessName: string;
  loginLink: string;
}) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `You've been added to ${businessName}`,
    text: `Hi ${employeeName},\n\nYou've been added as an employee to ${businessName}. Log in with your existing account to view your payslips:\n\n${loginLink}\n\nBest regards,\n${businessName}`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>You've been added as an employee to <strong>${businessName}</strong>. <a href="${loginLink}">Log in</a> with your existing account to view your payslips.</p>
      <p>Best regards,<br/>${businessName}</p>
    `,
  });
}

export async function sendInviteEmail({
  to,
  employeeName,
  inviteLink,
}: {
  to: string;
  employeeName: string;
  inviteLink: string;
}) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "You're invited to the Payslip Portal",
    text: `Hi ${employeeName},\n\nYou've been added to the payslip portal. Click the link below to set your password and log in:\n\n${inviteLink}\n\nThis link expires in 7 days.\n\nBest regards,\nYour employer`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>You've been added to the payslip portal. Click the button below to set your password and log in:</p>
      <p><a href="${inviteLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;margin:12px 0;">Set password &amp; log in</a></p>
      <p>Or copy this link: <a href="${inviteLink}">${inviteLink}</a></p>
      <p style="color:#64748b;font-size:14px;">This link expires in 7 days.</p>
      <p>Best regards,<br/>Your employer</p>
    `,
  });
}

export async function sendPayslipAvailableEmail({
  to,
  employeeName,
  portalLink,
  message,
}: {
  to: string;
  employeeName: string;
  portalLink: string;
  message?: string;
}) {
  const customBlock = message?.trim()
    ? `\n\n${message.trim()}\n\n`
    : "\n\n";
  const customBlockHtml = message?.trim()
    ? `<p style="margin:16px 0;padding:12px;background:#f1f5f9;border-radius:6px;color:#0f172a;">${message.trim().replace(/\n/g, "<br/>")}</p>`
    : "";
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "New payslip available",
    text: `Hi ${employeeName},\n\nA new payslip has been added to your portal. Log in to view and download it:\n\n${portalLink}${customBlock}Best regards,\nYour employer`,
    html: `
      <p>Hi ${employeeName},</p>
      <p>A new payslip has been added to your portal. <a href="${portalLink}">Log in</a> to view and download it.</p>
      ${customBlockHtml}
      <p>Best regards,<br/>Your employer</p>
    `,
  });
}

export async function sendPayslipEmail({
  to,
  employeeName,
  pdfBuffer,
  fileName,
}: {
  to: string;
  employeeName: string;
  pdfBuffer: Buffer;
  fileName: string;
}) {
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Your payslip – ${fileName.replace(/\.[^.]+$/, "")}`,
    text: `Dear ${employeeName},\n\nPlease find your payslip attached.\n\nBest regards,\nHR`,
    html: `
      <p>Dear ${employeeName},</p>
      <p>Please find your payslip attached to this email.</p>
      <p>Best regards,<br/>HR</p>
    `,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

export async function sendCustomEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: subject.trim() || "Message from your employer",
    text: body.trim() || "(No content)",
    html: `<p>${(body.trim() || "(No content)").replace(/\n/g, "<br/>")}</p>`,
  });
}
