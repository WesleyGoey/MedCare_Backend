import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.settings.create({
    data: {
      alarmSound: "Default",
      notificationSound: "Default",
    },
  });

  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Seed User",
      email: "seed@example.com",
      password: hashedPassword,
      phone: "081234567890",
      age: 30,
      settingId: settings.id,
    },
  });

  // 5 medicines (status default true)
  const medsData = [
    { name: "Aspirin", type: "Tablet", dosage: "500mg", stock: 30, minStock: 5, notes: "After meal" },
    { name: "Paracetamol", type: "Tablet", dosage: "500mg", stock: 20, minStock: 5, notes: "Pain relief" },
    { name: "Amoxicillin", type: "Capsule", dosage: "250mg", stock: 14, minStock: 3, notes: "Antibiotic" },
    { name: "Vitamin C", type: "Tablet", dosage: "1000mg", stock: 60, minStock: 10, notes: "Immune support" },
    { name: "Metformin", type: "Tablet", dosage: "850mg", stock: 50, minStock: 10, notes: "For diabetes" },
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
        // status default true dari schema
      },
    });
    medicines.push(med);
  }

  // 3 schedules (semua DAILY, no scheduleType, no dayOfWeek, status default true)
  const schedulesToCreate = [
    {
      medicine: medicines[0].id,
      startDate: new Date(),
      details: [
        { time: new Date("1970-01-01T08:00:00Z") },
        { time: new Date("1970-01-01T20:00:00Z") },
      ],
    },
    {
      medicine: medicines[1].id,
      startDate: new Date(),
      details: [
        { time: new Date("1970-01-01T09:00:00Z") },
        { time: new Date("1970-01-01T21:00:00Z") },
      ],
    },
    {
      medicine: medicines[2].id,
      startDate: new Date(),
      details: [
        { time: new Date("1970-01-01T07:30:00Z") },
      ],
    },
  ];

  for (const s of schedulesToCreate) {
    await prisma.schedule.create({
      data: {
        medicineId: s.medicine,
        startDate: s.startDate,
        // REMOVED: scheduleType
        // status default true dari schema
        details: {
          create: s.details.map((d: any) => ({
            time: d.time,
            // REMOVED: dayOfWeek
          })),
        },
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });