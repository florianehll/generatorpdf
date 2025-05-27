/**
 * Générateur de Rapports de Mission ARESIA
 * Application principale - Gestion des interactions utilisateur
 */

// Variables globales
let roundCounter = 0;
let formData = {};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de l\'application ARESIA');
    
    // Définir la date par défaut
    setDefaultDate();
    
    // Ajouter un premier round par défaut
    addRound();
    
    // Initialiser les gestionnaires d'événements
    initializeEventListeners();
    
    // Initialiser les animations
    initializeAnimations();
    
    console.log('✅ Application initialisée avec succès');
});

/**
 * Définir la date par défaut à aujourd'hui
 */
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('missionDate').value = today;
}

/**
 * Initialiser tous les gestionnaires d'événements
 */
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
    
    // Validation en temps réel
    setupFormValidation();
    
    console.log('🔗 Gestionnaires d\'événements initialisés');
}

/**
 * Initialiser les animations d'entrée
 */
function initializeAnimations() {
    // Animer les sections du formulaire avec un délai
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
}

/**
 * Configuration de la validation du formulaire
 */
function setupFormValidation() {
    const requiredFields = document.querySelectorAll('input[required], select[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

/**
 * Valider un champ individuel
 */
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (!value) {
        showFieldError(field, 'Ce champ est obligatoire');
    } else {
        clearFieldError(field);
    }
}

/**
 * Effacer l'erreur d'un champ
 */
function clearFieldError(event) {
    const field = event.target;
    field.classList.remove('error');
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Afficher une erreur sur un champ
 */
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

/**
 * Ajouter un nouveau round
 */
function addRound() {
    roundCounter++;
    
    const template = document.getElementById('roundTemplate');
    const roundElement = template.content.cloneNode(true);
    
    // Définir l'ID unique du round
    const roundId = `round-${Date.now()}-${roundCounter}`;
    const roundItem = roundElement.querySelector('.round-item');
    roundItem.dataset.roundId = roundId;
    
    // Mettre à jour le numéro du round
    roundElement.querySelector('.round-number').textContent = roundCounter;
    
    // Configurer les événements pour ce round
    setupRoundEvents(roundElement, roundId);
    
    // Ajouter le round au conteneur
    document.getElementById('roundsContainer').appendChild(roundElement);
    
    console.log(`➕ Round ${roundCounter} ajouté (ID: ${roundId})`);
    
    // Mettre à jour le message d'information
    updateRoundsInfo();
}

/**
 * Configurer les événements pour un round
 */
function setupRoundEvents(roundElement, roundId) {
    // Bouton de suppression
    const removeBtn = roundElement.querySelector('.remove-round-btn');
    removeBtn.addEventListener('click', () => removeRound(roundId));
    
    // Upload de graphique
    const uploadArea = roundElement.querySelector('.round-graphic-upload');
    const fileInput = roundElement.querySelector('.round-graphic-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileUpload(e, 'round', roundId));
}

/**
 * Supprimer un round
 */
function removeRound(roundId) {
    const rounds = document.querySelectorAll('.round-item');
    
    if (rounds.length <= 1) {
        showModal('Erreur', 'Vous devez avoir au moins un round pour générer le rapport.', 'error');
        return;
    }
    
    const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
    if (roundElement) {
        // Animation de suppression
        roundElement.style.animation = 'slideOutRight 0.3s ease-out';
        
        setTimeout(() => {
            roundElement.remove();
            updateRoundNumbers();
            updateRoundsInfo();
            
            // Nettoyer les données du round supprimé
            if (FileHandler.roundGraphics[roundId]) {
                delete FileHandler.roundGraphics[roundId];
            }
            
            console.log(`🗑️ Round ${roundId} supprimé`);
        }, 300);
    }
}

/**
 * Mettre à jour les numéros des rounds après suppression
 */
function updateRoundNumbers() {
    const rounds = document.querySelectorAll('.round-item');
    roundCounter = rounds.length;
    
    rounds.forEach((round, index) => {
        round.querySelector('.round-number').textContent = index + 1;
    });
}

/**
 * Mettre à jour les informations sur les rounds
 */
function updateRoundsInfo() {
    const roundsCount = document.querySelectorAll('.round-item').length;
    const infoElement = document.querySelector('.rounds-info p');
    
    if (infoElement) {
        infoElement.innerHTML = `<i class="fas fa-info-circle"></i> 
            ${roundsCount} round(s) configuré(s). Les graphiques montrent les trajectoires de tir.`;
    }
}

/**
 * Gestion des fichiers uploadés
 */
function handleFileUpload(event, type, roundId = null) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validation du fichier
    if (!validateFile(file)) {
        return;
    }
    
    // Traitement selon le type
    if (type === 'pilot') {
        FileHandler.handlePilotPhoto(file);
    } else if (type === 'round') {
        FileHandler.handleRoundGraphic(file, roundId);
    }
}

/**
 * Valider un fichier uploadé
 */
function validateFile(file) {
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
        showModal('Erreur', 'Veuillez sélectionner un fichier image (JPG, PNG).', 'error');
        return false;
    }
    
    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showModal('Erreur', 'Le fichier ne doit pas dépasser 5MB.', 'error');
        return false;
    }
    
    return true;
}

