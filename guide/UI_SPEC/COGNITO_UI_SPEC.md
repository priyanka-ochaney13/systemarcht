# AWS Cognito User Pools - Frontend UI Specification

## Overview
This document defines the exact UI behavior and backend integration for the AWS Cognito User Pools pricing calculator. Cognito pricing is based on Monthly Active Users (MAU) and authentication requests, with optional advanced features.

---

## UI Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔐 AWS Cognito User Pools Configuration              ┃
┚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 Region
   [Asia Pacific (Mumbai) ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 MONTHLY ACTIVE USERS (MAU)

   [1,000,000                                        ]
   users per month
   💡 Free: First 50,000 MAUs
      Paid: $0.004/user/month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 AUTHENTICATION REQUESTS

   Sign-Ups per Month
   [10,000                                          ]
   requests per month

   ────────────────────────────────────────────────

   Sign-Ins per Month
   [100,000                                         ]
   requests per month

   ────────────────────────────────────────────────

   Token Refreshes per Month
   [50,000                                          ]
   requests per month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ MULTI-FACTOR AUTHENTICATION (MFA) (Collapsible)

   [✓] Enable MFA
   
   MFA Type
   (•) SMS MFA        $0.00248 per SMS
   ( ) Email MFA      FREE (uses AWS SES)
   ( ) Auth App       FREE (TOTP)

   ────────────────────────────────────────────────

   Percentage of Users with MFA
   [30                                             ]
   percent (0-100)

   💡 MFA cost = MAU × percentage × rate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  ADVANCED SECURITY (Collapsible)

   [✓] Enable Advanced Security
   
   Risk-Evaluated Logins per Month
   [100,000                                         ]
   logins per month
   Cost: $0.01 per login (first 1M free)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 ADDITIONAL FEATURES (Collapsible)

   [✓] Custom Domain
       Cost: $0.50/month

   ────────────────────────────────────────────────

   [✓] Email Customization (From Cognito)
       Cost: $0.00003 per email
       Monthly Emails: [50,000           ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ESTIMATED MONTHLY COST

   ┌────────────────────────────────────┐
   │ MAU Charges:          $X.XX        │
   │ SMS MFA:              $X.XX        │
   │ Advanced Security:    $X.XX        │
   │ Custom Domain:        $X.XX        │
   │ Email Customization:  $X.XX        │
   │ ──────────────────────────────────│
   │ TOTAL:               $X.XX/month   │
   │ Free Tier Savings:   -$X.XX        │
   └────────────────────────────────────┘

   [  Calculate  ]     [  Reset  ]     [  Add to Estimate  ]
```

---

## Field Specifications

### 1. Region Dropdown
- **Label:** "📍 Region"
- **Type:** Dropdown (searchable)
- **Default:** Asia Pacific (Mumbai)
- **Required:** Yes
- **Options:** All AWS regions where Cognito is available (see backend mapping)
- **Backend Mapping:**
  ```javascript
  {
    "US East (N. Virginia)": "us-east-1",
    "US East (Ohio)": "us-east-2",
    "US West (N. California)": "us-west-1",
    "US West (Oregon)": "us-west-2",
    "Asia Pacific (Mumbai)": "ap-south-1",
    "Asia Pacific (Sydney)": "ap-southeast-2",
    "EU (Ireland)": "eu-west-1",
    "EU (Frankfurt)": "eu-central-1"
  }
  ```

---

### 2. Monthly Active Users (MAU)
- **Label:** "👥 MONTHLY ACTIVE USERS (MAU)"
- **Type:** Number input with formatting
- **Default:** 1,000,000
- **Min:** 0
- **Max:** No limit
- **Required:** Yes
- **Unit Display:** "users per month"
- **Format:** Comma-separated thousands (1,000,000)
- **Tooltip:** "Unique users who have authenticated in the month"
- **Note:** "💡 Free: First 50,000 MAUs | Paid: $0.004/user/month"
- **Pricing:**
  - Free Tier: 50,000 MAUs/month
  - Paid: $0.004 per MAU
  - Formula: `max(0, mau - 50000) × $0.004`

---

### 3. Sign-Ups per Month
- **Label:** "Sign-Ups per Month"
- **Type:** Number input
- **Default:** 10,000
- **Min:** 0
- **Required:** Yes
- **Unit Display:** "requests per month"
- **Tooltip:** "New user registrations"
- **Note:** "Counted as part of authentication requests"

---

### 4. Sign-Ins per Month
- **Label:** "Sign-Ins per Month"
- **Type:** Number input
- **Default:** 100,000
- **Min:** 0
- **Required:** Yes
- **Unit Display:** "requests per month"
- **Tooltip:** "User authentications with credentials"
- **Note:** "Each login counts as one request"

---

### 5. Token Refreshes per Month
- **Label:** "Token Refreshes per Month"
- **Type:** Number input
- **Default:** 50,000
- **Min:** 0
- **Required:** Yes
- **Unit Display:** "requests per month"
- **Tooltip:** "Refresh token usage to get new access tokens"
- **Note:** "No direct charge, but counts in analytics"

---

### 6. MFA (Multi-Factor Authentication) Toggle & Settings
- **Label:** "🛡️ MULTI-FACTOR AUTHENTICATION (MFA)"
- **Type:** Collapsible section with checkbox
- **Default:** Unchecked (false)
- **Required:** No

#### Sub-fields (when enabled):

**6a. MFA Type Radio Buttons**
- **Label:** "MFA Type"
- **Type:** Radio buttons
- **Options:**
  | Display | Value | Cost | Note |
  |---------|-------|------|------|
  | SMS MFA | `sms` | $0.00248 per SMS | Most common |
  | Email MFA | `email` | FREE | Uses AWS SES |
  | Auth App | `totp` | FREE | TOTP/Authenticator |
- **Default:** SMS
- **Backend Value:** Send selected type

**6b. Percentage of Users with MFA**
- **Label:** "Percentage of Users with MFA"
- **Type:** Number input (slider optional)
- **Default:** 30
- **Min:** 0
- **Max:** 100
- **Unit Display:** "percent"
- **Required:** No (if MFA disabled)
- **Validation:** Must be 0-100
- **Formula:** `mau × (percentage / 100) × rate_per_sms × average_smses_per_user`

---

### 7. Advanced Security Toggle & Settings
- **Label:** "⚠️ ADVANCED SECURITY"
- **Type:** Collapsible section with checkbox
- **Default:** Unchecked (false)
- **Required:** No
- **Warning:** "⚠️ Provides adaptive authentication and account takeover protection"

#### Sub-fields (when enabled):

**7a. Risk-Evaluated Logins per Month**
- **Label:** "Risk-Evaluated Logins per Month"
- **Type:** Number input
- **Default:** 100,000
- **Min:** 0
- **Required:** No (if feature disabled)
- **Unit Display:** "logins per month"
- **Tooltip:** "Risk-evaluated login events trigger advanced security checks"
- **Note:** "💡 First 1M evaluations FREE | Paid: $0.01/evaluation"
- **Pricing:**
  - Free Tier: 1,000,000 evaluations/month
  - Paid: $0.01 per evaluation
  - Formula: `max(0, evaluations - 1000000) × $0.01`

---

### 8. Custom Domain Toggle
- **Label:** "🎨 ADDITIONAL FEATURES"
- **Type:** Checkbox
- **Default:** Unchecked (false)
- **Required:** No
- **Cost:** $0.50/month (flat)
- **Note:** "Custom domain for hosted UI (e.g., auth.yourdomain.com)"

---

### 9. Email Customization Toggle & Count
- **Label:** "Email Customization (From Cognito)"
- **Type:** Checkbox + Number input
- **Default:** Unchecked, 0 emails
- **Required:** No
- **Cost:** $0.00003 per email (SES rates)

#### Sub-field (when enabled):

**9a. Monthly Emails Sent**
- **Label:** "Monthly Emails Sent"
- **Type:** Number input
- **Default:** 50,000
- **Min:** 0
- **Unit Display:** "emails per month"
- **Tooltip:** "Verification codes, password resets, welcome emails"
- **Note:** "First email per user per day is FREE"
- **Pricing:**
  - Free: First email per user per day
  - Paid: $0.00003 per additional email
  - Simplified: Budget `emails_count × $0.00003`

---

## Pricing Formulas

### MAU Charges
```
Free Tier: 50,000 users/month
Rate: $0.004 per user/month

Formula:
  billable_mau = max(0, mau - 50000)
  cost = billable_mau × $0.004

Example:
  1,000,000 MAU:
  billable = 1,000,000 - 50,000 = 950,000
  cost = 950,000 × $0.004 = $3,800/month
```

### SMS MFA Charges
```
Rate: $0.00248 per SMS
Assume: 1 SMS per MFA user per month average

Formula:
  annual_mau = mau (unique monthly users)
  mfa_users = annual_mau × (mfa_percentage / 100)
  sms_sent = mfa_users × 12 / 12 = mfa_users per month
  cost = sms_sent × $0.00248

Example:
  1,000,000 MAU, 30% with SMS MFA:
  mfa_users = 1,000,000 × 0.30 = 300,000
  cost = 300,000 × $0.00248 = $744/month
```

### Advanced Security Charges
```
Free Tier: 1,000,000 evaluations/month
Rate: $0.01 per evaluation

Formula:
  billable_evaluations = max(0, risk_evaluations - 1000000)
  cost = billable_evaluations × $0.01

Example:
  2,000,000 risk-evaluated logins:
  billable = 2,000,000 - 1,000,000 = 1,000,000
  cost = 1,000,000 × $0.01 = $10,000/month
```

### Custom Domain Charges
```
Price: Flat $0.50/month
No calculations needed - add when enabled
```

### Email Customization Charges
```
Rate: $0.00003 per email (after first per user per day)
Simplified: All emails charged

Formula:
  cost = total_monthly_emails × $0.00003

Example:
  50,000 emails/month:
  cost = 50,000 × $0.00003 = $1.50/month
```

---

## Backend API Integration

### Endpoint
```
POST /api/cognito/calculate
```

### Request Payload
```json
{
  "region": "ap-south-1",
  "mau": 1000000,
  "signups_per_month": 10000,
  "signins_per_month": 100000,
  "token_refreshes_per_month": 50000,
  "mfa_enabled": true,
  "mfa_type": "sms",
  "mfa_percentage": 30,
  "advanced_security_enabled": true,
  "risk_evaluated_logins": 100000,
  "custom_domain_enabled": true,
  "email_customization_enabled": true,
  "monthly_emails": 50000
}
```

### Request Field Details
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `region` | string | Yes | - | AWS region code |
| `mau` | integer | Yes | - | Monthly Active Users |
| `signups_per_month` | integer | Yes | - | New user registrations |
| `signins_per_month` | integer | Yes | - | User logins |
| `token_refreshes_per_month` | integer | Yes | - | Token refresh requests |
| `mfa_enabled` | boolean | No | false | Enable MFA |
| `mfa_type` | string | No | `sms` | MFA type: sms, email, totp |
| `mfa_percentage` | integer | No | 0 | % of users with MFA |
| `advanced_security_enabled` | boolean | No | false | Enable advanced security |
| `risk_evaluated_logins` | integer | No | 0 | Risk-evaluated logins |
| `custom_domain_enabled` | boolean | No | false | Enable custom domain |
| `email_customization_enabled` | boolean | No | false | Enable email customization |
| `monthly_emails` | integer | No | 0 | Emails sent per month |

### Response Format
```json
{
  "service": "cognito",
  "breakdown": {
    "total_cost": 4555.50,
    "mau_charge": 3800.00,
    "sms_mfa_charge": 744.00,
    "advanced_security_charge": 10.00,
    "custom_domain_charge": 0.50,
    "email_customization_charge": 1.50,
    "free_tier_savings": 1050.00
  },
  "details": {
    "mau": 1000000,
    "billable_mau": 950000,
    "mfa_users": 300000,
    "risk_evaluated_logins": 100000,
    "billable_evaluations": 0,
    "monthly_emails": 50000
  }
}
```

### Example Response 1: Small App (Within Free Tier)
```json
{
  "service": "cognito",
  "breakdown": {
    "total_cost": 0.50,
    "mau_charge": 0.00,
    "sms_mfa_charge": 0.00,
    "advanced_security_charge": 0.00,
    "custom_domain_charge": 0.50,
    "email_customization_charge": 0.00,
    "free_tier_savings": 0.00
  },
  "details": {
    "mau": 30000,
    "billable_mau": 0,
    "mfa_users": 0,
    "risk_evaluated_logins": 0,
    "billable_evaluations": 0,
    "monthly_emails": 0
  }
}
```

### Example Response 2: Large App (Heavy Usage)
```json
{
  "service": "cognito",
  "breakdown": {
    "total_cost": 5600.00,
    "mau_charge": 4800.00,
    "sms_mfa_charge": 960.00,
    "advanced_security_charge": 0.00,
    "custom_domain_charge": 0.50,
    "email_customization_charge": 39.50,
    "free_tier_savings": 50000.00
  },
  "details": {
    "mau": 1200000,
    "billable_mau": 1150000,
    "mfa_users": 400000,
    "risk_evaluated_logins": 500000,
    "billable_evaluations": 0,
    "monthly_emails": 1315000
  }
}
```

---

## Validation Rules

### Frontend Validation
```javascript
const validationRules = {
  region: {
    required: true,
    type: "string"
  },
  mau: {
    required: true,
    min: 0,
    type: "integer",
    error: "MAU must be non-negative"
  },
  signups_per_month: {
    required: true,
    min: 0,
    type: "integer",
    error: "Sign-ups must be non-negative"
  },
  signins_per_month: {
    required: true,
    min: 0,
    type: "integer",
    error: "Sign-ins must be non-negative"
  },
  token_refreshes_per_month: {
    required: true,
    min: 0,
    type: "integer",
    error: "Token refreshes must be non-negative"
  },
  mfa_percentage: {
    min: 0,
    max: 100,
    type: "integer",
    error: "MFA percentage must be 0-100"
  },
  risk_evaluated_logins: {
    min: 0,
    type: "integer",
    error: "Risk logins must be non-negative"
  },
  monthly_emails: {
    min: 0,
    type: "integer",
    error: "Emails must be non-negative"
  }
};
```

### Warning Conditions
1. **High MAU:** Show warning when `mau > 5000000`
   - Message: "💡 At this scale, consider AWS Organizations for volume discounts"

2. **SMS MFA High Cost:** Show warning when `sms_cost > 5000`
   - Message: "⚠️ SMS MFA is expensive at this scale. Consider email/app MFA"

3. **Advanced Security Large Volume:** Show info when `risk_evaluated_logins > 10000000`
   - Message: "💡 Contact AWS for volume pricing on advanced security"

---

## UI Behavior

### On MFA Enable/Disable
1. Show/hide MFA type radio buttons and percentage input
2. Recalculate estimate if auto-calculate enabled
3. Clear error state

### On Advanced Security Toggle
1. Show/hide risk-evaluated logins input
2. Recalculate estimate if auto-calculate enabled
3. Update cost breakdown

### On Custom Domain Toggle
1. Add/remove $0.50 from total cost immediately (no backend call needed)
2. Update UI without recalculating

### On Feature Addition
1. For MFA/Advanced Security: Auto-expand collapsible section
2. Show indicator if any advanced feature is enabled
3. Highlight in cost breakdown

### Calculate Button
1. Validate all inputs
2. Show loading state
3. Disable button during calculation
4. Call API with all parameters
5. Display results in breakdown section
6. Highlight free tier savings

### Reset Button
1. Reset all fields to defaults
2. Clear cost results
3. Collapse all advanced sections
4. Set pricing store to null

---

## Error Handling

### API Errors
```javascript
const errorMessages = {
  400: "Invalid input parameters. Please check your values.",
  401: "Authentication required.",
  403: "Permission denied.",
  500: "Server error. Please try again.",
  503: "Service temporarily unavailable.",
  network: "Network error. Please check your connection."
};
```

### Display Format
```
┌────────────────────────────────────────────────┐
│ ⚠️ Error                                       │
│ ────────────────────────────────────────────   │
│ Could not calculate pricing: [error message]  │
│                                               │
│ [Try Again]                                   │
└────────────────────────────────────────────────┘
```

---

## Responsive Design Notes

### Mobile (< 768px)
- Stack all sections vertically
- Full-width inputs
- Breakdown in collapsible accordion
- Sticky Calculate button at bottom
- Collapsible advanced sections by default

### Tablet (768px - 1024px)
- Two-column layout for MFA settings
- Grouped inputs
- Collapsible advanced sections

### Desktop (> 1024px)
- Full layout as shown in UI Layout section
- Inline tooltips on hover
- Smooth transitions for collapsible sections
- Side-by-side cost breakdown

---

## Accessibility

1. **Labels:** All inputs have associated labels
2. **ARIA:** Use `aria-describedby` for hints/notes
3. **Keyboard:** Full keyboard navigation support
4. **Screen Readers:** Announce cost updates with `aria-live="polite"`
5. **Color:** Don't rely solely on color for information
6. **Focus:** Visible focus indicators on all interactive elements

---

## Frontend Implementation Checklist

- [ ] Create region dropdown with display names and mapping
- [ ] Add MAU input with number formatting
- [ ] Add sign-ups input with validation
- [ ] Add sign-ins input with validation
- [ ] Add token refreshes input with validation
- [ ] Create collapsible MFA section with checkbox
- [ ] Implement MFA type radio buttons
- [ ] Add MFA percentage input (0-100)
- [ ] Create collapsible advanced security section
- [ ] Add risk-evaluated logins input
- [ ] Create collapsible additional features section
- [ ] Add custom domain checkbox
- [ ] Add email customization checkbox and email count input
- [ ] Build request payload with all parameters
- [ ] Call backend API endpoint
- [ ] Parse and display cost breakdown with all charges
- [ ] Show free tier savings when applicable
- [ ] Handle all error states with user-friendly messages
- [ ] Add loading states with spinning indicators
- [ ] Format currency display ($X.XX)
- [ ] Add tooltips and help text
- [ ] Implement responsive design for mobile/tablet/desktop
- [ ] Add validation with clear error messages
- [ ] Implement auto-expand for collapsible sections on content
