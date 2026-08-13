import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or has expired" },
        { status: 404 }
      );
    }

    if (!note.fileUrl || !note.filePublicId) {
      return NextResponse.json(
        { error: "No file attached to this note" },
        { status: 404 }
      );
    }

    console.log("DOWNLOAD DEBUG");
    console.log("Public ID:", note.filePublicId);
    console.log("Resource Type:", note.fileResourceType);
    console.log("File Type:", note.fileType);

    const signedUrl = cloudinary.url(note.filePublicId, {
      secure: true,
      resource_type: note.fileResourceType || "raw",
      type: "upload",
      sign_url: true,
    });

    console.log("Resource Type Used:", note.fileResourceType || "raw");

    const response = await fetch(signedUrl);

    if (!response.ok) {
      console.error(
        "Cloudinary fetch failed:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error: `Cloudinary returned ${response.status}: ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const fileBuffer = await response.arrayBuffer();

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": note.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${note.fileName || "download"}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("DOWNLOAD ROUTE ERROR:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}