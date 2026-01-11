# Phase 6: Notification System

## Objective
Build automated notification system for clients, clippers, and admins using Whop Notifications API.

---

## Prerequisites
- Phase 5 complete
- Admin user ID configured for admin notifications

---

## Agent Usage
Claude Code will automatically invoke:
- **whop-specialist**: Notification API, templates

---

## Tasks

### 1. Create Notification Templates

Create `src/templates/notification-templates.ts`:

```typescript
export const NOTIFICATION_TEMPLATES = {
  // Client notifications
  client_welcome: {
    title: "Welcome to Clipping Agency!",
    body: "Your account is set up. Access your content folder and upload your first raw footage to get started.",
    action_url: "{{drive_folder_url}}",
  },

  clip_ready_for_review: {
    title: "New clip ready for review",
    body: "Your clipper has finished a new clip for {{project_name}}. Review and provide feedback.",
    action_url: "{{clip_url}}",
  },

  monthly_report: {
    title: "Your Monthly Content Report",
    body: "{{clips_delivered}} clips delivered this month. View your full performance report.",
    action_url: "{{report_url}}",
  },

  // Clipper notifications
  clipper_welcome: {
    title: "Welcome to the Clipper Network!",
    body: "You've been approved as a clipper. Access your workspace folder and start accepting assignments.",
    action_url: "{{drive_folder_url}}",
  },

  new_assignment: {
    title: "New assignment available",
    body: "{{client_name}} has raw footage ready for clipping. {{clip_count}} clips needed.",
    action_url: "{{assignment_url}}",
  },

  feedback_received: {
    title: "Feedback on your clip",
    body: "{{client_name}} left feedback on your recent clip: {{feedback_preview}}",
    action_url: "{{clip_url}}",
  },

  payment_sent: {
    title: "Payment processed",
    body: "{{amount}} has been sent for {{clip_count}} clips delivered.",
    action_url: undefined,
  },

  // Admin notifications
  admin_new_client: {
    title: "New client signup!",
    body: "{{client_name}} joined on {{tier_name}} tier. Revenue: {{monthly_revenue}}",
    action_url: "{{client_url}}",
  },

  admin_new_application: {
    title: "New clipper application",
    body: "{{applicant_name}} applied with {{capacity}} clips/week capacity.",
    action_url: "{{application_url}}",
  },

  admin_clip_overdue: {
    title: "Overdue clip alert",
    body: "Clip for {{client_name}} is {{hours_overdue}} hours overdue. Assigned to {{clipper_name}}.",
    action_url: "{{assignment_url}}",
  },
} as const;

export type NotificationTemplate = keyof typeof NOTIFICATION_TEMPLATES;
```

### 2. Create Notification Service

Create `src/services/notifications.ts`:

