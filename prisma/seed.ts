// Reuses the shared extended client (Decimal->number coercion) instead of a
// bare `new PrismaClient()` — otherwise sellingPrice/costPrice below would
// come back as Prisma.Decimal objects and break the `sellingPrice * qty`
// arithmetic further down.
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Seed accounts only — sets an initial password so the pilot can log in at
// all on day one. Must be changed immediately after first login (there's no
// "forgot password"/email flow yet — see scripts/set-password.ts to change
// it from the command line). `update: {}` on the user upserts below means
// this never resets a password that's already been changed for real.
const DEFAULT_SEED_PASSWORD_HASH = bcrypt.hashSync("ChangeMe123!", 10);

const categories = [
  "LED Screen",
  "Sound System",
  "Lighting",
  "Stage & Truss",
  "Furniture",
  "Decor",
  "Generator & Power",
];

const materials: {
  materialCode: string;
  materialName: string;
  category: string;
  subCategory: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  description: string;
}[] = [
  { materialCode: "LED001", materialName: "P3 Indoor LED Wall", category: "LED Screen", subCategory: "Indoor", unit: "Sq.ft", costPrice: 180, sellingPrice: 250, description: "High resolution LED panel" },
  { materialCode: "LED002", materialName: "P4.8 Outdoor LED Wall", category: "LED Screen", subCategory: "Outdoor", unit: "Sq.ft", costPrice: 160, sellingPrice: 220, description: "Weatherproof outdoor LED panel" },
  { materialCode: "LED003", materialName: "P2.6 Indoor LED Wall", category: "LED Screen", subCategory: "Indoor", unit: "Sq.ft", costPrice: 210, sellingPrice: 290, description: "Fine pitch indoor LED panel" },
  { materialCode: "SND001", materialName: "Line Array Speaker", category: "Sound System", subCategory: "PA System", unit: "Nos", costPrice: 3500, sellingPrice: 4800, description: "High output line array speaker" },
  { materialCode: "SND002", materialName: "Digital Mixer 32 Channel", category: "Sound System", subCategory: "Mixer", unit: "Nos", costPrice: 6000, sellingPrice: 8500, description: "32 channel digital audio mixer" },
  { materialCode: "SND003", materialName: "Wireless Handheld Mic", category: "Sound System", subCategory: "Microphone", unit: "Nos", costPrice: 800, sellingPrice: 1200, description: "UHF wireless handheld microphone" },
  { materialCode: "LGT001", materialName: "Moving Head Beam Light", category: "Lighting", subCategory: "Moving Head", unit: "Nos", costPrice: 1500, sellingPrice: 2200, description: "230W sharpy beam moving head" },
  { materialCode: "LGT002", materialName: "LED Par Can", category: "Lighting", subCategory: "Wash", unit: "Nos", costPrice: 350, sellingPrice: 550, description: "RGBW LED par light" },
  { materialCode: "LGT003", materialName: "Hazer Machine", category: "Lighting", subCategory: "Effects", unit: "Nos", costPrice: 900, sellingPrice: 1400, description: "Atmospheric haze effect machine" },
  { materialCode: "STG001", materialName: "Modular Stage Deck", category: "Stage & Truss", subCategory: "Stage", unit: "Sq.ft", costPrice: 60, sellingPrice: 95, description: "4x8 ft modular stage deck, up to 2ft height" },
  { materialCode: "STG002", materialName: "Box Truss 12 inch", category: "Stage & Truss", subCategory: "Truss", unit: "Running Ft", costPrice: 120, sellingPrice: 180, description: "Aluminium box truss section" },
  { materialCode: "FUR001", materialName: "Chiavari Chair", category: "Furniture", subCategory: "Seating", unit: "Nos", costPrice: 40, sellingPrice: 70, description: "Gold chiavari chair with cushion" },
  { materialCode: "FUR002", materialName: "Round Banquet Table", category: "Furniture", subCategory: "Table", unit: "Nos", costPrice: 150, sellingPrice: 250, description: "10-seater round banquet table" },
  { materialCode: "DEC001", materialName: "Floral Backdrop 10x10", category: "Decor", subCategory: "Backdrop", unit: "Nos", costPrice: 8000, sellingPrice: 12500, description: "Artificial floral backdrop, 10x10 ft" },
  { materialCode: "DEC002", materialName: "Fabric Draping", category: "Decor", subCategory: "Drapes", unit: "Running Ft", costPrice: 45, sellingPrice: 75, description: "Ceiling to floor fabric drape" },
  { materialCode: "PWR001", materialName: "125 KVA Silent Generator", category: "Generator & Power", subCategory: "Generator", unit: "Day", costPrice: 12000, sellingPrice: 18000, description: "Silent diesel generator with operator" },
];

