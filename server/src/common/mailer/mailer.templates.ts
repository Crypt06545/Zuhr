// mailer.templates.ts
// ইমেইলের চেহারা এক জায়গায়। রঙ বদলাতে নিচের COLORS বদলান।

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// আপনার সাইটের আসল রঙ আমি জানি না, তাই নিরপেক্ষ রঙ ধরেছি। ইচ্ছেমতো বদলে নিন।
const COLORS = {
  page: '#f4f1ec',
  card: '#ffffff',
  text: '#1f1d1a',
  muted: '#6b665e',
  line: '#e6dfd3',
  accent: '#b08d57',
  button: '#1f1d1a',
  buttonText: '#ffffff',
  codeBg: '#f7f4ee',
  noticeBg: '#faf7f2',
} as const;

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, monospace";

const H1 = `margin:0 0 16px 0;font-family:${SERIF};font-size:26px;line-height:34px;font-weight:normal;color:${COLORS.text}`;
const P = `margin:0 0 16px 0;font-size:15px;line-height:24px;color:${COLORS.text}`;
const SMALL = `margin:0;font-size:13px;line-height:20px;color:${COLORS.muted}`;

// env পড়া হয় দরকারের সময়, তাই .env যখনই লোড হোক কাজ করে.
// তিনটাই ঐচ্ছিক; না দিলে ডিফল্ট চলে.
const brandName = () => process.env.MAIL_BRAND_NAME?.trim() || 'ZUHR';
const siteUrl = () =>
  (process.env.MAIL_SITE_URL?.trim() || 'https://zuhrbd.com').replace(
    /\/+$/,
    '',
  );
const supportEmail = () => process.env.MAIL_SUPPORT_EMAIL?.trim() || '';
const otpMinutes = () => Number(process.env.OTP_EXPIRES_MINUTES) || 5;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (params: {
  title: string;
  preheader: string;
  content: string;
}): string => {
  const brand = escapeHtml(brandName());
  const site = escapeHtml(siteUrl());
  const support = supportEmail();
  const year = new Date().getFullYear();

  // ইনবক্সের তালিকায় সাবজেক্টের পাশে যে ছোট লেখা দেখায়
  const hidden = '&zwnj;&nbsp;'.repeat(60);

  const supportLine = support
    ? `<p style="margin:0 0 8px 0;">Need help? Write to <a href="mailto:${escapeHtml(support)}" style="color:${COLORS.muted};text-decoration:underline;">${escapeHtml(support)}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(params.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.page};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(params.preheader)}${hidden}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 24px 0;">
              <span style="font-family:${SERIF};font-size:26px;font-weight:bold;letter-spacing:8px;padding-left:8px;color:${COLORS.text};">${brand}</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${COLORS.card};border:1px solid ${COLORS.line};border-top:3px solid ${COLORS.accent};border-radius:8px;padding:40px 36px;font-family:${FONT};color:${COLORS.text};">
              ${params.content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLORS.muted};">
              ${supportLine}
              <p style="margin:0 0 8px 0;">You received this email because a request was made with your address on <a href="${site}" style="color:${COLORS.muted};text-decoration:underline;">${brand}</a>.</p>
              <p style="margin:0;">&copy; ${year} ${brand}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ───────────────────────── Password reset OTP ─────────────────────────

export const otpEmail = (otp: string): EmailContent => {
  const brand = brandName();
  const minutes = otpMinutes();

  const content = `
    <h1 style="${H1}">Reset your password</h1>
    <p style="${P}">We received a request to reset the password for your ${escapeHtml(brand)} account. Enter this code to continue:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr>
        <td align="center" style="background-color:${COLORS.codeBg};border:1px solid ${COLORS.line};border-radius:8px;padding:22px 12px;">
          <span style="font-family:${MONO};font-size:34px;line-height:40px;font-weight:bold;letter-spacing:10px;padding-left:10px;color:${COLORS.text};">${escapeHtml(otp)}</span>
        </td>
      </tr>
    </table>

    <p style="${P}">This code expires in <strong>${minutes} minutes</strong>.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
      <tr>
        <td style="background-color:${COLORS.noticeBg};border-left:3px solid ${COLORS.accent};padding:12px 16px;font-size:13px;line-height:20px;color:${COLORS.muted};">
          <strong style="color:${COLORS.text};">Keep this code private.</strong> ${escapeHtml(brand)} will never ask you for it by phone, chat or email.
        </td>
      </tr>
    </table>

    <p style="${SMALL}">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
  `;

  const text = [
    'Reset your password',
    '',
    `We received a request to reset the password for your ${brand} account.`,
    '',
    `Your code: ${otp}`,
    `It expires in ${minutes} minutes.`,
    '',
    `Keep this code private. ${brand} will never ask you for it.`,
    "If you didn't request this, ignore this email. Your password will not change.",
  ].join('\n');

  return {
    subject: `Your ${brand} password reset code`,
    html: layout({
      title: 'Reset your password',
      preheader: `Your code is ${otp}. It expires in ${minutes} minutes.`,
      content,
    }),
    text,
  };
};

// ───────────────────────── Email verification ─────────────────────────

export const verificationEmail = (verificationLink: string): EmailContent => {
  const brand = brandName();
  const link = escapeHtml(verificationLink);

  const content = `
    <h1 style="${H1}">Verify your email address</h1>
    <p style="${P}">Welcome to ${escapeHtml(brand)}. Please confirm your email address to activate your account.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
      <tr>
        <td align="center" bgcolor="${COLORS.button}" style="background-color:${COLORS.button};border-radius:6px;">
          <a href="${link}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:15px;font-weight:bold;color:${COLORS.buttonText};text-decoration:none;border-radius:6px;">Verify email address</a>
        </td>
      </tr>
    </table>

    <p style="${P}">This link expires in <strong>24 hours</strong>.</p>

    <p style="${SMALL};padding-top:16px;border-top:1px solid ${COLORS.line};">Button not working? Copy and paste this link into your browser:</p>
    <p style="margin:8px 0 20px 0;font-size:12px;line-height:18px;word-break:break-all;"><a href="${link}" target="_blank" style="color:${COLORS.muted};text-decoration:underline;">${link}</a></p>

    <p style="${SMALL}">If you didn't create an account, you can safely ignore this email.</p>
  `;

  const text = [
    'Verify your email address',
    '',
    `Welcome to ${brand}. Please confirm your email address to activate your account.`,
    '',
    verificationLink,
    '',
    'This link expires in 24 hours.',
    "If you didn't create an account, ignore this email.",
  ].join('\n');

  return {
    subject: `Verify your email for ${brand}`,
    html: layout({
      title: 'Verify your email address',
      preheader: 'Confirm your email address to activate your account.',
      content,
    }),
    text,
  };
};
