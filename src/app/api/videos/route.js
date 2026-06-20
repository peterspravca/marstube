import { NextResponse } from "next/server";
import { getYT } from "@/lib/youtube";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const ids = idsParam.split(",").filter(id => id.trim() !== "");
  
  if (ids.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const yt = await getYT();
    
    // Fetch all video infos in parallel (up to a reasonable limit, e.g., 20 to avoid rate limits)
    const fetchPromises = ids.slice(0, 20).map(async (id) => {
      try {
        const info = await yt.getBasicInfo(id);
        return {
          id: id,
          url: `/watch?v=${id}`,
          title: info.basic_info.title || "Neznámy názov",
          thumbnail: info.basic_info.thumbnail?.[0]?.url || "",
          uploaderName: info.basic_info.author || "Neznámy autor",
          views: info.basic_info.view_count || ""
        };
      } catch (e) {
        console.warn(`Failed to fetch info for video ${id}:`, e);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    const validResults = results.filter(r => r !== null);

    return NextResponse.json(validResults);
  } catch (error) {
    console.error("API /videos error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
