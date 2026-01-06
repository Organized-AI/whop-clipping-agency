# Functional Requirements

## Client Requirements

### FR-C1: Client Onboarding
- System SHALL create client record on membership activation
- System SHALL provision Google Drive folder structure
- System SHALL share folder with client email
- System SHALL send welcome notification with folder link

### FR-C2: Tier Management
- System SHALL support Starter ($5k), Growth ($8k), Scale ($15k) tiers
- System SHALL enforce clip quotas per tier (30/60/120)
- System SHALL handle tier upgrades/downgrades

### FR-C3: Client Lifecycle
- System SHALL handle membership pausing
- System SHALL handle membership cancellation
- System SHALL revoke access on cancellation

## Clipper Requirements

### FR-P1: Clipper Application
- System SHALL provide application form via Whop Experience
- System SHALL track application status (pending/approved/rejected)
- System SHALL support feedback on rejection

### FR-P2: Clipper Management
- System SHALL track clipper capacity
- System SHALL assign clippers to clients
- System SHALL share appropriate folders on assignment

### FR-P3: Clipper Notifications
- System SHALL notify on new assignments
- System SHALL notify on feedback received
- System SHALL notify on payment processed

## Admin Requirements

### FR-A1: Dashboard
- System SHALL display active client count
- System SHALL display monthly revenue
- System SHALL display clipper utilization

### FR-A2: Assignment Management
- System SHALL allow assigning clippers to clients
- System SHALL track clip delivery status
- System SHALL alert on overdue clips

### FR-A3: Analytics
- System SHALL track revenue over time
- System SHALL track clips delivered
- System SHALL track average turnaround time

## Integration Requirements

### FR-I1: Whop Integration
- System SHALL verify webhook signatures
- System SHALL handle all membership events
- System SHALL use Whop for notifications

### FR-I2: Google Drive Integration
- System SHALL use OAuth2 for authentication
- System SHALL create folder structures programmatically
- System SHALL manage folder permissions

---

# Non-Functional Requirements

### NFR-1: Security
- All webhook payloads MUST be signature-verified
- API endpoints MUST require authentication
- Credentials MUST be stored as environment variables

### NFR-2: Performance
- Webhook handlers MUST respond within 5 seconds
- Long operations MUST be queued
- API responses MUST be under 200ms

### NFR-3: Reliability
- System MUST log all events for debugging
- System MUST handle Whop API failures gracefully
- System MUST handle Drive API failures gracefully

### NFR-4: Maintainability
- Code MUST use TypeScript strict mode
- All inputs MUST be validated with Zod
- Code MUST follow ESLint rules
