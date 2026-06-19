# Backoffice RAG Supabase

This project is a monorepo containing a Retrieval-Augmented Generation (RAG) system with a **FastAPI** backend, a **React (Vite)** frontend, and a **Supabase (pgvector)** database.

---

## Architecture Overview

The codebase is split into two primary components:

*   **`/back` (Backend)**: A FastAPI application hosting modular API endpoints, document parsing (`pypdf` for PDFs, native text loaders for TXT/MD), and RAG business logic. It runs local CPU vector embeddings using `sentence-transformers` with the `google/embedding-gemma-300m` model.
*   **`/front` (Frontend)**: A modern React application created with Vite, styled with custom CSS variables (featuring glassmorphic dark-mode aesthetics), and packaged into a multi-stage Docker build served via Nginx.

---

## Required Environment Variables

### Backend Configuration (`back/.env`)

Create a `.env` file in the `back/` folder (you can copy `back/.env.example` as a template):

```bash
# Server Port (Optional)
PORT=8000

# Supabase Credentials (Required)
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Logging Configuration (Optional - DEBUG, INFO, WARNING, ERROR)
LOG_LEVEL=INFO
```

### Frontend Configuration

The React build dynamically references the backend URL via:
- `VITE_API_URL`: Backend API base address. (Defaults to `http://localhost:8000` if not set).

---

## Main Flows

1.  **Document Ingestion & Deduplication**:
    *   The frontend uploads files or plain text with optional JSON metadata.
    *   The backend calculates an MD5 hash of the file. If an identical file exists in the category, ingestion is skipped. If a modified version is uploaded, old vector chunks are clean-deleted and overwritten.
    *   The text is split into chunks, embedded using Gemma-300m, and saved into Supabase `document_chunks` with `language` and `metadata` properties.
    *   A progress stepper displays active steps, culminating in an **Ingestion Summary** card detailing the registered/skipped file.

2.  **Semantic Search**:
    *   A query string is submitted from the search panel.
    *   The backend embeds the query and matches it against database chunks using a cosine similarity threshold RPC (`match_document_chunks`).

3.  **Metrics & Categories CRUD**:
    *   The dashboard dynamically queries metrics (number of active categories and chunks).
    *   Users can manage document organization folders through category creation forms.

---

## How to Run & Access

### 1. Build and Run Container Services

Run the following command from the root directory to build and spin up the Docker containers in detached mode:

```bash
docker compose up --build -d
```

### 2. Services & Docs URLs

Once the containers are running, you can access the application at the following endpoints:

*   **Frontend Dashboard**: [http://localhost:8080](http://localhost:8080)
*   **Backend API Root**: [http://localhost:8000](http://localhost:8000)
*   **API Interactive Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
*   **API Static Schema Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Running Tests

### Backend Unit Tests

Run the pytest suite inside the running backend container:

```bash
docker compose exec back pytest tests/
```

### Frontend Tests

Currently, the frontend scaffold is minimal and does not include a testing framework. If test suites (e.g. Vitest / React Testing Library) are added later, you can run them via:

```bash
cd front && npm run test
```
