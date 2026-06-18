# Base Database Schema Design (Supabase)

This document describes the schema design for the RAG Backoffice system. The database is hosted on Supabase, using PostgreSQL with the `pgvector` extension enabled for semantic vector search.

## DDL (SQL Schema)

Use the following SQL to set up or verify the tables in your Supabase SQL editor.

```sql
-- 1. Enable the pgvector extension to store and search vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Document Chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    -- google/embeddinggemma-300m generates embeddings of 768 dimensions
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create an index for cosine distance vector search (IVFFlat or HNSW)
-- HNSW index is recommended for performance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);
```

## Helper Function for Semantic Search

To perform vector searches from the Supabase client, we need a PostgreSQL stored function that performs cosine similarity comparison.

```sql
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.category_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 
    (1 - (document_chunks.embedding <=> query_embedding) > match_threshold)
    AND (filter_category_id IS NULL OR document_chunks.category_id = filter_category_id)
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```
