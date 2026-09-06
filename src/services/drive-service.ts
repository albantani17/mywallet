/**
 * A thin client for the parts of the Google Drive REST API a manual backup
 * needs: find or create one folder, list it, upload, download, delete.
 *
 * It takes an access token as an argument and knows nothing about how that
 * token was obtained — `google-auth-service.ts` owns that half.
 *
 * Everything here runs under the `drive.file` scope, which grants access only
 * to files this app created. That is why `ensureBackupFolder` can search for
 * the folder at all: we made it. A backup written by a different OAuth client
 * would be invisible to us, which is the intended trade — the scope is not
 * classed as sensitive, so it needs no Google verification review.
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

/** The one scope this app asks for. */
export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export const BACKUP_FOLDER_NAME = "MyWallet Backups";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const BACKUP_MIME = "application/json";

export type DriveFile = {
  id: string;
  name: string;
  /** Bytes. Drive returns this as a string; parsed here. */
  size: number | null;
  modifiedTime: string;
};

export class DriveError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DriveError";
    this.status = status;
  }
}

/**
 * The token was rejected — expired, revoked, or missing the Drive scope. The
 * caller should send the user back through sign-in rather than showing a
 * generic failure.
 */
export class DriveAuthError extends DriveError {
  constructor(message: string) {
    super(401, message);
    this.name = "DriveAuthError";
  }
}

type DriveRequest = Omit<RequestInit, "headers"> & {
  // Narrower than RequestInit's HeadersInit on purpose: the spread below only
  // works for a plain object, and a Headers instance would silently vanish.
  headers?: Record<string, string>;
};

async function driveFetch(
  token: string,
  url: string,
  init: DriveRequest = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (response.ok) return response;

  // Drive answers with { error: { message } }; fall back to the status text
  // when the body is empty or not JSON, which happens on gateway errors.
  let message = response.statusText;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    message = body.error?.message ?? message;
  } catch {
    // Keep the status text.
  }

  if (response.status === 401 || response.status === 403) {
    throw new DriveAuthError(message);
  }
  throw new DriveError(response.status, message);
}

/** Escapes a value for Drive's `q` query language, where \ and ' are special. */
function escapeQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export const driveService = {
  /**
   * The id of the app's backup folder, creating it on first use.
   *
   * A folder the user has since moved or renamed is not found again and a new
   * one is created — acceptable for a manual backup, and far better than
   * refusing to back up at all.
   */
  async ensureBackupFolder(token: string): Promise<string> {
    const query = [
      `name = '${escapeQuery(BACKUP_FOLDER_NAME)}'`,
      `mimeType = '${FOLDER_MIME}'`,
      "trashed = false",
    ].join(" and ");

    const response = await driveFetch(
      token,
      `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent("files(id)")}&pageSize=1`,
    );
    const found = (await response.json()) as { files?: { id: string }[] };
    const existing = found.files?.[0]?.id;
    if (existing) return existing;

    const created = await driveFetch(token, `${DRIVE_API}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: FOLDER_MIME,
      }),
    });

    return ((await created.json()) as { id: string }).id;
  },

  /** Every backup in the folder, newest first. */
  async listBackups(token: string, folderId: string): Promise<DriveFile[]> {
    const query = [
      `'${escapeQuery(folderId)}' in parents`,
      "trashed = false",
    ].join(" and ");

    const response = await driveFetch(
      token,
      `${DRIVE_API}/files` +
        `?q=${encodeURIComponent(query)}` +
        `&orderBy=modifiedTime desc` +
        `&pageSize=50` +
        `&fields=${encodeURIComponent("files(id,name,size,modifiedTime)")}`,
    );

    const body = (await response.json()) as {
      files?: {
        id: string;
        name: string;
        size?: string;
        modifiedTime: string;
      }[];
    };

    return (body.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size === undefined ? null : Number(file.size),
      modifiedTime: file.modifiedTime,
    }));
  },

  /**
   * Uploads a backup as a new file. Always a new one, never an overwrite —
   * the whole value of a manual backup is being able to go back further than
   * the last mistake.
   */
  async uploadBackup(
    token: string,
    folderId: string,
    name: string,
    content: string,
  ): Promise<DriveFile> {
    // A multipart/related body: the metadata part, then the file itself. This
    // is hand-built because FormData in React Native does not produce the
    // `related` subtype Drive requires.
    const boundary = "mywallet-backup-boundary";
    const metadata = JSON.stringify({
      name,
      parents: [folderId],
      mimeType: BACKUP_MIME,
    });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${BACKUP_MIME}\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const response = await driveFetch(
      token,
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=${encodeURIComponent("id,name,size,modifiedTime")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );

    const file = (await response.json()) as {
      id: string;
      name: string;
      size?: string;
      modifiedTime: string;
    };

    return {
      id: file.id,
      name: file.name,
      size: file.size === undefined ? null : Number(file.size),
      modifiedTime: file.modifiedTime,
    };
  },

  /** The raw contents of a backup file. */
  async downloadBackup(token: string, fileId: string): Promise<string> {
    const response = await driveFetch(
      token,
      `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`,
    );
    return response.text();
  },

  /** Moves a backup to the Drive trash. */
  async deleteBackup(token: string, fileId: string): Promise<void> {
    await driveFetch(token, `${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  },
};
