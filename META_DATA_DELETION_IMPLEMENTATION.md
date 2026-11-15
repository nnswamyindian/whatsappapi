# Meta Data Deletion & Privacy Rights Technical Implementation

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Compliance Standards:** Meta Platform Terms §3.b, GDPR Article 17, DPDPA 2023 §12  

---

## 1. Overview & Architecture

Meta's Platform Policies strictly require all applications utilizing Facebook Login or Embedded Signup to provide:
1. An automated **Data Deletion Callback URL** capable of parsing and verifying Meta's cryptographic `signed_request`.
2. A publicly accessible **Data Deletion Instructions URL** where users can self-serve deletion requests and check processing status without requiring login credentials.

MetaGreenWave implements a dual-channel data deletion engine backed by the `data_deletion_requests` relational table in MySQL.

---

## 2. Dual-Channel Deletion Flow

```
                      +---------------------------------------+
                      |       Meta User Settings or Web       |
                      +---------------------------------------+
                                     /         \
                 Meta Signed Request /           \ Self-Service Form
                                    v             v
       [POST /api/v1/meta/data-deletion]       [POST /api/v1/meta/data-deletion/request]
                     |                                       |
        HMAC-SHA256 Verification                            Validate Email & Input
                     |                                       |
        Disconnect & Invalidate WABA                         Generate Confirmation Code
                     \                                       /
                      \                                     /
                       v                                   v
                   +-------------------------------------------+
                   |  INSERT into data_deletion_requests       |
                   |  status = 'completed' or 'PENDING'        |
                   +-------------------------------------------+
                                         |
                                         v
                         Public Real-Time Status Lookup
                     [GET /api/v1/meta/data-deletion/status/:code]
```

---

## 3. Meta Signed Request Callback Specification

### 3.1 Endpoint
- **URL:** `POST https://metagreenwave.com/api/v1/meta/data-deletion`
- **Authentication:** Meta `signed_request` body parameter (Base64URL encoded signature and JSON payload).

### 3.2 Cryptographic Verification Algorithm
1. Split `signed_request` into `encoded_sig` and `payload`.
2. Decode `encoded_sig` using Base64URL to raw buffer.
3. Decode `payload` using Base64URL to JSON string and parse into object `{ user_id, algorithm }`.
4. Calculate expected HMAC-SHA256 signature using `META_APP_SECRET` against the raw `payload` string.
5. Perform constant-time cryptographic comparison:
   ```ts
   crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
   ```
6. If invalid, reject immediately with HTTP 400.

### 3.3 Deletion Execution
- Generates a unique tracking `confirmation_code` (`DEL-[TIMESTAMP]-[RANDOM]`).
- Disconnects any active `whatsapp_connections` matching the Meta `user_id`.
- Records a row in `data_deletion_requests` with `status = 'completed'`.
- Returns Meta-compliant JSON response:
  ```json
  {
    "url": "https://metagreenwave.com/data-deletion",
    "confirmation_code": "DEL-ABC12345DEF"
  }
  ```

---

## 4. Public Self-Service Portal (`/data-deletion`)

Users who do not use Facebook directly or who wish to delete their entire customer account can visit `https://metagreenwave.com/data-deletion`:
1. **Submit Request (`POST /api/v1/meta/data-deletion/request`):**
   - Inputs: Name, Email, Phone/WABA ID, Reason.
   - Creates a pending record in `data_deletion_requests` with status `PENDING`.
   - Records an immutable audit log entry in `audit_logs`.
   - Displays confirmation code and tracking instructions to the user.
2. **Track Status (`GET /api/v1/meta/data-deletion/status/:code`):**
   - Publicly accessible without authentication.
   - Returns request status (`PENDING`, `in_progress`, `completed`), creation timestamp, and completion timestamp.
   - Strictly redacts private personal details to prevent information disclosure.

---

## 5. Database Schema (`data_deletion_requests`)

```sql
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id VARCHAR(64) PRIMARY KEY,
  confirmation_code VARCHAR(64) NOT NULL UNIQUE,
  request_type ENUM('meta_callback', 'user_portal', 'admin_manual') NOT NULL,
  requester_name VARCHAR(255) NULL,
  requester_email VARCHAR(255) NULL,
  organization_name VARCHAR(255) NULL,
  account_identifier VARCHAR(255) NULL,
  user_id VARCHAR(64) NULL,
  meta_user_id VARCHAR(64) NULL,
  request_details TEXT NULL,
  status ENUM('PENDING', 'in_progress', 'completed', 'rejected') DEFAULT 'PENDING',
  created_at VARCHAR(64) NOT NULL,
  completed_at VARCHAR(64) NULL,
  INDEX idx_ddr_code (confirmation_code),
  INDEX idx_ddr_email (requester_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Audit & Automated Purging

When a deletion request is executed:
1. Associated user account records are anonymized or removed.
2. Encrypted WhatsApp credentials in `whatsapp_connections` are set to `NULL`.
3. Contact lists and recipient profiles in `contacts` are permanently deleted.
4. An immutable audit record is logged: `action = 'DATA_DELETION_EXECUTED'`.
