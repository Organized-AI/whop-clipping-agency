# Phase 6: Notification System

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Build automated notification system for all stakeholders.

### 1. Create src/templates/notification-templates.ts
```typescript
export const NOTIFICATION_TEMPLATES = {
  // Client notifications
  client_welcome: {
    title: "Welcome to Clipping Agency! 🎬",
    body: "Your account is set up. Access your content folder and upload your first raw footage to get started.",
    action_url: "{{drive_folder_url}}",
  },
  
  clip_ready_for_review: {
    title: "New clip ready for review",
    body: "Your clipper has finished a new clip for {{project_name}}. Review and provide feedback.",
    action_url: "{{clip_url}}",
  },
  
  monthly_report: {
    title: "Your Monthly Content Report 📊",
    body: "{{clips_delivered}} clips delivered this month. View your full performance report.",
    action_url: "{{report_url}}",
  },
  
  // Clipper notifications
  clipper_welcome: {
    title: "Welcome to the Clipper Network! ✂️",
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
    title: "Payment processed 💰",
    body: "{{amount}} has been sent for {{clip_count}} clips delivered.",
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
    title: "⚠️ Overdue clip alert",
    body: "Clip for {{client_name}} is {{hours_overdue}} hours overdue. Assigned to {{clipper_name}}.",
    action_url: "{{assignment_url}}",
  },
} as const;

export type NotificationTemplate = keyof typeof NOTIFICATION_TEMPLATES;
```

### 2. Create src/services/notifications.ts
```typescript
import { WhopAPI } from "@whop/sdk";
import { NOTIFICATION_TEMPLATES, NotificationTemplate } from "../templates/notification-templates";

const whop = new WhopAPI({ apiKey: process.env.WHOP_API_KEY });

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
  const templateData = NOTIFICATION_TEMPLATES[template];
  
  // Replace variables in template
  let title = templateData.title;
  let body = templateData.body;
  let actionUrl = templateData.action_url;
  
  for (const [key, value] of Object.entries(variables)) {
    title = title.replace(`{{${key}}}`, value);
    body = body.replace(`{{${key}}}`, value);
    if (actionUrl) {
      actionUrl = actionUrl.replace(`{{${key}}}`, value);
    }
  }
  
  await whop.notifications.create({
    user_id: recipientUserId,
    title,
    body,
    action_url: actionUrl,
  });
}

// Convenience functions
export async function notifyClientWelcome(
  userId: string,
  driveFolderUrl: string
) {
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
) {
  await sendNotification({
    template: "clip_ready_for_review",
    recipientUserId: userId,
    variables: { project_name: projectName, clip_url: clipUrl },
  });
}

export async function notifyNewAssignment(
  userId: string,
  clientName: string,
  clipCount: number,
  assignmentUrl: string
) {
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

export async function notifyAdminNewClient(
  adminUserId: string,
  clientName: string,
  tierName: string,
  monthlyRevenue: string,
  clientUrl: string
) {
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

// Bulk notification for overdue clips
export async function checkAndNotifyOverdueClips() {
  const overdueAssignments = await getOverdueAssignments();
  
  for (const assignment of overdueAssignments) {
    // Notify admin
    await sendNotification({
      template: "admin_clip_overdue",
      recipientUserId: process.env.ADMIN_USER_ID!,
      variables: {
        client_name: assignment.clientName,
        hours_overdue: String(assignment.hoursOverdue),
        clipper_name: assignment.clipperName,
        assignment_url: assignment.url,
      },
    });
    
    // Optionally notify clipper
    // await sendReminderToClipper(assignment);
  }
}
```

### 3. Integration with Other Phases

In Phase 2 webhooks:
```typescript
import { notifyClientWelcome, notifyAdminNewClient } from "../services/notifications";

// After client folder is created
await notifyClientWelcome(userId, folderUrl);
await notifyAdminNewClient(adminId, clientName, tier, revenue, clientUrl);
```

In Phase 3 clipper management:
```typescript
import { notifyNewAssignment } from "../services/notifications";

// When clipper is assigned
await notifyNewAssignment(clipperId, clientName, clipCount, assignmentUrl);
```

### 4. Scheduled Notifications
Add cron job for periodic checks:
```typescript
import cron from "node-cron";
import { checkAndNotifyOverdueClips } from "./services/notifications";

// Check for overdue clips every hour
cron.schedule("0 * * * *", async () => {
  await checkAndNotifyOverdueClips();
});
```

## Whop API Endpoints Used
- `create_notifications`

## Expected Output
- Template-based notification system
- Client, clipper, and admin notifications
- Integration points with all other phases
- Scheduled overdue alerts
