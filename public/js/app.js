/**
 * Application principale ARESIA - VERSION CORRIGÉE
 * Correction du bug de validation des champs
 */

// Variables globales
let roundCounter = 0;
let formData = {};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de l\'application ARESIA');
    
    setDefaultDate();
    addRound();
    initializeEventListeners();
    initializeAnimations();
    
    console.log('✅ Application initialisée avec succès');
});

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('missionDate').value = today;
}

function initializeEventListeners() {
    // Formulaire principal
    const form = document.getElementById('mission-form');
    form.addEventListener('submit', handleFormSubmit);
    
    // Photo du pilote
    const pilotPhotoUpload = document.getElementById('pilotPhotoUpload');
    const pilotPhotoInput = document.getElementById('pilotPhoto');
    
    pilotPhotoUpload.addEventListener('click', () => pilotPhotoInput.click());
    pilotPhotoInput.addEventListener('change', (e) => handleFileUpload(e, 'pilot'));
    
    // Boutons d'action
    document.getElementById('addRoundBtn').addEventListener('click', addRound);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    
    // Modal
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('closeStatusBtn').addEventListener('click', closeModal);
    
    // Fermeture du modal en cliquant à l'extérieur
    document.getElementById('statusModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // CORRECTION : Validation en temps réel AMÉLIORÉE
    setupFormValidation();
    
    console.log('🔗 Gestionnaires d\'événements initialisés');
}

function initializeAnimations() {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
}

/**
 * CORRECTION : Configuration de validation améliorée
 */
function setupFormValidation() {
    const requiredFields = document.querySelectorAll('input[required], select[required]');
    
    requiredFields.forEach(field => {
        // Validation seulement sur blur ET si le champ a été modifié
        field.addEventListener('blur', function(event) {
            // CORRECTION : Ne valider que si le champ a été touché par l'utilisateur
            if (field.dataset.userModified === 'true') {
                validateField(event);
            }
        });
        
        // Marquer le champ comme modifié dès qu'on tape dedans
        field.addEventListener('input', function(event) {
            field.dataset.userModified = 'true';
            clearFieldError(event);
        });
        
        // Pour les select, marquer comme modifié au change
        if (field.tagName === 'SELECT') {
            field.addEventListener('change', function(event) {
                field.dataset.userModified = 'true';
                clearFieldError(event);
            });
        }
    });
}

/**
 * CORRECTION : Valider un champ seulement s'il a été modifié
 */
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Ne pas valider si le champ n'a pas été modifié par l'utilisateur
    if (field.dataset.userModified !== 'true') {
        return;
    }
    
    if (!value && field.hasAttribute('required')) {
        showFieldError(field, 'Ce champ est obligatoire');
    } else {
        clearFieldError(event);
    }
}

function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Supprimer l'ancienne erreur s'il y en a une
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Ajouter le nouveau message d'erreur
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

function addRound() {
    roundCounter++;
    
    const template = document.getElementById('roundTemplate');
    const roundElement = template.content.cloneNode(true);
    
    const roundId = `round-${Date.now()}-${roundCounter}`;
    const roundItem = roundElement.querySelector('.round-item');
    roundItem.dataset.roundId = roundId;
    
    roundElement.querySelector('.round-number').textContent = roundCounter;
    
    setupRoundEvents(roundElement, roundId);
    
    document.getElementById('roundsContainer').appendChild(roundElement);
    
    console.log(`➕ Round ${roundCounter} ajouté (ID: ${roundId})`);
    updateRoundsInfo();
}

