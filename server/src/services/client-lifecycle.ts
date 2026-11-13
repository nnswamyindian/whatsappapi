import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env.js';
import { EmailService } from './email.js';
import { getWhatsAppProvider } from '../providers/whatsapp/factory.js';
import { NotificationService } from './notifications.js';

export interface OmnichannelPayload {
  organizationId: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  eventType:
    | 'onboarding_reminder'
    | 'application_received'
    | 'application_approved'
    | 'application_needs_info'
    | 'whatsapp_connected'
    | 'payment_captured'
    | 'marketing_guide'
    | 'festival_wishes'
    | 'renewal_reminder'
    | 'winback_offer';
  title: string;
  whatsappBody: string;
  emailSubject: string;
  emailHtml: string;
  metadata?: Record<string, any>;
}

export const MARKETING_PLAYBOOKS = [
  {
    id: 1,
    title: 'MetaGreenWave Growth Hack #1: 65%+ Open Rate Blueprint',
    preview: 'Mastering Interactive Quick-Reply Buttons in WhatsApp Broadcasts',
    content:
      '🌟 *MetaGreenWave Growth Playbook #1*\n\n' +
      'Did you know WhatsApp campaigns that use *Quick-Reply Buttons* generate 3.4x higher response rates than plain text?\n\n' +
      '💡 *Top 3 Tips for High Conversions:*\n' +
      '1. Keep your copy under 140 characters before the call to action.\n' +
      '2. Use exactly 2 clear interactive buttons (e.g. [Claim Offer] or [Talk to Expert]).\n' +
      '3. Schedule broadcasts between 10:30 AM and 1:30 PM local customer time.\n\n' +
      '👉 Open your *Campaign Studio* in MetaGreenWave to draft your next high-converting broadcast!',
  },
  {
    id: 2,
    title: 'MetaGreenWave Growth Hack #2: 24/7 Visual Chatbot Lead Capture',
    preview: 'Automating instant lead qualification without human intervention',
    content:
      '🤖 *MetaGreenWave Growth Playbook #2*\n\n' +
      'Never lose a lead outside business hours! With our *No-Code Chatbot Studio*, you can automatically qualify inbound prospects in seconds.\n\n' +
      '💡 *Recommended Lead Flow:*\n' +
      '• Keyword trigger: "Hi", "Price", or "Demo"\n' +
      '• Ask 2 quick multiple-choice questions\n' +
      '• Auto-assign lead to qualified CRM stage\n' +
      '• Hand off to a human agent when intent is high.\n\n' +
      '👉 Navigate to *Chatbots* in your MetaGreenWave dashboard to launch your first flow in 5 minutes!',
  },
  {
    id: 3,
    title: 'MetaGreenWave Growth Hack #3: Contact Segmentation & Health Quality',
    preview: 'Protecting your WhatsApp Business Phone Quality Rating from RED flags',
    content:
      '🛡️ *MetaGreenWave Growth Playbook #3*\n\n' +
      'Meta monitors your WhatsApp number quality (GREEN, YELLOW, RED). Protect your delivery tier by segmenting your audience:\n\n' +
      '💡 *Golden Rules:*\n' +
      '• Always honor opt-outs immediately (MetaGreenWave automates this via Reply Rules).\n' +
      '• Segment contacts by purchase history and tags instead of blasting entire lists.\n' +
      '• Re-engage inactive contacts with helpful utility alerts rather than hard marketing.\n\n' +
      '👉 Check your real-time phone health rating anytime under *Integrations*.',
  },
  {
    id: 4,
    title: 'MetaGreenWave Growth Hack #4: CRM Automation & Sales Closing',
    preview: 'Turning customer replies into paying customers with pipeline stages',
    content:
      '💼 *MetaGreenWave Growth Playbook #4*\n\n' +
      'Speed to lead is everything. Leads contacted within 5 minutes on WhatsApp are 9x more likely to convert!\n\n' +
      '💡 *Action Steps:*\n' +
      '• Configure *Reply Classification Rules* to tag warm replies automatically.\n' +
      '• Move interested contacts to "Proposal Shared" stage in your CRM Kanban board.\n' +
      '• Leave internal team notes on conversation cards without the customer seeing them.\n\n' +
      '👉 View your active opportunities in the *WhatsApp CRM* tab!',
  },
];

