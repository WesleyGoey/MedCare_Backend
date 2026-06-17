# ⏰ MedCare - Healthcare & Medication Reminder Mobile App (Backend)

[![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

MedCare Backend is a scalable RESTful API service engineered to power a specialized eldercare medication adherence platform. This system handles complex relational database mapping, persistent recurring alert logic, and secure multi-role entity relationships, ensuring data processing remains stable and available for client applications.

*Companion Frontend Repository:* [MedCare Frontend](https://github.com/WesleyGoey/MedCare_Frontend.git)

---

## 📌 Project Context & Metadata

| Attribute | Details |
| :--- | :--- |
| 🎓 Institution | Universitas Ciputra Surabaya |
| 🚀 Academic Timeline | Semester 3 - Visual Programming Final Project |
| 📅 Development Period | September 2025 – January 2026 |
| 👥 Team Size | 3 Developers |
| 💻 Platform | RESTful API Service |

---

## 🚀 Technical Features & Core Logic

### 🏗️ Enterprise Layered Architecture
- Design Patterns: Implemented a robust architecture separating logic into DTOs (Data Transfer Objects), Services, and Repositories to isolate operational queries from client endpoints.
- Scalable Route Design: Created structured RESTful API layers, defining predictable endpoint architectures to serve frontend payload requirements cleanly.

### 💾 Schema Modeling & Data Persistence
- Relational Database Modeling: Configured a normalized PostgreSQL database schema optimized to register complex relational connections among users, caregivers, customized medications, and recurring schedules.
- Prisma ORM Optimization: Leveraged Prisma ORM to execute secure database transactions and migration controls, minimizing raw SQL runtime errors and abstracting table relationships efficiently.

### 📊 Scheduling Engine & Adherence Tracking
- Recurring Frequency Calculators: Built backend scheduling validators to parse and store diverse cron-like intake patterns (e.g., daily, specific interval gaps).
- Centralized Compliance Audit: Engineered database operations to save history logs, allowing the system to aggregate operational data for compliance reporting.

---

## 💻 Tech Stack

- Runtime Environment: Node.js
- Framework: Express.js
- ORM: Prisma
- Database: PostgreSQL
- Architecture Pattern: Layered Architecture (DTO, Service, Repository)
