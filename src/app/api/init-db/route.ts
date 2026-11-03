// src/app/api/init-db/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {
    await client.query(`
CREATE TABLE IF NOT EXISTS playlists (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`);

    await client.query(`
CREATE TABLE IF NOT EXISTS channels (
id SERIAL PRIMARY KEY,
playlist_id INT REFERENCES playlists(id) ON DELETE CASCADE,
name VARCHAR(255) NOT NULL,
group_title VARCHAR(255) DEFAULT 'Общие',
logo_url TEXT,
stream_url TEXT NOT NULL,
tvg_id VARCHAR(255),
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`);

    // Безопасно добавляем колонку, если её не было
    await client.query(`
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
`);

    await client.query(`
CREATE INDEX IF NOT EXISTS idx_channels_playlist_id ON channels(playlist_id);
`);
    await client.query(`
CREATE INDEX IF NOT EXISTS idx_channels_group_title ON channels(group_title);
`);

    return NextResponse.json({
      success: true,
      message: "Миграция Neon успешно завершена!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
