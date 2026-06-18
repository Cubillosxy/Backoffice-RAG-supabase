import os
import logging
from typing import List
from sentence_transformers import SentenceTransformer
from huggingface_hub import login

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model_name = os.getenv("EMBEDDING_MODEL_NAME", "google/embeddinggemma-300m")
        self.hf_token = os.getenv("HF_TOKEN")
        self._model = None

        # Intentar login en Hugging Face si hay un token disponible
        if self.hf_token:
            try:
                login(token=self.hf_token)
                logger.info("Successfully authenticated with Hugging Face token.")
            except Exception as e:
                logger.warning(f"Failed to log in with Hugging Face token: {e}")

    @property
    def model(self) -> SentenceTransformer:
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}...")
            try:
                # Cargar el modelo. google/embeddinggemma-300m requiere trust_remote_code=True
                self._model = SentenceTransformer(
                    self.model_name,
                    trust_remote_code=True
                )
                logger.info("Embedding model loaded successfully.")
            except Exception as e:
                logger.error(
                    f"Error loading model '{self.model_name}': {e}. "
                    "Make sure you accepted the terms of use on Hugging Face (https://huggingface.co/google/embeddinggemma-300m) "
                    "and that your HF_TOKEN is valid."
                )
                raise e
        return self._model

    def get_embedding(self, text: str) -> List[float]:
        """Generates a dense vector representation of the text (768 dimensions)."""
        if not text.strip():
            raise ValueError("Text content cannot be empty.")
        
        # Generar embeddings usando sentence-transformers
        embedding = self.model.encode(text, convert_to_numpy=True)
        # Convertir a lista de floats estándar de Python
        return embedding.tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for multiple text strings."""
        if not texts:
            return []
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return [emb.tolist() for emb in embeddings]

# Instancia singleton para reuso en toda la aplicación
embeddings_service = EmbeddingService()
