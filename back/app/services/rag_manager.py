import os
import hashlib
import io
import logging
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from app.services.embeddings import embeddings_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

class RAGManager:
    def __init__(self):
        self.db = supabase_service
        self.embedder = embeddings_service

    def _calculate_md5(self, data: bytes) -> str:
        """Calculates MD5 hash of the file bytes."""
        return hashlib.md5(data).hexdigest()

    def _extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extracts text content from PDF bytes using pypdf."""
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
            return "\n\n".join(text)
        except Exception as e:
            raise ValueError(f"Error parsing PDF file: {e}")

    def _chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """Splits text into chunks of chunk_size characters with chunk_overlap overlap."""
        if not text.strip():
            return []
        
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append(chunk)
            start += chunk_size - chunk_overlap
            
        return chunks

    def ingest_document(
        self,
        category_name: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Orchestrates document ingestion: checks/creates category, embeds content, and saves to DB."""
        if not content.strip():
            raise ValueError("Document content cannot be empty.")

        # 1. Resolver o crear la categoría
        category = self.db.get_category_by_name(category_name)
        if not category:
            logger.info(f"Category '{category_name}' not found. Creating it.")
            category = self.db.create_category(category_name, f"Auto-created category for {category_name}")
        
        category_id = category["id"]

        # 2. Generar el embedding vector
        logger.info(f"Generating embedding for content of category '{category_name}'...")
        embedding = self.embedder.get_embedding(content)

        # 3. Guardar en Supabase
        logger.info("Storing document chunk in Supabase...")
        return self.db.insert_document_chunk(
            category_id=category_id,
            content=content,
            embedding=embedding,
            metadata=metadata,
            document_id=document_id,
            language=language
        )

    def ingest_file(
        self,
        category_name: str,
        filename: str,
        file_bytes: bytes,
        metadata: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Ingests a file (PDF, MD, TXT) with MD5 deduplication and chunk-based embedding."""
        # 1. Calcular hash MD5 del archivo
        file_hash = self._calculate_md5(file_bytes)
        
        # 2. Obtener o crear la categoría
        category = self.db.get_category_by_name(category_name)
        if not category:
            logger.info(f"Category '{category_name}' not found. Creating it.")
            category = self.db.create_category(category_name, f"Auto-created category for {category_name}")
        category_id = category["id"]

        # 3. Comprobar duplicado en tabla documents
        existing_doc = self.db.get_document_by_filename(category_id, filename)
        if existing_doc:
            if existing_doc["file_hash"] == file_hash:
                logger.info(f"File '{filename}' already ingested with same hash. Skipping.")
                # Count current chunks in DB for this document
                chunks_resp = self.db.client.table("document_chunks").select("id", count="exact").eq("document_id", existing_doc["id"]).execute()
                chunks_count = chunks_resp.count or 0
                return {
                    "status": "skipped",
                    "message": "File already exists and content is identical.",
                    "document_id": existing_doc["id"],
                    "filename": filename,
                    "created_at": existing_doc.get("created_at"),
                    "category_name": category_name,
                    "chunks_count": chunks_count
                }
            else:
                logger.info(f"File '{filename}' exists but hash changed. Deleting old document for overwrite.")
                self.db.delete_document(existing_doc["id"])

        # 4. Parsear contenido según extensión
        ext = os.path.splitext(filename.lower())[1]
        if ext == ".pdf":
            logger.info(f"Extracting text from PDF: {filename}...")
            text_content = self._extract_text_from_pdf(file_bytes)
        elif ext in [".md", ".txt"]:
            logger.info(f"Reading text/markdown file: {filename}...")
            text_content = file_bytes.decode("utf-8", errors="ignore")
        else:
            # Fallback a texto
            logger.warning(f"Unsupported file extension '{ext}'. Attempting to read as plain text.")
            text_content = file_bytes.decode("utf-8", errors="ignore")

        if not text_content.strip():
            raise ValueError(f"No text content could be extracted from file '{filename}'.")

        # 5. Crear el registro del documento en la base de datos
        logger.info(f"Registering new document: {filename}...")
        doc_record = self.db.create_document(category_id, filename, file_hash)
        document_id = doc_record["id"]

        # 6. Dividir el texto en chunks
        chunks = self._chunk_text(text_content)
        logger.info(f"Generated {len(chunks)} chunks from document.")

        # 7. Ingestar cada chunk (embedding + guardar)
        ingested_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_metadata = (metadata or {}).copy()
            chunk_metadata.update({
                "source": filename,
                "chunk_index": i,
                "total_chunks": len(chunks)
            })
            
            logger.info(f"Embedding and storing chunk {i+1}/{len(chunks)}...")
            embedding = self.embedder.get_embedding(chunk)
            chunk_res = self.db.insert_document_chunk(
                category_id=category_id,
                content=chunk,
                embedding=embedding,
                metadata=chunk_metadata,
                document_id=document_id,
                language=language
            )
            ingested_chunks.append(chunk_res["id"])

        return {
            "status": "success",
            "message": f"Successfully ingested {len(chunks)} chunks.",
            "document_id": document_id,
            "chunks_count": len(chunks),
            "chunks": ingested_chunks,
            "filename": filename,
            "created_at": doc_record.get("created_at"),
            "category_name": category_name
        }

    def search_similar_documents(
        self,
        query: str,
        category_name: Optional[str] = None,
        match_threshold: float = 0.4,
        match_count: int = 5
    ) -> List[Dict[str, Any]]:
        """Orchestrates similarity search: embeds query and queries Supabase."""
        if not query.strip():
            raise ValueError("Search query cannot be empty.")

        # 1. Generar embedding para el query
        logger.info(f"Generating embedding for query: '{query}'...")
        query_embedding = self.embedder.get_embedding(query)

        # 2. Resolver la categoría ID si se especificó el nombre
        category_id = None
        if category_name:
            category = self.db.get_category_by_name(category_name)
            if not category:
                logger.warning(f"Filter category '{category_name}' not found. Searching all categories.")
            else:
                category_id = category["id"]

        # 3. Buscar en la base de datos
        logger.info("Executing vector similarity search...")
        return self.db.semantic_search(
            query_embedding=query_embedding,
            match_threshold=match_threshold,
            match_count=match_count,
            category_id=category_id
        )

# Instancia singleton para reuso
rag_manager = RAGManager()
