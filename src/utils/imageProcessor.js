const fs = require('fs');
const path = require('path');

/**
 * Classe pour le traitement et la manipulation des images
 */
class ImageProcessor {
  /**
   * Copie une image dans le dossier de destination
   * 
   * @param {string} sourcePath - Chemin de l'image source
   * @param {string} destFolder - Dossier de destination
   * @returns {Promise<string>} - Chemin de l'image copiée
   */
  static async copyImage(sourcePath, destFolder) {
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      throw new Error(`L'image source n'existe pas: ${sourcePath}`);
    }
    
    // Créer le dossier de destination s'il n'existe pas
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    
    // Générer un nom de fichier unique pour éviter les conflits
    const fileName = `${Date.now()}_${path.basename(sourcePath)}`;
    const destPath = path.join(destFolder, fileName);
    
    // Copier le fichier
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(destPath);
      
      readStream.on('error', err => {
        reject(err);
      });
      
      writeStream.on('error', err => {
        reject(err);
      });
      
      writeStream.on('finish', () => {
        resolve(destPath);
      });
      
      readStream.pipe(writeStream);
    });
  }
  
  /**
   * Vérifie si un fichier est une image valide
   * 
   * @param {string} filePath - Chemin du fichier à vérifier
   * @returns {boolean} - true si le fichier est une image valide
   */
  static isValidImage(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return false;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    
    return validExtensions.includes(ext);
  }
  
  /**
   * Crée une image temporaire si l'image demandée n'existe pas
   * 
   * @param {string} imagePath - Chemin de l'image à vérifier
   * @param {string} tempFolder - Dossier temporaire
   * @param {string} defaultImage - Chemin de l'image par défaut
   * @returns {Promise<string>} - Chemin de l'image à utiliser
   */
  static async ensureImage(imagePath, tempFolder, defaultImage) {
    if (imagePath && fs.existsSync(imagePath) && this.isValidImage(imagePath)) {
      return imagePath;
    }
    
    // Si l'image par défaut existe, la copier
    if (defaultImage && fs.existsSync(defaultImage) && this.isValidImage(defaultImage)) {
      return this.copyImage(defaultImage, tempFolder);
    }
    
    throw new Error('Aucune image valide disponible');
  }
}

module.exports = ImageProcessor;