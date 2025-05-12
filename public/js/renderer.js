const { ipcRenderer } = require('electron');

// Éléments DOM
const missionForm = document.getElementById('mission-form');
const pilotNameInput = document.getElementById('pilotName');
const instructorNameInput = document.getElementById('instructorName');
const missionDateInput = document.getElementById('missionDate');
const missionTypeInput = document.getElementById('missionType');
const missionNameInput = document.getElementById('missionName');
const aircraftInput = document.getElementById('aircraft');
const mapInput = document.getElementById('map');
const selectPilotPhotoBtn = document.getElementById('selectPilotPhoto');
const pilotPhotoPathInput = document.getElementById('pilotPhotoPath');
const pilotPhotoPreview = document.getElementById('pilotPhotoPreview');
const roundsContainer = document.getElementById('rounds-container');
const addRoundBtn = document.getElementById('addRoundBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const statusContainer = document.getElementById('status-container');
const statusMessage = document.getElementById('status-message');
const openReportBtn = document.getElementById('openReportBtn');
const closeStatusBtn = document.getElementById('closeStatusBtn');

// Templates
const roundTemplate = document.getElementById('round-template');
const shotTemplate = document.getElementById('shot-template');

// Variables globales
let pilotPhotoPath = null;
let currentReportPath = null;
let roundCounter = 0;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Définir la date par défaut à aujourd'hui
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  missionDateInput.value = formattedDate;
  
  // Ajouter un premier round par défaut
  addRound();
  
  // Attacher les gestionnaires d'événements
  setupEventListeners();
});

// Configuration des gestionnaires d'événements
function setupEventListeners() {
  // Sélection de la photo du pilote
  selectPilotPhotoBtn.addEventListener('click', selectPilotPhoto);
  
  // Ajout d'un nouveau round
  addRoundBtn.addEventListener('click', addRound);
  
  // Soumission du formulaire
  missionForm.addEventListener('submit', generateReport);
  
  // Ouverture du rapport
  openReportBtn.addEventListener('click', openReport);
  
  // Fermeture du message de statut
  closeStatusBtn.addEventListener('click', () => {
    statusContainer.classList.add('hidden');
  });
}

// Fonction pour sélectionner la photo du pilote
async function selectPilotPhoto() {
  pilotPhotoPath = await ipcRenderer.invoke('select-pilot-photo');
  
  if (pilotPhotoPath) {
    pilotPhotoPathInput.value = pilotPhotoPath;
    pilotPhotoPreview.innerHTML = `<img src="${pilotPhotoPath}" alt="Photo du pilote">`;
    pilotPhotoPreview.classList.add('has-image');
  }
}

// Fonction pour ajouter un nouveau round
function addRound() {
  roundCounter++;
  
  // Cloner le template du round
  const roundNode = document.importNode(roundTemplate.content, true);
  
  // Définir l'ID unique du round
  const roundId = `round-${Date.now()}`;
  const roundElement = roundNode.querySelector('.round');
  roundElement.dataset.roundId = roundId;
  
  // Mettre à jour le numéro de round
  roundNode.querySelector('.round-number').textContent = roundCounter;
  
  // Configurer les gestionnaires d'événements pour ce round
  setupRoundEventListeners(roundElement);
  
  // Ajouter le round au conteneur
  roundsContainer.appendChild(roundNode);
  
  // Ajouter un tir par défaut
  addShot(roundElement.querySelector('.shots-container'), roundId);
  
  return roundElement;
}

// Configurer les gestionnaires d'événements pour un round
function setupRoundEventListeners(roundElement) {
  const roundId = roundElement.dataset.roundId;
  const selectChartBtn = roundElement.querySelector('.select-chart-btn');
  const chartPathInput = roundElement.querySelector('.chart-path');
  const chartPreview = roundElement.querySelector('.chart-preview');
  const addShotBtn = roundElement.querySelector('.add-shot-btn');
  const removeRoundBtn = roundElement.querySelector('.remove-round-btn');
  const shotsContainer = roundElement.querySelector('.shots-container');
  
  // Sélection du graphique de performance
  selectChartBtn.addEventListener('click', async () => {
    const chartPath = await ipcRenderer.invoke('select-chart-image');
    
    if (chartPath) {
      chartPathInput.value = chartPath;
      chartPreview.innerHTML = `<img src="${chartPath}" alt="Graphique de performance">`;
      chartPreview.classList.add('has-image');
    }
  });
  
  // Ajout d'un tir
  addShotBtn.addEventListener('click', () => {
    addShot(shotsContainer, roundId);
  });
  
  // Suppression du round
  removeRoundBtn.addEventListener('click', () => {
    // Vérifier qu'il y a plus d'un round avant de supprimer
    if (roundsContainer.children.length > 1) {
      roundElement.remove();
      updateRoundNumbers();
    } else {
      showStatus('Vous devez avoir au moins un round', 'error');
    }
  });
}

