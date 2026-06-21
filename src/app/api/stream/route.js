import { NextResponse } from "next/server";
import { getVideoStream } from "@/lib/api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const streamData = await getVideoStream(id);
    return NextResponse.json(streamData);
  } catch (error) {
    console.error("API /stream error:", error);
    return NextResponse.json({ error: "Failed to fetch stream data" }, { status: 500 });
  }
}
