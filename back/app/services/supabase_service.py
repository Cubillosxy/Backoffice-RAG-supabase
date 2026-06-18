import os
import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        # Preferir service role key para operaciones administrativas si está disponible
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        self._client: Optional[Client] = None

        if not self.supabase_url or not self.supabase_key or "your-supabase" in self.supabase_url:
            logger.warning("Supabase credentials are not fully configured or are using placeholders.")
        else:
            try:
                self._client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.error(f"Error initializing Supabase client: {e}")

    @property
    def client(self) -> Client:
        if self._client is None:
            raise ValueError(
                "Supabase client is not initialized. Please verify SUPABASE_URL and SUPABASE_KEY in your environment."
            )
        return self._client

    # --- Categories CRUD ---

    def create_category(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new document category."""
        data = {"name": name, "description": description}
        response = self.client.table("categories").insert(data).execute()
        if not response.data:
            raise RuntimeError("Failed to create category or empty response.")
        return response.data[0]

    def list_categories(self) -> List[Dict[str, Any]]:
        """Lists all existing categories."""
        response = self.client.table("categories").select("*").order("name").execute()
        return response.data or []

    def get_category_by_id(self, category_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a category by its ID."""
        response = self.client.table("categories").select("*").eq("id", category_id).execute()
        return response.data[0] if response.data else None

    def get_category_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Fetches a category by its name."""
        response = self.client.table("categories").select("*").eq("name", name).execute()
        return response.data[0] if response.data else None

    # --- Documents CRUD (Deduplication) ---

    def get_document_by_filename(self, category_id: str, filename: str) -> Optional[Dict[str, Any]]:
        """Fetches a document by its filename in a specific category."""
        response = self.client.table("documents").select("*").eq("category_id", category_id).eq("filename", filename).execute()
        return response.data[0] if response.data else None

    def create_document(self, category_id: str, filename: str, file_hash: str) -> Dict[str, Any]:
        """Creates a document tracking entry."""
        data = {
            "category_id": category_id,
            "filename": filename,
            "file_hash": file_hash
        }
        response = self.client.table("documents").insert(data).execute()
        if not response.data:
            raise RuntimeError("Failed to create document record.")
        return response.data[0]

    def delete_document(self, document_id: str) -> None:
        """Deletes a document tracking entry (triggers ON DELETE CASCADE for chunks)."""
        self.client.table("documents").delete().eq("id", document_id).execute()

    # --- Document Chunks CRUD ---

    def insert_document_chunk(
        self,
        category_id: str,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Inserts a new document chunk with its vector embedding."""
        data = {
            "category_id": category_id,
            "content": content,
            "embedding": embedding,
            "metadata": metadata or {}
        }
        if document_id:
            data["document_id"] = document_id
            
        response = self.client.table("document_chunks").insert(data).execute()
        if not response.data:
            raise RuntimeError("Failed to insert document chunk or empty response.")
        return response.data[0]

    def list_document_chunks(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists document chunks without embeddings (standard fetch)."""
        response = self.client.table("document_chunks").select("id, category_id, content, metadata, created_at").limit(limit).execute()
        return response.data or []

    # --- Vector Similarity Search ---

    def semantic_search(
        self,
        query_embedding: List[float],
        match_threshold: float = 0.5,
        match_count: int = 5,
        category_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Performs a vector search in Supabase using the match_document_chunks RPC."""
        params = {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count
        }
        if category_id:
            params["filter_category_id"] = category_id

        # RPC call to search pgvector
        response = self.client.rpc("match_document_chunks", params).execute()
        return response.data or []

# Instancia singleton para reuso en toda la aplicación
supabase_service = SupabaseService()