// Fonction pour ajouter un tir dans un round
function addShot(shotsContainer, roundId) {
  // Cloner le template du tir
  const shotNode = document.importNode(shotTemplate.content, true);
  
  // Définir l'ID unique du tir
  const shotElement = shotNode.querySelector('.shot');
  const shotId = `shot-${Date.now()}`;
  shotElement.dataset.shotId = shotId;
  
  // Configurer les gestionnaires d'événements pour ce tir
  setupShotEventListeners(shotElement);
  
  // Ajouter le tir au conteneur
  shotsContainer.appendChild(shotNode);
}

// Configurer les gestionnaires d'événements pour un tir
function setupShotEventListeners(shotElement) {
  const removeShotBtn = shotElement.querySelector('.remove-shot-btn');
  
  // Suppression du tir
  removeShotBtn.addEventListener('click', () => {
    // Vérifier qu'il y a plus d'un tir dans le round avant de supprimer
    const shotsContainer = shotElement.parentElement;
    if (shotsContainer.children.length > 1) {
      shotElement.remove();
    } else {
      showStatus('Vous devez avoir au moins un tir par round', 'error');
    }
  });
}

// Mettre à jour les numéros de rounds après suppression
function updateRoundNumbers() {
  const rounds = roundsContainer.querySelectorAll('.round');
  rounds.forEach((round, index) => {
    round.querySelector('.round-number').textContent = index + 1;
  });
  roundCounter = rounds.length;
}

// Collecter les données du formulaire
function collectFormData() {
  const rounds = [];
  
  // Collecter les données de chaque round
  document.querySelectorAll('.round').forEach(roundElement => {
    const roundId = roundElement.dataset.roundId;
    const roundNumber = parseInt(roundElement.querySelector('.round-number').textContent);
    const chartPath = roundElement.querySelector('.chart-path').value;
    
    const shots = [];
    // Collecter les données de chaque tir
    roundElement.querySelectorAll('.shot').forEach(shotElement => {
      shots.push({
        number: parseInt(shotElement.querySelector('.shot-number').value) || 0,
        speed: parseFloat(shotElement.querySelector('.shot-speed').value) || 0,
        altitude: parseFloat(shotElement.querySelector('.shot-altitude').value) || 0,
        distance: parseFloat(shotElement.querySelector('.shot-distance').value) || 0,
        hit: shotElement.querySelector('.shot-hit').value === 'true'
      });
    });
    
    rounds.push({
      id: roundId,
      number: roundNumber,
      chartImage: chartPath,
      shots: shots
    });
  });
  
  // Retourner toutes les données du formulaire
  return {
    pilotName: pilotNameInput.value,
    instructorName: instructorNameInput.value,
    date: missionDateInput.value,
    missionType: missionTypeInput.value,
    missionName: missionNameInput.value,
    aircraft: aircraftInput.value,
    map: mapInput.value,
    pilotPhoto: pilotPhotoPath,
    rounds: rounds
  };
}

// Générer le rapport PDF
async function generateReport(event) {
  event.preventDefault();
  
  generateReportBtn.disabled = true;
  showStatus('Génération du rapport en cours...', 'info');
  
  try {
    const formData = collectFormData();
    const result = await ipcRenderer.invoke('generate-report', formData);
    
    if (result.success) {
      currentReportPath = result.path;
      showStatus('Rapport généré avec succès!', 'success');
      openReportBtn.classList.remove('hidden');
    } else {
      showStatus(`Erreur: ${result.message}`, 'error');
      openReportBtn.classList.add('hidden');
    }
  } catch (error) {
    showStatus(`Une erreur est survenue: ${error.message}`, 'error');
    openReportBtn.classList.add('hidden');
  } finally {
    generateReportBtn.disabled = false;
  }
}

// Ouvrir le rapport généré
async function openReport() {
  if (currentReportPath) {
    try {
      await ipcRenderer.invoke('open-report', currentReportPath);
    } catch (error) {
      showStatus(`Erreur lors de l'ouverture du rapport: ${error.message}`, 'error');
    }
  }
}

// Afficher un message de statut
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusContainer.classList.remove('hidden');
}