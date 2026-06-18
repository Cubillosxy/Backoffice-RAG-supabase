# Backoffice RAG Supabase - Backend

Este proyecto está estructurado como un monorepo básico. Contiene un backend en Python utilizando **FastAPI** ejecutándose dentro de contenedores Docker para facilitar el desarrollo local sin necesidad de instalar Python en la máquina host.

## Requisitos Previos

- [Docker](https://www.docker.com/) instalado en tu sistema.
- Docker Compose v2+.

## Estructura del Proyecto

```
.
├── .agents/                   # Personalizaciones y skills de Antigravity
│   └── skills/
│       └── edwin-criteria/    # Skill con criterios senior y review (Ponytail)
├── back/                      # Código fuente del backend (FastAPI)
│   ├── .env.example           # Plantilla de variables de entorno
│   ├── Dockerfile             # Dockerfile de desarrollo
│   ├── main.py                # Entrada de la API
│   └── requirements.txt       # Dependencias de Python fijadas
├── docker-compose.yml         # Orquestación de contenedores
└── README.md                  # Este archivo
```

## Configuración y Ejecución

1. **Configurar Variables de Entorno**
   Crea una copia de la plantilla `.env.example` en la carpeta `back/` con el nombre `.env`:
   ```bash
   cp back/.env.example back/.env
   ```
   Ajusta las variables de entorno dentro del archivo `back/.env` si es necesario.

2. **Iniciar el Contenedor**
   En el directorio raíz del proyecto, ejecuta el siguiente comando para construir y arrancar el contenedor:
   ```bash
   docker compose up --build
   ```

3. **Verificar el Estado**
   Una vez que el contenedor esté corriendo, la API estará disponible en:
   - Base URL: [http://localhost:8000](http://localhost:8000)
   - Documentación Interactiva (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Desarrollo en Vivo (Hot Reload)**
   La carpeta `back/` está montada como un volumen dentro del contenedor docker. Cualquier cambio que realices en el código local (`main.py`, etc.) se reflejará y recargará automáticamente.