function setupRoundEvents(roundElement, roundId) {
    const removeBtn = roundElement.querySelector('.remove-round-btn');
    removeBtn.addEventListener('click', () => removeRound(roundId));
    
    const uploadArea = roundElement.querySelector('.round-graphic-upload');
    const fileInput = roundElement.querySelector('.round-graphic-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileUpload(e, 'round', roundId));
}

function removeRound(roundId) {
    const rounds = document.querySelectorAll('.round-item');
    
    if (rounds.length <= 1) {
        showModal('Erreur', 'Vous devez avoir au moins un round pour générer le rapport.', 'error');
        return;
    }
    
    const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
    if (roundElement) {
        roundElement.style.animation = 'slideOutRight 0.3s ease-out';
        
        setTimeout(() => {
            roundElement.remove();
            updateRoundNumbers();
            updateRoundsInfo();
            
            if (FileHandler.roundGraphics[roundId]) {
                delete FileHandler.roundGraphics[roundId];
            }
            
            console.log(`🗑️ Round ${roundId} supprimé`);
        }, 300);
    }
}

function updateRoundNumbers() {
    const rounds = document.querySelectorAll('.round-item');
    roundCounter = rounds.length;
    
    rounds.forEach((round, index) => {
        round.querySelector('.round-number').textContent = index + 1;
    });
}

function updateRoundsInfo() {
    const roundsCount = document.querySelectorAll('.round-item').length;
    const infoElement = document.querySelector('.rounds-info p');
    
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> 
            ${roundsCount} round(s) configuré(s). Les graphiques montrent les trajectoires de tir.`;
    }
}

function handleFileUpload(event, type, roundId = null) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!validateFile(file)) {
        return;
    }
    
    if (type === 'pilot') {
        FileHandler.handlePilotPhoto(file);
    } else if (type === 'round') {
        FileHandler.handleRoundGraphic(file, roundId);
    }
}

function validateFile(file) {
    if (!file.type.startsWith('image/')) {
        showModal('Erreur', 'Veuillez sélectionner un fichier image (JPG, PNG).', 'error');
        return false;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showModal('Erreur', 'Le fichier ne doit pas dépasser 5MB.', 'error');
        return false;
    }
    
    return true;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
    
    try {
        formData = collectFormData();
        
        if (!validateFormData(formData)) {
            return;
        }
        
        showLoadingModal('Génération du rapport PDF en cours...');
        
        await PDFGenerator.generateReport(formData);
        
        showModal('Succès', 'Le rapport PDF a été généré avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        showModal('Erreur', `Une erreur est survenue: ${error.message}`, 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
    }
}

function collectFormData() {
    const rounds = [];
    
    document.querySelectorAll('.round-item').forEach((roundElement, index) => {
        const roundId = roundElement.dataset.roundId;
        const graphic = FileHandler.roundGraphics[roundId] || null;
        
        rounds.push({
            number: index + 1,
            id: roundId,
            graphic: graphic
        });
    });
    
    const data = {
        pilotName: document.getElementById('pilotName').value.trim(),
        pilotPhoto: FileHandler.pilotPhotoData,
        instructorName: document.getElementById('instructorName').value.trim(),
        date: document.getElementById('missionDate').value,
        missionType: document.getElementById('missionType').value,
        missionName: document.getElementById('missionName').value.trim(),
        aircraft: document.getElementById('aircraft').value.trim(),
        map: document.getElementById('map').value.trim(),
        rounds: rounds,
        generatedAt: new Date().toISOString(),
        totalRounds: rounds.length
    };
    
    console.log('📊 Données collectées:', data);
    return data;
}

/**
 * CORRECTION : Validation finale plus permissive
 */
function validateFormData(data) {
    const errors = [];
    
    // Validation des champs obligatoires uniquement
    if (!data.pilotName) errors.push('Le nom du pilote est obligatoire');
    if (!data.instructorName) errors.push('Le nom de l\'instructeur est obligatoire');
    if (!data.date) errors.push('La date de la mission est obligatoire');
    if (!data.missionType) errors.push('Le type de mission est obligatoire');
    if (!data.aircraft) errors.push('L\'avion utilisé est obligatoire');
    
    if (data.rounds.length === 0) {
        errors.push('Au moins un round est requis');
    }
    
    // CORRECTION : Ne plus exiger de graphiques pour tous les rounds
    // Les rounds sans graphiques auront un placeholder dans le PDF
    
    if (errors.length > 0) {
        const errorMessage = errors.join('\n• ');
        showModal('Validation', `Veuillez corriger les erreurs suivantes:\n\n• ${errorMessage}`, 'error');
        return false;
    }
    
    return true;
}

function resetForm() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les données seront perdues.')) {
        document.getElementById('mission-form').reset();
        setDefaultDate();
        
        const rounds = document.querySelectorAll('.round-item');
        rounds.forEach((round, index) => {
            if (index > 0) {
                round.remove();
            }
        });
        
        roundCounter = 1;
        updateRoundNumbers();
        
        FileHandler.reset();
        
        document.getElementById('pilotPhotoPreview').innerHTML = '';
        document.getElementById('pilotPhotoUpload').classList.remove('has-file');
        
        document.querySelectorAll('.round-graphic-preview').forEach(preview => {
            preview.innerHTML = '';
        });
        document.querySelectorAll('.round-graphic-upload').forEach(upload => {
            upload.classList.remove('has-file');
        });
        
        // CORRECTION : Réinitialiser les flags de modification
        document.querySelectorAll('input[required], select[required]').forEach(field => {
            field.dataset.userModified = 'false';
            field.classList.remove('error');
        });
        
        console.log('🔄 Formulaire réinitialisé');
        showModal('Information', 'Le formulaire a été réinitialisé.', 'info');
    }
}

function showModal(title, message, type = 'info') {
    const modal = document.getElementById('statusModal');
    const titleElement = document.getElementById('modalTitle');
    const messageElement = document.getElementById('statusMessage');
    const spinnerElement = document.getElementById('loadingSpinner');
    
    spinnerElement.classList.add('hidden');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    messageElement.className = `status-message status-${type}`;
    
    modal.classList.remove('hidden');
}

function showLoadingModal(message) {
    const modal = document.getElementById('statusModal');
    const titleElement = document.getElementById('modalTitle');
    const messageElement = document.getElementById('statusMessage');
    const spinnerElement = document.getElementById('loadingSpinner');
    
    spinnerElement.classList.remove('hidden');
    
    titleElement.textContent = 'Génération en cours';
    messageElement.textContent = message;
    messageElement.className = 'status-message status-info';
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('statusModal').classList.add('hidden');
}

const Logger = {
    info: (message, data = null) => {
        console.log(`ℹ️ ${message}`, data || '');
    },
    
    success: (message, data = null) => {
        console.log(`✅ ${message}`, data || '');
    },
    
    warning: (message, data = null) => {
        console.warn(`⚠️ ${message}`, data || '');
    },
    
    error: (message, error = null) => {
        console.error(`❌ ${message}`, error || '');
    }
};

window.addEventListener('error', function(event) {
    Logger.error('Erreur JavaScript globale:', event.error);
    showModal('Erreur', 'Une erreur inattendue s\'est produite. Veuillez recharger la page.', 'error');
});

window.addEventListener('beforeunload', function(event) {
    const hasData = document.getElementById('pilotName').value.trim() || 
                   document.getElementById('instructorName').value.trim() ||
                   Object.keys(FileHandler.roundGraphics || {}).length > 0;
    
    if (hasData) {
        event.preventDefault();
        event.returnValue = 'Vous avez des données non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
    }
});

// Export pour utilisation dans d'autres modules
window.AppController = {
    showModal,
    closeModal,
    Logger,
    validateFile,
    collectFormData
};