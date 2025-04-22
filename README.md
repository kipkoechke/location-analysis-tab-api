# 📍 Location Analysis Backend – PDF Parsing & Data Pipeline

This repository contains my submission for the Starboard backend integration challenge. It supports uploading Offering Memorandum (OM) PDFs and extracting key structured data to be consumed by the frontend.

---

## 🔗 Live Deployment

- **Live API URL:** [https://location-analysis-tab-api.onrender.com/pdf/upload](https://location-analysis-tab-api.onrender.com/pdf/upload)
- **Endpoint:** `POST /om/upload`

---

## 🧠 Tech Stack

- **Backend:** NestJS, TypeORM, PostgreSQL
- **PDF Parsing:** [pdf.js-extract](https://www.npmjs.com/package/pdf.js-extract)
- **Frontend:** React, React Query, Context API
- **Deployment:** Render.com (Node Web Service + Managed PostgreSQL)

---

## ✅ Features

- Upload OM PDFs and extract structured JSON data
- Extracted sections:
  - Sales Comparables (structured table data)
  - Proximity Insights (locations, distances, strategic notes)
  - Demographics (population, income, spending power)
- Partial support for zoning and pipeline data
- Frontend integration with **React Query** for fetching + **Context API** for shared state
- Clean UI with upload functionality and data display

---

## ⚙️ Running the Project Locally

### 1. Clone the repository

````bash
git clone https://github.com/your-username/location-analysis-backend.git
cd location-analysis-backend

## Set up .env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=location-analysis
PORT=3000

## Installation

```bash
$ npm install
````

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
