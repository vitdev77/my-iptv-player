import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
export async function GET() {
  const client = await pool.connect();
  try {
    const queryText = "TRUNCATE TABLE channels RESTART IDENTITY;";
    await client.query(queryText);
    return NextResponse.json({
      success: true,
      message: "База данных успешно очищена, счетчик ID сброшен в 0.",
    });
  } catch (error: any) {
    console.error("Ошибка при очистке БД:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Не удалось очистить таблицу channels",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
