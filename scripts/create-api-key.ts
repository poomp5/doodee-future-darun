#!/usr/bin/env bun
/**
 * สร้าง API Key สำหรับ dekgp.com (หรือแอปอื่น)
 * รัน: bun scripts/create-api-key.ts
 */
import { prisma } from "../lib/prisma";
import { randomBytes, createHash } from "crypto";

async function main() {
  const rawKey = "df_live_" + randomBytes(32).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const created = await prisma.api_keys.create({
    data: {
      key_hash: keyHash,
      name: "dekgp.com",
      owner_email: "admin@dekgp.com",
      rate_limit: 120,
      scopes: [
        "read:exams",
        "write:attempts",
        "read:attempts",
        "read:dream-faculties",
        "write:dream-faculties",
      ],
    },
  });

  console.log("\n✅  API Key created!");
  console.log(`    ID   : ${created.id}`);
  console.log(`    Name : ${created.name}`);
  console.log("\n🔑  Key (แสดงครั้งเดียว - เก็บใส่ .env ของ dekgp ทันที):\n");
  console.log(`    ${rawKey}\n`);
  console.log("เพิ่มใน .env ของ dekgp.com:");
  console.log(`    DOODEE_API_KEY=${rawKey}\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
