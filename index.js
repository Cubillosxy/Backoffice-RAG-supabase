const API_BASE_URL = 'http://localhost:8000';

// Elementos del DOM
const apiStatusIndicator = document.getElementById('api-status');
const apiStatusDot = document.querySelector('.status-indicator');
const ingestCategorySelect = document.getElementById('ingest-category');
const searchCategorySelect = document.getElementById('search-category');
const categoriesGridCompact = document.getElementById('categories-grid-compact');
const categoriesGridDetailed = document.getElementById('categories-grid-detailed');
const statCategoriesCount = document.getElementById('stat-categories-count');
const statDocsCount = document.getElementById('stat-docs-count');
const toastContainer = document.getElementById('toast-container');

// Variables de estado
let activeCategories = [];
let selectedFile = null;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    loadCategories();
    setupDragAndDrop();
    setupFormListeners();
});

// Cambiar de Pestaña (Tab Switch)
window.switchTab = function(tabId) {
    // Desactivar todos los enlaces y secciones
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    // Activar el enlace seleccionado
    const clickedNav = document.querySelector(`a[href="#${tabId}"]`);
    if (clickedNav) clickedNav.classList.add('active');

    // Activar el panel correspondiente
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.add('active');

    // Actualizar títulos
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (tabId === 'dashboard') {
        pageTitle.textContent = 'Panel de Control';
        pageSubtitle.textContent = 'Gestiona la base de conocimientos vectorial en Supabase';
        loadCategories();
    } else if (tabId === 'ingestion') {
        pageTitle.textContent = 'Ingesta de Conocimiento';
        pageSubtitle.textContent = 'Indexa nuevos textos, archivos PDF o Markdown';
    } else if (tabId === 'search') {
        pageTitle.textContent = 'Búsqueda Semántica';
        pageSubtitle.textContent = 'Consulta tus documentos utilizando vectores pgvector';
    } else if (tabId === 'categories-tab') {
        pageTitle.textContent = 'Categorías de Información';
        pageSubtitle.textContent = 'Estructura los tipos de contenidos del RAG';
    }
};

// Notificaciones Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'ph ph-info';
    if (type === 'success') iconClass = 'ph ph-check-circle';
    if (type === 'error') iconClass = 'ph ph-x-circle';

    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
}

// Verificar estado de la API
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            apiStatusIndicator.textContent = 'Online';
            apiStatusDot.className = 'status-indicator online';
        } else {
            throw new Error();
        }
    } catch (e) {
        apiStatusIndicator.textContent = 'Offline';
        apiStatusDot.className = 'status-indicator offline';
        showToast('No se pudo conectar con el servidor API local.', 'error');
    }
}

// Cargar y Renderizar Categorías
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const json = await response.json();
        
        if (json.status === 'success') {
            activeCategories = json.data;
            renderCategoriesDropdowns();
            renderCategoriesGrids();
            
            // Actualizar estadísticas básicas
            statCategoriesCount.textContent = activeCategories.length;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error al cargar las categorías desde la API.', 'error');
    }
}

function renderCategoriesDropdowns() {
    // Limpiar selectores manteniendo opción por defecto
    ingestCategorySelect.innerHTML = '<option value="" disabled selected>Selecciona una categoría...</option>';
    searchCategorySelect.innerHTML = '<option value="">Buscar en todas las categorías</option>';

    activeCategories.forEach(cat => {
        const option1 = new Option(cat.name, cat.name);
        const option2 = new Option(cat.name, cat.name);
        ingestCategorySelect.add(option1);
        searchCategorySelect.add(option2);
    });
}

function renderCategoriesGrids() {
    if (activeCategories.length === 0) {
        categoriesGridCompact.innerHTML = '<p class="subtitle">No hay categorías creadas aún.</p>';
        categoriesGridDetailed.innerHTML = '<p class="subtitle">No hay categorías registradas en la base de datos.</p>';
        return;
    }

    // Render compact badges on dashboard
    categoriesGridCompact.innerHTML = activeCategories.map(cat => `
        <span class="category-tag"><i class="ph ph-tag"></i> ${cat.name}</span>
    `).join('');

    // Render detailed cards on categories tab
    categoriesGridDetailed.innerHTML = activeCategories.map(cat => `
        <div class="category-badge-detailed">
            <h4><i class="ph ph-tag"></i> ${cat.name}</h4>
            <p>${cat.description || 'Sin descripción proporcionada.'}</p>
            <small class="code-font" style="color: var(--text-secondary); margin-top: 4px;">ID: ${cat.id}</small>
        </div>
    `).join('');
}

// Alternar Tipo de Ingesta (Archivo o Texto Plano)
window.switchIngestType = function(type) {
    document.querySelectorAll('.tab-sub').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.ingest-input-section').forEach(sec => sec.classList.remove('active'));

    if (type === 'file') {
        document.querySelector('.tab-sub:nth-child(1)').classList.add('active');
        document.getElementById('input-type-file').classList.add('active');
    } else {
        document.querySelector('.tab-sub:nth-child(2)').classList.add('active');
        document.getElementById('input-type-raw').classList.add('active');
    }
};

// Configuración de Drag & Drop para archivos
function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectedFileBadge = document.getElementById('selected-file');
    const selectedFileName = document.getElementById('selected-file-name');

    // Click para abrir explorador
    dropZone.addEventListener('click', (e) => {
        // Evitar que el botón de eliminar abra el diálogo
        if (e.target.closest('.btn-remove-file')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFileSelect(fileInput.files[0]);
        }
    });

    // Eventos dragover/dragleave/drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    function handleFileSelect(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'md', 'txt'].includes(ext)) {
            showToast('Formato de archivo no soportado. Sube PDF, MD o TXT.', 'error');
            return;
        }

        selectedFile = file;
        selectedFileName.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        selectedFileBadge.style.display = 'flex';
        
        // Esconder textos descriptivos del drag zone
        document.querySelector('.icon-upload').style.display = 'none';
        document.querySelector('.drag-title').style.display = 'none';
        document.querySelector('.drag-subtitle').style.display = 'none';
    }
}

// Resetear Archivo Seleccionado
window.clearFileSelection = function() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('selected-file').style.display = 'none';

    // Mostrar textos descriptivos
    document.querySelector('.icon-upload').style.display = 'block';
    document.querySelector('.drag-title').style.display = 'block';
    document.querySelector('.drag-subtitle').style.display = 'block';
};