```typescript
import { getWhopClient } from "../lib/whop-client.js";
import {
  NOTIFICATION_TEMPLATES,
  NotificationTemplate,
} from "../templates/notification-templates.js";

interface NotificationParams {
  template: NotificationTemplate;
  recipientUserId: string;
  variables: Record<string, string>;
}

export async function sendNotification({
  template,
  recipientUserId,
  variables,
}: NotificationParams): Promise<void> {
  const whop = getWhopClient();
  const templateData = NOTIFICATION_TEMPLATES[template];

  // Replace variables in template
  let title = templateData.title;
  let body = templateData.body;
  let actionUrl = templateData.action_url;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    title = title.replace(placeholder, value);
    body = body.replace(placeholder, value);
    if (actionUrl) {
      actionUrl = actionUrl.replace(placeholder, value);
    }
  }

  console.log(`📧 Sending notification to ${recipientUserId}`);
  console.log(`   Template: ${template}`);
  console.log(`   Title: ${title}`);

  await whop.notifications.create({
    user_id: recipientUserId,
    title,
    body,
    action_url: actionUrl,
  });

  console.log(`✅ Notification sent`);
}

// ============ Client Notifications ============

export async function notifyClientWelcome(
  userId: string,
  driveFolderUrl: string
): Promise<void> {
  await sendNotification({
    template: "client_welcome",
    recipientUserId: userId,
    variables: { drive_folder_url: driveFolderUrl },
  });
}

export async function notifyClipReady(
  userId: string,
  projectName: string,
  clipUrl: string
): Promise<void> {
  await sendNotification({
    template: "clip_ready_for_review",
    recipientUserId: userId,
    variables: { project_name: projectName, clip_url: clipUrl },
  });
}

export async function notifyMonthlyReport(
  userId: string,
  clipsDelivered: number,
  reportUrl: string
): Promise<void> {
  await sendNotification({
    template: "monthly_report",
    recipientUserId: userId,
    variables: {
      clips_delivered: String(clipsDelivered),
      report_url: reportUrl,
    },
  });
}

// ============ Clipper Notifications ============

export async function notifyClipperWelcome(
  userId: string,
  driveFolderUrl: string
): Promise<void> {
  await sendNotification({
    template: "clipper_welcome",
    recipientUserId: userId,
    variables: { drive_folder_url: driveFolderUrl },
  });
}

export async function notifyNewAssignment(
  userId: string,
  clientName: string,
  clipCount: number,
  assignmentUrl: string
): Promise<void> {
  await sendNotification({
    template: "new_assignment",
    recipientUserId: userId,
    variables: {
      client_name: clientName,
      clip_count: String(clipCount),
      assignment_url: assignmentUrl,
    },
  });
}

export async function notifyFeedbackReceived(
  userId: string,
  clientName: string,
  feedbackPreview: string,
  clipUrl: string
): Promise<void> {
  await sendNotification({
    template: "feedback_received",
    recipientUserId: userId,
    variables: {
      client_name: clientName,
      feedback_preview: feedbackPreview.slice(0, 100),
      clip_url: clipUrl,
    },
  });
}

export async function notifyPaymentSent(
  userId: string,
  amount: string,
  clipCount: number
): Promise<void> {
  await sendNotification({
    template: "payment_sent",
    recipientUserId: userId,
    variables: {
      amount,
      clip_count: String(clipCount),
    },
  });
}

// ============ Admin Notifications ============

export async function notifyAdminNewClient(
  clientName: string,
  tierName: string,
  monthlyRevenue: string,
  clientUrl: string
): Promise<void> {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.warn("ADMIN_USER_ID not configured, skipping admin notification");
    return;
  }

  await sendNotification({
    template: "admin_new_client",
    recipientUserId: adminUserId,
    variables: {
      client_name: clientName,
      tier_name: tierName,
      monthly_revenue: monthlyRevenue,
      client_url: clientUrl,
    },
  });
}

export async function notifyAdminNewApplication(
  applicantName: string,
  capacity: number,
  applicationUrl: string
): Promise<void> {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.warn("ADMIN_USER_ID not configured, skipping admin notification");
    return;
  }

  await sendNotification({
    template: "admin_new_application",
    recipientUserId: adminUserId,
    variables: {
      applicant_name: applicantName,
      capacity: String(capacity),
      application_url: applicationUrl,
    },
  });
}

export async function notifyAdminClipOverdue(
  clientName: string,
  clipperName: string,
  hoursOverdue: number,
  assignmentUrl: string
): Promise<void> {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.warn("ADMIN_USER_ID not configured, skipping admin notification");
    return;
  }

  await sendNotification({
    template: "admin_clip_overdue",
    recipientUserId: adminUserId,
    variables: {
      client_name: clientName,
      clipper_name: clipperName,
      hours_overdue: String(hoursOverdue),
      assignment_url: assignmentUrl,
    },
  });
}

// ============ Scheduled Tasks ============

export async function checkAndNotifyOverdueClips(): Promise<void> {
  console.log("\n⏰ Checking for overdue clips...");

  // TODO: Fetch overdue assignments from database
  const overdueAssignments: Array<{
    clientName: string;
    clipperName: string;
    hoursOverdue: number;
    assignmentUrl: string;
  }> = [];

  for (const assignment of overdueAssignments) {
    await notifyAdminClipOverdue(
      assignment.clientName,
      assignment.clipperName,
      assignment.hoursOverdue,
      assignment.assignmentUrl
    );
  }

  console.log(`Processed ${overdueAssignments.length} overdue alerts`);
}
```

### 3. Integrate with Webhook Handlers