async function main() {
  console.log("Seeding database...");

  const categoryMap = new Map<string, string>();
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryMap.set(name, cat.id);
  }

  for (const m of materials) {
    await prisma.material.upsert({
      where: { materialCode: m.materialCode },
      update: {},
      create: {
        materialCode: m.materialCode,
        materialName: m.materialName,
        subCategory: m.subCategory,
        unit: m.unit,
        costPrice: m.costPrice,
        sellingPrice: m.sellingPrice,
        description: m.description,
        categoryId: categoryMap.get(m.category),
      },
    });
  }

  // Company name is the known pilot customer; GST/PAN/bank/signature are
  // deliberately left blank rather than fabricated — those must be entered
  // by Sri Eswari Groups themselves under Settings > Company Profile before
  // the first real proposal goes out, since they print on every PDF.
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Sri Eswari Groups",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { name: "Admin User", email: "admin@example.com", role: "ADMIN", passwordHash: DEFAULT_SEED_PASSWORD_HASH },
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: { name: "Priya Sharma", email: "sales@example.com", role: "SALES", passwordHash: DEFAULT_SEED_PASSWORD_HASH },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      clientName: "Rahul Mehta",
      company: "Zenith Weddings Pvt Ltd",
      contactPerson: "Rahul Mehta",
      email: "rahul@zenithweddings.com",
      phone: "+91 98765 43210",
    },
  });

  const existing = await prisma.proposal.findUnique({ where: { proposalNumber: "PROP-2026-0001" } });
  if (!existing) {
    const led = await prisma.material.findUnique({ where: { materialCode: "LED001" } });
    const sound = await prisma.material.findUnique({ where: { materialCode: "SND001" } });
    const light = await prisma.material.findUnique({ where: { materialCode: "LGT001" } });

    const items = [
      led && { material: led, qty: 40 },
      sound && { material: sound, qty: 4 },
      light && { material: light, qty: 10 },
    ].filter(Boolean) as { material: NonNullable<typeof led>; qty: number }[];

    const subtotal = items.reduce((sum, it) => sum + it.material.sellingPrice * it.qty, 0);
    const discountPercent = 5;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxPercent = 18;
    const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
    const grandTotal = subtotal - discountAmount + taxAmount;

    await prisma.proposal.create({
      data: {
        proposalNumber: "PROP-2026-0001",
        status: "SENT",
        clientId: client.id,
        clientName: client.clientName,
        company: client.company,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        eventName: "Zenith Annual Wedding Gala",
        eventDate: new Date("2026-08-15"),
        venue: "Grand Hyatt, Mumbai",
        salesPersonId: sales.id,
        salesPersonName: sales.name,
        notes: "Client prefers warm white lighting theme.",
        subtotal,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        grandTotal,
        items: {
          create: items.map((it, idx) => ({
            materialId: it.material.id,
            materialName: it.material.materialName,
            description: it.material.description,
            unit: it.material.unit,
            sellingPrice: it.material.sellingPrice,
            quantity: it.qty,
            amount: it.material.sellingPrice * it.qty,
            sortOrder: idx,
          })),
        },
      },
    });
  }

  console.log(`Seed complete. Admin: ${admin.email}, Sales: ${sales.email}`);
  console.log(`If these accounts were just created, their password is "ChangeMe123!" — change it immediately (npx tsx scripts/set-password.ts <email> <new-password>).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