export const FESTIVAL_CALENDAR = [
  {
    name: 'New Year Celebrations',
    dateMonthDay: '01-01',
    message:
      '🎆 *Happy New Year from MetaGreenWave!*\n\n' +
      'Wishing your team, your business, and your families a joyful, healthy, and exceptionally prosperous year ahead. Thank you for partnering with MetaGreenWave as your trusted business messaging platform. Here is to growing your conversations and customer loyalty in 2026! 🚀',
  },
  {
    name: 'Festival of Lights (Diwali)',
    dateMonthDay: '11-01',
    message:
      '🪔 *Warm Diwali Greetings from MetaGreenWave!*\n\n' +
      'May this festive season illuminate your business with boundless opportunities, prosperity, and success. Thank you for powering your customer relationships with MetaGreenWave. Wishing you and your loved ones peace and happiness! ✨',
  },
  {
    name: 'Eid Mubarak',
    dateMonthDay: '03-31',
    message:
      '🌙 *Eid Mubarak from the MetaGreenWave Team!*\n\n' +
      'May this special day bring peace, prosperity, and blessings to you, your family, and your enterprise. Thank you for being a valued part of the MetaGreenWave community! 🌟',
  },
  {
    name: 'Christmas & Holiday Season',
    dateMonthDay: '12-25',
    message:
      '🎄 *Merry Christmas & Warm Holiday Greetings!*\n\n' +
      'The MetaGreenWave team wishes you a wonderful holiday season filled with cheer and togetherness. Thank you for trusting us to power your business conversations throughout the year! 🎅',
  },
  {
    name: 'Independence Day',
    dateMonthDay: '08-15',
    message:
      '🇮🇳 *Happy Independence Day from MetaGreenWave!*\n\n' +
      'Celebrating freedom, innovation, and entrepreneurial resilience. We are honored to empower businesses across the globe to connect meaningfully with their customers. 🇮🇳',
  },
];

