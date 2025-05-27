/**
 * Générateur PDF pour l'application ARESIA
 * Création de rapports PDF conformes à la charte graphique ARESIA
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
        }
    },

    /**
     * Générer le rapport complet
     */
    async generateReport(data) {
        console.log('📄 Début de la génération du rapport PDF');
        
        try {
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
        
        const { pageWidth, pageHeight, margin, colors, fonts } = this.config;
        
        // Fond dégradé pour l'en-tête
        this.addGradientHeader(pdf);
        
        // Logo et titre ARESIA
        this.addAresiaLogo(pdf);
        
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
            pdf.setGState(new pdf.GState({ opacity: alpha }));
            pdf.rect(0, i * (headerHeight / steps), pageWidth, headerHeight / steps, 'F');
        }
        
        // Réinitialiser l'opacité
        pdf.setGState(new pdf.GState({ opacity: 1 }));
    },

    /**
     * Ajouter le logo ARESIA
     */
    addAresiaLogo(pdf) {
        const { pageWidth, colors, fonts } = this.config;
        
        // Logo simulé avec du texte
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.subtitle);
        pdf.setFont(fonts.primary, 'bold');
        
        // Positionnement en haut à droite
        const logoText = 'ARESIA';
        const logoWidth = pdf.getTextWidth(logoText);
        pdf.text(logoText, pageWidth - logoWidth - 20, 20);
        
        // Tagline
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
        
        // Fond de la section
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'F');
        
        // Bordure
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(1);
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'S');
        
        // Titre de la section
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('PILOT', margin + 5, yPos + 15);
        
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
        
        // Bordure
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(1);
        pdf.rect(xPos, yPos, sectionWidth, sectionHeight, 'S');
        
        // Titre de la section
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('INSTRUCTOR', xPos + 5, yPos + 15);
        
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
        
        // Bordure
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(1);
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'S');
        
        // Titre de la section
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('TRAINING DETAILS', margin + 5, yPos + 15);
        
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
            pdf.text(detail, margin + 5, yPos + 30 + (index * 8));
        });
        
        return yPos + sectionHeight + 10;
    },

    /**
     * Ajouter la photo du pilote
     */
    async addPilotPhoto(pdf, photoData) {
        const { pageWidth, margin } = this.config;
        
        try {
            // Calculer la position (coin supérieur droit de la section mission)
            const photoWidth = 50;
            const photoHeight = 60;
            const xPos = pageWidth - margin - photoWidth - 5;
            const yPos = 140;
            
            // Ajouter la photo
            pdf.addImage(photoData, 'JPEG', xPos, yPos, photoWidth, photoHeight);
            
            // Bordure autour de la photo
            pdf.setDrawColor(...this.hexToRgb(this.config.colors.aresiaNavy).values());
            pdf.setLineWidth(0.5);
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
     * Ajouter le titre de la page des rounds
     */
    addRoundsPageTitle(pdf) {
        const { colors, fonts } = this.config;
        
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(fonts.sizes.title);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('Training Simulation Report - Shots Details', 20, 30);
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
        
        // Titre du round
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text(`Round ${round.number}`, margin, yPos);
        
        yPos += 15;
        
        // Graphique du round (si disponible)
        if (round.graphic) {
            try {
                const graphicWidth = pageWidth - 2 * margin;
                const graphicHeight = 80;
                
                pdf.addImage(round.graphic, 'JPEG', margin, yPos, graphicWidth, graphicHeight);
                
                // Bordure autour du graphique
                pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
                pdf.setLineWidth(0.5);
                pdf.rect(margin, yPos, graphicWidth, graphicHeight, 'S');
                
                yPos += graphicHeight + 10;
                
            } catch (error) {
                console.warn(`⚠️ Impossible d'ajouter le graphique du round ${round.number}:`, error);
                
                // Placeholder pour graphique manquant
                pdf.setFontSize(fonts.sizes.body);
                pdf.setTextColor(colors.darkGray);
                pdf.text('Graphique non disponible', margin, yPos + 20);
                yPos += 40;
            }
        } else {
            // Placeholder pour graphique manquant
            pdf.setFontSize(fonts.sizes.body);
            pdf.setTextColor(colors.darkGray);
            pdf.text('Aucun graphique fourni pour ce round', margin, yPos + 10);
            yPos += 30;
        }
        
        return yPos + 10;
    },

    /**
     * Ajouter le pied de page
     */
    addFooter(pdf, pageNumber) {
        const { pageWidth, pageHeight, margin, colors, fonts } = this.config;
        
        // Ligne de séparation
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(0.5);
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
        
        // Logo ARESIA petit
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('ARESIA', pageWidth / 2 - 10, pageHeight - 10);
    },

    /**
     * Utilitaires
     */
    
    /**
     * Convertir couleur hex en RGB
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
    },

    /**
     * Calculer les dimensions optimales pour une image
     */
    calculateImageDimensions(maxWidth, maxHeight, imageWidth, imageHeight) {
        const aspectRatio = imageWidth / imageHeight;
        
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = maxHeight * aspectRatio;
        }
        
        return { width, height };
    },

    /**
     * Ajouter une bordure décorative
     */
    addDecorativeBorder(pdf, x, y, width, height, color = null) {
        const borderColor = color || this.config.colors.aresiaBlue;
        
        pdf.setDrawColor(...this.hexToRgb(borderColor).values());
        pdf.setLineWidth(2);
        
        // Coins décoratifs
        const cornerSize = 10;
        
        // Coin supérieur gauche
        pdf.line(x, y, x + cornerSize, y);
        pdf.line(x, y, x, y + cornerSize);
        
        // Coin supérieur droit
        pdf.line(x + width - cornerSize, y, x + width, y);
        pdf.line(x + width, y, x + width, y + cornerSize);
        
        // Coin inférieur gauche
        pdf.line(x, y + height - cornerSize, x, y + height);
        pdf.line(x, y + height, x + cornerSize, y + height);
        
        // Coin inférieur droit
        pdf.line(x + width, y + height - cornerSize, x + width, y + height);
        pdf.line(x + width - cornerSize, y + height, x + width, y + height);
    },

    /**
     * Ajouter un filigrane
     */
    addWatermark(pdf, text = 'ARESIA') {
        const { pageWidth, pageHeight, colors } = this.config;
        
        pdf.setGState(new pdf.GState({ opacity: 0.1 }));
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFontSize(60);
        pdf.setFont('helvetica', 'bold');
        
        // Centrer le texte et le faire tourner
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, pageWidth / 2 - textWidth / 2, pageHeight / 2, { angle: 45 });
        
        // Réinitialiser l'opacité
        pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
};

// Export global
window.PDFGenerator = PDFGenerator;