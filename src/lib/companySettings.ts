import { prisma } from "@/lib/db";

const SETTINGS_ID = "default";

export async function getCompanySettings() {
  return prisma.companySettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export { SETTINGS_ID };