/**
 * Gérer la soumission du formulaire
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Désactiver le bouton de génération
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';
    
    try {
        // Collecter les données du formulaire
        formData = collectFormData();
        
        // Valider les données
        if (!validateFormData(formData)) {
            return;
        }
        
        // Afficher le modal de chargement
        showLoadingModal('Génération du rapport PDF en cours...');
        
        // Générer le PDF
        await PDFGenerator.generateReport(formData);
        
        // Afficher le succès
        showModal('Succès', 'Le rapport PDF a été généré avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        showModal('Erreur', `Une erreur est survenue: ${error.message}`, 'error');
    } finally {
        // Réactiver le bouton
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalText;
    }
}

/**
 * Collecter toutes les données du formulaire
 */
function collectFormData() {
    const rounds = [];
    
    // Collecter les données des rounds
    document.querySelectorAll('.round-item').forEach((roundElement, index) => {
        const roundId = roundElement.dataset.roundId;
        const graphic = FileHandler.roundGraphics[roundId] || null;
        
        rounds.push({
            number: index + 1,
            id: roundId,
            graphic: graphic
        });
    });
    
    // Collecter toutes les données
    const data = {
        // Informations du pilote
        pilotName: document.getElementById('pilotName').value.trim(),
        pilotPhoto: FileHandler.pilotPhotoData,
        
        // Informations de l'instructeur
        instructorName: document.getElementById('instructorName').value.trim(),
        
        // Détails de la mission
        date: document.getElementById('missionDate').value,
        missionType: document.getElementById('missionType').value,
        missionName: document.getElementById('missionName').value.trim(),
        aircraft: document.getElementById('aircraft').value.trim(),
        map: document.getElementById('map').value.trim(),
        
        // Rounds et graphiques
        rounds: rounds,
        
        // Métadonnées
        generatedAt: new Date().toISOString(),
        totalRounds: rounds.length
    };
    
    console.log('📊 Données collectées:', data);
    return data;
}

/**
 * Valider les données du formulaire
 */
