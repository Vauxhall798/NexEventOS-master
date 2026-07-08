// Sets or resets a user's password from the command line — there's no
// "forgot password" / email flow yet, so this is how an admin creates a
// login for a new team member or resets one that's been lost.
//
// Usage: npx tsx scripts/set-password.ts <email> <new-password>
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/set-password.ts <email> <new-password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`No user found with email "${email}". Create the user first (e.g. via the seed script or Prisma Studio).`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  console.log(`Password updated for ${user.email} (${user.role}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
