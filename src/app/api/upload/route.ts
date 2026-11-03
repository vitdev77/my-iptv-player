// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import parser from "iptv-playlist-parser";

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { fileText, playlistName } = await request.json();
    if (!fileText) {
      return NextResponse.json({ error: "Файл пуст" }, { status: 400 });
    }

    // 1. Парсим m3u текст в JSON массив
    const parsedPlaylist = parser.parse(fileText);
    const items = parsedPlaylist.items;
    if (items.length === 0) {
      return NextResponse.json({ error: "Каналы не найдены" }, { status: 400 });
    }

    await client.query("BEGIN");

    // 2. Создаем запись о плейлисте
    const playlistQuery = `
INSERT INTO playlists (name) 
VALUES ($1) 
RETURNING id
`;
    const playlistResult = await client.query(playlistQuery, [
      playlistName || "Мой плейлист",
    ]);
    const playlistId = playlistResult.rows[0].id;

    // 3. Удаляем старые каналы, если они были (для очистки)
    await client.query("DELETE FROM channels WHERE playlist_id = $1", [
      playlistId,
    ]);

    // 4. Подготавливаем Bulk Insert (разбиваем на пачки по 500 штук для стабильности)
    const chunkSize = 500;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const values: any[] = [];

      // Динамически строим запрос вида: INSERT INTO channels (...) VALUES ($1, $2...), ($6, $7...)
      const valueStrings = chunk
        .map((item, index) => {
          const offset = index * 5;
          values.push(
            playlistId,
            item.name || "Без названия",
            item.group.title || "Общие",
            item.tvg.logo || "",
            item.url,
          );
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        })
        .join(", ");

      const insertChannelsQuery = `
INSERT INTO channels (playlist_id, name, group_title, logo_url, stream_url) 
VALUES ${valueStrings}
`;

      await client.query(insertChannelsQuery, values);
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, count: items.length });
  } catch (error: any) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: error.message || "Ошибка сервера" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
