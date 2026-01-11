# Phase 4: Google Drive Integration

## Objective
Integrate Google Drive for automated folder provisioning, permission management, and content delivery.

---

## Prerequisites
- Phase 3 complete
- Google Cloud project with Drive API enabled
- OAuth credentials configured in `.env`

---

## Agent Usage
Claude Code will automatically invoke:
- **drive-specialist**: OAuth, folder creation, permissions
- **backend-dev**: Service structure, error handling

---

## Tasks

### 1. Create Drive Configuration

Create `src/config/drive.ts`:

```typescript
export const DRIVE_CONFIG = {
  parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER!,

  clientFolderStructure: [
    "Raw Footage",
    "Clips In Progress",
    "Approved Clips",
    "Brief & Guidelines",
  ],

  clipperFolderStructure: [
    "Assigned Work",
    "Completed",
  ],

  templateFolderId: process.env.GOOGLE_DRIVE_TEMPLATE_FOLDER,
};

export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
```

### 2. Create Drive Service

Create `src/services/drive-service.ts`:

```typescript
import { google, drive_v3 } from "googleapis";
import { DRIVE_CONFIG, FOLDER_MIME_TYPE } from "../config/drive.js";

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (!driveClient) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    driveClient = google.drive({ version: "v3", auth });
  }

  return driveClient;
}

export async function createFolder(
  name: string,
  parentId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });

  return {
    id: folder.data.id!,
    webViewLink: folder.data.webViewLink!,
  };
}

export async function createClientFolder(
  clientId: string,
  clientName: string
): Promise<{ folderId: string; folderUrl: string; subfolders: Record<string, string> }> {
  const drive = getDriveClient();
  console.log(`Creating client folder for: ${clientName}`);

  // 1. Find or create Clients parent folder
  const clientsFolder = await findOrCreateFolder("Clients", DRIVE_CONFIG.parentFolderId);

  // 2. Create main client folder
  const mainFolder = await createFolder(clientName, clientsFolder);
  console.log(`Created client folder: ${mainFolder.id}`);

  // 3. Create subfolders
  const subfolders: Record<string, string> = {};
  for (const subfolderName of DRIVE_CONFIG.clientFolderStructure) {
    const subfolder = await createFolder(subfolderName, mainFolder.id);
    subfolders[subfolderName] = subfolder.id;
    console.log(`  Created subfolder: ${subfolderName}`);
  }

  return {
    folderId: mainFolder.id,
    folderUrl: mainFolder.webViewLink,
    subfolders,
  };
}

export async function createClipperFolder(
  clipperId: string,
  clipperName: string
): Promise<{ folderId: string; folderUrl: string; subfolders: Record<string, string> }> {
  console.log(`Creating clipper folder for: ${clipperName}`);

  // 1. Find or create Clippers parent folder
  const clippersFolder = await findOrCreateFolder("Clippers", DRIVE_CONFIG.parentFolderId);

  // 2. Create main clipper folder
  const mainFolder = await createFolder(clipperName, clippersFolder);
  console.log(`Created clipper folder: ${mainFolder.id}`);

  // 3. Create subfolders
  const subfolders: Record<string, string> = {};
  for (const subfolderName of DRIVE_CONFIG.clipperFolderStructure) {
    const subfolder = await createFolder(subfolderName, mainFolder.id);
    subfolders[subfolderName] = subfolder.id;
    console.log(`  Created subfolder: ${subfolderName}`);
  }

  return {
    folderId: mainFolder.id,
    folderUrl: mainFolder.webViewLink,
    subfolders,
  };
}

export async function shareFolder(
  folderId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "writer"
): Promise<void> {
  const drive = getDriveClient();
  console.log(`Sharing folder ${folderId} with ${email} as ${role}`);

  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: "user",
      role,
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });

  console.log(`✅ Shared folder with ${email}`);
}

export async function revokeAccess(
  folderId: string,
  email: string
): Promise<void> {
  const drive = getDriveClient();
  console.log(`Revoking access for ${email} on folder ${folderId}`);

  // Get permission ID for the email
  const permissions = await drive.permissions.list({
    fileId: folderId,
    fields: "permissions(id, emailAddress)",
  });

  const permission = permissions.data.permissions?.find(
    p => p.emailAddress === email
  );

  if (permission?.id) {
    await drive.permissions.delete({
      fileId: folderId,
      permissionId: permission.id,
    });
    console.log(`✅ Revoked access for ${email}`);
  } else {
    console.log(`Permission not found for ${email}`);
  }
}

export async function duplicateTemplate(
  templateId: string,
  newName: string,
  parentId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();

  const copy = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: newName,
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });

  return {
    id: copy.data.id!,
    webViewLink: copy.data.webViewLink!,
  };
}

async function findOrCreateFolder(
  name: string,
  parentId: string
): Promise<string> {
  const drive = getDriveClient();

  // Search for existing folder
  const search = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`,
    fields: "files(id)",
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  // Create if not found
  const folder = await createFolder(name, parentId);
  return folder.id;
}

export async function listFolderContents(folderId: string) {
  const drive = getDriveClient();

  const files = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, webViewLink, modifiedTime)",
    orderBy: "modifiedTime desc",
  });

  return files.data.files || [];
}
```

### 3. Create Folder Templates Service

Create `src/services/folder-templates.ts`:

```typescript
import * as driveService from "./drive-service.js";

