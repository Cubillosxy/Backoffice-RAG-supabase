import sys
import os

# Añadir el directorio actual y su subdirectorio app al sys.path para importaciones relativas limpias
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, "app"))

from app.main import app

# Esto permite correr main.py directamente con `python main.py` si es necesario
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