function validateFormData(data) {
    const errors = [];
    
    // Validation des champs obligatoires
    if (!data.pilotName) errors.push('Le nom du pilote est obligatoire');
    if (!data.instructorName) errors.push('Le nom de l\'instructeur est obligatoire');
    if (!data.date) errors.push('La date de la mission est obligatoire');
    if (!data.missionType) errors.push('Le type de mission est obligatoire');
    if (!data.aircraft) errors.push('L\'avion utilisé est obligatoire');
    
    // Validation des rounds
    if (data.rounds.length === 0) {
        errors.push('Au moins un round est requis');
    }
    
    // Vérifier que chaque round a un graphique
    const roundsWithoutGraphic = data.rounds.filter(round => !round.graphic);
    if (roundsWithoutGraphic.length > 0) {
        errors.push(`${roundsWithoutGraphic.length} round(s) n'ont pas de graphique associé`);
    }
    
    // Afficher les erreurs si il y en a
    if (errors.length > 0) {
        const errorMessage = errors.join('\n• ');
        showModal('Validation', `Veuillez corriger les erreurs suivantes:\n\n• ${errorMessage}`, 'error');
        return false;
    }
    
    return true;
}

/**
 * Réinitialiser le formulaire
 */
function resetForm() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les données seront perdues.')) {
        // Réinitialiser le formulaire HTML
        document.getElementById('mission-form').reset();
        
        // Remettre la date par défaut
        setDefaultDate();
        
        // Supprimer tous les rounds sauf le premier
        const rounds = document.querySelectorAll('.round-item');
        rounds.forEach((round, index) => {
            if (index > 0) {
                round.remove();
            }
        });
        
        // Réinitialiser le compteur
        roundCounter = 1;
        updateRoundNumbers();
        
        // Nettoyer les données des fichiers
        FileHandler.reset();
        
        // Nettoyer les previews
        document.getElementById('pilotPhotoPreview').innerHTML = '';
        document.getElementById('pilotPhotoUpload').classList.remove('has-file');
        
        document.querySelectorAll('.round-graphic-preview').forEach(preview => {
            preview.innerHTML = '';
        });
        document.querySelectorAll('.round-graphic-upload').forEach(upload => {
            upload.classList.remove('has-file');
        });
        
        console.log('🔄 Formulaire réinitialisé');
        showModal('Information', 'Le formulaire a été réinitialisé.', 'info');
    }
}

/**
 * Afficher un modal
 */
function showModal(title, message, type = 'info') {
    const modal = document.getElementById('statusModal');
    const titleElement = document.getElementById('modalTitle');
    const messageElement = document.getElementById('statusMessage');
    const spinnerElement = document.getElementById('loadingSpinner');
    
    // Masquer le spinner
    spinnerElement.classList.add('hidden');
    
    // Définir le titre et le message
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Définir la classe de style
    messageElement.className = `status-message status-${type}`;
    
    // Afficher le modal
    modal.classList.remove('hidden');
}

/**
 * Afficher le modal de chargement
 */
function showLoadingModal(message) {
    const modal = document.getElementById('statusModal');
    const titleElement = document.getElementById('modalTitle');
    const messageElement = document.getElementById('statusMessage');
    const spinnerElement = document.getElementById('loadingSpinner');
    
    // Afficher le spinner
    spinnerElement.classList.remove('hidden');
    
    // Définir le titre et le message
    titleElement.textContent = 'Génération en cours';
    messageElement.textContent = message;
    messageElement.className = 'status-message status-info';
    
    // Afficher le modal
    modal.classList.remove('hidden');
}

/**
 * Fermer le modal
 */
function closeModal() {
    document.getElementById('statusModal').classList.add('hidden');
}

/**
 * Utilitaires pour le debug et les logs
 */
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

/**
 * Gestionnaire d'erreurs global
 */
window.addEventListener('error', function(event) {
    Logger.error('Erreur JavaScript globale:', event.error);
    showModal('Erreur', 'Une erreur inattendue s\'est produite. Veuillez recharger la page.', 'error');
});

/**
 * Gestion de la fermeture de l'onglet/fenêtre
 */
window.addEventListener('beforeunload', function(event) {
    // Vérifier s'il y a des données non sauvegardées
    const hasData = document.getElementById('pilotName').value.trim() || 
                   document.getElementById('instructoreName').value.trim() ||
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