// src/app/api/init-db/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {
    // Принудительно очищаем таблицы от накопившихся дублей при повторных тестах
    await client.query("TRUNCATE TABLE channels CASCADE;");
    await client.query("TRUNCATE TABLE playlists CASCADE;");

    return NextResponse.json({
      success: true,
      message:
        "База данных Neon успешно очищена от дубликатов! Теперь загрузите файл заново.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
