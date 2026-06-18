import os
import sys
from unittest.mock import MagicMock, patch

# Asegurar importaciones
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, "..")))
sys.path.append(os.path.abspath(os.path.join(current_dir, "../app")))

import pytest
from fastapi.testclient import TestClient

# Mock de los servicios antes de cargar la app para evitar descargas reales y llamadas a la API de Supabase en los tests unitarios
mock_embedding_service = MagicMock()
mock_embedding_service.get_embedding.return_value = [0.1] * 768
mock_embedding_service.model_name = "mock-model"

mock_supabase_service = MagicMock()
mock_supabase_service.get_category_by_name.return_value = {"id": "test-cat-id", "name": "test-cat"}
mock_supabase_service.create_category.return_value = {"id": "new-cat-id", "name": "new-cat"}
mock_supabase_service.list_categories.return_value = [{"id": "test-cat-id", "name": "test-cat"}]
mock_supabase_service.insert_document_chunk.return_value = {
    "id": "chunk-id",
    "category_id": "test-cat-id",
    "content": "test content",
    "metadata": {}
}

# Aplicar los patches a los modulos importados por la API
sys.modules["app.services.embeddings"] = MagicMock(embeddings_service=mock_embedding_service)
sys.modules["app.services.supabase_service"] = MagicMock(supabase_service=mock_supabase_service)

# Ahora podemos importar de manera segura la app y el cliente de pruebas
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "Backoffice RAG API"}

def test_list_categories():
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["name"] == "test-cat"

def test_generate_raw_embeddings():
    response = client.post("/api/embeddings/generate", json={"text": "hello testing"})
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["dimensions"] == 768
    assert len(json_data["embedding"]) == 768
    assert json_data["embedding"][0] == 0.1

def test_ingest_document():
    payload = {
        "category_name": "test-cat",
        "content": "this is some RAG content",
        "metadata": {"source": "test"}
    }
    # Mockear el RAGManager para usar nuestros servicios mockeados
    with patch("app.api.endpoints.rag_manager") as mock_rag_mgr:
        mock_rag_mgr.ingest_document.return_value = {
            "id": "chunk-id",
            "category_id": "test-cat-id",
            "content": payload["content"],
            "metadata": payload["metadata"]
        }
        
        response = client.post("/api/documents/ingest", json=payload)
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["status"] == "success"
        assert json_data["data"]["content"] == payload["content"]
        assert json_data["data"]["metadata"]["source"] == "test"

def test_upload_document():
    # Mockear el RAGManager para interceptar la carga del archivo
    with patch("app.api.endpoints.rag_manager") as mock_rag_mgr:
        mock_rag_mgr.ingest_file.return_value = {
            "status": "success",
            "message": "Successfully ingested 2 chunks.",
            "document_id": "test-doc-uuid",
            "chunks_count": 2,
            "chunks": ["chunk1", "chunk2"]
        }
        
        # Simular carga multipart
        files = {"file": ("test_resume.pdf", b"%PDF-1.4 Mock PDF content", "application/pdf")}
        data = {"category_name": "experience", "metadata": '{"author": "test-user"}'}
        
        response = client.post("/api/documents/upload", data=data, files=files)
        assert response.status_code == 200
        json_data = response.json()
        assert json_data["status"] == "success"
        assert json_data["document_id"] == "test-doc-uuid"
        assert json_data["chunks_count"] == 2
