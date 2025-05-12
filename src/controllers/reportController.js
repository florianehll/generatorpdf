const Report = require('../models/report');
const PDFGenerator = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

/**
 * Contrôleur pour la génération des rapports
 */
class ReportController {
  /**
   * Génère un rapport PDF à partir d'une mission
   * 
   * @param {Mission} mission - Instance de Mission
   * @param {string} outputDir - Dossier de sortie pour le rapport
   * @returns {Promise<string>} - Chemin du fichier PDF généré
   */
  static async generateReport(mission, outputDir) {
    try {
      // Créer une instance de Report
      const report = new Report(mission);
      
      // Valider les données
      report.validate();
      
      // Créer le dossier de sortie s'il n'existe pas
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Générer le chemin complet du fichier PDF
      const pdfPath = path.join(outputDir, report.fileName);
      
      // Générer le PDF
      const pdfGenerator = new PDFGenerator(mission);
      const generatedPath = await pdfGenerator.generate(pdfPath);
      
      return generatedPath;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du rapport: ${error.message}`);
    }
  }
  
  /**
   * Ouvre un rapport PDF après sa génération
   * 
   * @param {string} pdfPath - Chemin du fichier PDF
   * @returns {Promise<void>}
   */
  static async openReport(pdfPath) {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`Le fichier PDF n'existe pas: ${pdfPath}`);
      }
      
      // Ouvrir le fichier PDF avec l'application par défaut
      const { shell } = require('electron');
      await shell.openPath(pdfPath);
    } catch (error) {
      throw new Error(`Erreur lors de l'ouverture du rapport: ${error.message}`);
    }
  }
}

module.exports = ReportController;