export async function provisionClientOnboarding(
  clientId: string,
  clientName: string,
  clientEmail: string
): Promise<{ folderId: string; folderUrl: string }> {
  console.log(`\n📁 Provisioning client onboarding for: ${clientName}`);

  // 1. Create client folder structure
  const clientFolder = await driveService.createClientFolder(clientId, clientName);

  // 2. Share with client
  await driveService.shareFolder(clientFolder.folderId, clientEmail, "writer");

  // 3. Copy onboarding template if configured
  if (process.env.CLIENT_ONBOARDING_TEMPLATE) {
    const template = await driveService.duplicateTemplate(
      process.env.CLIENT_ONBOARDING_TEMPLATE,
      "Getting Started Guide",
      clientFolder.subfolders["Brief & Guidelines"]
    );
    console.log(`  Copied onboarding template: ${template.id}`);
  }

  console.log(`✅ Client onboarding complete: ${clientFolder.folderUrl}`);
  return {
    folderId: clientFolder.folderId,
    folderUrl: clientFolder.folderUrl,
  };
}

export async function provisionClipperOnboarding(
  clipperId: string,
  clipperName: string,
  clipperEmail: string
): Promise<{ folderId: string; folderUrl: string }> {
  console.log(`\n📁 Provisioning clipper workspace for: ${clipperName}`);

  // 1. Create clipper folder structure
  const clipperFolder = await driveService.createClipperFolder(clipperId, clipperName);

  // 2. Share with clipper
  await driveService.shareFolder(clipperFolder.folderId, clipperEmail, "writer");

  console.log(`✅ Clipper workspace ready: ${clipperFolder.folderUrl}`);
  return {
    folderId: clipperFolder.folderId,
    folderUrl: clipperFolder.folderUrl,
  };
}

export async function shareClientFolderWithClipper(
  clientFolderSubfolders: Record<string, string>,
  clipperEmail: string,
  subfolders: string[] = ["Raw Footage", "Clips In Progress"]
): Promise<void> {
  console.log(`\n🔗 Sharing client folders with clipper: ${clipperEmail}`);

  for (const subfolderName of subfolders) {
    const subfolderId = clientFolderSubfolders[subfolderName];
    if (subfolderId) {
      await driveService.shareFolder(subfolderId, clipperEmail, "writer");
      console.log(`  Shared: ${subfolderName}`);
    }
  }

  console.log(`✅ Folder sharing complete`);
}

export async function revokeClientAccess(
  clientFolderId: string,
  clientEmail: string
): Promise<void> {
  console.log(`\n🔒 Revoking client access: ${clientEmail}`);
  await driveService.revokeAccess(clientFolderId, clientEmail);
  console.log(`✅ Access revoked`);
}
```

### 4. Integrate with Webhook Handlers

Update `src/webhooks/events/membership.ts`:

```typescript
import { provisionClientOnboarding, revokeClientAccess } from "../../services/folder-templates.js";

export async function handleMembershipValid(data: MembershipEventData) {
  console.log("🎉 Membership went valid:", data.membership_id);

  // Create Drive folder for client
  const clientFolder = await provisionClientOnboarding(
    data.membership_id,
    data.metadata?.company_name || data.user_email,
    data.user_email
  );

  // TODO Phase 6: Send welcome notification with folder URL
  // await sendWelcomeNotification(data.user_id, clientFolder.folderUrl);

  return {
    action: "onboarding_triggered",
    membership_id: data.membership_id,
    folder_url: clientFolder.folderUrl,
  };
}

export async function handleMembershipInvalid(data: MembershipEventData) {
  console.log("⚠️ Membership went invalid:", data.membership_id);

  // Revoke Drive folder access
  // Note: Need to store/retrieve folder ID from database
  // await revokeClientAccess(storedFolderId, data.user_email);

  return {
    action: "access_revoked",
    membership_id: data.membership_id,
  };
}
```

---

## Success Criteria

- [ ] `src/config/drive.ts` has folder configuration
- [ ] `src/services/drive-service.ts` implements all Drive operations
- [ ] `src/services/folder-templates.ts` provides provisioning functions
- [ ] Client folder creation works with subfolders
- [ ] Clipper folder creation works with subfolders
- [ ] Folder sharing sends email notification
- [ ] Access revocation removes permissions
- [ ] Webhook integration triggers folder creation

---

## Verification Commands

```bash
# Verify TypeScript compiles
npm run typecheck

# Test folder creation manually (requires valid credentials)
# Create a test script or use REPL
```

---

## Completion

Create `docs/phases/PHASE_4_COMPLETE.md`:

```markdown
# Phase 4: Drive Integration - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/config/drive.ts - Drive configuration
- [x] src/services/drive-service.ts - Drive API wrapper
- [x] src/services/folder-templates.ts - Provisioning functions
- [x] Updated webhook handlers with Drive integration

## Features
- Client folder creation with subfolders
- Clipper folder creation with subfolders
- Folder sharing with email notification
- Access revocation
- Template duplication

## Verification
- `npm run typecheck`: ✅
- Folder creation tested: ✅
- Sharing permissions work: ✅

## Next Phase
Proceed to Phase 5: Admin Dashboard API
```

Then commit:
```bash
git add -A && git commit -m "Phase 4: Drive integration complete"
```

Or use: `/commit feat Phase 4 Drive integration complete`
