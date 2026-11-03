// src/lib/db.ts
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in environment variables");
}

// Инициализируем пул соединений
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Удобная функция-обертка для выполнения быстрых SQL-запросов
export const query = (text: string, params?: any[]) => pool.query(text, params);
