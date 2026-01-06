# Phase 4: Google Drive Integration

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Integrate Google Drive for automated folder provisioning and content management.

### 1. Create src/config/drive.ts
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
```

### 2. Create src/services/drive-service.ts
```typescript
import { google } from "googleapis";
import { DRIVE_CONFIG } from "../config/drive";

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials from stored tokens
auth.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth });

export async function createClientFolder(
  clientId: string,
  clientName: string
): Promise<string> {
  // 1. Create main client folder
  const mainFolder = await drive.files.create({
    requestBody: {
      name: clientName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [DRIVE_CONFIG.parentFolderId + "/Clients"],
    },
    fields: "id",
  });

  // 2. Create subfolders
  for (const subfolder of DRIVE_CONFIG.clientFolderStructure) {
    await drive.files.create({
      requestBody: {
        name: subfolder,
        mimeType: "application/vnd.google-apps.folder",
        parents: [mainFolder.data.id!],
      },
    });
  }

  return mainFolder.data.id!;
}

export async function createClipperFolder(
  clipperId: string,
  clipperName: string
): Promise<string> {
  // Similar to client folder creation
  const mainFolder = await drive.files.create({
    requestBody: {
      name: clipperName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [DRIVE_CONFIG.parentFolderId + "/Clippers"],
    },
    fields: "id",
  });

  for (const subfolder of DRIVE_CONFIG.clipperFolderStructure) {
    await drive.files.create({
      requestBody: {
        name: subfolder,
        mimeType: "application/vnd.google-apps.folder",
        parents: [mainFolder.data.id!],
      },
    });
  }

  return mainFolder.data.id!;
}

export async function shareFolder(
  folderId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "writer"
): Promise<void> {
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: "user",
      role,
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });
}

export async function revokeAccess(
  folderId: string,
  email: string
): Promise<void> {
  // Get permission ID for the email
  const permissions = await drive.permissions.list({
    fileId: folderId,
    fields: "permissions(id,emailAddress)",
  });

  const permission = permissions.data.permissions?.find(
    (p) => p.emailAddress === email
  );

  if (permission?.id) {
    await drive.permissions.delete({
      fileId: folderId,
      permissionId: permission.id,
    });
  }
}

export async function duplicateTemplate(
  templateId: string,
  newName: string,
  parentId: string
): Promise<string> {
  const copy = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: newName,
      parents: [parentId],
    },
    fields: "id",
  });
  
  return copy.data.id!;
}

export async function watchFolder(folderId: string, webhookUrl: string) {
  // Set up Drive API push notifications
  // for monitoring folder changes
}
```

### 3. Create src/services/folder-templates.ts
```typescript
import * as driveService from "./drive-service";

export async function provisionClientOnboarding(
  clientId: string,
  clientName: string,
  clientEmail: string
) {
  // 1. Create client folder structure
  const folderId = await driveService.createClientFolder(clientId, clientName);
  
  // 2. Share with client
  await driveService.shareFolder(folderId, clientEmail, "writer");
  
  // 3. Copy onboarding template
  await driveService.duplicateTemplate(
    process.env.CLIENT_ONBOARDING_TEMPLATE!,
    "Getting Started Guide",
    folderId
  );
  
  return folderId;
}

export async function assignClipperToClientFolder(
  clipperEmail: string,
  clientFolderId: string,
  subfolders: string[] = ["Raw Footage", "Clips In Progress"]
) {
  // Share specific subfolders with clipper
  for (const subfolder of subfolders) {
    const subfolderFile = await findSubfolder(clientFolderId, subfolder);
    if (subfolderFile) {
      await driveService.shareFolder(subfolderFile.id, clipperEmail, "writer");
    }
  }
}
```

## Integration Points
- Phase 2 webhooks trigger folder creation
- Phase 3 clipper approval triggers folder creation
- Phase 3 assignment shares appropriate folders

## Expected Output
- Automated client folder creation on signup
- Automated clipper folder creation on approval
- Folder sharing on assignment
- Access revocation on cancellation
