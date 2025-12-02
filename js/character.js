let character = null;
let schools = [];
let positions = [];
let rarities = [];
let specialties = [];
let bonds = [];

const abilityLevels = {};
let memoryGrade = 'I';
let memoryChart = null; // ⭐ Controla el gráfico de recuerdos

async function init() {
  try {
    const id = getURLParameter('id');
    if (!id) {
      alert('Falta ?id= en la URL');
      return;
    }

    [schools, positions, rarities, specialties, bonds] = await loadMultipleJSON([
      'data/schools.json',
      'data/positions.json',
      'data/rarities.json',
      'data/specialties.json',
      'data/bonds.json'
    ]);

    character = await loadJSON(`data/characters/${id}.json`);
    if (!character) {
      alert('Personaje no encontrado');
      return;
    }

    loadSavedAbilityLevels();
    loadSavedMemoryGrade();

    renderProfile();
    renderStatsTab();
    renderAbilitiesTab();
    renderResonancesTab();
    renderMemoryTab();
    renderBondsTab(); // Renderizado vinculos
    setupTabs();
  } catch (e) {
    console.error('Error en página de personaje:', e);
  }
}

function renderProfile() {
  document.getElementById('char-profile-image').src = character.image_profile;
  document.getElementById('char-profile-image').alt = character.name;

  const rarity = rarities.find(r => r.id === character.rarity);
  if (rarity) {
    document.getElementById('char-rarity-icon').src = rarity.icon;
    document.getElementById('char-rarity-icon-info').src = rarity.icon;
    document.getElementById('char-rarity-name').textContent = rarity.name;
  }

  document.getElementById('char-name').textContent = character.name;
  document.getElementById('char-name-kanji').textContent = character.name_kanji || '';

  const school = schools.find(s => s.id === character.id_school);
  if (school) {
    document.getElementById('char-school-icon').src = school.icon;
    document.getElementById('char-school-name').textContent = school.name;
  }

  const pos = positions.find(p => p.id === character.position);
  if (pos) {
    document.getElementById('char-position-icon').src = pos.icon;
    document.getElementById('char-position-name').textContent = pos.name;
  }

  const specContainer = document.getElementById('char-specialties');
  specContainer.innerHTML = '';
  (character.specialties || []).forEach(specId => {
    const spec = specialties.find(s => s.id === specId);
    if (spec) {
      const img = document.createElement('img');
      img.src = spec.icon;
      img.alt = spec.name;
      img.title = spec.name;
      img.className = 'specialty-badge';
      specContainer.appendChild(img);
    }
  });
}

function renderStatsTab() {
  const s = character.stats;
  const canvas = document.getElementById('baseStatsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Colocación', 'Saque', 'Recuperación', 'Bloqueo', 'Recepción', 'Ataque Rápido', 'Ataque Poderoso'],
      datasets: [{
        label: character.name,
        data: [
          s.colocacion,
          s.saque,
          s.recuperacion,
          s.bloqueo,
          s.recepcion,
          s.ataque_rapido,
          s.ataque_poderoso
        ],
        backgroundColor: 'rgba(196, 255, 14, 0.2)',
        borderColor: 'rgba(196, 255, 14, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(196, 255, 14, 1)'
      }]
    },
    options: {
      scales: {
        r: {
          min: 0,
          max: 2000,
          ticks: { backdropColor: 'transparent', display: false },
          pointLabels: { color: '#b0b0b0', display: true, font: { size: 13 } },
          grid: { color: '#404040' }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function loadSavedAbilityLevels() {
  if (!character || !character.abilities) return;
  character.abilities.forEach(ability => {
    const key = `${character.id}_${ability.id}_level`;
    const saved = localStorage.getItem(key);
    abilityLevels[ability.id] = saved ? Number(saved) : 1;
  });
}

function saveAbilityLevel(abilityId, level) {
  const key = `${character.id}_${abilityId}_level`;
  localStorage.setItem(key, level);
  abilityLevels[abilityId] = level;
}

function renderAbilitiesTab() {
  const container = document.getElementById('abilities-container');
  if (!container) return;
  container.innerHTML = '';

  if (!character.abilities || character.abilities.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No hay habilidades disponibles</p>';
    return;
  }

  character.abilities.forEach(ability => {
    const abilityDiv = document.createElement('div');
    abilityDiv.className = ability.type === 'ultimate' ? 'ability-card ultimate' : 'ability-card';

    const tagsHTML = ability.tags.map(tag => {
      const tagClass = tag === 'Definitiva' ? 'ability-tag ultimate-tag' : 'ability-tag';
      return `<span class="${tagClass}">${tag}</span>`;
    }).join('');

    let levelButtonsHTML = '';
    for (let lvl = 1; lvl <= ability.max_level; lvl++) {
      const activeClass = abilityLevels[ability.id] === lvl ? 'active' : '';
      levelButtonsHTML += `<button class="level-btn ${activeClass}" data-level="${lvl}" data-ability-id="${ability.id}">${lvl}</button>`;
    }

    abilityDiv.innerHTML = `
      <div class="ability-header">
        <img src="${ability.icon}" alt="${ability.name}" class="ability-icon" />
        <div class="ability-info">
          <h4 class="ability-name">${ability.name_es || ability.name}</h4>
          <div class="ability-tags">${tagsHTML}</div>
        </div>
      </div>
      <div class="level-selector">
        <span class="level-label">Nivel:</span>
        ${levelButtonsHTML}
      </div>
      <p class="ability-description">${ability.descriptions[abilityLevels[ability.id]]}</p>
    `;
    container.appendChild(abilityDiv);

    abilityDiv.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = Number(btn.dataset.level);
        const id = btn.dataset.abilityId;
        saveAbilityLevel(id, level);
        renderAbilitiesTab();
      });
    });
  });
}

