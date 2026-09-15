import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MEMBERS: { name: string; isLeader?: boolean }[] = [
  { name: "정연석", isLeader: true },
  { name: "김선경" },
  { name: "김영진" },
  { name: "주유란" },
  { name: "이종준" },
  { name: "박진현" },
];

async function main() {
  for (const member of MEMBERS) {
    await prisma.member.upsert({
      where: { name: member.name },
      update: { isLeader: member.isLeader ?? false },
      create: { name: member.name, isLeader: member.isLeader ?? false },
    });
  }
  console.log(`Seeded ${MEMBERS.length} members.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
