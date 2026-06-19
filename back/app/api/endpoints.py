import json
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.supabase_service import supabase_service
from app.services.embeddings import embeddings_service
from app.services.rag_manager import rag_manager

router = APIRouter(prefix="/api")

# --- Schemas ---

class CategoryCreate(BaseModel):
    name: str = Field(..., examples=["projects"], description="Uniq name of the category")
    description: Optional[str] = Field(None, examples=["Category to store project-related info"], description="Category description")

class DocumentIngest(BaseModel):
    category_name: str = Field(..., examples=["projects"], description="Category for the document")
    content: str = Field(..., examples=["This is the backoffice RAG setup guide"], description="Text content to embed and save")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata dictionary")

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., examples=["how to configure docker compose"], description="Search query in plain text")
    category_name: Optional[str] = Field(None, examples=["projects"], description="Filter search by category name")
    match_threshold: float = Field(0.4, ge=0.0, le=1.0, description="Minimum similarity threshold")
    match_count: int = Field(5, ge=1, le=50, description="Number of results to return")

class EmbedRequest(BaseModel):
    text: str = Field(..., examples=["Hello World"])

# --- Routes ---

@router.post("/categories", summary="Create a new information category")
def create_category(payload: CategoryCreate):
    try:
        # Verificar si la categoría ya existe
        existing = supabase_service.get_category_by_name(payload.name)
        if existing:
            raise HTTPException(status_code=400, detail=f"Category '{payload.name}' already exists.")
        
        category = supabase_service.create_category(payload.name, payload.description)
        return {"status": "success", "data": category}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories", summary="List all categories")
def list_categories():
    try:
        categories = supabase_service.list_categories()
        return {"status": "success", "data": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/ingest", summary="Ingest, embed and store a document chunk")
def ingest_document(payload: DocumentIngest):
    try:
        result = rag_manager.ingest_document(
            category_name=payload.category_name,
            content=payload.content,
            metadata=payload.metadata
        )
        return {"status": "success", "message": "Document chunk ingested successfully", "data": {
            "id": result["id"],
            "category_id": result["category_id"],
            "content": result["content"],
            "metadata": result["metadata"]
        }}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/search", summary="Perform semantic search using embedding comparison")
def semantic_search(payload: SemanticSearchRequest):
    try:
        results = rag_manager.search_similar_documents(
            query=payload.query,
            category_name=payload.category_name,
            match_threshold=payload.match_threshold,
            match_count=payload.match_count
        )
        return {"status": "success", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embeddings/generate", summary="Generate vector embeddings for a given text")
def generate_raw_embeddings(payload: EmbedRequest):
    try:
        embedding = embeddings_service.get_embedding(payload.text)
        return {
            "status": "success",
            "model": embeddings_service.model_name,
            "dimensions": len(embedding),
            "embedding": embedding
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/documents/upload", summary="Upload, parse, chunk, embed and store a file (PDF, MD, TXT)")
async def upload_document(
    category_name: str = Form(..., examples=["projects"], description="Category for the document"),
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None, description="Optional JSON string metadata")
):
    try:
        # Parsear metadatos JSON opcionales
        meta_dict = {}
        if metadata:
            try:
                meta_dict = json.loads(metadata)
            except json.JSONDecodeError as je:
                raise HTTPException(status_code=400, detail=f"Invalid JSON in metadata: {je}")

        file_bytes = await file.read()
        
        result = rag_manager.ingest_file(
            category_name=category_name,
            filename=file.filename,
            file_bytes=file_bytes,
            metadata=meta_dict
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", summary="Get dashboard statistics")
def get_stats():
    try:
        stats = supabase_service.get_stats()
        return {"status": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
