// Funciones utilitarias compartidas

// Obtener parámetro de URL
function getURLParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Cargar un archivo JSON
async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error cargando ${path}:`, error);
        return null;
    }
}

// Cargar múltiples archivos JSON en paralelo
async function loadMultipleJSON(paths) {
    try {
        const promises = paths.map(path => loadJSON(path));
        return await Promise.all(promises);
    } catch (error) {
        console.error('Error cargando archivos JSON:', error);
        return [];
    }
}

// Función para normalizar texto (remover acentos y convertir a minúsculas)
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
