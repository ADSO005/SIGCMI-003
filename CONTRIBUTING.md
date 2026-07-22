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
- Open a Pull Request to develop.
- Wait for at least one review before merging.

## Code Style

All code must pass ESLint and be formatted with Prettier before creating a Pull Request.