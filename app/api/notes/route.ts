import "@/lib/env";
import { ratelimit } from "@/lib/rateLimit";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";
import streamifier from "streamifier";
import type { UploadApiResponse } from "cloudinary";

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function uploadToCloudinary(
  file: File,
  pin: string,
): Promise<UploadApiResponse> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "notesbhejo",
        public_id: `${pin}-${Date.now()}`,
        resource_type: "auto",
      },
      (err, result) => {
        if (err || !result) {
          reject(err);
          return;
        }

        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

async function deleteFromCloudinary(publicId: string) {
  try {
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result !== "ok") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true,
      });
    }

    if (result.result !== "ok") {
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
        invalidate: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function cleanupExpiredNotes() {
  try {
    const expiredNotes = await prisma.note.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    for (const note of expiredNotes) {
      if (note.filePublicId) {
        await deleteFromCloudinary(note.filePublicId);
      }
    }

    await prisma.note.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (err) {
    console.error("Cleanup Error:", err);
  }
}

export async function POST(request: Request) {
  const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
  "anonymous";

const { success } = await ratelimit.limit(ip);

if (!success) {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
    }
  );
}
  

  try {
    await cleanupExpiredNotes();
    const formData = await request.formData();

    const content = formData.get("content") as string | null;
    const expirationHours =
      parseInt(formData.get("expirationHours") as string) || 24;

    const burnAfterReading = formData.get("burnAfterReading") === "true";

    const file = formData.get("file") as File | null;

    if (!content && !file) {
      return NextResponse.json(
        { error: "Content or file is required" },
        { status: 400 },
      );
    }

    if (content && content.length > 10000) {
      return NextResponse.json(
        { error: "Content exceeds maximum length of 10000 characters" },
        { status: 400 },
      );
    }

    const validExpiration = Math.min(Math.max(expirationHours, 1), 168);

    // Generate Unique PIN
    let pin = generatePin();
    let attempts = 0;

    while (attempts < 10) {
      const existing = await prisma.note.findFirst({
        where: {
          pin,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!existing) break;

      pin = generatePin();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Unable to generate unique PIN." },
        { status: 500 },
      );
    }

    let fileUrl: string | null = null;
    let filePublicId: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize: number | null = null;

    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size must be less than 50MB" },
          { status: 400 },
        );
      }

      const allowedTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Text
  "text/plain",
  "text/csv",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "text/xml",
  "text/markdown",

  // Source Code
  "text/x-java-source",
  "text/x-python",
  "text/x-c",
  "text/x-c++",
  "text/x-typescript",
  "text/x-php",
  "application/sql",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/mp4",

  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",

  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "application/x-tar",
  "application/gzip",

  // APK
  "application/vnd.android.package-archive",
]

if (!allowedTypes.includes(file.type)) {
  return NextResponse.json(
    {
      error: "Unsupported file type",
    },
    {
      status: 400,
    }
  );
}
const allowedExtensions = [
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",

  // Documents
  ".pdf",
  ".doc",
  ".docx",

  // Excel
  ".xls",
  ".xlsx",

  // PowerPoint
  ".ppt",
  ".pptx",

  // Text
  ".txt",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".md",

  // Programming
  ".java",
  ".py",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".php",
  ".go",
  ".rs",
  ".swift",
  ".kt",
  ".sql",

  // Audio
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",

  // Video
  ".mp4",
  ".webm",
  ".mov",
  ".avi",
  ".mkv",

  // Archives
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",

  // Android
  ".apk",
]

const originalFileName = file.name.toLowerCase();

const hasValidExtension = allowedExtensions.some((ext) =>
  originalFileName.endsWith(ext)
);

if (!hasValidExtension) {
  return NextResponse.json(
    {
      error: "Invalid file extension",
    },
    {
      status: 400,
    }
  );
}
      const uploaded = await uploadToCloudinary(file, pin);

      fileUrl = uploaded.secure_url;
      filePublicId = uploaded.public_id;
      fileName = file.name
  .replace(/[^\w.\- ]/g, "")
  .trim();
      fileType = file.type;
      fileSize = file.size;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validExpiration);

    const note = await prisma.note.create({
      data: {
        pin,
        content: content ?? "",

        expiresAt,

        burnAfterRead: burnAfterReading,

        fileUrl,
        filePublicId,
        fileName,
        fileType,
        fileSize,
      },
    });

    const shareUrl =
`${process.env.NEXT_PUBLIC_BASE_URL}/receive?pin=${note.pin}`;
const qrCode = await QRCode.toDataURL(shareUrl);

return NextResponse.json({
  pin: note.pin,
  qrCode,
  shareUrl,
  expiresAt: note.expiresAt,
  hasFile: !!note.fileUrl,
});
  } catch (error) {
    console.error("POST Error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: Request) {
  const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
  "anonymous";

const { success } = await ratelimit.limit(ip);

if (!success) {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
    }
  );
}
  

  try {
    await cleanupExpiredNotes();
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");

    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit PIN is required" },
        { status: 400 },
      );
    }

    const note = await prisma.note.findFirst({
      where: {
        pin,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        {
          error: "Note not found or has expired",
        },
        {
          status: 404,
        },
      );
    }

    // Burn after reading
//     if (note.burnAfterRead) {
//   await prisma.note.delete({
//     where: {
//       id: note.id,
//     },
//   });
// }
    return NextResponse.json({
      id: note.id,
      content: note.content,
      expiresAt: note.expiresAt,
      fileUrl: note.fileUrl,
      fileName: note.fileName,
      fileType: note.fileType,
      fileSize: note.fileSize,
      burnAfterReading: note.burnAfterRead,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
