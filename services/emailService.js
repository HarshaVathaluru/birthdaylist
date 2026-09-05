const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('../db');
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');

function getEmailConfig() {
  let settingsObj = {};
  try {
    const settingsArray = db.prepare('SELECT * FROM settings').all();
    for (const row of settingsArray) {
      settingsObj[row.key] = row.value;
    }
  } catch (err) {
    console.error('[EmailConfig] Error reading settings table:', err.message);
  }

  const resendApiKey = (settingsObj.resend_api_key || process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (settingsObj.from_email || process.env.FROM_EMAIL || 'celebrate@zen.ai').trim();
  const fromName = (settingsObj.from_name || process.env.FROM_NAME || 'Zenitude Celebrations').trim();

  return {
    provider: resendApiKey ? 'resend' : 'smtp',
    resendApiKey: resendApiKey,
    fromEmail: fromEmail,
    fromName: fromName,
    fromFormatted: `${fromName} <${fromEmail}>`,
    host: (settingsObj.smtp_host || process.env.SMTP_HOST || '').trim(),
    port: parseInt(settingsObj.smtp_port || process.env.SMTP_PORT || '587', 10),
    user: (settingsObj.smtp_user || process.env.SMTP_USER || '').trim(),
    pass: (settingsObj.smtp_pass || process.env.SMTP_PASS || '').trim(),
    masterReminder: settingsObj.master_reminder !== 'false'
  };
}

function createTransport() {
  const config = getEmailConfig();
  if (!config.host || !config.user || !config.pass) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

function normalizeDateStr(dateStr) {
  if (!dateStr) return '01-01';
  const parts = String(dateStr).trim().split('-').map(Number);
  let m, d;
  if (parts.length === 3) {
    m = parts[1];
    d = parts[2];
  } else if (parts.length === 2) {
    m = parts[0];
    d = parts[1];
  } else {
    return '01-01';
  }
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${mm}-${dd}`;
}

function formatDateLong(monthDayStr) {
  if (!monthDayStr) return '';
  const norm = normalizeDateStr(monthDayStr);
  const [m, d] = norm.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = months[parseInt(m, 10) - 1] || m;
  return `${monthName} ${parseInt(d, 10)}`;
}

function getInitials(name) {
  if (!name) return '🎂';
  const parts = name.trim().split(' ').filter(n => n.length > 0);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateGoogleCalendarUrl(name, dateStr) {
  const now = new Date();
  const [m, d] = dateStr.split('-').map(Number);
  let targetYear = now.getFullYear();
  const dateObj = new Date(targetYear, m - 1, d);
  if (dateObj < now) {
    targetYear++;
  }
  const y = targetYear.toString();
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  const formatted = `${y}${mm}${dd}`;

  const title = encodeURIComponent(`🎂 Birthday: ${name}`);
  const details = encodeURIComponent(`Don't forget to celebrate and wish ${name} a very Happy Birthday! 🎉`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatted}/${formatted}&details=${details}`;
}

// ============================================================================
// TEMPLATE 1: Executive Professional VIP Birthday Wish (For Celebrant)
// ============================================================================
function generateBirthdayPersonWishEmailHtml(birthday, customMessage = null) {
  const formattedDate = formatDateLong(birthday.date);
  const celebrantName = birthday.name || 'Valued Member';
  const wishBody = customMessage || `On behalf of the entire Zenitude Circle, we wish you a joyous and fulfilling birthday. May this upcoming milestone year bring you robust health, inspiring breakthroughs, enduring happiness, and the continued warmth of friends and family.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday, ${celebrantName} — Zenitude Celebrations</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased; line-height: 1.6;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Dear ${celebrantName}, the entire Zenitude Circle celebrates your special day today (${formattedDate}). Read our heartfelt greetings...
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container (Letterhead Style) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Top Accent Line -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #FF6B6B 0%, #FF8E53 50%, #FFD93D 100%);"></td>
          </tr>

          <!-- Letterhead Header -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #F1F5F9;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: 0.5px;">Zenitude</span>
                    <span style="display: inline-block; margin-left: 8px; background: #FFF1F2; color: #E11D48; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">VIP CELEBRATION</span>
                  </td>
                  <td align="right" valign="middle" style="font-size: 12px; color: #94A3B8; font-weight: 500;">
                    ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Letter Content -->
          <tr>
            <td style="padding: 36px 40px 28px 40px;">
              
              <!-- Salutation -->
              <h2 style="font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                Dear ${celebrantName},
              </h2>

              <p style="font-size: 15px; color: #334155; margin: 0 0 20px 0; line-height: 1.7;">
                Today marks an extraordinary milestone. We are delighted to pause and celebrate <strong>you</strong> — your presence, dedication, and the wonderful positivity you bring to our entire circle.
              </p>

              <!-- Celebrant Card Component -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF5FF; border-radius: 12px; border: 1px solid #F3E8FF; padding: 20px; margin: 24px 0;">
                <tr>
                  <td width="76" align="center" valign="middle" style="padding-right: 18px;">
                    ${birthday.photo ? `
                      <div style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid #FF8E53; overflow: hidden; box-shadow: 0 4px 12px rgba(255,142,83,0.25);">
                        <img src="${birthday.photo.startsWith('http') ? birthday.photo : 'cid:birthdayphoto'}" alt="${celebrantName}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                      </div>
                    ` : `
                      <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: #FFFFFF; font-size: 26px; font-weight: 800; line-height: 72px; text-align: center; box-shadow: 0 4px 12px rgba(255,107,107,0.25);">
                        ${getInitials(celebrantName)}
                      </div>
                    `}
                  </td>
                  <td valign="middle">
                    <div style="font-size: 11px; font-weight: 800; color: #7C3AED; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">
                      ✨ TODAY'S HONORED CELEBRANT
                    </div>
                    <div style="font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
                      ${celebrantName}
                    </div>
                    <div style="font-size: 13.5px; color: #64748B;">
                      Celebration Date: <strong style="color: #0F172A;">${formattedDate}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Executive Message Body -->
              <div style="background-color: #FFFDF9; border-left: 4px solid #FF8E53; border-radius: 0 8px 8px 0; padding: 18px 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14.5px; line-height: 1.75; color: #334155; font-style: italic;">
                  "${wishBody}"
                </p>
              </div>

              <!-- Action Buttons -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="http://localhost:3000/chat" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 14px rgba(255,107,107,0.3);">
                      💬 View Wishes on Circle Feed →
                    </a>
                  </td>
                  <td>
                    <a href="http://localhost:3000/" target="_blank" style="display: inline-block; background: #FFFFFF; color: #334155; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600; border: 1px solid #CBD5E1;">
                      🔍 Check More on Zenitude →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Sign-off -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9;">
                <p style="font-size: 14px; color: #475569; margin: 0 0 4px 0;">
                  Warmest regards and best wishes,
                </p>
                <p style="font-size: 15px; font-weight: 700; color: #0F172A; margin: 0;">
                  The Zenitude Circle Team
                </p>
                <p style="font-size: 12.5px; color: #94A3B8; margin: 2px 0 0 0;">
                  Executive Celebrations & Community
                </p>
              </div>

            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 22px 40px; border-top: 1px solid #E2E8F0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
                    © ${new Date().getFullYear()} Zenitude Community Operations. You received this email as an active member of our executive circle.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE 2: Executive Professional Intimation Letter (For Circle Members)
// ============================================================================
function generateCircleIntimationEmailHtml(birthday, daysUntil, recipientName = null, customMessage = null) {
  const formattedDate = formatDateLong(birthday.date);
  const celebrantName = birthday.name || 'Circle Celebrant';
  const recipientDisplayName = recipientName ? recipientName.trim() : 'Valued Circle Member';
  const isToday = daysUntil === 0;

  const subjectHeader = isToday 
    ? `Today We Celebrate ${celebrantName}'s Birthday` 
    : `Upcoming: ${celebrantName}'s Birthday is in ${daysUntil} Days`;

  const occasionBadge = isToday
    ? `<span style="display: inline-block; background: #ECFDF5; color: #059669; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">TODAY'S CELEBRATION</span>`
    : `<span style="display: inline-block; background: #EEF2FF; color: #4F46E5; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">${daysUntil}-DAY ADVANCE REMINDER</span>`;

  const leadParagraph = isToday
    ? `We are writing to let you know that today, <strong>${formattedDate}</strong>, is <strong>${celebrantName}'s birthday!</strong>`
    : `This is a quick heads-up to let you know that <strong>${celebrantName}'s birthday</strong> is coming up in <strong>${daysUntil} days</strong> on <strong>${formattedDate}</strong>.`;

  const actionText = isToday
    ? `Take a moment to send ${celebrantName} your warmest wishes or post a greeting on our shared circle board to make their day unforgettable.`
    : `Please mark your calendar and get ready to celebrate with the team.`;

  const customNote = customMessage ? `<div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #334155; font-style: italic;">"${customMessage}"</div>` : '';

  const gcalUrl = generateGoogleCalendarUrl(celebrantName, birthday.date);
  const chatUrl = `http://localhost:3000/chat?recipient=${encodeURIComponent(celebrantName)}`;
  const homeUrl = `http://localhost:3000/`;

  let actionButtonsHtml = '';
  if (isToday) {
    actionButtonsHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
        <tr>
          <td style="padding-right: 12px;">
            <a href="${chatUrl}" target="_blank" style="display: inline-block; background: #0F172A; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
              💬 Post Wish in Circle Chat →
            </a>
          </td>
          <td>
            <a href="${homeUrl}" target="_blank" style="display: inline-block; background: #FFFFFF; color: #334155; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600; border: 1px solid #CBD5E1;">
              🔍 Check More on Zenitude →
            </a>
          </td>
        </tr>
      </table>
    `;
  } else {
    actionButtonsHtml = `
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px 0;">
        <tr>
          <td style="padding-right: 12px;">
            <a href="${gcalUrl}" target="_blank" style="display: inline-block; background: #4F46E5; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(79,70,229,0.2);">
              📅 Add to Calendar
            </a>
          </td>
          <td>
            <a href="${homeUrl}" target="_blank" style="display: inline-block; background: #FFFFFF; color: #334155; text-decoration: none; padding: 11px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600; border: 1px solid #CBD5E1;">
              🔍 Check More on Zenitude →
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectHeader} — Zenitude Celebrations</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased; line-height: 1.6;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #F8FAFC; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Dear ${recipientDisplayName}, ${isToday ? `today is ${celebrantName}'s birthday!` : `${celebrantName}'s birthday is coming up in ${daysUntil} days.`} Open for celebration details...
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; padding: 40px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); border: 1px solid #E2E8F0;">
          
          <!-- Top Accent Line -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #4F46E5 0%, #06B6D4 50%, #10B981 100%);"></td>
          </tr>

          <!-- Letterhead Header -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #F1F5F9;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle">
                    <span style="font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: 0.5px;">Zenitude</span>
                    <span style="margin-left: 8px;">${occasionBadge}</span>
                  </td>
                  <td align="right" valign="middle" style="font-size: 12px; color: #94A3B8; font-weight: 500;">
                    ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Letter Content -->
          <tr>
            <td style="padding: 36px 40px 28px 40px;">
              
              <!-- Salutation with Recipient's Name -->
              <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 16px 0; letter-spacing: -0.3px;">
                Dear ${recipientDisplayName},
              </h2>

              <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0; line-height: 1.7;">
                ${leadParagraph}
              </p>

              <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; line-height: 1.7;">
                ${actionText}
              </p>

              ${customNote}

              <!-- Celebrant Profile Spotlight Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border-radius: 12px; border: 1.5px solid #E2E8F0; padding: 20px; margin: 24px 0;">
                <tr>
                  <td width="72" align="center" valign="middle" style="padding-right: 18px;">
                    ${birthday.photo ? `
                      <div style="width: 68px; height: 68px; border-radius: 50%; border: 3px solid #4F46E5; overflow: hidden; box-shadow: 0 4px 12px rgba(79,70,229,0.2);">
                        <img src="${birthday.photo.startsWith('http') ? birthday.photo : 'cid:birthdayphoto'}" alt="${celebrantName}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                      </div>
                    ` : `
                      <div style="width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #4F46E5, #06B6D4); color: #FFFFFF; font-size: 24px; font-weight: 800; line-height: 68px; text-align: center; box-shadow: 0 4px 12px rgba(79,70,229,0.2);">
                        ${getInitials(celebrantName)}
                      </div>
                    `}
                  </td>
                  <td valign="middle">
                    <div style="font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
                      ${celebrantName}
                    </div>
                    <div style="font-size: 13.5px; color: #64748B;">
                      🗓️ Celebration Date: <strong style="color: #0F172A;">${formattedDate}</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Interactive Buttons -->
              ${actionButtonsHtml}

              <!-- Sign-off -->
              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9;">
                <p style="font-size: 14px; color: #475569; margin: 0 0 4px 0;">
                  Warm regards,
                </p>
                <p style="font-size: 15px; font-weight: 700; color: #0F172A; margin: 0;">
                  The Zenitude Circle Team
                </p>
                <p style="font-size: 12.5px; color: #94A3B8; margin: 2px 0 0 0;">
                  Executive Community Operations
                </p>
              </div>

            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 22px 40px; border-top: 1px solid #E2E8F0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: #94A3B8; line-height: 1.6;">
                    © ${new Date().getFullYear()} Zenitude Community Operations. This notice was sent to ${recipientDisplayName} as part of your active circle notifications.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

// ============================================================================
// UNIFIED EMAIL DISPATCH (Resend HTTPS API with SMTP fallback)
// ============================================================================
async function sendSingleEmailMessage({ to, subject, html, attachments = [] }) {
  const config = getEmailConfig();

  // 1. Resend API Dispatch
  if (config.resendApiKey) {
    const resend = new Resend(config.resendApiKey);

    const resendAttachments = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.path && fs.existsSync(att.path)) {
          const content = fs.readFileSync(att.path);
          resendAttachments.push({
            filename: att.filename,
            content: content
          });
        }
      }
    }

    const toList = Array.isArray(to) ? to : [to];

    try {
      let response = await resend.emails.send({
        from: config.fromFormatted,
        to: toList,
        subject: subject,
        html: html,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined
      });

      if (response && response.error) {
        throw new Error(response.error.message || 'Resend delivery error');
      }

      return response;
    } catch (sendErr) {
      const errMsg = (sendErr.message || '').toLowerCase();
      // If custom domain (e.g. celebrate@zen.ai) is unverified, automatically fallback to onboarding@resend.dev sandbox
      if (errMsg.includes('domain') || errMsg.includes('verif') || errMsg.includes('validation') || errMsg.includes('403')) {
        console.warn(`[Resend] Custom domain (${config.fromEmail}) not yet verified. Automatically falling back to onboarding@resend.dev...`);
        try {
          const fallbackRes = await resend.emails.send({
            from: `Zenitude Celebrations <onboarding@resend.dev>`,
            to: toList,
            subject: subject,
            html: html,
            attachments: resendAttachments.length > 0 ? resendAttachments : undefined
          });
          if (fallbackRes && fallbackRes.error) {
            throw new Error(fallbackRes.error.message);
          }
          console.log('[Resend] Delivered successfully via onboarding@resend.dev fallback!');
          return fallbackRes;
        } catch (fallbackErr) {
          console.error('[Resend Fallback Error]:', fallbackErr.message);
          throw fallbackErr;
        }
      }
      throw sendErr;
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const transporter = createTransport();
  if (!transporter) {
    throw new Error('No email provider configured. Please check your Resend API key or SMTP settings in Admin.');
  }

  return await transporter.sendMail({
    from: config.fromFormatted,
    to: to,
    subject: subject,
    html: html,
    attachments: attachments
  });
}

// ============================================================================
// RECIPIENT RESOLUTION & DISPATCH LOGIC
// ============================================================================
function getAllCircleRecipients(specificRecipients = []) {
  const result = [];
  const seen = new Set();

  function addContact(name, email) {
    if (!email || !email.includes('@')) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!seen.has(cleanEmail)) {
      seen.add(cleanEmail);
      result.push({ name: name ? name.trim() : null, email: email.trim() });
    }
  }

  // 1. Central circle members directory
  try {
    const circleMembers = db.prepare('SELECT name, email FROM circle_members').all();
    for (const m of circleMembers) addContact(m.name, m.email);
  } catch (e) {}

  // 2. Global recipients from settings
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'global_recipients'").get();
    if (setting && setting.value) {
      const lines = setting.value.split(/[,;\n\r]+/).map(e => e.trim()).filter(Boolean);
      for (const line of lines) addContact(null, line);
    }
  } catch (e) {}

  // 3. Any specific recipients
  if (Array.isArray(specificRecipients)) {
    for (const r of specificRecipients) {
      if (typeof r === 'object' && r) addContact(r.name, r.email);
      else if (typeof r === 'string') addContact(null, r);
    }
  }

  return result;
}

