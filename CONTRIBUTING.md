# Contributing Guide - SIGCMI

This document defines the coding standards, Git workflow and collaboration guidelines for the SIGCMI project. All team members must follow these conventions.

## Team Members

- Juan Esteban Montoya Marín (Scrum Master)
- Karen Herrera
- Cristian Marmolejo
- Daniela Tamayo
- Santiago Galindo

## Variables

Use camelCase.

Example:

patientName

appointmentDate

doctorId

## Functions

Use camelCase.

Example:

createAppointment()

loginUser()

sendEmail()

## Classes

Use PascalCase.

Example:

User

Patient

Doctor

Appointment

## Database Tables

Use snake_case.

Examples:

users

patients

medical_appointments

medical_specialties

## Project Structure

src/
controllers/
models/
routes/
middleware/
views/
public/
config/

## Git Workflow

- main
- develop
- feature/*

- Never push directly to main.
- Work from a feature branch.
- Wait for at least one review before merging.

## Code Style

All code must pass ESLint and be formatted with Prettier before creating a Pull Request.

# Contributing to SIGCMI

Thank you for contributing to the SIGCMI project. Please follow the guidelines below to keep the codebase organized, consistent, and easy to maintain.

## Codebase Statistics

To count the lines of code in the project, we recommend using `cloc`.

### Install cloc

Install `cloc` globally using npm:

```bash
npm install -g cloc
```

### Count Lines of Code

From the root directory of the project, run:

```bash
cloc . --exclude-dir=node_modules,.git
```

This command provides the following information:

* Number of files
* Blank lines
* Comment lines
* Lines of code
* Breakdown by programming language

### Example

```text
-------------------------------------------------------------------------------
Language             files      blank    comment       code
-------------------------------------------------------------------------------
JavaScript              85       1200        450       8500
CSS                     20        300         50       2200
Pug                     15        200         30       1800
SQL                      8        100         20        700
-------------------------------------------------------------------------------
SUM:                   128       1800        550      13200
-------------------------------------------------------------------------------
```

> **Note:** The `node_modules` and `.git` directories are excluded because they contain external dependencies and Git metadata rather than project source code.
