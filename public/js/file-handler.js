/**
 * Gestionnaire de fichiers pour l'application ARESIA
 * Gestion des uploads d'images (photos pilote et graphiques)
 */

const FileHandler = {
    // Stockage des données d'images
    pilotPhotoData: null,
    roundGraphics: {},
    
    // Configuration
    config: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },

    /**
     * Initialisation du gestionnaire de fichiers
     */
    init() {
        console.log('📁 Gestionnaire de fichiers initialisé');
    },

    /**
     * Traiter l'upload de la photo du pilote
     */
    handlePilotPhoto(file) {
        console.log('📸 Traitement de la photo du pilote:', file.name);
        
        if (!this.validateFile(file)) {
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                this.pilotPhotoData = e.target.result;
                this.displayPilotPhotoPreview(e.target.result, file);
                console.log('✅ Photo du pilote chargée avec succès');
            } catch (error) {
                console.error('❌ Erreur lors du chargement de la photo:', error);
                this.showError('Erreur lors du chargement de la photo du pilote');
            }
        };
        
        reader.onerror = () => {
            console.error('❌ Erreur de lecture du fichier photo');
            this.showError('Impossible de lire le fichier image');
        };
        
        reader.readAsDataURL(file);
    },

    /**
     * Traiter l'upload d'un graphique de round
     */
    handleRoundGraphic(file, roundId) {
        console.log(`📊 Traitement du graphique pour le round ${roundId}:`, file.name);
        
        if (!this.validateFile(file)) {
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                this.roundGraphics[roundId] = e.target.result;
                this.displayRoundGraphicPreview(e.target.result, file, roundId);
                console.log(`✅ Graphique du round ${roundId} chargé avec succès`);
            } catch (error) {
                console.error('❌ Erreur lors du chargement du graphique:', error);
                this.showError('Erreur lors du chargement du graphique');
            }
        };
        
        reader.onerror = () => {
            console.error('❌ Erreur de lecture du fichier graphique');
            this.showError('Impossible de lire le fichier graphique');
        };
        
        reader.readAsDataURL(file);
    },

    /**
     * Valider un fichier
     */
    validateFile(file) {
        // Vérifier si le fichier existe
        if (!file) {
            this.showError('Aucun fichier sélectionné');
            return false;
        }

        // Vérifier le type MIME
        if (!this.config.allowedTypes.includes(file.type)) {
            this.showError(`Type de fichier non supporté. Types acceptés: ${this.config.allowedTypes.join(', ')}`);
            return false;
        }

        // Vérifier l'extension
        const extension = this.getFileExtension(file.name).toLowerCase();
        if (!this.config.allowedExtensions.includes(extension)) {
            this.showError(`Extension de fichier non supportée. Extensions acceptées: ${this.config.allowedExtensions.join(', ')}`);
            return false;
        }

        // Vérifier la taille
        if (file.size > this.config.maxFileSize) {
            const maxSizeMB = this.config.maxFileSize / (1024 * 1024);
            this.showError(`Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`);
            return false;
        }

        // Vérifier que c'est bien une image
        if (!file.type.startsWith('image/')) {
            this.showError('Le fichier doit être une image');
            return false;
        }

        return true;
    },

    /**
     * Afficher la prévisualisation de la photo du pilote
     */
    displayPilotPhotoPreview(imageData, file) {
        const previewContainer = document.getElementById('pilotPhotoPreview');
        const uploadArea = document.getElementById('pilotPhotoUpload');
        
        if (!previewContainer || !uploadArea) {
            console.error('❌ Éléments de prévisualisation non trouvés');
            return;
        }

        // Créer l'élément de prévisualisation
        const previewHTML = `
            <img src="${imageData}" alt="Photo du pilote">
            <div class="file-info">
                <i class="fas fa-image"></i>
                <span>${file.name}</span>
                <small>(${this.formatFileSize(file.size)})</small>
                <button type="button" class="remove-file-btn" onclick="FileHandler.removePilotPhoto()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        uploadArea.classList.add('has-file');

        // Animer l'apparition
        previewContainer.style.opacity = '0';
        setTimeout(() => {
            previewContainer.style.transition = 'opacity 0.3s ease';
            previewContainer.style.opacity = '1';
        }, 10);
    },

    /**
     * Afficher la prévisualisation d'un graphique de round
     */
    displayRoundGraphicPreview(imageData, file, roundId) {
        const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
        if (!roundElement) {
            console.error(`❌ Round ${roundId} non trouvé`);
            return;
        }

        const previewContainer = roundElement.querySelector('.round-graphic-preview');
        const uploadArea = roundElement.querySelector('.round-graphic-upload');
        
        if (!previewContainer || !uploadArea) {
            console.error('❌ Éléments de prévisualisation du round non trouvés');
            return;
        }

        // Créer l'élément de prévisualisation
        const previewHTML = `
            <img src="${imageData}" alt="Graphique de performance">
            <div class="file-info">
                <i class="fas fa-chart-area"></i>
                <span>${file.name}</span>
                <small>(${this.formatFileSize(file.size)})</small>
                <button type="button" class="remove-file-btn" onclick="FileHandler.removeRoundGraphic('${roundId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        uploadArea.classList.add('has-file');

        // Animer l'apparition
        previewContainer.style.opacity = '0';
        setTimeout(() => {
            previewContainer.style.transition = 'opacity 0.3s ease';
            previewContainer.style.opacity = '1';
        }, 10);
    },

    /**
     * Supprimer la photo du pilote
     */
    removePilotPhoto() {
        this.pilotPhotoData = null;
        
        const previewContainer = document.getElementById('pilotPhotoPreview');
        const uploadArea = document.getElementById('pilotPhotoUpload');
        const fileInput = document.getElementById('pilotPhoto');
        
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        if (uploadArea) {
            uploadArea.classList.remove('has-file');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        console.log('🗑️ Photo du pilote supprimée');
    },

    /**
     * Supprimer un graphique de round
     */
    removeRoundGraphic(roundId) {
        delete this.roundGraphics[roundId];
        
        const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
        if (!roundElement) return;

        const previewContainer = roundElement.querySelector('.round-graphic-preview');
        const uploadArea = roundElement.querySelector('.round-graphic-upload');
        const fileInput = roundElement.querySelector('.round-graphic-input');
        
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        
        if (uploadArea) {
            uploadArea.classList.remove('has-file');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
        
        console.log(`🗑️ Graphique du round ${roundId} supprimé`);
    },

    /**
     * Obtenir l'extension d'un fichier
     */
    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    },

    /**
     * Formater la taille d'un fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Afficher une erreur
     */
    showError(message) {
        console.error('❌ FileHandler Error:', message);
        
        // Utiliser le système de notification de l'app principale si disponible
        if (window.AppController && window.AppController.showModal) {
            window.AppController.showModal('Erreur de fichier', message, 'error');
        } else {
            alert(`Erreur: ${message}`);
        }
    },

    /**
     * Obtenir les informations d'un fichier
     */
    getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            extension: this.getFileExtension(file.name),
            formattedSize: this.formatFileSize(file.size)
        };
    },

    /**
     * Vérifier si une image est chargée
     */
    isPilotPhotoLoaded() {
        return this.pilotPhotoData !== null;
    },

    /**
     * Vérifier si un round a un graphique
     */
    isRoundGraphicLoaded(roundId) {
        return this.roundGraphics[roundId] !== undefined;
    },

    /**
     * Obtenir le nombre total de graphiques chargés
     */
    getTotalGraphicsCount() {
        return Object.keys(this.roundGraphics).length;
    },

    /**
     * Obtenir toutes les données des graphiques
     */
    getAllGraphicsData() {
        return {
            pilotPhoto: this.pilotPhotoData,
            roundGraphics: { ...this.roundGraphics }
        };
    },

    /**
     * Réinitialiser toutes les données
     */
    reset() {
        this.pilotPhotoData = null;
        this.roundGraphics = {};
        console.log('🔄 Données des fichiers réinitialisées');
    },

    /**
     * Sauvegarder les données dans le localStorage (optionnel)
     */
    saveToLocalStorage() {
        try {
            const data = {
                pilotPhoto: this.pilotPhotoData,
                roundGraphics: this.roundGraphics,
                timestamp: Date.now()
            };
            localStorage.setItem('aresia_file_data', JSON.stringify(data));
            console.log('💾 Données sauvegardées dans le localStorage');
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder dans le localStorage:', error);
        }
    },

    /**
     * Charger les données depuis le localStorage (optionnel)
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('aresia_file_data');
            if (data) {
                const parsedData = JSON.parse(data);
                this.pilotPhotoData = parsedData.pilotPhoto;
                this.roundGraphics = parsedData.roundGraphics || {};
                console.log('📥 Données chargées depuis le localStorage');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger depuis le localStorage:', error);
        }
        return false;
    },

    /**
     * Supprimer les données du localStorage
     */
    clearLocalStorage() {
        try {
            localStorage.removeItem('aresia_file_data');
            console.log('🗑️ Données supprimées du localStorage');
        } catch (error) {
            console.warn('⚠️ Impossible de supprimer du localStorage:', error);
        }
    },

    /**
     * Redimensionner une image (utilitaire)
     */
    resizeImage(imageData, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculer les nouvelles dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Redimensionner
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en base64
                const resizedImageData = canvas.toDataURL('image/jpeg', quality);
                resolve(resizedImageData);
            };
            
            img.src = imageData;
        });
    },

    /**
     * Convertir une image en différents formats
     */
    convertImageFormat(imageData, format = 'image/jpeg', quality = 0.9) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const convertedImageData = canvas.toDataURL(format, quality);
                resolve(convertedImageData);
            };
            
            img.src = imageData;
        });
    },

    /**
     * Obtenir les métadonnées d'une image
     */
    getImageMetadata(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height,
                    megapixels: (img.width * img.height) / 1000000
                });
            };
            
            img.src = imageData;
        });
    }
};

// Initialiser le gestionnaire de fichiers au chargement
document.addEventListener('DOMContentLoaded', () => {
    FileHandler.init();
});

// Export global
window.FileHandler = FileHandler;