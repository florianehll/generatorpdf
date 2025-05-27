/**
 * Gestionnaire de fichiers pour l'application ARESIA - VERSION CORRIGÉE
 * Gestion des uploads d'images avec validation améliorée et drag & drop
 */

const FileHandler = {
    // Stockage des données d'images
    pilotPhotoData: null,
    roundGraphics: {},
    
    // Configuration améliorée
    config: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        // Recommandations pour la qualité
        recommendations: {
            minWidth: 800,
            minHeight: 600,
            optimalRatio: 16/9
        }
    },

    /**
     * Initialisation du gestionnaire de fichiers
     */
    init() {
        console.log('📁 Gestionnaire de fichiers ARESIA initialisé');
        this.setupDragAndDrop();
        this.updateStats();
    },

    /**
     * Configuration du drag & drop
     */
    setupDragAndDrop() {
        // Drag & drop pour la photo du pilote
        const pilotUpload = document.getElementById('pilotPhotoUpload');
        if (pilotUpload) {
            this.addDragDropListeners(pilotUpload, (files) => {
                if (files.length > 0) {
                    this.handlePilotPhoto(files[0]);
                }
            });
        }

        // Empêcher le drag & drop par défaut sur toute la page
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
    },

    /**
     * Ajouter les listeners drag & drop à un élément
     */
    addDragDropListeners(element, callback) {
        element.addEventListener('dragenter', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!element.contains(e.relatedTarget)) {
                element.classList.remove('drag-over');
            }
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            callback(files);
        });
    },

    /**
     * Traiter l'upload de la photo du pilote
     */
    handlePilotPhoto(file) {
        console.log('📸 Traitement de la photo du pilote:', file.name);
        
        if (!this.validateFile(file)) {
            return;
        }

        this.showProcessingState('pilotPhotoUpload');

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const imageData = e.target.result;
                
                // Vérifier les dimensions de l'image
                const metadata = await this.getImageMetadata(imageData);
                console.log('📊 Métadonnées image pilote:', metadata);
                
                // Optimiser l'image si nécessaire
                const optimizedData = await this.optimizeImage(imageData, {
                    maxWidth: 400,
                    maxHeight: 500,
                    quality: 0.9
                });
                
                this.pilotPhotoData = optimizedData;
                this.displayPilotPhotoPreview(optimizedData, file, metadata);
                this.updateStats();
                
                console.log('✅ Photo du pilote chargée et optimisée avec succès');
                this.showToast('Photo du pilote ajoutée avec succès', 'success');
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement de la photo:', error);
                this.showError('Erreur lors du chargement de la photo du pilote');
                this.hideProcessingState('pilotPhotoUpload');
            }
        };
        
        reader.onerror = () => {
            console.error('❌ Erreur de lecture du fichier photo');
            this.showError('Impossible de lire le fichier image');
            this.hideProcessingState('pilotPhotoUpload');
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

        const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
        if (!roundElement) {
            console.error(`❌ Round ${roundId} non trouvé`);
            return;
        }

        const uploadArea = roundElement.querySelector('.round-graphic-upload');
        this.showProcessingState(uploadArea);

        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const imageData = e.target.result;
                
                // Vérifier les dimensions
                const metadata = await this.getImageMetadata(imageData);
                console.log(`📊 Métadonnées graphique round ${roundId}:`, metadata);
                
                // Optimiser pour les graphiques (qualité plus élevée)
                const optimizedData = await this.optimizeImage(imageData, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.95
                });
                
                this.roundGraphics[roundId] = optimizedData;
                this.displayRoundGraphicPreview(optimizedData, file, roundId, metadata);
                this.updateRoundStatus(roundId);
                this.updateStats();
                
                console.log(`✅ Graphique du round ${roundId} chargé avec succès`);
                this.showToast(`Graphique du Round ajouté avec succès`, 'success');
                
            } catch (error) {
                console.error('❌ Erreur lors du chargement du graphique:', error);
                this.showError('Erreur lors du chargement du graphique');
                this.hideProcessingState(uploadArea);
            }
        };
        
        reader.onerror = () => {
            console.error('❌ Erreur de lecture du fichier graphique');
            this.showError('Impossible de lire le fichier graphique');
            this.hideProcessingState(uploadArea);
        };
        
        reader.readAsDataURL(file);
    },

    /**
     * Valider un fichier avec des vérifications étendues
     */
    validateFile(file) {
        // Vérifier si le fichier existe
        if (!file) {
            this.showError('Aucun fichier sélectionné');
            return false;
        }

        // Vérifier le type MIME
        if (!this.config.allowedTypes.includes(file.type.toLowerCase())) {
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

        // Vérifier la taille minimale
        if (file.size < 1024) { // 1KB minimum
            this.showError('Le fichier semble être corrompu (trop petit)');
            return false;
        }

        return true;
    },

    /**
     * Optimiser une image
     */
    optimizeImage(imageData, options = {}) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            const {
                maxWidth = 1920,
                maxHeight = 1080,
                quality = 0.9
            } = options;
            
            img.onload = () => {
                // Calculer les nouvelles dimensions en gardant le ratio
                let { width, height } = img;
                const aspectRatio = width / height;
                
                if (width > maxWidth) {
                    width = maxWidth;
                    height = width / aspectRatio;
                }
                
                if (height > maxHeight) {
                    height = maxHeight;
                    width = height * aspectRatio;
                }
                
                // Redimensionner sur le canvas
                canvas.width = width;
                canvas.height = height;
                
                // Améliorer la qualité de rendu
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir en base64 avec la qualité spécifiée
                const optimizedImageData = canvas.toDataURL('image/jpeg', quality);
                resolve(optimizedImageData);
            };
            
            img.src = imageData;
        });
    },

    /**
     * Afficher l'état de traitement
     */
    showProcessingState(elementOrSelector) {
        const element = typeof elementOrSelector === 'string' ? 
            document.getElementById(elementOrSelector) : elementOrSelector;
        
        if (!element) return;
        
        element.classList.add('processing');
        
        const uploadContent = element.querySelector('.upload-content');
        if (uploadContent) {
            const originalContent = uploadContent.innerHTML;
            uploadContent.dataset.originalContent = originalContent;
            uploadContent.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <p>Traitement en cours...</p>
            `;
        }
    },

    /**
     * Masquer l'état de traitement
     */
    hideProcessingState(elementOrSelector) {
        const element = typeof elementOrSelector === 'string' ? 
            document.getElementById(elementOrSelector) : elementOrSelector;
        
        if (!element) return;
        
        element.classList.remove('processing');
        
        const uploadContent = element.querySelector('.upload-content');
        if (uploadContent && uploadContent.dataset.originalContent) {
            uploadContent.innerHTML = uploadContent.dataset.originalContent;
            delete uploadContent.dataset.originalContent;
        }
    },

    /**
     * Afficher la prévisualisation de la photo du pilote
     */
    displayPilotPhotoPreview(imageData, file, metadata) {
        const previewContainer = document.getElementById('pilotPhotoPreview');
        const uploadArea = document.getElementById('pilotPhotoUpload');
        
        if (!previewContainer || !uploadArea) {
            console.error('❌ Éléments de prévisualisation non trouvés');
            return;
        }

        // Créer l'élément de prévisualisation avec métadonnées
        const previewHTML = `
            <div class="image-preview-container">
                <img src="${imageData}" alt="Photo du pilote" class="preview-image">
                <div class="image-overlay">
                    <button type="button" class="preview-btn" onclick="FileHandler.showImagePreview('${imageData}', 'Photo du Pilote')">
                        <i class="fas fa-search-plus"></i>
                    </button>
                </div>
            </div>
            <div class="file-info">
                <div class="file-main-info">
                    <i class="fas fa-image"></i>
                    <span class="filename">${file.name}</span>
                    <small class="filesize">(${this.formatFileSize(file.size)})</small>
                </div>
                <div class="file-meta">
                    <span class="dimensions">${metadata.width}×${metadata.height}</span>
                    <span class="megapixels">${metadata.megapixels.toFixed(1)}MP</span>
                </div>
                <button type="button" class="remove-file-btn" onclick="FileHandler.removePilotPhoto()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        uploadArea.classList.add('has-file');
        this.hideProcessingState(uploadArea);

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
    displayRoundGraphicPreview(imageData, file, roundId, metadata) {
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

        // Vérifier si c'est un bon ratio pour les graphiques
        const isGoodRatio = Math.abs(metadata.aspectRatio - this.config.recommendations.optimalRatio) < 0.1;
        const qualityIndicator = isGoodRatio ? 'optimal' : 'acceptable';

        const previewHTML = `
            <div class="image-preview-container">
                <img src="${imageData}" alt="Graphique de performance" class="preview-image">
                <div class="image-overlay">
                    <button type="button" class="preview-btn" onclick="FileHandler.showImagePreview('${imageData}', 'Graphique Round ${roundElement.querySelector('.round-number').textContent}')">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <div class="quality-badge ${qualityIndicator}">
                        <i class="fas fa-${isGoodRatio ? 'check' : 'info'}"></i>
                        ${isGoodRatio ? 'Optimal' : 'OK'}
                    </div>
                </div>
            </div>
            <div class="file-info">
                <div class="file-main-info">
                    <i class="fas fa-chart-area"></i>
                    <span class="filename">${file.name}</span>
                    <small class="filesize">(${this.formatFileSize(file.size)})</small>
                </div>
                <div class="file-meta">
                    <span class="dimensions">${metadata.width}×${metadata.height}</span>
                    <span class="ratio">Ratio ${metadata.aspectRatio.toFixed(2)}:1</span>
                </div>
                <button type="button" class="remove-file-btn" onclick="FileHandler.removeRoundGraphic('${roundId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        uploadArea.classList.add('has-file');
        this.hideProcessingState(uploadArea);

        // Animer l'apparition
        previewContainer.style.opacity = '0';
        setTimeout(() => {
            previewContainer.style.transition = 'opacity 0.3s ease';
            previewContainer.style.opacity = '1';
        }, 10);
    },

    /**
     * Afficher une prévisualisation d'image en grand
     */
    showImagePreview(imageData, title) {
        const modal = document.createElement('div');
        modal.className = 'modal image-preview-modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h4><i class="fas fa-image"></i> ${title}</h4>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="image-preview-large">
                        <img src="${imageData}" alt="${title}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Fermer
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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
        
        this.updateStats();
        console.log('🗑️ Photo du pilote supprimée');
        this.showToast('Photo du pilote supprimée', 'info');
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
        
        this.updateRoundStatus(roundId);
        this.updateStats();
        
        console.log(`🗑️ Graphique du round ${roundId} supprimé`);
        this.showToast('Graphique supprimé', 'info');
    },

    /**
     * Mettre à jour le statut d'un round
     */
    updateRoundStatus(roundId) {
        const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
        if (!roundElement) return;

        const statusIndicator = roundElement.querySelector('.status-indicator');
        const hasGraphic = this.roundGraphics[roundId] !== undefined;
        
        if (statusIndicator) {
            if (hasGraphic) {
                statusIndicator.setAttribute('data-status', 'ready');
                statusIndicator.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span class="status-text">Prêt</span>
                `;
            } else {
                statusIndicator.setAttribute('data-status', 'empty');
                statusIndicator.innerHTML = `
                    <i class="fas fa-circle"></i>
                    <span class="status-text">En attente</span>
                `;
            }
        }
    },

    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        const totalRounds = document.querySelectorAll('.round-item').length;
        const withGraphics = Object.keys(this.roundGraphics).length;
        const completionRate = totalRounds > 0 ? Math.round((withGraphics / totalRounds) * 100) : 0;

        // Mettre à jour les éléments de statistiques
        const totalElement = document.getElementById('totalRounds');
        const graphicsElement = document.getElementById('withGraphics');
        const rateElement = document.getElementById('completionRate');

        if (totalElement) totalElement.textContent = totalRounds;
        if (graphicsElement) graphicsElement.textContent = withGraphics;
        if (rateElement) rateElement.textContent = `${completionRate}%`;

        // Mettre à jour l'info des rounds
        const infoElement = document.querySelector('.rounds-info .info-text p:last-child');
        if (infoElement) {
            infoElement.innerHTML = `
                <strong>Statut :</strong> ${withGraphics}/${totalRounds} rounds avec graphiques 
                (${completionRate}% complété)
            `;
        }
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
     * Afficher une erreur avec toast
     */
    showError(message) {
        console.error('❌ FileHandler Error:', message);
        this.showToast(message, 'error');
        
        // Fallback pour les navigateurs sans support des toasts
        if (window.AppController && window.AppController.showModal) {
            window.AppController.showModal('Erreur de fichier', message, 'error');
        }
    },

    /**
     * Afficher un toast de notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            // Animation d'entrée
            setTimeout(() => toast.classList.add('show'), 10);
            
            // Suppression automatique après 5 secondes
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        }
    },

    /**
     * Obtenir l'icône pour un type de toast
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
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
        this.updateStats();
        console.log('🔄 Données des fichiers réinitialisées');
    },

    /**
     * Dupliquer un graphique de round
     */
    duplicateRoundGraphic(sourceRoundId, targetRoundId) {
        if (this.roundGraphics[sourceRoundId]) {
            this.roundGraphics[targetRoundId] = this.roundGraphics[sourceRoundId];
            this.updateRoundStatus(targetRoundId);
            this.updateStats();
            console.log(`📋 Graphique dupliqué du round ${sourceRoundId} vers ${targetRoundId}`);
            this.showToast('Graphique dupliqué avec succès', 'success');
        }
    },

    /**
     * Configurer le drag & drop pour un nouveau round
     */
    setupRoundDragDrop(roundId) {
        const roundElement = document.querySelector(`[data-round-id="${roundId}"]`);
        if (!roundElement) return;

        const uploadArea = roundElement.querySelector('.round-graphic-upload');
        if (uploadArea) {
            this.addDragDropListeners(uploadArea, (files) => {
                if (files.length > 0) {
                    this.handleRoundGraphic(files[0], roundId);
                }
            });
        }
    },

    /**
     * Valider la qualité d'une image
     */
    validateImageQuality(metadata, type = 'general') {
        const recommendations = this.config.recommendations;
        const issues = [];

        if (metadata.width < recommendations.minWidth || metadata.height < recommendations.minHeight) {
            issues.push(`Résolution faible (${metadata.width}×${metadata.height}). Recommandé: au moins ${recommendations.minWidth}×${recommendations.minHeight}`);
        }

        if (type === 'graphic') {
            const ratioScore = Math.abs(metadata.aspectRatio - recommendations.optimalRatio);
            if (ratioScore > 0.2) {
                issues.push(`Ratio d'aspect non optimal (${metadata.aspectRatio.toFixed(2)}:1). Recommandé: ${recommendations.optimalRatio.toFixed(2)}:1 (16:9)`);
            }
        }

        return {
            isGood: issues.length === 0,
            issues: issues,
            score: Math.max(0, 100 - (issues.length * 25))
        };
    }
};

// Initialiser le gestionnaire de fichiers au chargement
document.addEventListener('DOMContentLoaded', () => {
    FileHandler.init();
});

// Export global
window.FileHandler = FileHandler;