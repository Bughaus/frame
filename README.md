# FRAME - Financials, Records, Activity, and Member Expenses

> [!CAUTION]
> **Disclaimer:** This project is "Vibe coded" (AI-assisted development) and has NOT yet been fully manually checked for errors or security vulnerabilities. It is in a prototype stage – **use at your own risk!**

FRAME is a modern, open-source club management system designed for sports clubs and associations. It streamlines administrative tasks, financial tracking, and member engagement through a clean, intuitive interface.

## 🚀 Key Features

- **Member Management**: Track member details, status, and historical data.
- **Financial Module (Treasurer)**: Comprehensive invoicing system with SEPA export (XML) for banking.
- **Point of Sale (Kasse)**: Digital cash register for club bars or events with article management and image support.
- **Working Hours Tracking**: Manage and verify member volunteer hours and event assignments.
- **Change Requests**: Integrated system for members to request data updates, ensuring GDPR compliance.
- **Security & RBAC**: Advanced Role-Based Access Control (VORSTAND, MITARBEITER, SCHATZMEISTER, MEMBER).
- **Privacy First**: Self-hosted architecture with full data control and built-in PII redaction for staff.

## 🛠 Tech Stack

- **Frontend**: Vue.js 3, Vuetify 3 (Material Design), Pinia (State Management), Vite.
- **Backend**: NestJS (Node.js), Prisma ORM.
- **Database**: PostgreSQL.
- **Security**: JWT Authentication, bcrypt hashing, SHA-256 for RFID tokens.

## 📦 Setting Up

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- RFID Hardware (optional, for the POS segment)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bughaus/frame.git
   cd frame
   ```

2. **Configure Backend**:
   - Navigate to `backend/`
   - Copy `.env.example` to `.env` and configure your database URL.
   - Install dependencies: `npm install`
   - Push schema to DB: `npx prisma db push`
   - Seed initial data: `npx prisma db seed`

3. **Configure Frontend**:
   - Navigate to `frontend/`
   - Install dependencies: `npm install`

4. **Run the Application**:
   - Backend: `cd backend && npm run start:dev`
   - Frontend: `cd frontend && npm run dev`

## ⚖️ License

Distributed under the **GPL-3.0 License**. See `LICENSE` (to be added) for more information.

## 👥 Authors

- **Michael Backhaus** - *Lead Developer* - [GitHub](https://github.com/bughaus)

---
*Created with a vibe of Metal.*
