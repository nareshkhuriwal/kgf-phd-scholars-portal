
# PhD Literature Review Admin (React + Vite)

A professional admin portal to record literature review fields, review papers one-by-one, and generate reports (ROL + full Literature Report to Excel).

## Features
- Secure login (JWT token expected; mock mode available)
- Review Papers: list, add, edit, delete
- Full paper schema covering: Paper ID, Literature Review, Category of Paper, DOI, Author(s), Year, Title, Name of Journal/Conference, ISSN / ISBN, Name of Publisher / Organization, Place of Conference, Volume, Issue, Page No, Area / Sub Area, Key Issue, Solution Approach / Methodology used, Related Work, Input Parameters used, Hardware / Software / Technology Used, Results, Key advantages, Limitations, Remarks
- Reports:
  - ROL report (subset of key columns)
  - Download complete Literature report (all columns) as Excel

## Tech
- React + Vite
- MUI
- React Router v6
- Redux Toolkit
- XLSX for Excel export

## Quick Start
```bash
npm i
cp .env.sample .env
# For demo without backend:
# ensure VITE_MOCK_MODE=true
npm run dev
```

## Backend API (expected)
- `POST /auth/login` -> `{ token, user }`
- `GET /papers` -> list of papers
- `POST /papers` -> create
- `GET /papers/:id` -> detail
- `PUT /papers/:id` -> update
- `DELETE /papers/:id` -> delete
- `GET /reports/rol` -> list rows for ROL report

Set `VITE_API_BASE_URL` in `.env` to your backend base URL. Set `VITE_MOCK_MODE=false` to call your real APIs.
# kgf-phd-scholars-portal