export class ClientLifecycleService {
  /**
   * Unified Omnichannel Dispatch: Delivers both WhatsApp and Email
   */
  public static async dispatch(payload: OmnichannelPayload): Promise<{
    dispatchId: string;
    whatsappDelivered: boolean;
    emailDelivered: boolean;
  }> {
    const dispatchId = `lcd_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    let whatsappSuccess = false;
    let emailSuccess = false;

    // 1. Dispatch Email if recipient email provided
    if (payload.recipientEmail) {
      try {
        const emailResult = await EmailService.sendRaw({
          to: payload.recipientEmail,
          subject: payload.emailSubject,
          html: payload.emailHtml,
          text: payload.whatsappBody,
        });
        emailSuccess = emailResult.success;
      } catch (err: any) {
        console.warn(`[Lifecycle] Email dispatch error to ${payload.recipientEmail}:`, err.message);
      }
    }

    // 2. Dispatch WhatsApp Notification to registered client phone
    if (payload.recipientPhone) {
      try {
        // Send using platform default provider (Sandbox or Meta Cloud API)
        const provider = getWhatsAppProvider(payload.organizationId);
        const sendResult = await provider.sendMessage({
          toPhoneE164: payload.recipientPhone,
          type: 'text',
          text: {
            body: payload.whatsappBody,
          },
        });
        whatsappSuccess = sendResult.success;
        console.log(`[Lifecycle WhatsApp] Sent '${payload.eventType}' to ${payload.recipientPhone}: ${sendResult.success ? 'SUCCESS' : 'FAILED'}`);
      } catch (err: any) {
        console.warn(`[Lifecycle] WhatsApp dispatch error to ${payload.recipientPhone}:`, err.message);
      }
    }

    // 3. Persist record into lifecycle_dispatches table
    try {
      db.execute(
        `INSERT INTO lifecycle_dispatches 
         (id, organization_id, recipient_phone, recipient_email, channel, event_type, title, message_preview, metadata_json, status, dispatched_at)
         VALUES (?, ?, ?, ?, 'both', ?, ?, ?, ?, ?, ?)`,
        [
          dispatchId,
          payload.organizationId,
          payload.recipientPhone || null,
          payload.recipientEmail || null,
          payload.eventType,
          payload.title,
          payload.whatsappBody.substring(0, 255),
          JSON.stringify(payload.metadata || {}),
          whatsappSuccess || emailSuccess ? 'delivered' : 'failed',
          now,
        ]
      );
    } catch (e: any) {
      console.warn('[Lifecycle] Logging dispatch record warning:', e.message);
    }

    return {
      dispatchId,
      whatsappDelivered: whatsappSuccess,
      emailDelivered: emailSuccess,
    };
  }

  /**
   * 1. Application Received Confirmation
   */
  public static async notifyApplicationReceived(app: {
    id: string;
    organization_id: string;
    business_name: string;
    owner_name: string;
    email: string;
    phone_e164: string;
  }) {
    const waText =
      `👋 *Hello ${app.owner_name}!*\n\n` +
      `Thank you for registering *${app.business_name}* on *MetaGreenWave* — the Official WhatsApp Business Messaging Platform.\n\n` +
      `📋 *Application Status:* PENDING REVIEW\n` +
      `Our compliance team is verifying your business details. You will receive an instant WhatsApp update once approved (typically under 1 hour during business hours).\n\n` +
      `💬 Questions? Reply directly to this conversation for prompt assistance.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
        <h2 style="color: #0f172a; margin-top: 0;">Application Received — MetaGreenWave</h2>
        <p>Dear ${app.owner_name},</p>
        <p>We have successfully received your business application for <strong>${app.business_name}</strong>.</p>
        <p style="background: #f1f5f9; padding: 12px; border-radius: 8px;"><strong>Current Status:</strong> Under Compliance Review</p>
        <p>You will receive an automated notification as soon as your account is approved.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">MetaGreenWave Platform Team &bull; Official WhatsApp Business Solutions</p>
      </div>
    `;

    return this.dispatch({
      organizationId: app.organization_id,
      recipientPhone: app.phone_e164,
      recipientEmail: app.email,
      eventType: 'application_received',
      title: 'MetaGreenWave Application Received',
      whatsappBody: waText,
      emailSubject: `MetaGreenWave Application Received for ${app.business_name}`,
      emailHtml: html,
      metadata: { applicationId: app.id },
    });
  }

  /**
   * 2. Application Approved & Onboarding Launch
   */
  public static async notifyApplicationApproved(app: {
    id: string;
    organization_id: string;
    business_name: string;
    owner_name: string;
    email: string;
    phone_e164: string;
  }) {
    const onboardingUrl = `http://localhost:${ENV.PORT}/onboarding`;
    const waText =
      `🎉 *Congratulations ${app.owner_name}!*\n\n` +
      `Your business account for *${app.business_name}* has been officially *APPROVED* by the MetaGreenWave compliance team!\n\n` +
      `🚀 *Next Step:* Connect your official WhatsApp Business Account (WABA) using our 12-Step Guided Onboarding.\n\n` +
      `👉 *Launch Onboarding:* ${onboardingUrl}\n\n` +
      `Welcome to MetaGreenWave! We are thrilled to partner with you.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #10b981; border-radius: 16px;">
        <h2 style="color: #047857; margin-top: 0;">🎉 Your MetaGreenWave Account is Approved!</h2>
        <p>Dear ${app.owner_name},</p>
        <p>Great news! Your account for <strong>${app.business_name}</strong> has passed compliance review and is ready for use.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${onboardingUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Launch 12-Step Onboarding</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">MetaGreenWave Platform Team &bull; Official WhatsApp Business Solutions</p>
      </div>
    `;

    return this.dispatch({
      organizationId: app.organization_id,
      recipientPhone: app.phone_e164,
      recipientEmail: app.email,
      eventType: 'application_approved',
      title: 'MetaGreenWave Account Approved',
      whatsappBody: waText,
      emailSubject: `🎉 Congratulations! Your MetaGreenWave Account for ${app.business_name} is Approved`,
      emailHtml: html,
      metadata: { applicationId: app.id },
    });
  }

