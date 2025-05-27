/**
 * Générateur PDF pour l'application ARESIA
 * Création de rapports PDF conformes à la charte graphique ARESIA
 * Version avec images intégrées
 */

const PDFGenerator = {
    // Configuration PDF
    config: {
        pageWidth: 210, // A4 width in mm
        pageHeight: 297, // A4 height in mm
        margin: 20,
        colors: {
            aresiaNavy: '#1C3062',
            aresiaBlue: '#4A90E2',
            aresiaLightBlue: '#7FDBFF',
            aresiaGold: '#FFD700',
            white: '#FFFFFF',
            lightGray: '#F8F9FA',
            darkGray: '#343A40',
            black: '#000000'
        },
        fonts: {
            primary: 'helvetica',
            sizes: {
                title: 24,
                subtitle: 18,
                heading: 16,
                subheading: 14,
                body: 12,
                small: 10,
                tiny: 8
            }
        },
        images: {
            logo: 'assets/images/logo.png',
            aircraft1: 'assets/images/avion1.jpg',
            aircraft2: 'assets/images/AVION2.jpg'
        }
    },

    // Cache pour les images
    imageCache: {},

    /**
     * Précharger les images nécessaires
     */
    async preloadImages() {
        console.log('🖼️ Préchargement des images...');
        
        const imagesToLoad = [
            { key: 'logo', path: this.config.images.logo },
            { key: 'aircraft1', path: this.config.images.aircraft1 },
            { key: 'aircraft2', path: this.config.images.aircraft2 }
        ];

        const loadPromises = imagesToLoad.map(img => this.loadImageAsBase64(img.key, img.path));
        
        try {
            await Promise.all(loadPromises);
            console.log('✅ Images préchargées avec succès');
        } catch (error) {
            console.warn('⚠️ Certaines images n\'ont pas pu être chargées:', error);
        }
    },

    /**
     * Charger une image et la convertir en base64
     */
    async loadImageAsBase64(key, imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    this.imageCache[key] = {
                        data: canvas.toDataURL('image/jpeg', 0.8),
                        width: img.width,
                        height: img.height
                    };
                    
                    console.log(`✅ Image ${key} chargée (${img.width}x${img.height})`);
                    resolve(this.imageCache[key]);
                } catch (error) {
                    console.warn(`⚠️ Erreur lors du traitement de l'image ${key}:`, error);
                    reject(error);
                }
            };
            
            img.onerror = () => {
                console.warn(`⚠️ Impossible de charger l'image: ${imagePath}`);
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            
            img.src = imagePath;
        });
    },

    /**
     * Générer le rapport complet
     */
    async generateReport(data) {
        console.log('📄 Début de la génération du rapport PDF');
        
        try {
            // Précharger les images
            await this.preloadImages();
            
            // Créer une nouvelle instance jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('portrait', 'mm', 'a4');
            
            // Générer la page de couverture
            await this.generateCoverPage(pdf, data);
            
            // Générer les pages de détails des rounds
            if (data.rounds && data.rounds.length > 0) {
                await this.generateRoundsPages(pdf, data);
            }
            
            // Télécharger le PDF
            const fileName = this.generateFileName(data);
            pdf.save(fileName);
            
            console.log('✅ Rapport PDF généré avec succès:', fileName);
            
        } catch (error) {
            console.error('❌ Erreur lors de la génération du PDF:', error);
            throw new Error(`Impossible de générer le rapport PDF: ${error.message}`);
        }
    },

    /**
     * Générer la page de couverture
     */
    async generateCoverPage(pdf, data) {
        console.log('📋 Génération de la page de couverture');
        
        // Ajouter l'image d'avion en arrière-plan
        await this.addAircraftBackground(pdf);
        
        // Fond dégradé pour l'en-tête
        this.addGradientHeader(pdf);
        
        // Logo ARESIA
        await this.addAresiaLogo(pdf);
        
        // Titre principal
        this.addMainTitle(pdf);
        
        // Sections d'informations
        let yPos = 80;
        
        // Section Pilote
        yPos = this.addPilotSection(pdf, data, yPos);
        
        // Section Instructeur  
        yPos = this.addInstructorSection(pdf, data, yPos);
        
        // Section Détails de la mission
        yPos = this.addMissionDetailsSection(pdf, data, yPos);
        
        // Photo du pilote (si disponible)
        if (data.pilotPhoto) {
            await this.addPilotPhoto(pdf, data.pilotPhoto);
        }
        
        // Pied de page
        this.addFooter(pdf, 1);
    },

    /**
     * Ajouter l'image d'avion en arrière-plan
     */
    async addAircraftBackground(pdf) {
        const { pageWidth, pageHeight } = this.config;
        
        try {
            // Utiliser l'image d'avion 1 comme arrière-plan principal
            if (this.imageCache.aircraft1) {
                const aircraft = this.imageCache.aircraft1;
                
                // Calculer les dimensions pour couvrir toute la page avec opacité
                const aspectRatio = aircraft.width / aircraft.height;
                let bgWidth = pageWidth;
                let bgHeight = pageWidth / aspectRatio;
                
                if (bgHeight < pageHeight) {
                    bgHeight = pageHeight;
                    bgWidth = pageHeight * aspectRatio;
                }
                
                // Centrer l'image
                const xPos = (pageWidth - bgWidth) / 2;
                const yPos = (pageHeight - bgHeight) / 2;
                
                // Ajouter l'image avec transparence
                pdf.saveGraphicsState();
                pdf.setGState(new pdf.GState({ opacity: 0.08 }));
                pdf.addImage(aircraft.data, 'JPEG', xPos, yPos, bgWidth, bgHeight);
                pdf.restoreGraphicsState();
                
                console.log('✅ Image d\'avion ajoutée en arrière-plan');
            }
        } catch (error) {
            console.warn('⚠️ Impossible d\'ajouter l\'image d\'avion en arrière-plan:', error);
        }
    },

    /**
     * Ajouter l'en-tête avec dégradé
     */
    addGradientHeader(pdf) {
        const { pageWidth, colors } = this.config;
        
        // Simuler un dégradé avec plusieurs rectangles
        const headerHeight = 60;
        const steps = 20;
        
        for (let i = 0; i < steps; i++) {
            const alpha = 1 - (i / steps) * 0.3;
            const rgb = this.hexToRgb(colors.aresiaNavy);
            
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.saveGraphicsState();
            pdf.setGState(new pdf.GState({ opacity: alpha }));
            pdf.rect(0, i * (headerHeight / steps), pageWidth, headerHeight / steps, 'F');
            pdf.restoreGraphicsState();
        }
    },

    /**
     * Ajouter le logo ARESIA
     */
    async addAresiaLogo(pdf) {
        const { pageWidth, colors, fonts } = this.config;
        
        try {
            // Utiliser le vrai logo si disponible
            if (this.imageCache.logo) {
                const logo = this.imageCache.logo;
                const logoWidth = 40;
                const logoHeight = (logoWidth * logo.height) / logo.width;
                
                pdf.addImage(logo.data, 'PNG', pageWidth - logoWidth - 20, 12, logoWidth, logoHeight);
                
                // Tagline sous le logo
                pdf.setTextColor(colors.white);
                pdf.setFontSize(fonts.sizes.small);
                pdf.setFont(fonts.primary, 'normal');
                const taglineText = 'Bolder together';
                const taglineWidth = pdf.getTextWidth(taglineText);
                pdf.text(taglineText, pageWidth - taglineWidth - 20, 12 + logoHeight + 8);
                
                console.log('✅ Logo ARESIA ajouté');
            } else {
                // Fallback vers le texte
                this.addTextLogo(pdf);
            }
        } catch (error) {
            console.warn('⚠️ Erreur avec le logo, utilisation du texte:', error);
            this.addTextLogo(pdf);
        }
    },

    /**
     * Ajouter le logo en mode texte (fallback)
     */
    addTextLogo(pdf) {
        const { pageWidth, colors, fonts } = this.config;
        
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.subtitle);
        pdf.setFont(fonts.primary, 'bold');
        
        const logoText = 'ARESIA';
        const logoWidth = pdf.getTextWidth(logoText);
        pdf.text(logoText, pageWidth - logoWidth - 20, 20);
        
        pdf.setFontSize(fonts.sizes.small);
        pdf.setFont(fonts.primary, 'normal');
        const taglineText = 'Bolder together';
        const taglineWidth = pdf.getTextWidth(taglineText);
        pdf.text(taglineText, pageWidth - taglineWidth - 20, 28);
    },

    /**
     * Ajouter le titre principal
     */
    addMainTitle(pdf) {
        const { colors, fonts } = this.config;
        
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.title);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('Virtual Air Combat Engagement', 20, 35);
        
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'normal');
        pdf.text('Simulator for live fire training', 20, 45);
    },

    /**
     * Ajouter la section pilote
     */
    addPilotSection(pdf, data, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const sectionWidth = (pageWidth - 3 * margin) / 2;
        const sectionHeight = 50;
        
        // Fond de la section avec bordure
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'F');
        
        // Bordure colorée
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(2);
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'S');
        
        // Barre de titre colorée
        pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.rect(margin, yPos, sectionWidth, 8, 'F');
        
        // Titre de la section
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.subheading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('PILOT', margin + 5, yPos + 6);
        
        // Informations du pilote
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        pdf.text(`Name: ${data.pilotName}`, margin + 5, yPos + 25);
        
        return yPos + sectionHeight + 10;
    },

    /**
     * Ajouter la section instructeur
     */
    addInstructorSection(pdf, data, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const sectionWidth = (pageWidth - 3 * margin) / 2;
        const sectionHeight = 50;
        const xPos = pageWidth / 2 + 5;
        
        // Ajuster yPos pour aligner avec la section pilote
        yPos -= 60;
        
        // Fond de la section
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(xPos, yPos, sectionWidth, sectionHeight, 'F');
        
        // Bordure colorée
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(2);
        pdf.rect(xPos, yPos, sectionWidth, sectionHeight, 'S');
        
        // Barre de titre colorée
        pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.rect(xPos, yPos, sectionWidth, 8, 'F');
        
        // Titre de la section
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.subheading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('INSTRUCTOR', xPos + 5, yPos + 6);
        
        // Informations de l'instructeur
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        pdf.text(`Name: ${data.instructorName}`, xPos + 5, yPos + 25);
        
        return yPos + sectionHeight + 10;
    },

    /**
     * Ajouter la section détails de la mission
     */
    addMissionDetailsSection(pdf, data, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const sectionWidth = pageWidth - 2 * margin;
        const sectionHeight = 80;
        
        // Fond de la section
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'F');
        
        // Bordure colorée
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(2);
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'S');
        
        // Barre de titre colorée
        pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.rect(margin, yPos, sectionWidth, 12, 'F');
        
        // Titre de la section
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('TRAINING DETAILS', margin + 5, yPos + 9);
        
        // Détails de la mission
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        
        const details = [
            `Date: ${this.formatDate(data.date)}`,
            `Mission Type: ${data.missionType}`,
            `Mission Name: ${data.missionName || 'N/A'}`,
            `Aircraft: ${data.aircraft}`,
            `Map: ${data.map || 'N/A'}`,
            `Total Rounds: ${data.totalRounds}`
        ];
        
        details.forEach((detail, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const xPos = margin + 5 + (col * (sectionWidth / 2));
            const yPos2 = yPos + 25 + (row * 8);
            pdf.text(detail, xPos, yPos2);
        });
        
        return yPos + sectionHeight + 10;
    },

    /**
     * Ajouter la photo du pilote
     */
    async addPilotPhoto(pdf, photoData) {
        const { pageWidth, margin, colors } = this.config;
        
        try {
            // Calculer la position (coin supérieur droit de la section mission)
            const photoWidth = 50;
            const photoHeight = 60;
            const xPos = pageWidth - margin - photoWidth - 5;
            const yPos = 140;
            
            // Bordure décorative autour de la photo
            pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
            pdf.rect(xPos - 2, yPos - 2, photoWidth + 4, photoHeight + 4, 'F');
            
            // Ajouter la photo
            pdf.addImage(photoData, 'JPEG', xPos, yPos, photoWidth, photoHeight);
            
            // Cadre blanc fin
            pdf.setDrawColor(255, 255, 255);
            pdf.setLineWidth(1);
            pdf.rect(xPos, yPos, photoWidth, photoHeight, 'S');
            
        } catch (error) {
            console.warn('⚠️ Impossible d\'ajouter la photo du pilote:', error);
        }
    },

    /**
     * Générer les pages de détails des rounds
     */
    async generateRoundsPages(pdf, data) {
        console.log('📊 Génération des pages de rounds');
        
        // Nouvelle page pour les rounds
        pdf.addPage();
        
        // Ajouter une image d'avion subtile en arrière-plan des pages de rounds
        await this.addRoundsPageBackground(pdf);
        
        // Titre de la page
        this.addRoundsPageTitle(pdf);
        
        // Texte explicatif
        this.addExplanatoryText(pdf);
        
        let yPos = 70;
        
        // Ajouter chaque round
        for (let i = 0; i < data.rounds.length; i++) {
            const round = data.rounds[i];
            
            // Vérifier si on a besoin d'une nouvelle page
            if (yPos > 200) {
                pdf.addPage();
                await this.addRoundsPageBackground(pdf);
                yPos = 30;
            }
            
            yPos = await this.addRoundSection(pdf, round, yPos);
        }
        
        // Pied de page pour toutes les pages de rounds
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            this.addFooter(pdf, i);
        }
    },

    /**
     * Ajouter l'arrière-plan pour les pages de rounds
     */
    async addRoundsPageBackground(pdf) {
        try {
            if (this.imageCache.aircraft2) {
                const { pageWidth, pageHeight } = this.config;
                const aircraft = this.imageCache.aircraft2;
                
                // Image plus subtile pour les pages de contenu
                pdf.saveGraphicsState();
                pdf.setGState(new pdf.GState({ opacity: 0.03 }));
                
                const aspectRatio = aircraft.width / aircraft.height;
                const bgWidth = pageWidth * 0.8;
                const bgHeight = bgWidth / aspectRatio;
                const xPos = (pageWidth - bgWidth) / 2;
                const yPos = pageHeight - bgHeight - 50;
                
                pdf.addImage(aircraft.data, 'JPEG', xPos, yPos, bgWidth, bgHeight);
                pdf.restoreGraphicsState();
            }
        } catch (error) {
            console.warn('⚠️ Impossible d\'ajouter l\'arrière-plan des pages rounds:', error);
        }
    },

    /**
     * Ajouter le titre de la page des rounds
     */
    addRoundsPageTitle(pdf) {
        const { colors, fonts } = this.config;
        
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(fonts.sizes.title);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('Training Simulation Report - Shots Details', 20, 30);
        
        // Ligne décorative sous le titre
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.setLineWidth(2);
        pdf.line(20, 35, 190, 35);
    },

    /**
     * Ajouter le texte explicatif
     */
    addExplanatoryText(pdf) {
        const { pageWidth, margin, colors, fonts } = this.config;
        
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        
        const explanationText = 'Le rapport présente les courbes des différents rounds de tirs. Dans les graphiques, la fenêtre jaune représente votre fenêtre de tir, les petits ronds noirs indiquent les moments où vous avez tiré, et les triangles verts signalent les tirs ayant touché la cible.';
        
        const splitText = pdf.splitTextToSize(explanationText, pageWidth - 2 * margin);
        pdf.text(splitText, margin, 45);
    },

    /**
     * Ajouter une section de round
     */
    async addRoundSection(pdf, round, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        
        // Titre du round avec style amélioré
        pdf.setFillColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, 'F');
        
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setTextColor(colors.white);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text(`Round ${round.number}`, margin + 5, yPos + 5);
        
        yPos += 20;
        
        // Graphique du round (si disponible)
        if (round.graphic) {
            try {
                const graphicWidth = pageWidth - 2 * margin;
                const graphicHeight = 80;
                
                // Bordure décorative autour du graphique
                pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
                pdf.rect(margin - 2, yPos - 2, graphicWidth + 4, graphicHeight + 4, 'F');
                
                pdf.addImage(round.graphic, 'JPEG', margin, yPos, graphicWidth, graphicHeight);
                
                // Cadre autour du graphique
                pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
                pdf.setLineWidth(1);
                pdf.rect(margin, yPos, graphicWidth, graphicHeight, 'S');
                
                yPos += graphicHeight + 15;
                
            } catch (error) {
                console.warn(`⚠️ Impossible d'ajouter le graphique du round ${round.number}:`, error);
                
                // Placeholder stylisé pour graphique manquant
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');
                
                pdf.setFontSize(fonts.sizes.body);
                pdf.setTextColor(colors.darkGray);
                pdf.text('Graphique non disponible', margin + 5, yPos + 25);
                yPos += 50;
            }
        } else {
            // Placeholder stylisé
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, yPos, pageWidth - 2 * margin, 30, 'S');
            
            pdf.setFontSize(fonts.sizes.body);
            pdf.setTextColor(colors.darkGray);
            pdf.text('Aucun graphique fourni pour ce round', margin + 5, yPos + 20);
            yPos += 40;
        }
        
        return yPos + 10;
    },

    /**
     * Ajouter le pied de page
     */
    addFooter(pdf, pageNumber) {
        const { pageWidth, pageHeight, margin, colors, fonts } = this.config;
        
        // Ligne de séparation colorée
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.setLineWidth(1);
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
        
        // Informations du pied de page
        pdf.setFontSize(fonts.sizes.small);
        pdf.setTextColor(colors.darkGray);
        pdf.setFont(fonts.primary, 'normal');
        
        // Date de génération
        const generatedDate = new Date().toLocaleDateString('fr-FR');
        pdf.text(`Généré le ${generatedDate}`, margin, pageHeight - 10);
        
        // Numéro de page
        pdf.text(`Page ${pageNumber}`, pageWidth - margin - 20, pageHeight - 10);
        
        // Logo ARESIA petit au centre
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('ARESIA', pageWidth / 2 - 10, pageHeight - 10);
    },

    /**
     * Utilitaires - Convertir couleur hex en RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            values: () => [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        } : null;
    },

    /**
     * Formater une date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    },

    /**
     * Générer le nom de fichier
     */
    generateFileName(data) {
        const pilotName = data.pilotName ? data.pilotName.replace(/\s+/g, '_') : 'Pilote';
        const missionDate = data.date ? data.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const missionType = data.missionType ? data.missionType.replace(/\s+/g, '_') : 'Mission';
        
        return `Rapport_Mission_${pilotName}_${missionType}_${missionDate}.pdf`;
    }
};

// Export global
window.PDFGenerator = PDFGenerator;