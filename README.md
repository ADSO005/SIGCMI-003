# 🏥 SIGCMI

> **Intelligent Medical Appointment Management System**

SIGCMI is an intelligent medical appointment management system built with Node.js, Express.js, Pug, Tailwind CSS, MySQL, Sequelize, and JWT authentication.

---

## 📋 Project Information

- **Project Name:** SIGCMI
- **Full Name:** Intelligent Medical Appointment Management System
- **Architecture:** Monolithic
- **Development Methodology:** Scrum
- **Version:** 1.0.0

---

## 🚀 Technologies

### Backend
- Node.js
- Express.js
- MySQL
- Sequelize ORM

### Authentication & Security
- JSON Web Token (JWT)
- Bcrypt
- Express Validator
- CSRF Protection
- Cookie Parser

### Frontend
- Pug (Template Engine)
- Tailwind CSS
- JavaScript

### Development Tools
- Git
- GitHub
- ESLint
- Prettier

---

## ⚙️ Installation

### Requirements

- Node.js 24 or later
- MySQL 8 or later
- A MySQL account allowed to create databases and tables

### Set up the database

1. Install the project dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   In PowerShell, use `Copy-Item .env.example .env`.

3. Set the MySQL connection variables in `.env`:

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_user
   DB_PASS=your_mysql_password
   DB_NAME=sigcminew
   ```

4. Create the database schema and required catalog records:

   ```bash
   npm run db:migrate
   ```

   The command creates `DB_NAME` if needed and applies pending migrations. It creates the application tables without the retired weekly schedule request tables. Your MySQL account must have permission to create the database and schema objects.

5. Configure `JWT_SECRET` and the `EMAIL_*` settings in `.env` before using authentication, registration, or email features. Use SMTP credentials from your email provider; `EMAIL_FROM` must be a sender address accepted by that provider. Do not commit `.env`.

### Start the application

For development, run the server and CSS watchers:

```bash
npm run dev
```

To start only the server after the CSS files have been generated:

```bash
npm start
```

The server uses port `3000` by default. Set `PORT` in `.env` to use another port.

To check migration status, run `npm run db:migrate:status`.

---

## 📂 Project Structure

```text
SIGCMI/
├── config/
├── controllers/
├── helpers/
├── middleware/
├── migrations/
├── models/
├── public/
├── routes/
├── scripts/
├── services/
├── tests/
├── utils/
├── views/
├── README.md
├── CONTRIBUTING.md
├── PRODUCT_BACKLOG.md
├── SPRINT_0.md
├── package.json
└── LICENSE
```

---

## 👥 Development Team

| Name | Role |
|------|------|
| Santiago Galindo | Full-stack |
| Cristians Marmolejo | Full-stack |
| Joseph Gomez | Full-stack |
| Karen Yulieth Herrera | Full-stack |

---

## 🌿 Git Workflow

The project follows the Git Flow strategy:

```text
main
develop
feature/*
```

Develop features in `feature/*` branches and merge them into `develop` through a pull request.

---

## 🎓 Academic Project

This project was developed as part of the **Software Analysis and Development Technology (ADSO)** program at **SENA (Servicio Nacional de Aprendizaje)** using the Scrum framework and GitHub for collaborative software development.
