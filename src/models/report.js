/**
 * Modèle pour la génération de rapports
 */
class Report {
    constructor(mission) {
      this.mission = mission;
      this.createdAt = new Date();
      this.fileName = this.generateFileName();
    }
  
    generateFileName() {
      // Générer un nom de fichier basé sur les informations de la mission
      const dateStr = this.mission.getFormattedDate().replace(/\//g, '-');
      const missionName = this.mission.missionName ? `-${this.mission.missionName.replace(/\s+/g, '_')}` : '';
      const pilotName = this.mission.pilotName.replace(/\s+/g, '_');
      
      return `Rapport_${pilotName}${missionName}_${dateStr}.pdf`;
    }
  
    // Méthode pour valider que toutes les données nécessaires sont présentes
    validate() {
      // Valider les données de mission
      this.mission.validate();
      
      // Vérifier que les données de performance sont valides
      if (!Array.isArray(this.mission.performanceData) || this.mission.performanceData.length === 0) {
        throw new Error('Les données de performance sont obligatoires');
      }
      
      return true;
    }
  }
  
  module.exports = Report;