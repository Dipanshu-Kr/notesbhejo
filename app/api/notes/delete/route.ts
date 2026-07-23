import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

async function deleteFromCloudinary(publicId: string) {
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

  console.log("Cloudinary Result:", result);
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
  return NextResponse.json(
    { success: false, error: "Invalid note id" },
    { status: 400 }
  );
}

    console.log("Before DB delete");
    const note = await prisma.note.findUnique({
      where: { id },
    });

    console.log("After DB delete");
    if (!note) {
      return NextResponse.json({ success: true });
    }
    if (note.filePublicId) {
  await deleteFromCloudinary(note.filePublicId);
}

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete Error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}