function renderResonancesTab() {
  const container = document.getElementById('resonances-container');
  if (!container) return;
  container.innerHTML = '';

  if (!character.resonances) {
    container.innerHTML = '<p class="placeholder-text">No hay resonancias disponibles</p>';
    return;
  }

  const resonanceLevels = { 'I': 4, 'II': 6, 'III': 8, 'IV': 10, 'V': 12 };
  const resonanceIcons = {
    'I': 'images/resonances/resonance-1.png',
    'II': 'images/resonances/resonance-2.png',
    'III': 'images/resonances/resonance-3.png',
    'IV': 'images/resonances/resonance-4.png',
    'V': 'images/resonances/resonance-5.png'
  };

  ['I', 'II', 'III', 'IV', 'V'].forEach(level => {
    const resDiv = document.createElement('div');
    resDiv.className = 'resonance-card';
    resDiv.innerHTML = `
      <div class="resonance-header">
        <img src="${resonanceIcons[level]}" alt="Resonancia ${level}" class="resonance-icon" />
        <div class="resonance-info">
          <h4 class="resonance-title">Resonancia de Habilidad ${level}</h4>
          <p class="resonance-level">Nivel requerido: ${resonanceLevels[level]}</p>
        </div>
      </div>
      <p class="resonance-description">${character.resonances[level]}</p>
    `;
    container.appendChild(resDiv);
  });
}

function loadSavedMemoryGrade() {
  if (!character) return;
  const saved = localStorage.getItem(`${character.id}_memory_grade`);
  if (saved && ['I', 'II', 'III', 'IV', 'V'].includes(saved)) {
    memoryGrade = saved;
  }
}

function saveMemoryGrade() {
  if (!character) return;
  localStorage.setItem(`${character.id}_memory_grade`, memoryGrade);
}

function renderMemoryTab() {
  const container = document.getElementById('memory-container');
  if (!container) return;

  if (memoryChart) {
    memoryChart.destroy();
    memoryChart = null;
  }

  container.innerHTML = '';

  if (!character.memory) {
    container.innerHTML = '<p class="placeholder-text">No hay recuerdo disponible</p>';
    return;
  }

  const memory = character.memory;
  const pos = positions.find(p => p.id === character.position);

  const gradeIcons = {
    'I': 'images/grades/grade-1.png',
    'II': 'images/grades/grade-2.png',
    'III': 'images/grades/grade-3.png',
    'IV': 'images/grades/grade-4.png',
    'V': 'images/grades/grade-5.png'
  };

  const memoryHTML = `
    <div class="memory-layout-new">
      <div class="memory-top">
        <div class="memory-left">
          <div class="memory-image-container">
            <img src="${memory.image}" alt="${memory.name}" class="memory-image" />
          </div>
        </div>

        <div class="memory-right">
          <div class="memory-header">
            <h4 class="memory-name">${memory.name}</h4>
            <p class="memory-level">Nivel: ${memory.level}</p>
          </div>

          <div class="memory-grade-selector">
            <span class="grade-label">Recuerdo de Grado:</span>
            <div class="grade-icons">
              <button class="grade-icon-btn ${memoryGrade === 'I' ? 'active' : ''}" data-grade="I">
                <img src="${gradeIcons['I']}" alt="Grado I" />
              </button>
              <button class="grade-icon-btn ${memoryGrade === 'II' ? 'active' : ''}" data-grade="II">
                <img src="${gradeIcons['II']}" alt="Grado II" />
              </button>
              <button class="grade-icon-btn ${memoryGrade === 'III' ? 'active' : ''}" data-grade="III">
                <img src="${gradeIcons['III']}" alt="Grado III" />
              </button>
              <button class="grade-icon-btn ${memoryGrade === 'IV' ? 'active' : ''}" data-grade="IV">
                <img src="${gradeIcons['IV']}" alt="Grado IV" />
              </button>
              <button class="grade-icon-btn ${memoryGrade === 'V' ? 'active' : ''}" data-grade="V">
                <img src="${gradeIcons['V']}" alt="Grado V" />
              </button>
            </div>
          </div>

          <div class="memory-effect">
            <div class="memory-effect-header">
              <img src="${pos ? pos.icon : ''}" alt="${pos ? pos.name : ''}" class="memory-position-icon" />
              <h5>EFECTO EXCLUSIVO DE ${pos ? pos.name.toUpperCase() : ''}</h5>
            </div>
            <p>${memory.exclusive_effects[memoryGrade]}</p>
          </div>
        </div>
      </div>

      <div class="memory-bottom">
        <h5>Mejoras de Stats</h5>
        <canvas id="memoryStatsChart"></canvas>
      </div>
    </div>
  `;

  container.innerHTML = memoryHTML;

  container.querySelectorAll('.grade-icon-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      memoryGrade = btn.dataset.grade;
      saveMemoryGrade();
      renderMemoryTab();
    });
  });

  setTimeout(() => {
    const canvas = document.getElementById('memoryStatsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    memoryChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Colocación', 'Saque', 'Recuperación', 'Bloqueo', 'Recepción', 'Remate'],
        datasets: [{
          label: 'Mejora de Stats',
          data: [
            memory.stats_boost.colocacion,
            memory.stats_boost.saque,
            memory.stats_boost.recuperacion,
            memory.stats_boost.bloqueo,
            memory.stats_boost.recepcion,
            memory.stats_boost.remate
          ],
          backgroundColor: 'rgba(196, 255, 14, 0.2)',
          borderColor: 'rgba(196, 255, 14, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(196, 255, 14, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 3,
        scales: {
          y: {
            beginAtZero: true,
            max: 1000,
            ticks: {
              color: '#c4ff0e',
              font: { size: 12 }
            },
            grid: {
              color: '#404040'
            }
          },
          x: {
            ticks: {
              color: '#b0b0b0',
              font: { size: 12 }
            },
            grid: {
              color: '#404040'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#c4ff0e',
            bodyColor: '#ffffff',
            borderColor: '#c4ff0e',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: context => `+${context.parsed.y}`
            }
          }
        }
      }
    });
  }, 0);
}

