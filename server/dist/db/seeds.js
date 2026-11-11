import { v4 as uuidv4 } from 'uuid';
import { db } from './index.js';
export function seedSubscriptionPlans() {
    const existingPlans = db.query('SELECT COUNT(*) as count FROM subscription_plans');
    if (existingPlans[0].count === 0) {
        const now = new Date().toISOString();
        const plans = [
            {
                id: 'plan_starter',
                name: 'Starter',
                slug: 'starter',
                description: 'Ideal for small businesses launching WhatsApp messaging with high-touch support.',
                monthly_price_usd: 29.00,
                yearly_price_usd: 290.00,
                contact_limit: 1000,
                team_member_limit: 2,
                campaign_limit: 50,
                waba_limit: 1,
                features: [
                    'Meta WhatsApp Cloud API v21 Integration',
                    'Shared Team Inbox (24h Window Timer)',
                    'CSV / XLSX Contact Import Wizard',
                    'Standard WhatsApp Template Builder',
                    'Double-Entry Wallet & Rate Card Ledger',
                    'Email & Ticket Support'
                ],
                sort_order: 1,
            },
            {
                id: 'plan_growth',
                name: 'Growth',
                slug: 'growth',
                description: 'For scaling companies requiring chatbots, multi-step automations, and CRM pipelines.',
                monthly_price_usd: 79.00,
                yearly_price_usd: 790.00,
                contact_limit: 10000,
                team_member_limit: 10,
                campaign_limit: 500,
                waba_limit: 2,
                features: [
                    'All Starter Features Included',
                    'Visual Drag-and-Drop Chatbot Studio',
                    'No-Code Workflow Automations Engine',
                    'WhatsApp CRM & Kanban Sales Pipeline',
                    'Automated Reply Classification & Tagging',
                    'Server-to-Server Transactional API & OTP',
                    'Priority Webhook Processing'
                ],
                sort_order: 2,
            },
            {
                id: 'plan_enterprise',
                name: 'Enterprise',
                slug: 'enterprise',
                description: 'High-volume enterprises needing custom roles, high throughput, and dedicated support.',
                monthly_price_usd: 199.00,
                yearly_price_usd: 1990.00,
                contact_limit: 100000,
                team_member_limit: 50,
                campaign_limit: 10000,
                waba_limit: 5,
                features: [
                    'All Growth Features Included',
                    'Multi-Tenant Role-Based Access Control (RBAC)',
                    'Custom Permission Sets & Granular Roles',
                    'Custom Rate Limits & High-Concurrency Sending',
                    'Dedicated Security & Compliance Audit Log',
                    'Audit Log Export & Webhook Diagnostics',
                    '24/7 SLA & Dedicated Solutions Architect'
                ],
                sort_order: 3,
            },
        ];
        for (const p of plans) {
            db.execute(`INSERT INTO subscription_plans 
         (id, name, slug, description, monthly_price_usd, yearly_price_usd, contact_limit, team_member_limit, campaign_limit, waba_limit, features_json, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`, [p.id, p.name, p.slug, p.description, p.monthly_price_usd, p.yearly_price_usd, p.contact_limit, p.team_member_limit, p.campaign_limit, p.waba_limit, JSON.stringify(p.features), p.sort_order, now, now]);
        }
    }
}
export function seedEmailTemplates() {
    const existingTemplates = db.query('SELECT COUNT(*) as count FROM email_templates');
    if (existingTemplates[0].count === 0) {
        const now = new Date().toISOString();
        const templates = [
            {
                slug: 'registration_successful',
                name: 'Registration Successful',
                subject: 'Welcome to GreenWave — Registration Received',
                category: 'auth',
                variables: ['fullName', 'businessName'],
                text: 'Hi {{fullName}},\n\nThank you for registering {{businessName}} with GreenWave. Your registration has been received. Please verify your email to proceed.',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #14532D; color: #ffffff; padding: 16px 20px; border-radius: 8px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">GreenWave WhatsApp Platform</h2>
          </div>
          <div style="padding: 24px 0;">
            <h3 style="color: #1e293b;">Welcome, {{fullName}}!</h3>
            <p style="color: #475569; line-height: 1.6;">Thank you for registering <strong>{{businessName}}</strong> with GreenWave. Your registration has been successfully received.</p>
            <p style="color: #475569; line-height: 1.6;">Please confirm your email address to enable review by our platform administration team.</p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
            GreenWave WhatsApp Business Platform &bull; Professional Messaging Infrastructure
          </div>
        </div>`
            },
            {
                slug: 'email_verification_required',
                name: 'Email Verification Required',
                subject: 'Please verify your official email address — GreenWave',
                category: 'auth',
                variables: ['fullName', 'verifyUrl'],
                text: 'Hi {{fullName}},\n\nPlease click the link below to verify your email address:\n{{verifyUrl}}\n\nThis link is valid for 24 hours.',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #14532D; color: #ffffff; padding: 16px 20px; border-radius: 8px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">GreenWave Verification</h2>
          </div>
          <div style="padding: 24px 0; text-align: center;">
            <h3 style="color: #1e293b;">Verify Your Email Address</h3>
            <p style="color: #475569; line-height: 1.6;">Hi {{fullName}}, click the button below to verify your email address and submit your business application for review.</p>
            <div style="margin: 28px 0;">
              <a href="{{verifyUrl}}" style="background: #16A34A; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Official Email</a>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">Or copy and paste this link: {{verifyUrl}}</p>
          </div>
        </div>`
            },
            {
                slug: 'email_verified',
                name: 'Email Verified',
                subject: 'Email Verified Successfully — GreenWave',
                category: 'auth',
                variables: ['fullName', 'dashboardUrl'],
                text: 'Hi {{fullName}},\n\nYour email address has been verified. Your application has now been placed in the Super Admin review queue.\n{{dashboardUrl}}',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h3 style="color: #16A34A;">Email Confirmed &bull; Application Under Review</h3>
          <p style="color: #475569; line-height: 1.6;">Hi {{fullName}}, thank you for confirming your email. Our platform compliance team is currently reviewing your application.</p>
        </div>`
            },
            {
                slug: 'application_received',
                name: 'Application Received',
                subject: 'GreenWave Business Application Received — #{{applicationId}}',
                category: 'approval',
                variables: ['fullName', 'businessName', 'applicationId'],
                text: 'Hi {{fullName}},\n\nYour application for {{businessName}} (ID: {{applicationId}}) has been received. Our review team typically processes business profiles within 1 business day.',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3 style="color: #1e293b;">Application Received &bull; GreenWave Review Team</h3>
          <p style="color: #475569;">We have received the business application for <strong>{{businessName}}</strong> (Reference: {{applicationId}}).</p>
        </div>`
            },
            {
                slug: 'application_under_review',
                name: 'Application Under Review',
                subject: 'Your GreenWave Account is Under Active Review',
                category: 'approval',
                variables: ['businessName'],
                text: 'Your application for {{businessName}} is currently being assessed by an administrator.',
                html: `<p style="color: #334155;">The application for {{businessName}} is currently undergoing verification.</p>`
            },
            {
                slug: 'additional_info_requested',
                name: 'Additional Information Requested',
                subject: 'Action Required: Additional Information Needed for {{businessName}}',
                category: 'approval',
                variables: ['fullName', 'businessName', 'requestDetails', 'actionUrl'],
                text: 'Hi {{fullName}},\n\nOur platform review team requires additional details for {{businessName}}:\n\n{{requestDetails}}\n\nPlease visit: {{actionUrl}} to update your submission.',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #f59e0b; border-radius: 12px; background: #fffbeb;">
          <h3 style="color: #b45309;">Additional Information Requested</h3>
          <p style="color: #78350f;"><strong>Requested Details:</strong></p>
          <div style="background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #fde68a; margin: 12px 0;">{{requestDetails}}</div>
          <a href="{{actionUrl}}" style="background: #d97706; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">Update Application</a>
        </div>`
            },
            {
                slug: 'application_approved',
                name: 'Application Approved',
                subject: '🎉 Congratulations! Your GreenWave Account for {{businessName}} is Approved',
                category: 'approval',
                variables: ['fullName', 'businessName', 'onboardingUrl'],
                text: 'Hi {{fullName}},\n\nGreat news! Your application for {{businessName}} has been approved. You can now log in and connect your WhatsApp Business Account using Meta Embedded Signup.\n\nGet Started: {{onboardingUrl}}',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #86efac; border-radius: 12px; background: #f0fdf4;">
          <h2 style="color: #15803d; margin-top: 0;">🎉 Application Approved!</h2>
          <p style="color: #166534; line-height: 1.6;">Hi {{fullName}}, we are delighted to inform you that <strong>{{businessName}}</strong> has been approved for access to GreenWave.</p>
          <div style="margin: 24px 0;">
            <a href="{{onboardingUrl}}" style="background: #16a34a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Launch Guided Onboarding</a>
          </div>
        </div>`
            },
            {
                slug: 'application_rejected',
                name: 'Application Rejected',
                subject: 'Update Regarding Your GreenWave Application for {{businessName}}',
                category: 'approval',
                variables: ['fullName', 'businessName', 'rejectionReason', 'supportEmail'],
                text: 'Hi {{fullName}},\n\nThank you for your interest in GreenWave. After careful review, we are unable to approve {{businessName}} at this time.\n\nReason: {{rejectionReason}}\n\nContact: {{supportEmail}}',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fecaca; border-radius: 12px; background: #fef2f2;">
          <h3 style="color: #b91c1c;">Application Status Update</h3>
          <p style="color: #7f1d1d;">Hi {{fullName}}, after review we are unable to approve <strong>{{businessName}}</strong> at this time.</p>
          <p style="color: #7f1d1d;"><strong>Reason provided:</strong> {{rejectionReason}}</p>
          <p style="color: #991b1b; font-size: 13px;">If you believe this is in error, please contact support at {{supportEmail}}.</p>
        </div>`
            },
            {
                slug: 'account_suspended',
                name: 'Account Suspended',
                subject: '⚠️ GreenWave Workspace Suspended — {{businessName}}',
                category: 'security',
                variables: ['businessName', 'reason'],
                text: 'The workspace {{businessName}} has been suspended. Reason: {{reason}}',
                html: `<p style="color: #dc2626;">The workspace {{businessName}} has been suspended due to: {{reason}}.</p>`
            },
            {
                slug: 'account_reactivated',
                name: 'Account Reactivated',
                subject: 'GreenWave Workspace Reactivated — {{businessName}}',
                category: 'security',
                variables: ['businessName'],
                text: 'Your workspace {{businessName}} has been reactivated and messaging is restored.',
                html: `<p style="color: #16a34a;">Your workspace {{businessName}} has been successfully reactivated.</p>`
            },
            {
                slug: 'whatsapp_setup_instructions',
                name: 'WhatsApp Setup Instructions',
                subject: 'Instructions: Connect Your WhatsApp Business Account',
                category: 'whatsapp',
                variables: ['businessName', 'setupUrl'],
                text: 'Step-by-step instructions to connect your official Meta WhatsApp Business number: {{setupUrl}}',
                html: `<p>Follow our guided instructions to onboard your WhatsApp Business Account with Meta: <a href="{{setupUrl}}">Open WhatsApp Setup</a></p>`
            },
            {
                slug: 'embedded_signup_started',
                name: 'Embedded Signup Started',
                subject: 'Meta Embedded Signup Session Initiated',
                category: 'whatsapp',
                variables: ['businessName'],
                text: 'A Meta Embedded Signup session was initiated for {{businessName}}.',
                html: `<p>A Meta Embedded Signup onboarding session has started for {{businessName}}.</p>`
            },
            {
                slug: 'whatsapp_connected',
                name: 'WhatsApp Connected',
                subject: '✅ WhatsApp Account Connected Successfully — {{phoneNumber}}',
                category: 'whatsapp',
                variables: ['businessName', 'phoneNumber', 'wabaId'],
                text: 'Your WhatsApp number {{phoneNumber}} (WABA: {{wabaId}}) is now connected to GreenWave!',
                html: `<div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
          <h3 style="color: #16a34a;">WhatsApp Connected!</h3>
          <p>Phone: <strong>{{phoneNumber}}</strong> &bull; WABA: <code>{{wabaId}}</code></p>
        </div>`
            },
            {
                slug: 'whatsapp_connection_failed',
                name: 'WhatsApp Connection Failed',
                subject: '⚠️ WhatsApp Connection Error for {{businessName}}',
                category: 'whatsapp',
                variables: ['businessName', 'errorMessage'],
                text: 'Connection failed: {{errorMessage}}',
                html: `<p style="color: #dc2626;">WhatsApp connection attempt failed: {{errorMessage}}</p>`
            },
            {
                slug: 'whatsapp_disconnected',
                name: 'WhatsApp Disconnected',
                subject: 'WhatsApp Account Disconnected — {{businessName}}',
                category: 'whatsapp',
                variables: ['businessName', 'phoneNumber'],
                text: 'The WhatsApp number {{phoneNumber}} has been disconnected from GreenWave.',
                html: `<p>The phone number {{phoneNumber}} has been disconnected from {{businessName}}.</p>`
            },
            {
                slug: 'template_submitted',
                name: 'Template Submitted',
                subject: 'Template Submitted to Meta for Review — {{templateName}}',
                category: 'templates',
                variables: ['templateName', 'category'],
                text: 'Your template {{templateName}} ({{category}}) was submitted to Meta for review.',
                html: `<p>Template <strong>{{templateName}}</strong> (Category: {{category}}) has been submitted to Meta.</p>`
            },
            {
                slug: 'template_approved',
                name: 'Template Approved',
                subject: '✅ Meta Approved Your Template — {{templateName}}',
                category: 'templates',
                variables: ['templateName', 'category'],
                text: 'Great news! Meta has approved your template {{templateName}}.',
                html: `<p style="color: #16a34a;">Meta has approved your template <strong>{{templateName}}</strong>!</p>`
            },
            {
                slug: 'template_rejected',
                name: 'Template Rejected',
                subject: '❌ Meta Rejected Your Template — {{templateName}}',
                category: 'templates',
                variables: ['templateName', 'reason'],
                text: 'Meta rejected {{templateName}}. Reason: {{reason}}',
                html: `<p style="color: #dc2626;">Meta rejected template <strong>{{templateName}}</strong>. Reason: {{reason}}</p>`
            },
            {
                slug: 'contact_import_successful',
                name: 'Contact Import Successful',
                subject: 'Contact Import Complete — {{validCount}} contacts imported',
                category: 'contacts',
                variables: ['filename', 'validCount', 'duplicatesCount', 'invalidCount'],
                text: 'Import summary for {{filename}}: {{validCount}} added, {{duplicatesCount}} duplicates skipped, {{invalidCount}} invalid.',
                html: `<p>File {{filename}} processed: {{validCount}} contacts successfully imported.</p>`
            },
            {
                slug: 'campaign_created',
                name: 'Campaign Created',
                subject: 'Campaign Created: {{campaignName}}',
                category: 'campaigns',
                variables: ['campaignName', 'recipientCount'],
                text: 'Campaign {{campaignName}} created with {{recipientCount}} recipients.',
                html: `<p>Campaign <strong>{{campaignName}}</strong> created with {{recipientCount}} recipients.</p>`
            },
            {
                slug: 'campaign_scheduled',
                name: 'Campaign Scheduled',
                subject: 'Campaign Scheduled: {{campaignName}} for {{scheduledTime}}',
                category: 'campaigns',
                variables: ['campaignName', 'scheduledTime', 'recipientCount'],
                text: 'Campaign {{campaignName}} is scheduled to send at {{scheduledTime}} to {{recipientCount}} recipients.',
                html: `<p>Campaign <strong>{{campaignName}}</strong> is scheduled for {{scheduledTime}}.</p>`
            },
            {
                slug: 'campaign_completed',
                name: 'Campaign Completed',
                subject: '🚀 Campaign Completed: {{campaignName}}',
                category: 'campaigns',
                variables: ['campaignName', 'sentCount', 'deliveredCount', 'readCount'],
                text: 'Campaign {{campaignName}} completed! Sent: {{sentCount}}, Delivered: {{deliveredCount}}, Read: {{readCount}}.',
                html: `<div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
          <h3 style="color: #16a34a;">Campaign Completed: {{campaignName}}</h3>
          <p>Sent: {{sentCount}} &bull; Delivered: {{deliveredCount}} &bull; Read: {{readCount}}</p>
        </div>`
            },
            {
                slug: 'campaign_failed',
                name: 'Campaign Failed',
                subject: '⚠️ Campaign Execution Failed: {{campaignName}}',
                category: 'campaigns',
                variables: ['campaignName', 'errorDetails'],
                text: 'Campaign {{campaignName}} encountered a failure: {{errorDetails}}',
                html: `<p style="color: #dc2626;">Campaign {{campaignName}} failed: {{errorDetails}}</p>`
            },
            {
                slug: 'subscription_activated',
                name: 'Subscription Activated',
                subject: 'Subscription Activated: {{planName}} Plan',
                category: 'billing',
                variables: ['businessName', 'planName', 'renewalDate'],
                text: 'Your {{planName}} subscription is active. Renewal date: {{renewalDate}}.',
                html: `<p>Your <strong>{{planName}}</strong> subscription is active. Renewal date: {{renewalDate}}.</p>`
            },
            {
                slug: 'subscription_expiring',
                name: 'Subscription Expiring',
                subject: 'Reminder: Your GreenWave Subscription Expires Soon',
                category: 'billing',
                variables: ['businessName', 'planName', 'expiryDate'],
                text: 'Your subscription for {{businessName}} expires on {{expiryDate}}.',
                html: `<p style="color: #d97706;">Your {{planName}} subscription expires on {{expiryDate}}. Please renew to keep your messaging queues running.</p>`
            },
            {
                slug: 'payment_successful',
                name: 'Payment Successful',
                subject: 'Payment Receipt: ${{amount}} — GreenWave',
                category: 'billing',
                variables: ['invoiceNumber', 'amount', 'date'],
                text: 'Thank you for your payment of ${{amount}} for invoice {{invoiceNumber}}.',
                html: `<p>Payment of <strong>\${{amount}}</strong> received for invoice {{invoiceNumber}} on {{date}}.</p>`
            },
            {
                slug: 'payment_failed',
                name: 'Payment Failed',
                subject: '⚠️ Action Required: Payment Failed for Invoice {{invoiceNumber}}',
                category: 'billing',
                variables: ['invoiceNumber', 'amount', 'retryUrl'],
                text: 'Payment of ${{amount}} for invoice {{invoiceNumber}} failed. Please update your payment method: {{retryUrl}}',
                html: `<p style="color: #dc2626;">Payment for invoice {{invoiceNumber}} failed. Please <a href="{{retryUrl}}">update payment method</a>.</p>`
            },
            {
                slug: 'password_reset',
                name: 'Password Reset',
                subject: 'Reset Your GreenWave Password',
                category: 'auth',
                variables: ['fullName', 'resetUrl'],
                text: 'Hi {{fullName}},\n\nClick the link below to reset your password:\n{{resetUrl}}\n\nThis link expires in 1 hour.',
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h3>Reset Password</h3>
          <p>Hi {{fullName}}, click below to set a new password:</p>
          <a href="{{resetUrl}}" style="background: #16A34A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>`
            },
            {
                slug: 'security_alert',
                name: 'Security Alert',
                subject: '🔒 Security Alert: New Login from {{ipAddress}}',
                category: 'security',
                variables: ['fullName', 'ipAddress', 'timestamp'],
                text: 'A new login to your GreenWave account occurred at {{timestamp}} from IP: {{ipAddress}}.',
                html: `<p style="color: #dc2626;">Security alert: Login from IP {{ipAddress}} at {{timestamp}}.</p>`
            },
            {
                slug: 'onboarding_completed',
                name: 'Onboarding Completed',
                subject: '🎉 Onboarding Complete! Welcome to GreenWave Messaging',
                category: 'onboarding',
                variables: ['businessName'],
                text: 'Congratulations! {{businessName}} has finished all guided onboarding steps. You are ready to run campaigns and manage customer conversations.',
                html: `<div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
          <h2 style="color: #16a34a;">Onboarding Complete!</h2>
          <p>Congratulations, {{businessName}} is fully configured and ready for live WhatsApp engagement.</p>
        </div>`
            }
        ];
        for (const t of templates) {
            db.execute(`INSERT INTO email_templates (id, name, slug, subject, html_content, text_content, category, variables_json, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [uuidv4(), t.name, t.slug, t.subject, t.html, t.text, t.category, JSON.stringify(t.variables), now, now]);
        }
    }
}
