# MetaGreenWave Legal and Policy Compliance Analysis

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Governing Regulations:** DPDPA 2023 (India), GDPR (EU), CCPA (California), Meta Platform Terms  
**Policy Version:** 2.0 (November 2026)  

---

## 1. Regulatory Context & Framework

As a multi-tenant business messaging SaaS platform operating globally and powered by Digi8 Solutions, MetaGreenWave must maintain comprehensive alignment across four primary regulatory and contractual pillars:
1. **Digital Personal Data Protection Act (DPDPA 2023 - India):** Notice, purpose limitation, data fiduciary/processor roles, right to erasure, auditable consent records.
2. **General Data Protection Regulation (GDPR - EU):** Lawful basis for processing, data subject rights (access, rectification, erasure), processor contractual terms, technical and organizational measures (TOMs).
3. **California Consumer Privacy Act (CCPA):** Notice at collection, "Do Not Sell or Share My Personal Information" disclosure, deletion rights.
4. **Meta WhatsApp Platform & Commerce Policies:** Opt-in requirements, spam prohibitions, 24-hour service window compliance, acceptable use guidelines.

---

## 2. Policy-by-Policy Compliance Mapping

### 2.1 Privacy Policy (`/privacy-policy`, `/privacy`)
- **Controller vs. Processor Distinction:** Explicitly delineates that Digi8 Solutions acts as a **Data Controller** for customer administrative account details and a **Data Processor** for recipient contacts and message payloads dispatched on behalf of customer businesses.
- **Lawful Basis & Opt-In:** Mandates that customers secure affirmative, prior consent from recipients before uploading numbers or scheduling campaigns.
- **Security Disclosures:** Documents AES-256-GCM encryption for Meta Cloud API credentials and salted SHA-256 hashing for passwords and transactional OTPs.
- **Data Subject Rights:** Outlines mechanisms for access, rectification, portability, and permanent erasure via the Data Deletion Portal.

### 2.2 Terms of Service (`/terms-of-service`, `/terms`)
- **Contractual Scope:** Binds customer businesses to Digi8 Solutions governing commercial usage.
- **Meta Policy Incorporation:** Formally binds customers to Meta WhatsApp Business Messaging Policy and WhatsApp Commerce Policy.
- **Approval & Super Admin Rights:** Reserves Digi8 Solutions' authority to vet, approve, or terminate customer accounts failing compliance or incurring RED sender ratings.
- **Disclaimer of Endorsement:** Clear legal disclaimer that MetaGreenWave is an independent platform not sponsored or endorsed by Meta Platforms, Inc.

### 2.3 Acceptable Use Policy (`/acceptable-use`)
- **Prohibited Verticals:** Explicitly bans unsolicited mass spam, counterfeit goods, illegal gambling, regulated weapons, illicit substances, and deceptive multi-level schemes.
- **Suppression Blacklists:** Details the mandatory, automated execution of recipient opt-out keywords ("STOP", "UNSUBSCRIBE").
- **Quality Tier Degradation:** Establishes automatic campaign pausing upon phone number quality degradation.

### 2.4 Cookie Policy (`/cookies`)
- **Data Minimization:** Documents strictly necessary session authentication cookies (`gw_token`, `gw_active_org_id`).
- **No Third-Party Ad Trackers:** Explicit disclosure that no advertising pixels, data-brokering beacons, or behavioral tracking scripts exist on the platform.

### 2.5 Cancellation & Refund Policy (`/cancellation-refund`)
- **Subscription Cycles:** Defines monthly and annual SaaS license cancellations and prorated terms.
- **Prepaid Messaging Wallet:** Outlines written refund procedures for unused prepaid funds during account termination.
- **Non-Refundable Meta Conversation Fees:** Establishes that third-party network conversation fees delivered through Meta Cloud API are consumed and strictly non-refundable.

---

## 3. Mandatory User Consent Capture Implementation

Compliance with DPDPA and GDPR requires explicit, affirmative consent that cannot be implied:
1. **Registration Checkbox:** During onboarding registration, customers must actively check the agreement box before submitting.
2. **Database Persistence:** The server records explicit consent rows in the `policy_consents` table inside the registration database transaction:
   - `user_id`: Registered administrator ID.
   - `organization_id`: Created workspace ID.
   - `policy_name`: `terms_and_conditions` and `privacy_policy`.
   - `policy_version`: `v2.0`.
   - `accepted_at`: ISO timestamp.
   - `ip_address`: Remote client IP address.
   - `user_agent`: Client browser signature.
3. **Immutability:** Consent records are immutable and retained for regulatory audit verification.
