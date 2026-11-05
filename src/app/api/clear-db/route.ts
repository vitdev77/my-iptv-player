import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    // Очищаем таблицу каналов в PostgreSQL
    await query("DELETE FROM channels");

    // Сбрасываем счетчик автоинкремента ID обратно на 1
    // По стандарту PostgreSQL имя последовательности формируется как: имяТаблицы_имяКолонки_seq
    try {
      await query("ALTER SEQUENCE channels_id_seq RESTART WITH 1");
    } catch (seqError) {
      // Если имя колонки отличается (например, id генерируется иначе), пробуем альтернативный метод TRUNCATE
      // Команда TRUNCATE удаляет данные и автоматически сбрасывает счетчики
      await query("TRUNCATE TABLE channels RESTART IDENTITY CASCADE");
    }

    return NextResponse.json({
      success: true,
      message: "База данных успешно очищена, счетчик ID сброшен на 1",
    });
  } catch (error: any) {
    console.error("Ошибка при очистке БД:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось очистить базу данных" },
      { status: 500 },
    );
  }
}
