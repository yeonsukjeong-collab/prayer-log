import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MEMBERS: { name: string; isLeader?: boolean; isAdmin?: boolean }[] = [
  { name: "정연석", isLeader: true, isAdmin: true },
  { name: "김선경", isAdmin: true },
  { name: "김영진" },
  { name: "주유란" },
  { name: "이종준" },
  { name: "박진현" },
];

async function main() {
  for (const member of MEMBERS) {
    const data = {
      isLeader: member.isLeader ?? false,
      isAdmin: member.isAdmin ?? false,
    };
    await prisma.member.upsert({
      where: { name: member.name },
      update: data,
      create: { name: member.name, ...data },
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
