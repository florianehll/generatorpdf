const Mission = require('../models/mission');
const ImageProcessor = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');

/**
 * Contrôleur pour la gestion des missions
 */
class MissionController {
  /**
   * Crée une nouvelle mission à partir des données du formulaire
   * 
   * @param {Object} formData - Données du formulaire
   * @returns {Promise<Mission>} - Instance de Mission créée
   */
  static async createMission(formData) {
    try {
      // Traiter la photo du pilote si elle existe
      let pilotPhoto = formData.pilotPhoto;
      if (pilotPhoto && fs.existsSync(pilotPhoto)) {
        // Copier l'image dans un dossier d'images temporaire
        const tempImagesFolder = path.join(__dirname, '../../temp/images');
        pilotPhoto = await ImageProcessor.copyImage(pilotPhoto, tempImagesFolder);
      }
      
      // Traiter les données de performance
      const performanceData = [];
      
      if (formData.rounds && Array.isArray(formData.rounds)) {
        for (const round of formData.rounds) {
          // Traiter l'image du graphique
          let chartImage = round.chartImage;
          if (chartImage && fs.existsSync(chartImage)) {
            // Copier l'image dans un dossier d'images temporaire
            const tempImagesFolder = path.join(__dirname, '../../temp/images');
            chartImage = await ImageProcessor.copyImage(chartImage, tempImagesFolder);
          }
          
          // Ajouter les données du round
          performanceData.push({
            number: round.number,
            chartImage: chartImage,
            shots: round.shots || []
          });
        }
      }
      
      // Créer une nouvelle instance de Mission
      const mission = new Mission({
        pilotName: formData.pilotName,
        instructorName: formData.instructorName,
        date: formData.date,
        missionType: formData.missionType,
        missionName: formData.missionName,
        aircraft: formData.aircraft,
        map: formData.map,
        pilotPhoto: pilotPhoto,
        performanceData: performanceData
      });
      
      // Valider les données
      mission.validate();
      
      return mission;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la mission: ${error.message}`);
    }
  }
  
  /**
   * Valide les données d'une mission
   * 
   * @param {Object} formData - Données du formulaire
   * @returns {Object} - Résultat de la validation
   */
  static validateMissionData(formData) {
    const errors = [];
    
    // Vérifier les champs obligatoires
    const requiredFields = [
      { field: 'pilotName', message: 'Le nom du pilote est obligatoire' },
      { field: 'instructorName', message: 'Le nom de l\'instructeur est obligatoire' },
      { field: 'date', message: 'La date est obligatoire' },
      { field: 'missionType', message: 'Le type de mission est obligatoire' },
      { field: 'aircraft', message: 'L\'avion est obligatoire' }
    ];
    
    for (const { field, message } of requiredFields) {
      if (!formData[field]) {
        errors.push(message);
      }
    }
    
    // Vérifier qu'il y a au moins un round
    if (!formData.rounds || !Array.isArray(formData.rounds) || formData.rounds.length === 0) {
      errors.push('Au moins un round est obligatoire');
    } else {
      // Vérifier les données de chaque round
      formData.rounds.forEach((round, index) => {
        if (!round.shots || !Array.isArray(round.shots) || round.shots.length === 0) {
          errors.push(`Le round ${index + 1} doit contenir au moins un tir`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = MissionController;