  /**
   * 3. WhatsApp Business Account Connected
   */
  public static async notifyWhatsAppConnected(org: {
    id: string;
    name: string;
    phone_e164?: string;
    owner_email?: string;
    display_phone?: string;
  }) {
    const waText =
      `✅ *WhatsApp Connected Successfully!*\n\n` +
      `Your official WhatsApp Business number *${org.display_phone || 'WABA'}* is now live and synchronized with *MetaGreenWave* for *${org.name}*.\n\n` +
      `You can now:\n` +
      `• Synchronize Meta message templates\n` +
      `• Import opt-in contact lists\n` +
      `• Launch targeted promotional campaigns\n` +
      `• Manage shared customer service chats in the Team Inbox.\n\n` +
      `👉 Need help? Our live support team is available 24/7.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #0284c7; border-radius: 16px;">
        <h2 style="color: #0369a1; margin-top: 0;">✅ WhatsApp Account Connected</h2>
        <p>Dear ${org.name} Team,</p>
        <p>Your WhatsApp Business connection is active. Your messaging capabilities are fully unlocked on MetaGreenWave.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">MetaGreenWave Platform Team</p>
      </div>
    `;

    return this.dispatch({
      organizationId: org.id,
      recipientPhone: org.phone_e164,
      recipientEmail: org.owner_email,
      eventType: 'whatsapp_connected',
      title: 'WhatsApp Business Connected',
      whatsappBody: waText,
      emailSubject: `✅ WhatsApp Business Account Connected — MetaGreenWave`,
      emailHtml: html,
    });
  }

