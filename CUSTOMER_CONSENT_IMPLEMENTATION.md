# Customer Consent Tracking & Auditable Compliance Implementation

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Governing Laws:** Digital Personal Data Protection Act (DPDPA 2023 §6), GDPR Article 7  

---

## 1. Regulatory Requirements for Valid Consent

Under DPDPA 2023 and GDPR, legal consent for commercial software contracts and personal data processing must be:
- **Freely Given:** Not bundled ambiguously or pre-checked.
- **Specific & Informed:** Clear identification of policy versions (`terms_and_conditions` v2.0, `privacy_policy` v2.0).
- **Unambiguous:** Expressed through affirmative physical action (checking an explicit checkbox).
- **Verifiable & Auditable:** The data fiduciary/processor must be capable of demonstrating proof of consent with immutable audit trails.

---

## 2. Technical Architecture & Database Design

Consent records are stored in the dedicated MySQL table `policy_consents`:

```sql
CREATE TABLE IF NOT EXISTS policy_consents (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  policy_name VARCHAR(64) NOT NULL,
  policy_version VARCHAR(32) NOT NULL,
  accepted_at VARCHAR(64) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(512) NULL,
  consent_category VARCHAR(64) DEFAULT 'essential',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_pc_user (user_id),
  INDEX idx_pc_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. Registration Workflow & Ingestion Implementation

When a new business customer registers at `/register`:
1. **Frontend Form Enforcement:** The UI presents two distinct policy links and requires checking the affirmative consent box before enabling the registration submission button:
   - "I have read and agree to the MetaGreenWave Terms of Service (v2.0) and Privacy Policy (v2.0) operated by Digi8 Solutions."
2. **Backend Transaction Execution (`server/src/routes/auth.routes.ts`):**
   ```ts
   // Record explicit auditable legal consent records
   const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
   const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';

   // 1. Consent for Terms of Service
   db.execute(
     `INSERT INTO policy_consents
      (id, user_id, organization_id, policy_name, policy_version, accepted_at, ip_address, user_agent, consent_category)
      VALUES (?, ?, ?, 'terms_and_conditions', 'v2.0', ?, ?, ?, 'essential')`,
     [uuidv4(), userId, orgId, now, clientIp, userAgent]
   );

   // 2. Consent for Privacy Policy
   db.execute(
     `INSERT INTO policy_consents
      (id, user_id, organization_id, policy_name, policy_version, accepted_at, ip_address, user_agent, consent_category)
      VALUES (?, ?, ?, 'privacy_policy', 'v2.0', ?, ?, ?, 'essential')`,
     [uuidv4(), userId, orgId, now, clientIp, userAgent]
   );
   ```

---

## 4. Policy Version Management & Re-Consent

1. When policies undergo substantive updates (e.g. v2.0 to v3.0):
   - A new policy version banner is triggered upon next user login.
   - The user must review and accept the updated terms.
   - A new row is appended to `policy_consents` retaining the historical audit record.
2. Consent records are never updated in place or overwritten. Every record represents an immutable, timestamped legal event.

---

## 5. Verification & Compliance Audit

To inspect consent records for regulatory compliance or data subject inquiries:
```sql
SELECT
  pc.id,
  u.email AS user_email,
  o.name AS organization_name,
  pc.policy_name,
  pc.policy_version,
  pc.accepted_at,
  pc.ip_address,
  pc.user_agent
FROM policy_consents pc
JOIN users u ON pc.user_id = u.id
JOIN organizations o ON pc.organization_id = o.id
ORDER BY pc.accepted_at DESC;
```