function renderBondsTab() {
  const thumbnailsContainer = document.getElementById('bond-thumbnails');
  const detailsContainer = document.getElementById('bond-details');
  if (!thumbnailsContainer || !detailsContainer) return;

  thumbnailsContainer.innerHTML = '';
  detailsContainer.innerHTML = '<p class="placeholder-text">Selecciona un vínculo para ver sus detalles</p>';

  if (!character || !bonds || bonds.length === 0) {
    thumbnailsContainer.innerHTML = '<p class="placeholder-text">No hay vínculos disponibles</p>';
    return;
  }

  // Filtrar vínculos donde el personaje está en el array characters
  const characterBonds = bonds.filter(b => b.characters.includes(character.id));

  if (characterBonds.length === 0) {
    thumbnailsContainer.innerHTML = '<p class="placeholder-text">No hay vínculos disponibles</p>';
    return;
  }

  characterBonds.forEach((bond, index) => {
    const img = document.createElement('img');
    img.src = bond.image || 'images/bonds/default-bond.png';
    img.alt = bond.name;
    img.title = bond.name;
    img.className = 'bond-thumbnail';

    img.addEventListener('click', () => {
      thumbnailsContainer.querySelectorAll('.bond-thumbnail').forEach(i => i.classList.remove('active'));
      img.classList.add('active');
      showBondDetails(bond);
    });

    thumbnailsContainer.appendChild(img);
  });

  if (characterBonds.length > 0) {
    thumbnailsContainer.children[0].classList.add('active');
    showBondDetails(characterBonds[0]);
  }

  function showBondDetails(bond) {
    let html = '';

    if (bond.type === 'alineacion' && bond.icon) {
      html += `
        <div class="bond-header">
          <img src="${bond.icon}" alt="${bond.name} icon" class="bond-icon" />
          <h4 class="bond-title">${bond.name}</h4>
        </div>
      `;
    } else {
      html += `<h4 class="bond-title">${bond.name}</h4>`;
    }

    if (bond.type === 'bonus') {
      html += '<p class="bond-subtitle">Ventaja de Atributos de Vínculo</p>';
      const myBonus = bond.bonuses?.[character.id];
      if (myBonus) {
        for (let i = 1; i <= 5; i++) {
          html += `<p class="bond-level"><strong>Nivel ${i}:</strong> ${myBonus[String(i)]}</p>`;
        }
      } else {
        html += '<p class="bond-level">No hay bonificaciones disponibles</p>';
      }
    } else if (bond.type === 'alineacion') {
      html += '<p class="bond-subtitle">Efecto de la habilidad del vínculo</p>';
      for (let i = 1; i <= 5; i++) {
        const effect = bond.effects?.[String(i)];
        if (effect) {
          html += `<p class="bond-level"><strong>Nivel ${i}:</strong> ${effect}</p>`;
        }
      }
    }

    detailsContainer.innerHTML = html;
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}

window.addEventListener('load', init);