  /**
   * 4. Subscription Payment Captured & Activated
   */
  public static async notifyPaymentCaptured(org: {
    id: string;
    name: string;
    owner_name: string;
    phone_e164?: string;
    owner_email?: string;
    plan_name: string;
    amount: number;
    invoice_number: string;
    renewal_date: string;
  }) {
    const formattedDate = new Date(org.renewal_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const formattedAmount = Number(org.amount).toFixed(2);
    const waText =
      `💳 *Payment Receipt & Subscription Active!*\n\n` +
      `Dear ${org.owner_name}, thank you for your payment of *US$ ${formattedAmount}* for the *${org.plan_name}* on *MetaGreenWave*.\n\n` +
      `📄 *Invoice #:* ${org.invoice_number}\n` +
      `📅 *Next Renewal Date:* ${formattedDate}\n` +
      `✨ *Plan Status:* ACTIVE & UNRESTRICTED\n\n` +
      `Throughout your subscription, our team will provide automated WhatsApp marketing playbooks and growth guidance to help you maximize ROI. Welcome aboard! 🚀`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #10b981; border-radius: 16px;">
        <h2 style="color: #047857; margin-top: 0;">💳 Payment Successful — Invoice #${org.invoice_number}</h2>
        <p>Dear ${org.owner_name},</p>
        <p>We have successfully processed your payment of <strong>$${formattedAmount}</strong> for the <strong>${org.plan_name}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #64748b;">Organization:</td><td><strong>${org.name}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Invoice Number:</td><td><strong>${org.invoice_number}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Plan Tier:</td><td><strong>${org.plan_name}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Valid Until:</td><td><strong>${formattedDate}</strong></td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">MetaGreenWave Platform Team &bull; support@metagreenwave.io</p>
      </div>
    `;

    return this.dispatch({
      organizationId: org.id,
      recipientPhone: org.phone_e164,
      recipientEmail: org.owner_email,
      eventType: 'payment_captured',
      title: `Payment Receipt: Invoice #${org.invoice_number}`,
      whatsappBody: waText,
      emailSubject: `💳 Payment Receipt & Subscription Activated: #${org.invoice_number} — MetaGreenWave`,
      emailHtml: html,
      metadata: { invoiceNumber: org.invoice_number, amount: org.amount },
    });
  }

  /**
   * 5. Subscription Expiry Warning & Renewal Follow-Up
   */
  public static async notifySubscriptionExpiring(org: {
    id: string;
    name: string;
    phone_e164?: string;
    owner_email?: string;
    days_left: number;
    plan_name: string;
    renewal_date: string;
  }) {
    const renewUrl = `http://localhost:${ENV.PORT}/billing`;
    const waText =
      `⏰ *MetaGreenWave Subscription Reminder*\n\n` +
      `Your *${org.plan_name}* for *${org.name}* will renew in *${org.days_left} day${org.days_left > 1 ? 's' : ''}* (${org.renewal_date}).\n\n` +
      `To ensure uninterrupted WhatsApp message delivery, chatbot execution, and team inbox operations, please verify your payment method.\n\n` +
      `👉 *Manage Subscription:* ${renewUrl}\n\n` +
      `Thank you for trusting MetaGreenWave!`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #f59e0b; border-radius: 16px;">
        <h2 style="color: #b45309; margin-top: 0;">⏰ MetaGreenWave Subscription Notice</h2>
        <p>Dear ${org.name} Team,</p>
        <p>Your subscription is set to renew in <strong>${org.days_left} days</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${renewUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Billing & Renewal</a>
        </div>
      </div>
    `;

    return this.dispatch({
      organizationId: org.id,
      recipientPhone: org.phone_e164,
      recipientEmail: org.owner_email,
      eventType: 'renewal_reminder',
      title: `Subscription Expiring in ${org.days_left} Days`,
      whatsappBody: waText,
      emailSubject: `⏰ Reminder: Your MetaGreenWave Subscription Renews in ${org.days_left} Days`,
      emailHtml: html,
      metadata: { daysLeft: org.days_left },
    });
  }

  /**
   * 6. Post-Expiry Winback & Retention Automated Follow-Up
   */
  public static async notifySubscriptionWinback(org: {
    id: string;
    name: string;
    phone_e164?: string;
    owner_email?: string;
  }) {
    const renewUrl = `http://localhost:${ENV.PORT}/billing`;
    const waText =
      `👋 *We miss you at MetaGreenWave!*\n\n` +
      `Your messaging subscription for *${org.name}* recently concluded. We want to help you continue growing your WhatsApp sales and customer relationships.\n\n` +
      `🎁 *Special Retention Bonus:* Renew within the next 48 hours to preserve your active templates, chat histories, and unlock a *15% bonus credit* on your messaging wallet!\n\n` +
      `👉 *Reactivate Now:* ${renewUrl}\n\n` +
      `Need custom enterprise pricing or high-volume rates? Reply directly to speak with an account specialist.`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #6366f1; border-radius: 16px;">
        <h2 style="color: #4338ca; margin-top: 0;">👋 Continue Your WhatsApp Growth with MetaGreenWave</h2>
        <p>Dear ${org.name} Team,</p>
        <p>We would love to welcome you back! Reactivate your subscription to resume automated campaigns and team inbox operations.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${renewUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reactivate Subscription</a>
        </div>
      </div>
    `;

    return this.dispatch({
      organizationId: org.id,
      recipientPhone: org.phone_e164,
      recipientEmail: org.owner_email,
      eventType: 'winback_offer',
      title: 'MetaGreenWave Reactivation & Win-Back Offer',
      whatsappBody: waText,
      emailSubject: `🎁 Exclusive Retention Offer: Reactivate Your MetaGreenWave Subscription`,
      emailHtml: html,
    });
  }

  /**
   * 7. Automated Scheduled Lifecycle Engine Runner (Cron / Periodic interval)
   */
  public static async runScheduledLifecycleCheck(): Promise<{
    processedCount: number;
    remindersSent: number;
    nurtureSent: number;
  }> {
    let remindersSent = 0;
    let nurtureSent = 0;

    try {
      const activeSubs = db.query<any>(`
        SELECT s.*, o.name as org_name, o.phone_e164, u.email as owner_email, u.full_name as owner_name, sp.name as plan_name
        FROM subscriptions s
        JOIN organizations o ON o.id = s.organization_id
        LEFT JOIN memberships m ON m.organization_id = o.id AND m.role = 'owner'
        LEFT JOIN users u ON u.id = m.user_id
        LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
        WHERE s.status = 'active' AND s.renewal_date IS NOT NULL
      `);

      const now = new Date();

      for (const sub of activeSubs) {
        if (!sub.renewal_date) continue;
        const renewalDate = new Date(sub.renewal_date);
        const diffMs = renewalDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Check for 7-day, 3-day, and 1-day reminders
        if ([7, 3, 1].includes(daysLeft)) {
          // Avoid duplicate reminder on same day
          const existing = db.queryOne<any>(
            `SELECT id FROM lifecycle_dispatches 
             WHERE organization_id = ? AND event_type = 'renewal_reminder' 
             AND date(dispatched_at) = date('now')`,
            [sub.organization_id]
          );

          if (!existing) {
            await this.notifySubscriptionExpiring({
              id: sub.organization_id,
              name: sub.org_name,
              phone_e164: sub.phone_e164,
              owner_email: sub.owner_email,
              days_left: daysLeft,
              plan_name: sub.plan_name || 'Active Plan',
              renewal_date: sub.renewal_date,
            });
            remindersSent++;
          }
        }
      }
    } catch (err: any) {
      console.warn('[Lifecycle Engine] Scheduled renewal check warning:', err.message);
    }

    return {
      processedCount: 0,
      remindersSent,
      nurtureSent,
    };
  }
}