// Listeners de Formularios
function setupFormListeners() {
    // 1. Formulario Categoría
    const categoryForm = document.getElementById('category-form');
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-desc').value.trim();

        try {
            const response = await fetch(`${API_BASE_URL}/api/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                showToast(`Categoría '${name}' creada exitosamente.`, 'success');
                categoryForm.reset();
                loadCategories();
            } else {
                showToast(result.detail || 'Error al crear la categoría.', 'error');
            }
        } catch (error) {
            showToast('Error de red al crear la categoría.', 'error');
        }
    });

    // 2. Formulario Ingesta (Documento / Archivo)
    const ingestForm = document.getElementById('ingest-form');
    const btnIngest = document.getElementById('btn-ingest');
    
    ingestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categoryName = ingestCategorySelect.value;
        const metadataRaw = document.getElementById('metadata-input').value.trim();
        
        if (!categoryName) {
            showToast('Por favor, selecciona una categoría.', 'error');
            return;
        }

        // Validar JSON de metadatos opcionales
        if (metadataRaw) {
            try {
                JSON.parse(metadataRaw);
            } catch (je) {
                showToast('Los metadatos provistos no son un JSON válido.', 'error');
                return;
            }
        }

        // Cambiar botón a estado cargando
        btnIngest.disabled = true;
        btnIngest.querySelector('span').textContent = 'Vectorizando e Indexando...';
        
        const isFileMode = document.getElementById('input-type-file').classList.contains('active');

        try {
            if (isFileMode) {
                if (!selectedFile) {
                    showToast('Por favor, selecciona o arrastra un archivo.', 'error');
                    resetIngestButton();
                    return;
                }

                // Subir archivo usando multipart/form-data
                const formData = new FormData();
                formData.append('category_name', categoryName);
                formData.append('file', selectedFile);
                if (metadataRaw) {
                    formData.append('metadata', metadataRaw);
                }

                const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();

                if (response.ok) {
                    if (result.status === 'skipped') {
                        showToast('Deduplicado: El archivo ya estaba subido con el mismo contenido.', 'info');
                    } else {
                        showToast(`Éxito: Se indexaron ${result.chunks_count} fragmentos vectoriales.`, 'success');
                        clearFileSelection();
                        ingestForm.reset();
                    }
                } else {
                    showToast(result.detail || 'Error al procesar el archivo.', 'error');
                }
            } else {
                const textContent = document.getElementById('raw-text').value.trim();
                if (!textContent) {
                    showToast('Por favor, escribe el contenido de texto.', 'error');
                    resetIngestButton();
                    return;
                }

                // Indexar texto libre (JSON)
                const payload = {
                    category_name: categoryName,
                    content: textContent,
                    metadata: metadataRaw ? JSON.parse(metadataRaw) : {}
                };

                const response = await fetch(`${API_BASE_URL}/api/documents/ingest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (response.ok) {
                    showToast('Texto plano indexado exitosamente en Supabase.', 'success');
                    ingestForm.reset();
                } else {
                    showToast(result.detail || 'Error al indexar el texto.', 'error');
                }
            }
        } catch (error) {
            showToast('Error de conexión con el backend.', 'error');
        } finally {
            resetIngestButton();
        }
    });

    function resetIngestButton() {
        btnIngest.disabled = false;
        btnIngest.querySelector('span').textContent = 'Indexar en Supabase';
    }

    // 3. Formulario Búsqueda Semántica
    const searchForm = document.getElementById('search-form');
    const searchResultsList = document.getElementById('search-results-list');
    const resultsCountLabel = document.getElementById('results-count-label');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = document.getElementById('search-query').value.trim();
        const categoryName = document.getElementById('search-category').value;
        const threshold = parseFloat(document.getElementById('search-threshold').value);

        if (!query) return;

        searchResultsList.innerHTML = '<div class="loading-spinner"></div>';
        resultsCountLabel.style.display = 'none';

        try {
            const payload = {
                query,
                category_name: categoryName || null,
                match_threshold: threshold,
                match_count: 5
            };

            const response = await fetch(`${API_BASE_URL}/api/documents/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                const results = result.results;
                resultsCountLabel.style.display = 'block';
                
                if (results.length === 0) {
                    searchResultsList.innerHTML = `
                        <div class="search-placeholder">
                            <i class="ph ph-magnifying-glass"></i>
                            <p>No se encontraron resultados que superen la similitud mínima de ${threshold}.</p>
                        </div>
                    `;
                    return;
                }

                // Renderizar resultados con tags y score
                searchResultsList.innerHTML = results.map(res => {
                    const simScore = (res.similarity * 100).toFixed(1);
                    const scoreClass = res.similarity >= 0.65 ? 'score-high' : 'score-medium';
                    
                    // Formatear metadatos para visualizarlos
                    let metaBadges = '';
                    if (res.metadata) {
                        metaBadges = Object.entries(res.metadata)
                            .map(([key, val]) => `<span class="result-meta-tag"><strong>${key}:</strong> ${val}</span>`)
                            .join('');
                    }

                    return `
                        <div class="result-item">
                            <div class="result-header">
                                <span class="category-tag"><i class="ph ph-tag"></i> Similarity Search</span>
                                <span class="score-badge ${scoreClass}">${simScore}% Match</span>
                            </div>
                            <div class="result-body">${escapeHTML(res.content)}</div>
                            <div class="result-footer">
                                ${metaBadges}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                showToast(result.detail || 'Error al buscar en la base de datos.', 'error');
            }
        } catch (error) {
            showToast('Error al conectar con la base de datos vectorial.', 'error');
            searchResultsList.innerHTML = `
                <div class="search-placeholder">
                    <i class="ph ph-x-circle" style="color: var(--danger-color); opacity: 0.8;"></i>
                    <p>Error al realizar la búsqueda semántica.</p>
                </div>
            `;
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
