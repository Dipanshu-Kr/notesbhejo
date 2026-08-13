import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary";


function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function cleanupExpiredNotes() {
  try {
    const expiredNotes = await prisma.note.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    for (const note of expiredNotes) {
      try {
        if (note.filePublicId) {
          await deleteFromCloudinary(
            note.filePublicId,
            note.fileResourceType ?? "image"
          );
        }

        await prisma.note.delete({
          where: {
            id: note.id,
          },
        });

        console.log(`Expired note deleted: ${note.id}`);
      } catch (error) {
        console.error(
          `Failed to delete expired note ${note.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Cleanup Error:", error);
  }
}
export async function POST(request: Request) {
  cleanupExpiredNotes();

  try {
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
let fileResourceType: string | null = null;
let fileName: string | null = null;
let fileType: string | null = null;
let fileSize: number | null = null;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
  return NextResponse.json(
    { error: "File size must be less than 10MB" },
    { status: 400 },
  );
}

      const uploaded = await uploadToCloudinary(file, pin);

fileUrl = uploaded.secure_url;
filePublicId = uploaded.public_id;
fileResourceType = uploaded.resource_type;
fileName = file.name;
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
    fileResourceType,
    fileName,
    fileType,
    fileSize,
  },
});

    return NextResponse.json({
      pin: note.pin,
      expiresAt: note.expiresAt,
      hasFile: !!note.fileUrl,
    });
  }  catch (error) {
  console.error("UPLOAD ERROR:", error);

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : String(error),
    },
    {
      status: 500,
    },
  );
  }
}

export async function GET(request: Request) {
  cleanupExpiredNotes();

  try {
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
await prisma.note.update({
  where: {
    id: note.id,
  },
  data: {
    readCount: {
      increment: 1,
    },
  },
});

    return NextResponse.json({
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");

    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { error: "Valid 6-digit PIN is required" },
        { status: 400 }
      );
    }

    const note = await prisma.note.findFirst({
      where: {
        pin,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // Delete file from Cloudinary
    if (note.filePublicId) {
      await deleteFromCloudinary(
        note.filePublicId,
        note.fileResourceType ?? "image"
      );
    }

    // Delete note from database
    await prisma.note.delete({
      where: {
        id: note.id,
      },
    });

    console.log(`Note deleted: ${note.id}`);

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
