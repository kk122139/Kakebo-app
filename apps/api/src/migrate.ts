import { db } from "./db";
import { readFileSync } from "node:fs";
import { join } from "node:path";
(async () => {
  try {
    await db.query(readFileSync(join(__dirname, "schema.sql"), "utf8"));
    console.log("Esquema instalado");
  } finally {
    await db.end();
  }
})().catch(() => {
  console.error("No se pudo instalar el esquema");
  process.exitCode = 1;
});
