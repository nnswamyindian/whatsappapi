# Meta App Dashboard Step-by-Step Configuration Guide

**Application:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Target Environment:** Meta Developer Dashboard (`developers.facebook.com`)  

---

## 1. Overview

This guide details the precise configurations required inside the **Meta Developer Dashboard** to connect your Meta App to the live **MetaGreenWave by Digi8 Solutions** platform.

---

## 2. Step 1: Create or Select Business App

1. Log in to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** &gt; **Create App**.
3. Select **Other** &gt; click **Next**.
4. Select App Type: **Business** &gt; click **Next**.
5. Set:
   - **App Name:** `MetaGreenWave`
   - **App Contact Email:** `hello@digi8solutions.com`
   - **Business Portfolio:** Select your verified Digi8 Solutions Business Account.
6. Click **Create App**.

---

## 3. Step 2: Configure Basic Settings

Navigate to **App Settings** &gt; **Basic**:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **App Domains** | `metagreenwave.com` | Primary production domain |
| **Privacy Policy URL** | `https://metagreenwave.com/privacy-policy` | Must be live and HTTPS |
| **Terms of Service URL** | `https://metagreenwave.com/terms-of-service` | Must be live and HTTPS |
| **User Data Deletion** | Select **Data Deletion Callback URL** | Provide both fields |
| **Data Deletion Callback URL** | `https://metagreenwave.com/api/v1/meta/data-deletion` | Receives signed requests from Meta |
| **Data Deletion Instructions URL** | `https://metagreenwave.com/data-deletion` | Public portal for users |
| **App Icon** | Upload 1024 x 1024 px PNG | Professional MetaGreenWave logo |
| **Category** | Business and Pages | General business messaging |
| **Business Verification** | Link to Digi8 Solutions Business Portfolio | Required for Live mode |

*Click **Save Changes**.*

---

## 4. Step 3: Add & Configure WhatsApp Product

1. In the left navigation menu, click **Add Product** &gt; locate **WhatsApp** &gt; click **Set Up**.
2. Navigate to **WhatsApp** &gt; **Configuration**:
   - **Webhook Callback URL:** `https://metagreenwave.com/api/v1/webhooks/whatsapp`
   - **Verify Token:** Enter the value from your server `.env` (`META_WEBHOOK_VERIFY_TOKEN`).
   - Click **Verify and Save**. (Meta sends a GET challenge handshake which MetaGreenWave automatically verifies with HTTP 200).
3. **Webhook Field Subscriptions:**
   Click **Manage** next to Webhook Fields and subscribe to:
   - `messages` (Mandatory: incoming chats and delivery receipts)
   - `message_template_status_update` (Mandatory: template approvals/rejections)
   - `phone_number_quality_update` (Mandatory: quality rating changes)
   - `account_review_update` (Recommended)

---

## 5. Step 4: Configure WhatsApp Embedded Signup v4

1. Under WhatsApp in the left menu, navigate to **Quickstart** or **Embedded Signup Configuration**.
2. Create or configure a new Embedded Signup setup:
   - Note the resulting **Configuration ID** (e.g. `987654321012345`).
   - Copy this value into `META_CONFIG_ID` in your server `.env`.
3. In Facebook Login for Business settings:
   - Enable **Login with JavaScript SDK**.
   - Allowed Domains for JavaScript SDK: Add `https://metagreenwave.com`.

---

## 6. Step 5: App Review & Live Mode Switch

1. Navigate to **App Review** &gt; **Permissions and Features**.
2. Request Advanced Access for:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
3. Provide the review details and screen recordings documented in `META_APP_REVIEW_GUIDE.md`.
4. Once approved, toggle the **App Mode** switch at the top of the dashboard from **Development** to **Live**.
