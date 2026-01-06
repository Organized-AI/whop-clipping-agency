---
name: test-webhook
description: Generate and send a test webhook event to the local server
---

# Command: /test-webhook

## Purpose
Test webhook handling by sending simulated Whop events to the local server.

## Usage
```
/test-webhook [event-type]
```

## Behavior
1. Generate a properly structured Whop event payload
2. Sign the payload with the webhook secret
3. Send POST to `http://localhost:3000/webhooks/whop`
4. Display response and any errors

## Event Types
- `membership.went_valid` - New active membership
- `membership.went_invalid` - Membership became inactive
- `membership.updated` - Membership tier changed
- `membership.created` - New membership created

## Example Payloads

### membership.went_valid
```json
{
  "type": "membership.went_valid",
  "data": {
    "membership_id": "mem_test_123",
    "product_id": "prod_starter",
    "user_id": "user_test_456",
    "user_email": "test@example.com",
    "plan_id": "plan_monthly",
    "metadata": {
      "company_name": "Test Company",
      "website": "https://test.com"
    }
  }
}
```

## Implementation
```bash
#!/bin/bash
EVENT_TYPE=${1:-"membership.went_valid"}
SECRET="${WHOP_WEBHOOK_SECRET:-test_secret}"

PAYLOAD='{"type":"'$EVENT_TYPE'","data":{"membership_id":"mem_test","user_id":"user_test"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

curl -X POST http://localhost:3000/webhooks/whop \
  -H "Content-Type: application/json" \
  -H "whop-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```
