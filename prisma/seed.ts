import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ✅ Helper: Create UTC date at midnight
function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

async function main() {
  console.log("🌱 Starting seed...");

  // ============================================
  // 1. CREATE USER
  // ============================================
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Seed User",
      email: "seed@example.com",
      password: hashedPassword,
      phone: "081234567890",
      age: 30,
    },
  });
  console.log("✅ User created:", user.email);

  // ============================================
  // 2. CREATE MEDICINES
  // ============================================
  const medsData = [
    { name: "Aspirin", type: "Tablet", dosage: "500mg", stock: 30, minStock: 5, notes: "After meal" },
    { name: "Paracetamol", type: "Tablet", dosage: "500mg", stock: 20, minStock: 5, notes: "Pain relief" },
    { name: "Amoxicillin", type: "Capsule", dosage: "250mg", stock: 14, minStock: 3, notes: "Antibiotic" },
    { name: "Vitamin C", type: "Tablet", dosage: "1000mg", stock: 60, minStock: 10, notes: "Immune support" },
    { name: "Metformin", type: "Tablet", dosage: "850mg", stock: 3, minStock: 10, notes: "For diabetes (LOW STOCK)" },
  ];

  const medicines = [];
  for (const m of medsData) {
    const med = await prisma.medicine.create({
      data: {
        userId: user.id,
        name: m.name,
        type: m.type,
        dosage: m.dosage,
        stock: m.stock,
        minStock: m.minStock,
        notes: m.notes,
      },
    });
    medicines.push(med);
  }
  console.log(`✅ Created ${medicines.length} medicines`);

  // ============================================
  // 3. CREATE SCHEDULES (DAILY, for the week)
  // ============================================
  const schedulesData = [
    {
      medicine: medicines[0],
      startDate: createUTCDate(2025, 1, 5), // ✅ UTC midnight
      times: ["08:00", "20:00"],
    },
    {
      medicine: medicines[1],
      startDate: createUTCDate(2025, 1, 5),
      times: ["09:00", "21:00"],
    },
    {
      medicine: medicines[2],
      startDate: createUTCDate(2025, 1, 5),
      times: ["07:30", "19:30"],
    },
    {
      medicine: medicines[3],
      startDate: createUTCDate(2025, 1, 5),
      times: ["08:30"],
    },
  ];

  const createdSchedules: any[] = [];
  for (const s of schedulesData) {
    const schedule = await prisma.schedule.create({
      data: {
        medicineId: s.medicine.id,
        startDate: s.startDate,
        details: {
          create: s.times.map((time) => ({
            time: new Date(`1970-01-01T${time}:00Z`),
          })),
        },
      },
      include: {
        details: true,
      },
    });
    createdSchedules.push({ ...s, schedule });
  }
  console.log(`✅ Created ${createdSchedules.length} schedules with details`);

  // ============================================
  // 4. CREATE HISTORY (5-7 Jan: UTC dates)
  // ============================================
  
  // ✅ Week range: Senin 5 Jan - Rabu 7 Jan 2025 (UTC midnight)
  const weekDates = [
    { date: createUTCDate(2025, 1, 5), label: "Senin" },    // Monday
    { date: createUTCDate(2025, 1, 6), label: "Selasa" },   // Tuesday
    { date: createUTCDate(2025, 1, 7), label: "Rabu" },     // Wednesday (TODAY)
  ];

  let historyCount = 0;

  for (const [index, { date: dayStart, label }] of weekDates.entries()) {
    for (const schedItem of createdSchedules) {
      for (const detail of schedItem.schedule.details) {
        const timeStr = detail.time.toISOString().substr(11, 5); // "08:00"
        const [hours, minutes] = timeStr.split(":").map(Number);

        // ✅ Build scheduled time in UTC
        const scheduledTime = new Date(dayStart);
        scheduledTime.setUTCHours(hours, minutes, 0, 0);

        let status: "PENDING" | "DONE" | "MISSED";
        let timeTaken: Date | null = null;

        if (index === 0) {
          // 5 Jan (Senin): 80% DONE, 20% MISSED
          const rand = Math.random();
          if (rand < 0.8) {
            status = "DONE";
            timeTaken = new Date(scheduledTime.getTime() + Math.random() * 30 * 60 * 1000);
          } else {
            status = "MISSED";
          }
        } else if (index === 1) {
          // 6 Jan (Selasa): 70% DONE, 30% MISSED
          const rand = Math.random();
          if (rand < 0.7) {
            status = "DONE";
            timeTaken = new Date(scheduledTime.getTime() + Math.random() * 45 * 60 * 1000);
          } else {
            status = "MISSED";
          }
        } else if (index === 2) {
          // 7 Jan (Rabu/TODAY): ALL PENDING
          status = "PENDING";
        } else {
          continue;
        }

        // ✅ Insert history dengan UTC date
        await prisma.history.create({
          data: {
            detailId: detail.id,
            date: dayStart, // Already UTC midnight
            timeTaken,
            status,
          },
        });
        historyCount++;
      }
    }
  }

  console.log(`✅ Created ${historyCount} history records (5-7 Jan 2025)`);

  // ============================================
  // 5. SUMMARY
  // ============================================
  console.log("\n📊 SEED SUMMARY:");
  console.log("=====================================");
  console.log(`User: ${user.email}`);
  console.log(`Medicines: ${medicines.length}`);
  console.log(`  - ${medicines[0].name}: ${medicines[0].stock}/${medicines[0].minStock} stock`);
  console.log(`  - ${medicines[4].name}: ${medicines[4].stock}/${medicines[4].minStock} stock (⚠️ LOW STOCK)`);
  console.log(`Schedules: ${createdSchedules.length}`);
  console.log(`  Total schedule details: ${createdSchedules.reduce((sum, s) => sum + s.times.length, 0)}`);
  console.log(`History records: ${historyCount}`);
  console.log(`  - 5 Jan (Senin): ~80% DONE, ~20% MISSED`);
  console.log(`  - 6 Jan (Selasa): ~70% DONE, ~30% MISSED`);
  console.log(`  - 7 Jan (Rabu/TODAY): ALL PENDING ✅`);
  console.log("=====================================");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });