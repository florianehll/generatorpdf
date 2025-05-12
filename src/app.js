const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const MissionController = require('./controllers/missionController');
const ReportController = require('./controllers/reportController');

// Désactiver l'avertissement de sécurité pour nodeIntegration
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// Variable pour stocker la fenêtre principale
let mainWindow;

// Chemin par défaut pour enregistrer les rapports
const defaultReportsPath = path.join(app.getPath('documents'), 'Mission Reports');

/**
 * Crée la fenêtre principale de l'application
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../public/images/app_icon.png'),
    title: 'Générateur de Rapports de Mission'
  });

  // Charger la page HTML
  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

  // Ouvrir les DevTools en mode développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Événement de fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialiser l'application lorsqu'elle est prête
app.whenReady().then(() => {
  // Créer les dossiers temporaires s'ils n'existent pas
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const tempImagesDir = path.join(tempDir, 'images');
  if (!fs.existsSync(tempImagesDir)) {
    fs.mkdirSync(tempImagesDir);
  }
  
  // Créer le dossier de rapports s'il n'existe pas
  if (!fs.existsSync(defaultReportsPath)) {
    fs.mkdirSync(defaultReportsPath, { recursive: true });
  }
  
  // Créer la fenêtre principale
  createWindow();
});

// Quitter l'application lorsque toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recréer la fenêtre principale lorsque l'application est activée (sur macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gérer les événements IPC (communication entre le processus principal et le renderer)

// Événement pour sélectionner une image (photo du pilote)
ipcMain.handle('select-pilot-photo', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
      ],
      title: 'Sélectionner la photo du pilote'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Erreur lors de la sélection de la photo du pilote:', error);
    return null;
  }
});

// Événement pour sélectionner une image (graphique de performance)
ipcMain.handle('select-chart-image', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
      ],
      title: 'Sélectionner une image de graphique'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'image du graphique:', error);
    return null;
  }
});

// Événement pour générer un rapport
ipcMain.handle('generate-report', async (event, formData) => {
  try {
    // Valider les données du formulaire
    const validation = MissionController.validateMissionData(formData);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Erreur de validation: ${validation.errors.join(', ')}`
      };
    }
    
    // Créer une mission à partir des données du formulaire
    const mission = await MissionController.createMission(formData);
    
    // Demander où enregistrer le rapport PDF
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Enregistrer le rapport',
      defaultPath: path.join(defaultReportsPath, `Rapport_${mission.pilotName.replace(/\s+/g, '_')}_${mission.getFormattedDate().replace(/\//g, '-')}.pdf`),
      filters: [
        { name: 'Fichiers PDF', extensions: ['pdf'] }
      ]
    });
    
    if (result.canceled) {
      return {
        success: false,
        message: 'Génération du rapport annulée par l\'utilisateur'
      };
    }
    
    // Générer le rapport PDF
    const pdfPath = await ReportController.generateReport(mission, path.dirname(result.filePath));
    
    return {
      success: true,
      message: 'Rapport généré avec succès',
      path: pdfPath
    };
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    return {
      success: false,
      message: `Erreur lors de la génération du rapport: ${error.message}`
    };
  }
});

// Événement pour ouvrir un rapport
ipcMain.handle('open-report', async (event, pdfPath) => {
  try {
    await ReportController.openReport(pdfPath);
    return {
      success: true
    };
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du rapport:', error);
    return {
      success: false,
      message: `Erreur lors de l'ouverture du rapport: ${error.message}`
    };
  }
});