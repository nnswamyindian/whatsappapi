# Meta App Review Guide for MetaGreenWave

**Application:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Target Permissions:** `whatsapp_business_management`, `whatsapp_business_messaging`  
**Purpose:** App Review Submission & Business Verification  

---

## 1. Overview

To move a Meta App from Development mode to Live mode and allow any business to connect their WABA via Embedded Signup, Meta requires formal **App Review** and **Business Verification**. This guide provides the complete documentation, step-by-step submission instructions, permission justifications, and testing procedures.

---

## 2. Business Verification Prerequisites

Before submitting for App Review:
1. **Meta Business Portfolio (Business Manager):** Must be verified under Digi8 Solutions.
2. **Legal Business Name:** Digi8 Solutions.
3. **Official Website:** Must be live, HTTPS-enabled, and prominently display Digi8 Solutions and MetaGreenWave branding.
4. **Official Email Domain:** Use an email address matching your verified business domain (e.g. `hello@digi8solutions.com`).
5. **Business Documents:** Proof of legal business registration (e.g. Certificate of Incorporation, GST Registration, or Business Tax Document) and utility bill/bank statement matching legal address.

---

## 3. Required Permissions & Review Justifications

### 3.1 `whatsapp_business_management`
- **Why your app needs this permission:**
  "MetaGreenWave is a WhatsApp Business messaging platform operated by Digi8 Solutions. We need `whatsapp_business_management` to allow business owners to onboard their WhatsApp Business Accounts (WABAs) via official Embedded Signup. This permission enables our platform to read business phone numbers, verified names, sender quality ratings, and message template libraries, as well as automatically subscribe the business to webhooks for message delivery receipts."
- **How users experience this feature:**
  "The business owner logs in to MetaGreenWave and navigates to the Integrations dashboard. They click 'Launch Meta WhatsApp Embedded Signup' to link their WABA via Facebook Login for Business. Upon completion, MetaGreenWave retrieves their registered phone number, verified business name, and message templates so the user can manage communications inside our dashboard."

### 3.2 `whatsapp_business_messaging`
- **Why your app needs this permission:**
  "MetaGreenWave requires `whatsapp_business_messaging` to send and receive WhatsApp messages on behalf of our customer businesses using the official Meta WhatsApp Cloud API. This allows our customers to dispatch approved template messages (e.g., transactional order updates, account notifications) and communicate with end-users in real time through our two-way shared team inbox within the 24-hour customer service window."
- **How users experience this feature:**
  "Once onboarded, business users can compose broadcasts using Meta-approved templates or respond directly to incoming customer service inquiries inside the MetaGreenWave shared inbox. Inbound messages and delivery status webhooks (sent, delivered, read) update in real time via Server-Sent Events (SSE)."

---

## 4. Test User & Demo Credentials for Reviewers

Provide Meta reviewers with dedicated test credentials:
- **Application URL:** `https://metagreenwave.com`
- **Test Reviewer Account:**
  - Email: `meta_reviewer@digi8solutions.com`
  - Password: `[SecureReviewerPassword#2026]`
- **Instructions for Reviewers:**
  1. Navigate to `https://metagreenwave.com/login`.
  2. Enter the reviewer credentials provided above.
  3. Navigate to **Integrations** (`https://metagreenwave.com/integrations`).
  4. View the "Meta WhatsApp Cloud API" section and click "Launch Meta WhatsApp Embedded Signup v4" to test the Facebook Login flow.
  5. Navigate to **Inbox** (`https://metagreenwave.com/inbox`) to see the two-way messaging interface.
  6. Navigate to **Campaigns** (`https://metagreenwave.com/campaigns`) to view template dispatch workflows.

---

## 5. Screen Recording Requirements

Meta App Review requires high-quality video screen recordings demonstrating the user journey for each requested permission:

### Recording 1: WhatsApp Embedded Signup (`whatsapp_business_management`)
- **Duration:** 1 to 2 minutes.
- **Steps to Show:**
  1. Start on the MetaGreenWave Integrations dashboard (`/integrations`).
  2. Point out that the workspace is currently disconnected.
  3. Click "Launch Meta WhatsApp Embedded Signup v4".
  4. Show the Meta Facebook Login popup opening with official Meta branding.
  5. Walk through selecting the Business Portfolio and WABA.
  6. Complete the flow and show the popup closing.
  7. Show the MetaGreenWave UI automatically updating to show the connected status, real WABA ID, Phone Number ID, and verified business name.
  8. Click "Refresh Meta Data" to show telemetry retrieval.

### Recording 2: Cloud API Messaging & Shared Inbox (`whatsapp_business_messaging`)
- **Duration:** 1 to 2 minutes.
- **Steps to Show:**
  1. Open the MetaGreenWave Shared Inbox (`/inbox`).
  2. Send a WhatsApp message from a physical mobile phone to the registered business number.
  3. Show the message appearing live in the MetaGreenWave agent inbox via webhook.
  4. Type a reply from the agent inbox and send it.
  5. Show the reply received on the mobile phone, demonstrating two-way 24-hour customer service messaging.
  6. Show read receipts and delivery statuses updating in real time.

---

## 6. Public Compliance URLs Required by Reviewers

Ensure all URLs are active, HTTPS-enabled, and match what is configured in App Settings:
- **Privacy Policy URL:** `https://metagreenwave.com/privacy-policy`
- **Terms of Service URL:** `https://metagreenwave.com/terms-of-service`
- **User Data Deletion Callback URL:** `https://metagreenwave.com/api/v1/meta/data-deletion`
- **User Data Deletion Instructions URL:** `https://metagreenwave.com/data-deletion`

---

## 7. Submission Checklist

- [ ] Digi8 Solutions Business Verification completed in Meta Business Manager.
- [ ] Meta App icon (1024x1024 px) uploaded.
- [ ] Business privacy policy and terms of service URLs confirmed live and accessible.
- [ ] User data deletion callback and instructions URLs verified.
- [ ] Test reviewer account created and verified.
- [ ] Screen recordings recorded and uploaded (MP4 format).
- [ ] Permission justifications copied into submission fields.
