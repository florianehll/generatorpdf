const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Classe pour générer des rapports PDF
 */
class PDFGenerator {
  constructor(mission) {
    this.mission = mission;
    this.doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: `Rapport de mission - ${mission.pilotName}`,
        Author: 'ARESIA',
        Subject: 'Virtual Air Combat Engagement - Rapport de simulation',
        Keywords: 'simulation, combat aérien, rapport, entraînement'
      }
    });
  }

  async generate(outputPath) {
    // Créer le dossier de sortie s'il n'existe pas
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Créer le flux de sortie
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    // Générer le contenu du PDF
    await this.generateCoverPage();
    
    // Générer les pages de détails de tirs
    if (this.mission.performanceData && this.mission.performanceData.length > 0) {
      for (let i = 0; i < this.mission.performanceData.length; i++) {
        this.doc.addPage();
        await this.generateRoundPage(this.mission.performanceData[i], i + 1);
      }
    }
    
    // Page produit
    this.doc.addPage();
    await this.generateProductPage();
    
    // Page contact
    this.doc.addPage();
    await this.generateContactPage();

    // Finaliser le document
    this.doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(outputPath);
      });
      stream.on('error', reject);
    });
  }

  async generateCoverPage() {
    // Logo et titre
    const logoPath = path.join(__dirname, '../../public/images/aresia_logo.png');
    if (fs.existsSync(logoPath)) {
      this.doc
        .image(logoPath, 450, 45, { width: 100 });
    }

    // Titre
    this.doc
      .fillColor('#003366')
      .fontSize(26)
      .text('Virtual Air', 50, 100)
      .fontSize(26)
      .text('Combat Engagement', 50, 135)
      .fontSize(18)
      .text('Simulator for live fire training', 50, 180);

    // Section rapport
    this.doc
      .fontSize(24)
      .text('Training Simulation Report', 50, 260);

    // Information Pilote
    this.doc
      .fontSize(20)
      .text('Pilot', 50, 320);

    // Cadre pour les informations du pilote
    this.doc
      .rect(50, 350, 350, 60)
      .lineWidth(1)
      .stroke();

    this.doc
      .fontSize(16)
      .text(`Name: ${this.mission.pilotName}`, 60, 370);

    // Information Instructeur
    this.doc
      .fontSize(20)
      .text('Instructor', 50, 430);

    // Cadre pour les informations de l'instructeur
    this.doc
      .rect(50, 460, 350, 60)
      .lineWidth(1)
      .stroke();

    this.doc
      .fontSize(16)
      .text(`Name: ${this.mission.instructorName}`, 60, 480);

    // Détails de la mission
    this.doc
      .fontSize(20)
      .text('Training details', 50, 540);

    // Cadre pour les détails de la mission
    this.doc
      .rect(50, 570, 350, 150)
      .lineWidth(1)
      .stroke();

    this.doc
      .fontSize(16)
      .text(`Date: ${this.mission.getFormattedDate()}`, 60, 590)
      .text(`Mission Type: ${this.mission.missionType}`, 60, 620)
      .text(`Mission Name: ${this.mission.missionName || '-'}`, 60, 650)
      .text(`Plane: ${this.mission.aircraft}`, 60, 680)
      .text(`Map: ${this.mission.map || '-'}`, 60, 710);

    // Photo du pilote
    if (this.mission.pilotPhoto && fs.existsSync(this.mission.pilotPhoto)) {
      this.doc
        .image(this.mission.pilotPhoto, 450, 350, { 
          width: 300,
          height: 250,
          fit: [300, 250]
        });
    }

    // Footer
    this.doc
      .fontSize(10)
      .text('aresia.com', 500, 780, { align: 'right' });
  }

  async generateRoundPage(roundData, roundNumber) {
    // Titre
    this.doc
      .fillColor('#003366')
      .fontSize(20)
      .text('Training Simulation Report - Shots Details', 50, 50);

    // Numéro du round
    this.doc
      .fontSize(22)
      .text(`Round ${roundNumber}`, 50, 100);

    // Image du graphique
    let yOffset = 130;
    if (roundData.chartImage && fs.existsSync(roundData.chartImage)) {
      this.doc
        .image(roundData.chartImage, 50, yOffset, { 
          width: 500,
          height: 300,
          fit: [500, 300]
        });
      yOffset += 320;
    }

    // Titre détails des tirs
    this.doc
      .fontSize(20)
      .text('Shots Details:', 50, yOffset);

    yOffset += 30;

    // Tableau des tirs
    if (roundData.shots && roundData.shots.length > 0) {
      const headers = ["SHOT NUMBER", "SPEED", "ALTITUDE", "DISTANCE", "TARGET HIT"];
      const colWidths = [100, 100, 100, 100, 100];
      
      // En-têtes du tableau
      this.drawTableRow(headers, 50, yOffset, colWidths);
      yOffset += 25;
      
      // Lignes du tableau
      for (const shot of roundData.shots) {
        const values = [
          shot.number.toString(),
          shot.speed.toString(),
          shot.altitude.toString(),
          shot.distance.toString(),
          shot.hit ? "YES" : "NO"
        ];
        
        this.drawTableRow(values, 50, yOffset, colWidths, shot.hit);
        yOffset += 25;
        
        // Si on a atteint le bas de la page, ajouter une nouvelle page
        if (yOffset > 750) {
          this.doc.addPage();
          this.doc
            .fillColor('#003366')
            .fontSize(20)
            .text('Training Simulation Report - Shots Details (continued)', 50, 50);
          yOffset = 100;
        }
      }
    }

    // Logo ARESIA en bas à droite
    const logoPath = path.join(__dirname, '../../public/images/aresia_logo.png');
    if (fs.existsSync(logoPath)) {
      this.doc
        .image(logoPath, 450, 750, { width: 100 });
    }
  }

  drawTableRow(cells, x, y, colWidths, isHit = null) {
    for (let i = 0; i < cells.length; i++) {
      const cellX = x + colWidths.slice(0, i).reduce((sum, width) => sum + width, 0);
      
      // Définir la couleur de fond pour la colonne "TARGET HIT"
      if (i === 4 && isHit !== null) {
        if (isHit) {
          this.doc
            .fillColor('#00cc00')  // Vert
            .rect(cellX, y, colWidths[i], 20)
            .fill();
        } else {
          this.doc
            .fillColor('#ff0000')  // Rouge
            .rect(cellX, y, colWidths[i], 20)
            .fill();
        }
      }
      
      // Dessiner la bordure de la cellule
      this.doc
        .strokeColor('#000000')
        .lineWidth(1)
        .rect(cellX, y, colWidths[i], 20)
        .stroke();
      
      // Écrire le texte (en blanc pour les cellules colorées, en noir sinon)
      if (i === 4 && isHit !== null) {
        this.doc.fillColor('#ffffff');  // Texte blanc
      } else {
        this.doc.fillColor('#000000');  // Texte noir
      }
      
      this.doc
        .fontSize(12)
        .text(cells[i], cellX + 5, y + 5, {
          width: colWidths[i] - 10,
          align: 'center'
        });
    }
    
    // Réinitialiser la couleur de remplissage
    this.doc.fillColor('#000000');
  }

  async generateProductPage() {
    // Titre
    this.doc
      .fillColor('#003366')
      .fontSize(26)
      .text('Virtual Air Combat Engagement', 50, 50);
    
    this.doc
      .fontSize(18)
      .text('Simulator for', 50, 100)
      .text('Air-to-Air & Air-to-Ground', 50, 125)
      .text('Live Fire Training', 50, 150);
    
    // Section Simulator Station
    this.doc
      .fontSize(20)
      .fillColor('#003366')
      .text('SIMULATOR STATION', 350, 270);
    
    this.doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Virtual Reality Helmet', 350, 300)
      .text('Joystick - Throttle - Rudder', 350, 325)
      .text('Immersive environment', 350, 350)
      .text('Real targets with 3D models', 350, 375);
    
    // Section Instructor Station
    this.doc
      .fontSize(20)
      .fillColor('#003366')
      .text('INSTRUCTOR STATION', 350, 425);
    
    this.doc
      .fontSize(16)
      .fillColor('#000000')
      .text('Remote mission control', 350, 455)
      .text('Mission Replay and Analysis', 350, 480)
      .text('Record Mission / Pilot data', 350, 505)
      .text('Virtual Instructor', 350, 530);
    
    // Section PRODUCT
    this.doc
      .fontSize(22)
      .fillColor('#003366')
      .text('PRODUCT', 50, 600);
    
    this.doc
      .fontSize(16)
      .fillColor('#000000')
      .text('- Possibility to customize missions and aircraft', 50, 635)
      .text('- Real Time Data Fusion (Trajectory, Eye Tracking, Hand Tracking, Stress Sensors ...)', 50, 660)
      .text('- Multi pilots Training', 50, 685)
      .text('- Real time Evaluation', 50, 710)
      .text('- Radio Communication Training', 50, 735)
      .text('- Voice Recognition / Synthesis', 50, 760);
    
    // Image du simulateur
    const simulatorImagePath = path.join(__dirname, '../../public/images/simulator.png');
    if (fs.existsSync(simulatorImagePath)) {
      this.doc.image(simulatorImagePath, 50, 250, { width: 250 });
    }
  }

  async generateContactPage() {
    // Titre
    this.doc
      .fillColor('#003366')
      .fontSize(26)
      .text('Virtual Air', 50, 50)
      .text('Combat Engagement', 50, 85)
      .fontSize(18)
      .text('Simulator for live fire training', 50, 130);
    
    // Logo ARESIA
    const logoPath = path.join(__dirname, '../../public/images/aresia_logo.png');
    if (fs.existsSync(logoPath)) {
      this.doc.image(logoPath, 450, 50, { width: 100 });
    }
    
    // Section Vidéo
    this.doc
      .fontSize(22)
      .text('VIDEO', 50, 200);
    
    this.doc
      .rect(50, 230, 500, 60)
      .stroke();
    
    this.doc
      .fontSize(14)
      .text('https://drive.google.com/file/d/1igE4wHErNEPPeFQGWXQXLpCjBrYCKJYa/view', 60, 250);
    
    // Section Contact
    this.doc
      .fontSize(22)
      .text('CONTACT', 50, 350);
    
    this.doc
      .rect(50, 380, 500, 150)
      .stroke();
    
    this.doc
      .fontSize(16)
      .text('ARESIA OZOIR', 60, 400)
      .text('Alain HOUELLE', 60, 430)
      .text('Phone: +33 (0) 6 61 88 55 39', 60, 460)
      .text('Email: alain.houelle@aresia.com', 60, 490)
      .text('Address: 11 avenue Henri Beaudelet', 60, 520)
      .text('                77330 Ozoir-la-Ferrière - FRANCE', 60, 550);
    
    // Image de démonstration
    const demoImagePath = path.join(__dirname, '../../public/images/demo.png');
    if (fs.existsSync(demoImagePath)) {
      this.doc.image(demoImagePath, 0, 600, { width: 595 });
    }
  }
}

module.exports = PDFGenerator;