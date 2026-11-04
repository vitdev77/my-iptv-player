import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
export async function GET() {
  const client = await pool.connect();
  try {
    const checkColumnQuery = `
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'channels' AND column_name = 'is_favorite'
`;
    const columnCheck = await client.query(checkColumnQuery);
    const hasFavoriteColumn = parseInt(columnCheck.rows[0].count) > 0;
    const selectFavorite = hasFavoriteColumn
      ? 'is_favorite as "isFavorite"'
      : 'FALSE as "isFavorite"';
    const queryText = `
SELECT id, name, group_title as "group", logo_url as logo, stream_url as url, ${selectFavorite}
FROM channels 
ORDER BY id ASC
`;
    const result = await client.query(queryText);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Ошибка API channels:", error);
    return NextResponse.json(
      { error: error.message || "Внутренняя ошибка сервера базы данных" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