async function sendBirthdayReminder(birthday, recipients = [], daysUntil, customMessage = null) {
  const config = getEmailConfig();
  const contacts = getAllCircleRecipients(recipients);

  if (contacts.length === 0) {
    console.warn(`No circle members configured for ${birthday.name}`);
    return { success: false, error: 'No circle members configured in the Auto-Trigger Directory. Add members in Admin.' };
  }

  const attachments = [];
  if (birthday.photo) {
    const photoFilename = birthday.photo.replace(/^\/uploads\//, '');
    const photoPath = path.join(__dirname, '..', 'uploads', photoFilename);
    if (fs.existsSync(photoPath)) {
      attachments.push({
        filename: photoFilename,
        path: photoPath,
        cid: 'birthdayphoto'
      });
    }
  }

  const formattedDate = formatDateLong(birthday.date);
  const isToday = daysUntil === 0;

  let successCount = 0;
  const celebrantCleanName = (birthday.name || '').trim().toLowerCase();
  const celebrantDirectEmail = (birthday.email || '').trim().toLowerCase();
  let birthdayPersonDelivered = false;

  for (const contact of contacts) {
    const contactName = (contact.name || '').trim();
    const contactEmail = (contact.email || '').trim().toLowerCase();

    const isBirthdayPerson = (
      (celebrantDirectEmail && contactEmail === celebrantDirectEmail) ||
      (contactName && contactName.toLowerCase() === celebrantCleanName) ||
      (contactEmail && contactEmail.includes(celebrantCleanName.replace(/\s+/g, '')))
    );

    // Rule: The 2-day advance reminder must NOT be sent to the birthday person themselves
    if (!isToday && isBirthdayPerson) {
      console.log(`[Email Service] Skipping 2-day advance reminder for birthday celebrant (${contact.email})`);
      continue;
    }

    let subject = '';
    let htmlContent = '';

    if (isToday && isBirthdayPerson) {
      // VIP Celebrant Wish (only on their actual birthday)
      subject = `✨ Happy Birthday, ${birthday.name}! — From the Zenitude Circle`;
      htmlContent = generateBirthdayPersonWishEmailHtml(birthday, customMessage);
      birthdayPersonDelivered = true;
    } else {
      // Circle Member Intimation
      subject = isToday
        ? `🎉 Today We Celebrate ${birthday.name}'s Birthday!`
        : `⏰ Upcoming Notice: ${birthday.name}'s Birthday is in ${daysUntil} Days (${formattedDate})`;
      htmlContent = generateCircleIntimationEmailHtml(birthday, daysUntil, contact.name, customMessage);
    }

    const recipientAddress = contact.name ? `"${contact.name}" <${contact.email}>` : contact.email;

    try {
      await sendSingleEmailMessage({
        to: recipientAddress,
        subject: subject,
        html: htmlContent,
        attachments: attachments
      });
      successCount++;
    } catch (err) {
      console.error(`[Email Service] Failed sending to ${contact.email}:`, err.message);
    }
  }

  // If today and celebrant has a direct email configured, ensure they receive their VIP Wish
  if (isToday && celebrantDirectEmail && !birthdayPersonDelivered) {
    try {
      await sendSingleEmailMessage({
        to: birthday.name ? `"${birthday.name}" <${birthday.email.trim()}>` : birthday.email.trim(),
        subject: `✨ Happy Birthday, ${birthday.name}! — From the Zenitude Circle`,
        html: generateBirthdayPersonWishEmailHtml(birthday, customMessage),
        attachments: attachments
      });
      successCount++;
      console.log(`[Email Service] Directly sent VIP celebration wish to celebrant email: ${birthday.email}`);
    } catch (err) {
      console.error(`[Email Service] Failed sending direct celebrant email to ${birthday.email}:`, err.message);
    }
  }

  console.log(`[Email Service] Dispatched tailored professional emails for ${birthday.name} to ${successCount} recipients via ${config.provider.toUpperCase()}.`);
  return { success: true, recipientCount: successCount };
}

async function sendTestEmail(targetEmail) {
  const config = getEmailConfig();
  const mockBirthday = {
    name: 'Aarav Sharma',
    date: '09-15',
    notes: 'Loves photography, chocolate truffles & traveling!',
    photo: null
  };

  const htmlContent = generateCircleIntimationEmailHtml(mockBirthday, 0, 'Valued Member');

  const result = await sendSingleEmailMessage({
    to: targetEmail || 'delivered@resend.dev',
    subject: '🧪 [Zenitude Test] Professional Circle Celebration Notice',
    html: htmlContent
  });

  return result;
}

function calculateDaysUntil(dateStr) {
  if (!dateStr) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const norm = normalizeDateStr(dateStr);
  const [month, day] = norm.split('-').map(Number);
  
  let nextBday = new Date(today.getFullYear(), month - 1, day);
  nextBday.setHours(0, 0, 0, 0);
  
  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBday - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

// ============================================================================
// AUTOMATED CRON SCHEDULE (Runs daily at 07:00 AM)
// ============================================================================
function startCronJob() {
  // Run daily at 07:00 AM (0 7 * * *)
  cron.schedule('0 7 * * *', async () => {
    console.log('[Cron] Running daily 07:00 AM birthday reminder check...');
    
    const config = getEmailConfig();
    if (!config.masterReminder) {
      console.log('[Cron] Master reminders are disabled in settings. Skipping.');
      return;
    }

    try {
      const birthdays = db.prepare('SELECT * FROM birthdays WHERE reminder_enabled = 1').all();
      
      for (const birthday of birthdays) {
        const daysUntil = calculateDaysUntil(birthday.date);
        const targetAlertDays = parseInt(birthday.remind_days_before !== undefined ? birthday.remind_days_before : 2, 10);
        
        // Trigger on the configured advance alert days (e.g. 2, 3, 5 days) or today (0 days)
        if (daysUntil === targetAlertDays || daysUntil === 0) {
          console.log(`[Cron 07:00 AM] Triggering ${daysUntil === 0 ? 'Today' : targetAlertDays + '-day advance'} notification for ${birthday.name}...`);
          await sendBirthdayReminder(birthday, [], daysUntil);
        }
      }
    } catch (error) {
      console.error('[Cron] Error running daily 07:00 AM birthday cron:', error);
    }
  });
  
  console.log('Birthday reminder cron job started (runs daily at 07:00 AM).');
}

module.exports = {
  getEmailConfig,
  createTransport,
  sendBirthdayReminder,
  sendTestEmail,
  startCronJob,
  generateBirthdayPersonWishEmailHtml,
  generateCircleIntimationEmailHtml,
  calculateDaysUntil
};
