/**
 * Générateur PDF pour l'application ARESIA - VERSION CORRIGÉE
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
            primary: 'helvetica', // jsPDF supporte : helvetica, times, courier
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

    // Cache pour les images
    imageCache: {},

    /**
     * Créer un logo ARESIA stylisé en SVG/Canvas
     */
    createAresiaLogo() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Dimensions du logo
            canvas.width = 200;
            canvas.height = 80;
            
            // Fond avec gradient
            const gradient = ctx.createLinearGradient(0, 0, 200, 0);
            gradient.addColorStop(0, '#1C3062');
            gradient.addColorStop(1, '#4A90E2');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 200, 80);
            
            // Texte ARESIA
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ARESIA', 100, 35);
            
            // Tagline
            ctx.font = '14px Arial, sans-serif';
            ctx.fillText('Bolder together', 100, 55);
            
            // Icône avion stylisée
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(20, 25);
            ctx.lineTo(40, 20);
            ctx.lineTo(45, 25);
            ctx.lineTo(40, 30);
            ctx.closePath();
            ctx.stroke();
            
            const logoData = canvas.toDataURL('image/png', 1.0);
            this.imageCache.logo = {
                data: logoData,
                width: 200,
                height: 80
            };
            
            resolve(this.imageCache.logo);
        });
    },

    /**
     * Créer une image d'avion stylisée
     */
    createAircraftImage() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 400;
            canvas.height = 200;
            
            // Avion stylisé
            ctx.fillStyle = '#4A90E2';
            ctx.globalAlpha = 0.3;
            
            // Corps de l'avion
            ctx.fillRect(50, 90, 300, 20);
            
            // Ailes
            ctx.fillRect(150, 70, 100, 60);
            
            // Queue
            ctx.fillRect(320, 80, 40, 40);
            
            const aircraftData = canvas.toDataURL('image/png', 1.0);
            this.imageCache.aircraft = {
                data: aircraftData,
                width: 400,
                height: 200
            };
            
            resolve(this.imageCache.aircraft);
        });
    },

    /**
     * Précharger toutes les images nécessaires
     */
    async preloadImages() {
        console.log('🖼️ Création des images pour le PDF...');
        
        try {
            await this.createAresiaLogo();
            await this.createAircraftImage();
            console.log('✅ Images créées avec succès');
        } catch (error) {
            console.warn('⚠️ Erreur lors de la création des images:', error);
        }
    },

    /**
     * Générer le rapport complet
     */
    async generateReport(data) {
        console.log('📄 Début de la génération du rapport PDF');
        
        try {
            // Créer les images
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
        
        // Fond dégradé pour l'en-tête (simulé avec rectangles)
        this.addGradientHeader(pdf);
        
        // Logo ARESIA
        await this.addAresiaLogo(pdf);
        
        // Titre principal
        this.addMainTitle(pdf);
        
        // Sections d'informations
        let yPos = 90;
        
        // Section combinée Pilote/Instructeur
        yPos = this.addPersonnelSection(pdf, data, yPos);
        
        // Section Détails de la mission
        yPos = this.addMissionDetailsSection(pdf, data, yPos);
        
        // Photo du pilote (mieux centrée)
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
            if (this.imageCache.aircraft) {
                const aircraft = this.imageCache.aircraft;
                
                // Centrer l'image avec opacité très faible
                const bgWidth = pageWidth * 0.8;
                const bgHeight = (bgWidth * aircraft.height) / aircraft.width;
                const xPos = (pageWidth - bgWidth) / 2;
                const yPos = pageHeight - bgHeight - 50;
                
                pdf.saveGraphicsState();
                pdf.setGState(new pdf.GState({ opacity: 0.05 }));
                pdf.addImage(aircraft.data, 'PNG', xPos, yPos, bgWidth, bgHeight);
                pdf.restoreGraphicsState();
                
                console.log('✅ Image d\'avion ajoutée en arrière-plan');
            }
        } catch (error) {
            console.warn('⚠️ Impossible d\'ajouter l\'image d\'avion:', error);
        }
    },

    /**
     * Ajouter l'en-tête avec dégradé simulé
     */
    addGradientHeader(pdf) {
        const { pageWidth, colors } = this.config;
        
        // Simuler un dégradé avec plusieurs rectangles
        const headerHeight = 65;
        const steps = 30;
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const rgb1 = this.hexToRgb(colors.aresiaNavy);
            const rgb2 = this.hexToRgb(colors.aresiaBlue);
            
            const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
            const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
            const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
            
            pdf.setFillColor(r, g, b);
            pdf.rect(0, i * (headerHeight / steps), pageWidth, Math.ceil(headerHeight / steps), 'F');
        }
    },

    /**
     * Ajouter le logo ARESIA
     */
    async addAresiaLogo(pdf) {
        const { pageWidth } = this.config;
        
        try {
            if (this.imageCache.logo) {
                const logoWidth = 50;
                const logoHeight = 20;
                
                pdf.addImage(
                    this.imageCache.logo.data, 
                    'PNG', 
                    pageWidth - logoWidth - 15, 
                    15, 
                    logoWidth, 
                    logoHeight
                );
                
                console.log('✅ Logo ARESIA ajouté');
            }
        } catch (error) {
            console.warn('⚠️ Erreur avec le logo:', error);
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
        pdf.text(logoText, pageWidth - logoWidth - 20, 25);
        
        pdf.setFontSize(fonts.sizes.small);
        pdf.setFont(fonts.primary, 'normal');
        const taglineText = 'Bolder together';
        const taglineWidth = pdf.getTextWidth(taglineText);
        pdf.text(taglineText, pageWidth - taglineWidth - 20, 33);
    },

    /**
     * Ajouter le titre principal
     */
    addMainTitle(pdf) {
        const { colors, fonts } = this.config;
        
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.title);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('Virtual Air Combat Engagement', 20, 30);
        
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'normal');
        pdf.text('Simulator for live fire training', 20, 42);
        
        // Ligne décorative
        pdf.setDrawColor(...this.hexToRgb('#FFD700').values());
        pdf.setLineWidth(2);
        pdf.line(20, 50, 120, 50);
    },

    /**
     * Section Personnel (Pilote + Instructeur côte à côte)
     */
    addPersonnelSection(pdf, data, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const sectionWidth = (pageWidth - 3 * margin) / 2;
        const sectionHeight = 45;
        
        // Section Pilote (gauche)
        this.createInfoCard(pdf, margin, yPos, sectionWidth, sectionHeight, 'PILOT', [
            `Name: ${data.pilotName}`,
            `Date: ${this.formatDate(data.date)}`
        ], colors.aresiaNavy);
        
        // Section Instructeur (droite)
        const rightX = margin + sectionWidth + 10;
        this.createInfoCard(pdf, rightX, yPos, sectionWidth, sectionHeight, 'INSTRUCTOR', [
            `Name: ${data.instructorName}`,
            `Mission: ${data.missionType}`
        ], colors.aresiaBlue);
        
        return yPos + sectionHeight + 15;
    },

    /**
     * Créer une carte d'information stylisée
     */
    createInfoCard(pdf, x, y, width, height, title, lines, color) {
        const { colors, fonts } = this.config;
        
        // Fond avec ombre
        pdf.setFillColor(200, 200, 200);
        pdf.rect(x + 2, y + 2, width, height, 'F');
        
        // Fond principal
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(x, y, width, height, 'F');
        
        // Bordure colorée
        pdf.setDrawColor(...this.hexToRgb(color).values());
        pdf.setLineWidth(2);
        pdf.rect(x, y, width, height, 'S');
        
        // Barre de titre
        pdf.setFillColor(...this.hexToRgb(color).values());
        pdf.rect(x, y, width, 12, 'F');
        
        // Titre
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.subheading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text(title, x + 5, y + 8);
        
        // Contenu
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        
        lines.forEach((line, index) => {
            pdf.text(line, x + 5, y + 22 + (index * 8));
        });
    },

    /**
     * Section détails de mission améliorée
     */
    addMissionDetailsSection(pdf, data, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const sectionWidth = pageWidth - 2 * margin;
        const sectionHeight = 70;
        
        // Fond avec effet de profondeur
        pdf.setFillColor(220, 220, 220);
        pdf.rect(margin + 3, yPos + 3, sectionWidth, sectionHeight, 'F');
        
        pdf.setFillColor(...this.hexToRgb(colors.lightGray).values());
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'F');
        
        // Bordure avec coins arrondis simulés
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.setLineWidth(3);
        pdf.rect(margin, yPos, sectionWidth, sectionHeight, 'S');
        
        // Barre de titre avec gradient
        const titleHeight = 15;
        pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
        pdf.rect(margin, yPos, sectionWidth, titleHeight, 'F');
        
        // Titre
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('TRAINING MISSION DETAILS', margin + 8, yPos + 11);
        
        // Détails en colonnes
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        
        const details = [
            [`Mission Name:`, data.missionName || 'Standard Training'],
            [`Aircraft:`, data.aircraft],
            [`Map/Area:`, data.map || 'Training Zone'],
            [`Total Rounds:`, data.totalRounds.toString()]
        ];
        
        details.forEach((detail, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const xPos = margin + 8 + (col * (sectionWidth / 2));
            const yPos2 = yPos + 30 + (row * 12);
            
            // Label en gras
            pdf.setFont(fonts.primary, 'bold');
            pdf.text(detail[0], xPos, yPos2);
            
            // Valeur
            pdf.setFont(fonts.primary, 'normal');
            pdf.text(detail[1], xPos + pdf.getTextWidth(detail[0]) + 3, yPos2);
        });
        
        return yPos + sectionHeight + 15;
    },

    /**
     * Photo du pilote mieux positionnée
     */
    async addPilotPhoto(pdf, photoData) {
        const { pageWidth, colors } = this.config;
        
        try {
            const photoWidth = 45;
            const photoHeight = 55;
            
            // Position dans le coin supérieur droit, mais avec plus d'espace
            const xPos = pageWidth - photoWidth - 25;
            const yPos = 75;
            
            // Ombre portée
            pdf.setFillColor(150, 150, 150);
            pdf.rect(xPos + 3, yPos + 3, photoWidth, photoHeight, 'F');
            
            // Bordure décorative épaisse
            pdf.setFillColor(...this.hexToRgb(colors.aresiaNavy).values());
            pdf.rect(xPos - 3, yPos - 3, photoWidth + 6, photoHeight + 6, 'F');
            
            // Bordure intermédiaire dorée
            pdf.setFillColor(...this.hexToRgb(colors.aresiaGold).values());
            pdf.rect(xPos - 1, yPos - 1, photoWidth + 2, photoHeight + 2, 'F');
            
            // Photo
            pdf.addImage(photoData, 'JPEG', xPos, yPos, photoWidth, photoHeight);
            
            // Label sous la photo
            pdf.setFontSize(8);
            pdf.setTextColor(colors.darkGray);
            pdf.setFont('helvetica', 'italic');
            pdf.text('Pilot Photo', xPos + 5, yPos + photoHeight + 8);
            
        } catch (error) {
            console.warn('⚠️ Impossible d\'ajouter la photo du pilote:', error);
        }
    },

    /**
     * Pages des rounds améliorées
     */
    async generateRoundsPages(pdf, data) {
        console.log('📊 Génération des pages de rounds');
        
        pdf.addPage();
        
        // Titre de page amélioré
        this.addRoundsPageTitle(pdf);
        this.addExplanatoryText(pdf);
        
        let yPos = 75;
        
        for (let i = 0; i < data.rounds.length; i++) {
            const round = data.rounds[i];
            
            if (yPos > 220) {
                pdf.addPage();
                yPos = 30;
            }
            
            yPos = await this.addRoundSection(pdf, round, yPos);
        }
        
        // Numéroter toutes les pages
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            this.addFooter(pdf, i);
        }
    },

    /**
     * Ajouter le texte explicatif
     */
    addExplanatoryText(pdf) {
        const { pageWidth, margin, colors, fonts } = this.config;
        
        pdf.setFontSize(fonts.sizes.body);
        pdf.setFont(fonts.primary, 'normal');
        pdf.setTextColor(colors.darkGray);
        
        const explanationText = 'This report presents the performance curves for different shooting rounds. In the graphics, the yellow window represents your shooting window, the small black dots indicate when you fired, and the green triangles mark successful hits on target.';
        
        const splitText = pdf.splitTextToSize(explanationText, pageWidth - 2 * margin);
        pdf.text(splitText, margin, 50);
    },
    addRoundsPageTitle(pdf) {
        const { pageWidth, colors, fonts } = this.config;
        
        // Fond coloré pour le titre
        pdf.setFillColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.rect(0, 15, pageWidth, 25, 'F');
        
        pdf.setTextColor(colors.white);
        pdf.setFontSize(fonts.sizes.title);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('TRAINING SIMULATION REPORT', 20, 30);
        
        pdf.setFontSize(fonts.sizes.subtitle);
        pdf.setFont(fonts.primary, 'normal');
        pdf.text('Shot Analysis & Performance Details', 20, 37);
    },

    /**
     * Section round améliorée
     */
    async addRoundSection(pdf, round, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        
        // En-tête du round avec style moderne
        const headerHeight = 18;
        pdf.setFillColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, headerHeight, 'F');
        
        // Accent doré sur le côté
        pdf.setFillColor(...this.hexToRgb(colors.aresiaGold).values());
        pdf.rect(margin, yPos - 3, 5, headerHeight, 'F');
        
        pdf.setFontSize(fonts.sizes.heading);
        pdf.setTextColor(colors.white);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text(`ROUND ${round.number} - PERFORMANCE ANALYSIS`, margin + 10, yPos + 8);
        
        yPos += 20;
        
        // Graphique avec cadre professionnel
        if (round.graphic) {
            try {
                const graphicWidth = pageWidth - 2 * margin;
                const graphicHeight = 85;
                
                // Ombre du graphique
                pdf.setFillColor(180, 180, 180);
                pdf.rect(margin + 4, yPos + 4, graphicWidth, graphicHeight, 'F');
                
                // Fond blanc pour le graphique
                pdf.setFillColor(255, 255, 255);
                pdf.rect(margin, yPos, graphicWidth, graphicHeight, 'F');
                
                // Graphique
                pdf.addImage(round.graphic, 'JPEG', margin + 2, yPos + 2, graphicWidth - 4, graphicHeight - 4);
                
                // Bordure élégante
                pdf.setDrawColor(...this.hexToRgb(colors.aresiaNavy).values());
                pdf.setLineWidth(2);
                pdf.rect(margin, yPos, graphicWidth, graphicHeight, 'S');
                
                yPos += graphicHeight + 8;
                
            } catch (error) {
                console.warn(`⚠️ Erreur graphique round ${round.number}:`, error);
                yPos = this.addPlaceholderGraphic(pdf, round, yPos);
            }
        } else {
            yPos = this.addPlaceholderGraphic(pdf, round, yPos);
        }
        
        return yPos + 15;
    },

    /**
     * Placeholder pour graphique manquant
     */
    addPlaceholderGraphic(pdf, round, yPos) {
        const { pageWidth, margin, colors, fonts } = this.config;
        const placeholderHeight = 50;
        
        // Fond avec motif
        pdf.setFillColor(248, 249, 250);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, placeholderHeight, 'F');
        
        // Bordure en pointillés simulée
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(1);
        for (let i = 0; i < pageWidth - 2 * margin; i += 5) {
            if (i % 10 < 5) {
                pdf.line(margin + i, yPos, margin + i + 3, yPos);
                pdf.line(margin + i, yPos + placeholderHeight, margin + i + 3, yPos + placeholderHeight);
            }
        }
        
        // Texte centré
        pdf.setFontSize(fonts.sizes.body);
        pdf.setTextColor(colors.darkGray);
        pdf.setFont(fonts.primary, 'italic');
        
        const text = `No performance graphic available for Round ${round.number}`;
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, (pageWidth - textWidth) / 2, yPos + placeholderHeight / 2);
        
        return yPos + placeholderHeight;
    },

    /**
     * Pied de page amélioré
     */
    addFooter(pdf, pageNumber) {
        const { pageWidth, pageHeight, margin, colors, fonts } = this.config;
        
        // Ligne de séparation stylisée
        pdf.setDrawColor(...this.hexToRgb(colors.aresiaBlue).values());
        pdf.setLineWidth(2);
        pdf.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
        
        // Informations du pied de page
        pdf.setFontSize(fonts.sizes.small);
        pdf.setTextColor(colors.darkGray);
        pdf.setFont(fonts.primary, 'normal');
        
        const generatedDate = new Date().toLocaleDateString('fr-FR');
        pdf.text(`Generated on ${generatedDate}`, margin, pageHeight - 15);
        
        // ARESIA au centre
        pdf.setTextColor(colors.aresiaNavy);
        pdf.setFont(fonts.primary, 'bold');
        pdf.text('ARESIA - Virtual Air Combat Training', pageWidth / 2 - 45, pageHeight - 15);
        
        // Numéro de page
        pdf.setTextColor(colors.darkGray);
        pdf.setFont(fonts.primary, 'normal');
        pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 15);
    },

    // Utilitaires inchangés
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            values: () => [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        } : null;
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    },

    generateFileName(data) {
        const pilotName = data.pilotName ? data.pilotName.replace(/\s+/g, '_') : 'Pilot';
        const missionDate = data.date ? data.date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const missionType = data.missionType ? data.missionType.replace(/\s+/g, '_') : 'Mission';
        
        return `ARESIA_Training_Report_${pilotName}_${missionType}_${missionDate}.pdf`;
    }
};

// Export global
window.PDFGenerator = PDFGenerator;