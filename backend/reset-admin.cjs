const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@sloncar.com";
  const newPassword = "sloncar";

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash }, // ✅ doğru alan
  });

  console.log(`✅ Admin password reset OK -> ${email} / ${newPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
