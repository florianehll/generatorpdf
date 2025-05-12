/**
 * Modèle de données pour les missions de simulation
 */
class Mission {
    constructor({
      pilotName,
      instructorName,
      date,
      missionType,
      missionName,
      aircraft,
      map,
      pilotPhoto,
      performanceData
    }) {
      this.pilotName = pilotName;
      this.instructorName = instructorName;
      this.date = date;
      this.missionType = missionType;
      this.missionName = missionName;
      this.aircraft = aircraft;
      this.map = map;
      this.pilotPhoto = pilotPhoto;
      this.performanceData = performanceData || []; // Contient les données pour les graphiques et tirs
    }
  
    validate() {
      // Validation des données obligatoires
      const requiredFields = ['pilotName', 'instructorName', 'date', 'missionType', 'aircraft'];
      for (const field of requiredFields) {
        if (!this[field]) {
          throw new Error(`Le champ "${field}" est obligatoire`);
        }
      }
      return true;
    }
  
    // Méthode pour formater la date selon le format du rapport (DD/MM/YYYY)
    getFormattedDate() {
      if (!this.date) return '';
      
      if (typeof this.date === 'string') {
        // Si c'est déjà une chaîne formatée comme DD/MM/YYYY, la retourner
        if (/\d{2}\/\d{2}\/\d{4}/.test(this.date)) {
          return this.date;
        }
        
        // Sinon, essayer de convertir la chaîne en Date
        const dateObj = new Date(this.date);
        return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      }
      
      // Si c'est déjà un objet Date
      if (this.date instanceof Date) {
        return `${this.date.getDate().toString().padStart(2, '0')}/${(this.date.getMonth() + 1).toString().padStart(2, '0')}/${this.date.getFullYear()}`;
      }
      
      return '';
    }
  }
  
  module.exports = Mission;