Update `src/webhooks/events/membership.ts`:

```typescript
import { provisionClientOnboarding } from "../../services/folder-templates.js";
import { notifyClientWelcome, notifyAdminNewClient } from "../../services/notifications.js";
import { TIERS } from "../../config/products.js";

export async function handleMembershipValid(data: MembershipEventData) {
  console.log("🎉 Membership went valid:", data.membership_id);

  // 1. Create Drive folder
  const clientFolder = await provisionClientOnboarding(
    data.membership_id,
    data.metadata?.company_name || data.user_email,
    data.user_email
  );

  // 2. Send welcome notification to client
  await notifyClientWelcome(data.user_id, clientFolder.folderUrl);

  // 3. Notify admin of new signup
  const tier = Object.entries(TIERS).find(([_, t]) =>
    // Match by product_id logic
    true
  );

  await notifyAdminNewClient(
    data.metadata?.company_name || data.user_email,
    tier?.[1].name || "Unknown",
    `$${(tier?.[1].price || 0) / 100}/mo`,
    `https://whop.com/dashboard/memberships/${data.membership_id}`
  );

  return {
    action: "onboarding_complete",
    membership_id: data.membership_id,
    folder_url: clientFolder.folderUrl,
    notifications_sent: ["client_welcome", "admin_new_client"],
  };
}
```

### 4. Integrate with Clipper Management

Update `src/services/clipper-management.ts`:

```typescript
import { provisionClipperOnboarding } from "./folder-templates.js";
import { notifyClipperWelcome, notifyNewAssignment, notifyAdminNewApplication } from "./notifications.js";

export async function approveApplication(applicationId: string): Promise<Clipper> {
  // ... existing code ...

  // 4. Create Drive folder for clipper
  const clipperFolder = await provisionClipperOnboarding(
    clipper.id,
    clipper.name,
    clipper.email
  );
  clipper.drive_folder_id = clipperFolder.folderId;

  // 5. Send welcome notification
  await notifyClipperWelcome(clipper.whop_user_id, clipperFolder.folderUrl);

  return clipper;
}

export async function assignClipperToClient(
  clipperId: string,
  clientId: string,
  clipCount: number
): Promise<ClipperAssignment> {
  // ... existing code ...

  // Notify clipper of new assignment
  await notifyNewAssignment(
    clipper.whop_user_id,
    clientName,
    clipCount,
    `https://dashboard.example.com/assignments/${assignment.id}`
  );

  return assignment;
}
```

### 5. Add Environment Variables

Update `.env.example`:

```env
# Admin
ADMIN_API_KEY=your_secure_admin_api_key_here
ADMIN_USER_ID=user_xxx
```

---

## Success Criteria

- [ ] `src/templates/notification-templates.ts` defines all templates
- [ ] `src/services/notifications.ts` implements notification sending
- [ ] Variable substitution works in templates
- [ ] Client welcome notification sent on signup
- [ ] Clipper welcome notification sent on approval
- [ ] Assignment notification sent to clipper
- [ ] Admin notifications sent for new clients/applications
- [ ] Test notification sends successfully

---

## Verification Commands

```bash
# Verify TypeScript compiles
npm run typecheck

# Test by triggering a webhook (see Phase 2)
/test-webhook membership.went_valid
```

---

## Completion

Create `docs/phases/PHASE_6_COMPLETE.md`:

```markdown
# Phase 6: Notification System - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/templates/notification-templates.ts - All templates
- [x] src/services/notifications.ts - Notification service
- [x] Webhook integration for client onboarding
- [x] Clipper management integration
- [x] Admin notification support

## Notifications Implemented
### Client
- Welcome
- Clip ready for review
- Monthly report

### Clipper
- Welcome
- New assignment
- Feedback received
- Payment sent

### Admin
- New client signup
- New application
- Overdue clip alert

## Verification
- `npm run typecheck`: ✅
- Test notification sent: ✅
- Integration with webhooks: ✅

## Project Complete!
All 7 phases have been implemented.
```

Then commit:
```bash
git add -A && git commit -m "Phase 6: Notification system complete - Project MVP ready"
```

Or use: `/commit feat Phase 6 Notification system complete - Project MVP ready`
