// js/gallery.js

// Variables globales
let allCharacters = [];
let schools = [];
let positions = [];
let rarities = [];
let specialties = [];

// Elementos del DOM
const elements = {
  grid: document.getElementById('characters-grid'),
  searchInput: document.getElementById('search-input'),
  filterSchool: document.getElementById('filter-school'),
  filterPosition: document.getElementById('filter-position'),
  filterRarity: document.getElementById('filter-rarity'),
  resetBtn: document.getElementById('reset-filters'),
  resultsCount: document.getElementById('results-count'),
  noResults: document.getElementById('no-results')
};

// Inicializar la aplicación
async function init() {
  try {
    // Cargar catálogos
    [schools, positions, rarities, specialties] = await loadMultipleJSON([
      'data/schools.json',
      'data/positions.json',
      'data/rarities.json',
      'data/specialties.json'
    ]);

    // Cargar personajes
    await loadCharacters();

    // Poblar filtros
    populateFilters();

    // Eventos
    setupEventListeners();

    // Render inicial
    renderCharacters(allCharacters);
  } catch (error) {
    console.error('Error inicializando la galería:', error);
  }
}

// Cargar todos los personajes
async function loadCharacters() {
  // Aquí agregas todos los IDs de personajes que tengas
  const characterIds = ['oikawa-ur'];

  const promises = characterIds.map(id => loadJSON(`data/characters/${id}.json`));
  const characters = await Promise.all(promises);
  allCharacters = characters.filter(c => c); // quitar null
}

// Poblar selects de filtros
function populateFilters() {
  // Escuelas
  schools.forEach(school => {
    const opt = document.createElement('option');
    opt.value = school.id;
    opt.textContent = school.name;
    elements.filterSchool.appendChild(opt);
  });

  // Posiciones
  positions.forEach(pos => {
    const opt = document.createElement('option');
    opt.value = pos.id;
    opt.textContent = pos.name;
    elements.filterPosition.appendChild(opt);
  });

  // Rareza
  rarities.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    elements.filterRarity.appendChild(opt);
  });
}

// Eventos
function setupEventListeners() {
  elements.searchInput.addEventListener('input', filterCharacters);
  elements.filterSchool.addEventListener('change', filterCharacters);
  elements.filterPosition.addEventListener('change', filterCharacters);
  elements.filterRarity.addEventListener('change', filterCharacters);
  elements.resetBtn.addEventListener('click', resetFilters);
}

// Aplicar filtros
function filterCharacters() {
  const term = normalizeText(elements.searchInput.value);
  const schoolFilter = elements.filterSchool.value;
  const positionFilter = elements.filterPosition.value;
  const rarityFilter = elements.filterRarity.value;

  const filtered = allCharacters.filter(ch => {
    const matchesSearch =
      term === '' || normalizeText(ch.name).includes(term);

    const matchesSchool =
      schoolFilter === '' || ch.id_school === schoolFilter;

    const matchesPosition =
      positionFilter === '' || ch.position === positionFilter;

    const matchesRarity =
      rarityFilter === '' || ch.rarity === rarityFilter;

    return matchesSearch && matchesSchool && matchesPosition && matchesRarity;
  });

  renderCharacters(filtered);
}

// Reset filtros
function resetFilters() {
  elements.searchInput.value = '';
  elements.filterSchool.value = '';
  elements.filterPosition.value = '';
  elements.filterRarity.value = '';
  renderCharacters(allCharacters);
}

// Pintar personajes
function renderCharacters(characters) {
  elements.grid.innerHTML = '';
  elements.resultsCount.textContent = characters.length;

  if (characters.length === 0) {
    elements.noResults.style.display = 'block';
    return;
  }
  elements.noResults.style.display = 'none';

  characters.forEach(ch => {
    const card = createCharacterCard(ch);
    elements.grid.appendChild(card);
  });
}

// Crear card de personaje
function createCharacterCard(character) {
  const card = document.createElement('div');
  card.className = 'character-card';

  // Navegar a la página individual al hacer clic
  card.addEventListener('click', () => {
    window.location.href = `character.html?id=${character.id}`;
  });

  const school = schools.find(s => s.id === character.id_school);
  const position = positions.find(p => p.id === character.position);
  const rarity = rarities.find(r => r.id === character.rarity);

  const characterSpecialties = (character.specialties || [])
    .map(id => specialties.find(s => s.id === id))
    .filter(Boolean);

  card.innerHTML = `
    <div class="card-header">
      <img src="${rarity ? rarity.icon : ''}" 
           alt="${rarity ? rarity.name : ''}" 
           class="card-rarity" />
      <img src="${school ? school.icon : ''}" 
           alt="${school ? school.name : ''}" 
           class="card-school" />
    </div>
    <div class="card-image-container">
      <img src="${character.image_card}" 
           alt="${character.name}" 
           class="card-image" />
    </div>
    <div class="card-body">
      <h2 class="card-name">${character.name}</h2>
      <p class="card-name-kanji">${character.name_kanji || ''}</p>
      <div class="card-divider"></div>
      <div class="card-info">
        <div class="card-info-row">
          <img src="${school ? school.icon : ''}" 
               class="card-info-icon" alt="Escuela" />
          <span>${school ? school.name : ''}</span>
        </div>
        <div class="card-info-row">
          <img src="${position ? position.icon : ''}" 
               class="card-info-icon" alt="Posición" />
          <span>${position ? position.name : ''}</span>
        </div>
      </div>
      <div class="card-specialties">
        ${characterSpecialties.map(spec =>
          `<img src="${spec.icon}" 
                alt="${spec.name}" 
                class="specialty-icon" 
                title="${spec.name}" />`
        ).join('')}
      </div>
    </div>
  `;

  return card;
}

// Iniciar
document.addEventListener('DOMContentLoaded', init);
