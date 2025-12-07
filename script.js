console.log("🆕🆕🆕 VERSION 2.5 - script.js CHARGÉE 🆕🆕🆕");
console.log("✅ Décalage altitude pas=1m");
console.log("✅ Recentrage caméra amélioré");
console.log("✅ Reset avec recentrage globe");
console.log("✅ Contrôle éclairage modèle 3D");
console.log("✅ Coloriage par altitude ET vitesse");
console.log("✅ FL115 filigrane + contour polyline blanc + label au bord NE");

// =======================================================
// GESTION DE LA DISPARITION DES MENUS APRÈS INACTIVITITÉ
// =======================================================
// Récupération des éléments de menu
const mobileMenu = document.getElementById('mobileMenu');
const traceMenu = document.getElementById('traceMenu');
const resetMenu = document.getElementById('resetMenu');
const environmentMenu = document.getElementById('environmentMenu');// s
const menus = [mobileMenu, traceMenu, resetMenu, environmentMenu];
const INACTIVITY_DELAY = 5000; // 5 secondes
let inactivityTimer;
// Liste des modèles disponibles dans le dossier models
const AVAILABLE_MODELS = [
   'PIC.glb',
   'PP Niviuk Zéno Bleue Mauve.glb',
   'PP Gin Boom orange.glb',
   'PP Ozone Zénno2 jaune.glb',
   'Avion Fokker.glb',
   'Helicoptere.glb',
   '2CV.glb',
   'Marcheur.glb',
   'Millenium.glb',
   'Darlmat.glb',
   'CampingCar.glb',
   'Scorpio.glb',
   'Chien.glb',
   'Vélo.glb',
   'Bateau.glb',
   'Randonneur.glb',
    'Avion.glb',
'Cheval.glb',
  // Ajoutez ici tous vos fichiers GLB
];
/**
 * Charge la liste des modèles disponibles dans le select
 */
function initModelSelector() {
  const modelSelect = document.getElementById('modelSelect');
  if (!modelSelect) {
    console.error('❌ Element modelSelect non trouvé dans le DOM');
    return;
  }
  console.log('🔍 modelSelect trouvé:', modelSelect);
  // Vider les options existantes (sauf la première)
  while (modelSelect.children.length > 1) {
    modelSelect.removeChild(modelSelect.lastChild);
  }
  console.log('📦 Modèles disponibles:', AVAILABLE_MODELS);
  // Ajouter les modèles disponibles
  AVAILABLE_MODELS.forEach(modelName => {
    if (modelName.trim()) { // Ignorer les chaînes vides
      const option = document.createElement('option');
      option.value = modelName;
      option.textContent = modelName;
      modelSelect.appendChild(option);
    }
  });
  console.log(`📁 ${AVAILABLE_MODELS.filter(m => m.trim()).length} modèles chargés dans le sélecteur`);
  console.log('🔢 Options dans le select:', modelSelect.children.length);
}
// ====================================
// GESTION AMÉLIORÉE DE LA CLÉ CESIUM ION
// ====================================
const loadCesiumKeyBtn = document.getElementById('loadCesiumKeyBtn');
const cesiumIonKeyInput = document.getElementById('cesiumIonKeyInput');
const openCesiumBtn = document.getElementById('openCesiumBtn');
// ✅ INFO BULLE VIA showStatus (remplacement du tooltip)
if (loadCesiumKeyBtn) {
  loadCesiumKeyBtn.addEventListener('mouseenter', () => {
    showStatus(
      'Collez votre clé API Cesium Ion pour activer le relief 3D. Elle n’est jamais envoyée sur Internet.',
      'info',
      4000
    );
  });
  loadCesiumKeyBtn.addEventListener('mouseleave', () => {
    showStatus('', 'info', 10); // Efface rapidement
  });
}
let isTerrainActive = false;
// Vérifier si une clé est déjà sauvegardée
const savedKey = localStorage.getItem('cesiumIonKey');
if (savedKey) {
  autoLoadCesiumKey(savedKey);
}
if (openCesiumBtn) {
  openCesiumBtn.addEventListener('click', () => {
    window.open('https://cesium.com/ion/signup', '_blank');
    showStatus(
      'Page officielle Cesium ouverte – Créez un compte gratuit pour obtenir votre clé.',
      'info',
      4000
    );
  });
}
// Gestion du bouton principal
loadCesiumKeyBtn.addEventListener('click', async () => {
  // Si le terrain est déjà actif, proposer de le désactiver
  if (isTerrainActive) {
    if (confirm('Voulez-vous désactiver le terrain 3D et effacer la clé sauvegardée ?')) {
      disableTerrain();
    }
    return;
  }
 
  // Afficher/masquer le champ de saisie
  if (cesiumIonKeyInput.style.display === 'none' || cesiumIonKeyInput.style.display === '') {
    cesiumIonKeyInput.style.display = 'block';
    cesiumIonKeyInput.focus();
    cesiumIonKeyInput.placeholder = 'Collez votre clé Ion (commence par eyJ...)';
  } else {
    const apiKey = cesiumIonKeyInput.value.trim();
   
    if (!apiKey) {
      alert('⚠️ Veuillez entrer une clé API valide.');
      return;
    }
   
    // Valider le format (clés Ion commencent par eyJ)
    if (!apiKey.startsWith('eyJ')) {
      alert('⚠️ Format de clé invalide.\n\nLes clés Cesium Ion commencent par "eyJ".\n\nObtenez-en une gratuitement sur:\n→ https://cesium.com/ion/signup');
      return;
    }
   
    await loadTerrainWithKey(apiKey);
  }
});
// Fonction pour charger le terrain avec une clé
async function loadTerrainWithKey(apiKey) {
  // Afficher un spinner
  loadCesiumKeyBtn.textContent = '⏳ Validation de la clé...';
  loadCesiumKeyBtn.disabled = true;
 
  try {
    // Appliquer la clé Cesium Ion
    Cesium.Ion.defaultAccessToken = apiKey;
   
    // Tenter d'activer le terrain 3D
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
   
    // Sauvegarder la clé
    localStorage.setItem('cesiumIonKey', apiKey);
   
    // Mise à jour de l'interface
    isTerrainActive = true;
    loadCesiumKeyBtn.textContent = '✅ Terrain 3D activé';
    loadCesiumKeyBtn.style.background = '#4CAF50';
    cesiumIonKeyInput.style.display = 'none';
    cesiumIonKeyInput.value = '';
   
  // alert('✅ Terrain 3D activé avec succès !\n\n• Relief et altitudes réalistes\n• Clé sauvegardée pour les prochaines sessions\n\nCliquez à nouveau sur le bouton pour désactiver.');
  showStatus('✅ Terrain 3D activé avec succès', 'success', 4000);
   
  } catch (error) {
    console.error('Erreur lors du chargement du terrain 3D:', error);
   
    // Revenir au terrain plat par défaut
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
   
    alert('❌ Clé Cesium Ion invalide ou expirée.\n\n' +
          'Vérifiez que :\n' +
          '• La clé commence par "eyJ"\n' +
          '• Elle n\'est pas expirée\n' +
          '• Vous l\'avez copiée entièrement\n\n' +
          'Obtenez une clé gratuite :\n' +
          '→ https://cesium.com/ion/signup');
   
    loadCesiumKeyBtn.textContent = 'Charger une clé Cesium pour voir en 3D';
    loadCesiumKeyBtn.style.background = '#444';
    cesiumIonKeyInput.style.display = 'none';
   
  } finally {
    loadCesiumKeyBtn.disabled = false;
  }
}
// Fonction pour charger automatiquement une clé sauvegardée
async function autoLoadCesiumKey(apiKey) {
  try {
    Cesium.Ion.defaultAccessToken = apiKey;
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
   
    isTerrainActive = true;
    loadCesiumKeyBtn.textContent = '✅ Terrain 3D activé';
    loadCesiumKeyBtn.style.background = '#4CAF50';
   
    console.log('✅ Terrain 3D chargé automatiquement depuis la clé sauvegardée');
   showStatus(
  '✅ Clé Cesium détectée — Terrain 3D activé automatiquement.',
  'success',
  5000
);
  } catch (error) {
    console.warn('La clé sauvegardée n\'est plus valide:', error);
    localStorage.removeItem('cesiumIonKey');
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
}
// Fonction pour désactiver le terrain 3D
function disableTerrain() {
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  localStorage.removeItem('cesiumIonKey');
 
  isTerrainActive = false;
  loadCesiumKeyBtn.textContent = 'Charger une clé Cesium pour voir en 3D';
  loadCesiumKeyBtn.style.background = '#444';
 
showStatus('ℹ️ Terrain 3D désactivé – Clé effacée', 'info', 4000);
}
/**
 * Charge un modèle depuis le dossier models
 */
function loadModelFromModelsFolder(modelFileName) {
  if (!modelFileName) {
    // Si pas de modèle sélectionné
    if (currentModelUri) {
      URL.revokeObjectURL(currentModelUri);
      currentModelUri = null;
    }
    document.getElementById('modelName').style.display = 'none';
    showStatus('Modèle retiré - disque rouge par défaut', 'info', 2000);
    return;
  }
  // Construire l'URL relative vers le modèle
  const modelUrl = `models/${modelFileName}`;
 
  console.log(`🚀 Chargement du modèle: ${modelUrl}`);
 
  // Libérer l'ancienne URL si elle existe
  if (currentModelUri) {
    URL.revokeObjectURL(currentModelUri);
  }
 
  currentModelUri = modelUrl;
  document.getElementById('modelName').textContent = modelFileName;
  document.getElementById('modelName').style.display = 'block';
  showStatus(`Modèle ${modelFileName} sélectionné`, 'info', 2000);
  // Recharger la trace si elle existe
  if (currentTraceData) {
    displayTrace(currentTraceData);
  }
}
/**
 * Fonction pour colapser les menus
 */
function collapseMenus() {
    mobileMenu.classList.add('collapsed');
    traceMenu.classList.add('collapsed');
    resetMenu.classList.add('collapsed');
    environmentMenu.classList.add('collapsed');
}
/**
 * Fonction pour étendre les menus (les afficher)
 */
function expandMenus() {
    menus.forEach(menu => menu.classList.remove('collapsed'));
    resetTimer();
}
/**
 * Fonction pour réinitialiser et redémarrer le minuteur d'inactivité
 */
function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(collapseMenus, INACTIVITY_DELAY);
}
// ---------------------------------------------
// 1. Gérer l'activité (pour réinitialiser le timer)
// ---------------------------------------------
// Événements d'activité sur le document entier
document.addEventListener('mousemove', resetTimer);
document.addEventListener('keypress', resetTimer);
document.addEventListener('click', resetTimer);
// ---------------------------------------------
// 2. Gérer le survol (pour ré-afficher le menu via la poignée)
// ---------------------------------------------
// Fonction helper pour gérer le z-index hovered
function setMenuHovered(menu, isHovered) {
  if (isHovered) {
    menu.classList.add('hovered');
  } else {
    menu.classList.remove('hovered');
  }
}
menus.forEach(menu => {
  // Hover desktop
  menu.addEventListener('mouseenter', (e) => {
    expandMenus();
    setMenuHovered(menu, true); // Boost z-index
  });
 
  menu.addEventListener('mouseleave', (e) => {
    resetTimer();
    setMenuHovered(menu, false); // Reset z-index
  });
 
  // Touch mobile (prioritaire, évite double-trigger)
  menu.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Évite scroll indésirable
    expandMenus();
    setMenuHovered(menu, true);
  }, { passive: false });
 
  menu.addEventListener('touchend', (e) => {
    setMenuHovered(menu, false);
    resetTimer(); // Remet le timer après interaction
  }, { passive: false });
});
// Assurez-vous que les menus sont initialement visibles et lancez le timer
expandMenus();
let fl115Entity = null; // Entité pour le filigrane FL115
let fl115Label = null; // Label pour "FL115"
let viewer;
let currentPlane = null;
let currentTrace = null;
let traceSegments = []; // Tableau pour les segments de trace colorés (altitude OU vitesse)

let currentTraceData = null;
let selectedFile = null;
let currentModelUri = null;
let zRotation = 0;
let isModelLoading = false;
let altitudeOffset = 0; // Variable pour le décalage d'altitude


// ---------------------- UI UTILITAIRES ----------------------
//
	 function clearFL115() {
  if (fl115Entity) {
    if (fl115Entity.outlinePolyline) {
      viewer.entities.remove(fl115Entity.outlinePolyline);
    }
    if (fl115Entity.gridEntities && Array.isArray(fl115Entity.gridEntities)) {
      fl115Entity.gridEntities.forEach(e => viewer.entities.remove(e));
    }
    viewer.entities.remove(fl115Entity);
    fl115Entity = null;
  }
  if (fl115Label) {
    viewer.entities.remove(fl115Label);
    fl115Label = null;
  }
}

function chargerFichierIGC(fichier) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const trace = TraceConverter.parse(e.target.result, 'igc');
            console.log('✅ Trace IGC chargée:', trace);
            // Utilisez vos points avec timestamp valide !
        } catch (error) {
            console.error('❌ Erreur conversion:', error);
        }
    };
    reader.readAsText(fichier);
}
function showStatus(message, type = 'info', autoHideMs = (type === 'success' ? 5000 : 0)) {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  if (autoHideMs > 0) {
    setTimeout(() => { status.style.display = 'none'; }, autoHideMs);
  }
}
function showSpinner(show = true) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = show ? 'block' : 'none';
}
function lockUI(lock = true) {
  const controls = document.querySelectorAll('#controls input, #controls button');
  controls.forEach(el => el.disabled = lock);
}
function showGlobalSpinner(show = true, text = "Chargement en cours...") {
  const spinner = document.getElementById('globalSpinner');
  const spinnerText = document.getElementById('globalSpinnerText');
 
  if (spinner) {
    if (show) {
      if (spinnerText) spinnerText.textContent = text;
      spinner.style.display = 'flex';
    } else {
      spinner.style.display = 'none';
    }
  }
}
// ---------------------- CHARGEMENT TRACE (TOUS FORMATS) ----------------------
async function loadTrace(file) {
  console.log('🚨🚨🚨 loadTrace APPELÉE 🚨🚨🚨');
  console.log('Fichier:', file.name);
 
  showStatus('Chargement de la trace...', 'info');
  showGlobalSpinner(true, `Chargement de ${file.name}...`);
 
  // Timeout de sécurité
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: Chargement trop long (>30s)')), 30000);
  });
  try {
    const fileContent = await Promise.race([file.text(), timeoutPromise]);
    const fileExtension = file.name.split('.').pop().toLowerCase();
   
    console.log('=== DEBUT DEBUG ===');
    console.log('Nom fichier:', file.name);
    console.log('Extension:', fileExtension);
    console.log('Taille fichier:', fileContent.length, 'caractères');
    console.log('=== FIN DEBUG ===');
    // Mettre à jour le texte du spinner
    showGlobalSpinner(true, `Parsing ${fileExtension.toUpperCase()}...`);
    // TEST DIRECT - Appel simple à TraceConverter
    console.log('🎯 Appel à TraceConverter.parse...');
    const traceData = TraceConverter.parse(fileContent, fileExtension);
    console.log('✅ TraceConverter a réussi');
    console.log('Points:', traceData.points.length);
    console.log('Format:', traceData.format);
    showGlobalSpinner(true, `Affichage de ${traceData.points.length} points...`);
   
    return traceData;
   
  } catch (error) {
    console.error('💥 ERREUR dans loadTrace:', error);
    showStatus(`Erreur : ${error.message}`, 'error');
    throw error;
  } finally {
    // S'assurer que le spinner est caché même en cas d'erreur
    setTimeout(() => showGlobalSpinner(false), 100);
  }
}
// ---------------------- AFFICHAGE CESIUM ----------------------
// Gestion du menu Environnement
function initEnvironmentMenu() {
  // Atmosphère et ciel
  const skyAtmosphereCheckbox = document.getElementById('skyAtmosphereCheckbox');
  if (skyAtmosphereCheckbox) {
    skyAtmosphereCheckbox.addEventListener('change', function() {
      viewer.scene.skyAtmosphere.show = this.checked;
      viewer.scene.skyBox.show = this.checked;
    });
  }
  // Éclairage solaire
  const sunLightCheckbox = document.getElementById('sunLightCheckbox');
  if (sunLightCheckbox) {
    sunLightCheckbox.addEventListener('change', function() {
      viewer.scene.globe.enableLighting = this.checked;
    });
  }
  // Ombres
  const shadowsCheckbox = document.getElementById('shadowsCheckbox');
  if (shadowsCheckbox) {
    shadowsCheckbox.addEventListener('change', function() {
      viewer.shadows = this.checked;
    });
  }
  // Luminosité
  const brightnessSlider = document.getElementById('brightnessSlider');
  const brightnessValue = document.getElementById('brightnessValue');
  if (brightnessSlider && brightnessValue) {
    brightnessSlider.addEventListener('input', function() {
      const value = parseFloat(this.value);
      brightnessValue.textContent = value.toFixed(1);
      viewer.scene.brightness = value;
    });
  }
}
function displayTrace(traceData) {
  const startTime = Date.now();
  console.log('🔄 Début displayTrace à', new Date().toISOString());
 
  showSpinner(true);
 
  // Annuler les chargements précédents
  isModelLoading = false;
 
  // Nettoyer les entités existantes
  if (currentPlane) {
    viewer.entities.remove(currentPlane);
    currentPlane = null;
  }
  if (currentTrace) {
    viewer.entities.remove(currentTrace);
    currentTrace = null;
  }
  if (traceSegments.length > 0) {
    traceSegments.forEach(segment => viewer.entities.remove(segment));
    traceSegments = [];
  }
  const polylinePositions = [];
  const positions = [];
  // Extraire les points valides AVEC DÉCALAGE D'ALTITUDE
  traceData.points.forEach(point => {
    if (!isNaN(point.lat) && !isNaN(point.lon)) {
      // Appliquer le décalage d'altitude
      const elevation = (point.elevation || 0) + altitudeOffset;
      const cartesian = Cesium.Cartesian3.fromDegrees(point.lon, point.lat, elevation);
      polylinePositions.push(cartesian);
     
      // Gestion du timestamp pour l'animation
      if (point.timestamp && !isNaN(point.timestamp.getTime())) {
        const julianTime = Cesium.JulianDate.fromDate(point.timestamp);
        positions.push({ time: julianTime, position: cartesian });
      } else {
        // Si pas de timestamp, utiliser une heure par défaut pour permettre l'animation
        const defaultTime = Cesium.JulianDate.fromDate(new Date());
        positions.push({ time: defaultTime, position: cartesian });
      }
    }
  });
  if (polylinePositions.length < 2) {
    console.warn('❌ Pas assez de points valides:', polylinePositions.length);
    showStatus('Pas assez de points valides dans la trace', 'error');
    showSpinner(false);
    return;
  }
  console.log(`✅ ${polylinePositions.length} points valides, ${positions.length} positions temporelles`);
  console.log(`📏 Décalage altitude appliqué: ${altitudeOffset}m`);
  // ✅ Coloriage : Priorité à la vitesse si cochée, sinon altitude, sinon unie
  const showTrace = document.getElementById('traceCheckbox').checked;
  const colorBySpeed = document.getElementById('colorBySpeedCheckbox')?.checked || false;
  const colorByAlt = !colorBySpeed && (document.getElementById('colorByAltitudeCheckbox')?.checked || false);
  if (showTrace) {
    if (!colorBySpeed && !colorByAlt) {
      // Trace unie bleue
      currentTrace = viewer.entities.add({
        polyline: {
          positions: polylinePositions,
          width: 3,
          material: Cesium.Color.BLUE,
          clampToGround: false
        }
      });
      console.log('📈 Trace unie bleue affichée');
    } else if (colorBySpeed) {
      // ✅ NOUVEAU : Coloriage par vitesse
      let minSpeed = Infinity;
      let maxSpeed = -Infinity;
      let hasValidTimestamps = false;
      const speeds = []; // Pour calcul des vitesses par segment
      for (let i = 0; i < positions.length - 1; i++) {
        const dist = Cesium.Cartesian3.distance(positions[i].position, positions[i + 1].position);
        let timeDelta = Cesium.JulianDate.secondsDifference(positions[i + 1].time, positions[i].time);
        if (timeDelta <= 0) {
          // Fallback : delta temps uniforme si timestamps manquants/invalides
          timeDelta = (positions[positions.length - 1].time.secondsOfDay - positions[0].time.secondsOfDay) / (positions.length - 1);
          console.warn('⚠️ Timestamps invalides pour vitesse – fallback delta uniforme');
        } else {
          hasValidTimestamps = true;
        }
        const speedMs = dist / timeDelta; // m/s
        const speedKmh = (speedMs * 3.6).toFixed(2); // km/h
        speeds.push({ speed: speedMs, kmh: parseFloat(speedKmh) });
        if (speedMs < minSpeed) minSpeed = speedMs;
        if (speedMs > maxSpeed) maxSpeed = speedMs;
      }
      console.log(`🚀 Coloriage par vitesse: min=${minSpeed.toFixed(1)} m/s (${(minSpeed*3.6).toFixed(0)} km/h), max=${maxSpeed.toFixed(1)} m/s (${(maxSpeed*3.6).toFixed(0)} km/h), timestamps valides: ${hasValidTimestamps}`);
      if (maxSpeed === minSpeed || speeds.length === 0) {
        // Vitesses identiques ou pas de segments : fallback bleu
        currentTrace = viewer.entities.add({
          polyline: {
            positions: polylinePositions,
            width: 3,
            material: Cesium.Color.BLUE,
            clampToGround: false
          }
        });
        console.log('📈 Vitesses égales : trace bleue unie');
      } else {
        // Créer des segments colorés (vert lent -> rouge rapide)
        speeds.forEach((speedData, i) => {
          const normalized = (speedData.speed - minSpeed) / (maxSpeed - minSpeed);
          const color = Cesium.Color.lerp(Cesium.Color.GREEN, Cesium.Color.RED, normalized, new Cesium.Color());
          const segment = viewer.entities.add({
            polyline: {
              positions: [polylinePositions[i], polylinePositions[i + 1]],
              width: 3,
              material: color,
              clampToGround: false
            }
          });
          traceSegments.push(segment);
        });
        console.log(`🚀 ${traceSegments.length} segments colorés par vitesse créés`);
      }
    } else if (colorByAlt) {
      // Ancien : Coloriage par altitude (inchangé)
      let minAlt = Infinity;
      let maxAlt = -Infinity;
      traceData.points.forEach(point => {
        const alt = (point.elevation || 0) + altitudeOffset;
        if (alt < minAlt) minAlt = alt;
        if (alt > maxAlt) maxAlt = alt;
      });
      console.log(`🌈 Coloriage par altitude: min=${minAlt.toFixed(0)}m, max=${maxAlt.toFixed(0)}m`);
      if (maxAlt === minAlt) {
        currentTrace = viewer.entities.add({
          polyline: {
            positions: polylinePositions,
            width: 3,
            material: Cesium.Color.BLUE,
            clampToGround: false
          }
        });
        console.log('📈 Toutes altitudes égales : trace bleue unie');
      } else {
        for (let i = 0; i < polylinePositions.length - 1; i++) {
          const alt1 = (traceData.points[i].elevation || 0) + altitudeOffset;
          const alt2 = (traceData.points[i + 1].elevation || 0) + altitudeOffset;
          const avgAlt = (alt1 + alt2) / 2;
          const normalized = (avgAlt - minAlt) / (maxAlt - minAlt);
          const color = Cesium.Color.lerp(Cesium.Color.BLUE, Cesium.Color.RED, normalized, new Cesium.Color());
          const segment = viewer.entities.add({
            polyline: {
              positions: [polylinePositions[i], polylinePositions[i + 1]],
              width: 3,
              material: color,
              clampToGround: false
            }
          });
          traceSegments.push(segment);
        }
        console.log(`🌈 ${traceSegments.length} segments colorés par altitude créés`);
      }
    }
  }
  // Création de l'entité mobile (avion/modèle) - INCHANGÉ
  if (positions.length > 0) {
    const positionProperty = new Cesium.SampledPositionProperty();
    positions.forEach(({ time, position }) => positionProperty.addSample(time, position));
    let orientationProperty;
    if (document.getElementById('orientCheckbox').checked && positions.length > 1) {
      orientationProperty = new Cesium.VelocityOrientationProperty(positionProperty);
      console.log('🧭 Orientation dynamique activée');
    } else {
      const fixedOrientation = Cesium.Transforms.headingPitchRollQuaternion(
        positions[0].position,
        new Cesium.HeadingPitchRoll(0, 0, 0)
      );
      orientationProperty = new Cesium.ConstantProperty(fixedOrientation);
      console.log('🧭 Orientation fixe');
    }
    // Application de la rotation Z si nécessaire
    if (zRotation !== 0) {
      const original = orientationProperty;
      orientationProperty = new Cesium.CallbackProperty((time, result) => {
        const base = original.getValue(time, result);
        const rollQ = Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(zRotation), new Cesium.Quaternion());
        return Cesium.Quaternion.multiply(base, rollQ, result);
      }, false);
      console.log('🔄 Rotation Z appliquée:', zRotation + '°');
    }
    const scaleValue = parseFloat(document.getElementById('scaleSlider').value);
    const lightValue = parseFloat(document.getElementById('lightSlider').value);
    // Entité de base (disque rouge) - visible immédiatement
    currentPlane = viewer.entities.add({
      position: positionProperty,
      orientation: orientationProperty,
      ellipse: {
        semiMinorAxis: 2 * scaleValue,
        semiMajorAxis: 2 * scaleValue,
        material: Cesium.Color.RED.withAlpha(0.8),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 2
      }
    });
    console.log('🔴 Disque de base créé');
    // Chargement du modèle 3D si sélectionné
    if (currentModelUri && !isModelLoading) {
      isModelLoading = true;
      console.log('🚀 Début chargement modèle 3D');
      showStatus('Chargement du modèle 3D...', 'info');
      lockUI(true);
      showGlobalSpinner(true, "Chargement du modèle 3D...");
      const tempEntity = viewer.entities.add({
        position: positions[0].position,
        model: {
          uri: currentModelUri,
          scale: scaleValue,
          minimumPixelSize: 64,
          imageBasedLightingFactor: new Cesium.Cartesian2(lightValue, lightValue)
        },
        show: false
      });
      // Timeout de sécurité
      let modelLoadTimeout = setTimeout(() => {
        console.warn('⏰ Timeout chargement modèle après 15s');
        onError('Timeout chargement modèle');
      }, 15000);
      const onReady = () => {
        console.log('✅ Modèle 3D chargé avec succès');
        clearTimeout(modelLoadTimeout);
        viewer.entities.remove(tempEntity);
        if (currentPlane) viewer.entities.remove(currentPlane);
       
        currentPlane = viewer.entities.add({
          position: positionProperty,
          orientation: orientationProperty,
          model: {
            uri: currentModelUri,
            scale: scaleValue,
            minimumPixelSize: 64,
            imageBasedLightingFactor: new Cesium.Cartesian2(lightValue, lightValue)
          }
        });
       
        showStatus('Modèle 3D chargé', 'success');
        isModelLoading = false;
        lockUI(false);
        showGlobalSpinner(false);
       
        // Recentrage APRÈS chargement du modèle
        setTimeout(() => recenterCamera(traceData), 500);
      };
      const onError = (err) => {
        console.error('❌ Erreur chargement modèle:', err);
        clearTimeout(modelLoadTimeout);
        viewer.entities.remove(tempEntity);
        showStatus('Erreur chargement modèle - disque conservé', 'error');
        isModelLoading = false;
        lockUI(false);
        showGlobalSpinner(false);
       
        // Recentrage même en cas d'erreur
        setTimeout(() => recenterCamera(traceData), 500);
      };
      try {
        const rp = tempEntity.model.readyPromise;
        if (rp && typeof rp.then === 'function') {
          rp.then(onReady).catch(onError);
        } else {
          console.warn('⚠️ readyPromise non disponible, fallback timeout');
          setTimeout(onReady, 1000);
        }
      } catch (error) {
        console.error('💥 Exception lors du chargement modèle:', error);
        setTimeout(onReady, 1000);
      }
    } else {
      console.log('ℹ️ Pas de modèle 3D à charger');
      // Recentrage immédiat si pas de modèle
      setTimeout(() => recenterCamera(traceData), 100);
    }
    // Configuration de l'animation temporelle
    if (positions.length > 1) {
      viewer.clock.startTime = positions[0].time.clone();
      viewer.clock.stopTime = positions[positions.length - 1].time.clone();
      viewer.clock.currentTime = positions[0].time.clone();
      viewer.clock.shouldAnimate = true;
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      console.log('⏱️ Animation temporelle configurée');
    }
  }
  // Activation du bouton reset
  document.getElementById('resetBtn').disabled = false;
 
  // MESURE DE PERFORMANCE
  const endTime = Date.now();
  console.log(`✅ displayTrace terminé en ${endTime - startTime}ms`);
 
  showSpinner(false);
  console.log('✅ displayTrace terminé avec succès');
}
// ---------------------- RECENTRAGE CAMERA ----------------------
function recenterCamera(traceData) {
  console.log('🎯 Début recentrage caméra...');
 
  const boundingSpherePositions = [];
  traceData.points.forEach(point => {
    if (!isNaN(point.lat) && !isNaN(point.lon)) {
      const elevation = (point.elevation || 0) + altitudeOffset;
      boundingSpherePositions.push(Cesium.Cartesian3.fromDegrees(point.lon, point.lat, elevation));
    }
  });
  if (boundingSpherePositions.length > 0) {
    const boundingSphere = Cesium.BoundingSphere.fromPoints(boundingSpherePositions);
   
    console.log(`🎯 Recentrage sur ${boundingSpherePositions.length} points, rayon: ${boundingSphere.radius.toFixed(0)}m`);
   
    viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(0, -0.5, boundingSphere.radius * 2.5)
    });
   
    console.log('✅ Recentrage caméra terminé');
  } else {
    console.warn('❌ Aucun point valide pour le recentrage');
  }
}
// ---------------------- INITIALISATION ----------------------
function initApp() {
if (typeof Cesium === 'undefined') {
    console.error('❌ Cesium pas chargé – recharge ou check CDN');
    return; // Arrête la fonction
  }
 console.log('🔍 DÉBUT INITAPP - Vérification des éléments DOM');
  console.log('modelSelect:', document.getElementById('modelSelect'));
  console.log('modelSelect existe?', !!document.getElementById('modelSelect'));
  console.log('modelSelect options avant init:', document.getElementById('modelSelect')?.children.length);
// Variable globale pour le terrain (pour switcher plus tard)
let terrainProvider = new Cesium.EllipsoidTerrainProvider();
viewer = new Cesium.Viewer('cesiumContainer', {
  terrainProvider: terrainProvider, // Initialement plat
  imageryProvider: new Cesium.OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' }),
});
  // ✅ Message état initial du terrain
if (!localStorage.getItem('cesiumIonKey')) {
  showStatus(
    'ℹ️ Aucune clé Cesium détectée — Terrain 3D désactivé.',
    'info',
    5000
  );
}
  // Capture des erreurs Cesium
  viewer.scene.renderError.addEventListener(function(e) {
    console.error('🚨 Erreur rendu Cesium:', e);
  });
  viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(2, 46, 4000000) });
  const fileInput = document.getElementById('fileInput');
 // ⛔️ SUPPRIMEZ const modelInput = document.getElementById('modelInput');
  const rotateBtn = document.getElementById('rotateBtn');
  const scaleSlider = document.getElementById('scaleSlider');
  const lightSlider = document.getElementById('lightSlider');
  const resetBtn = document.getElementById('resetBtn');
  const offsetSlider = document.getElementById('offsetSlider');
  const offsetValue = document.getElementById('offsetValue');
  // INITIALISATION DU CURSEUR D'ALTITUDE
  if (offsetSlider && offsetValue) {
    // Initialiser l'affichage de la valeur
    offsetValue.textContent = altitudeOffset;
   
    offsetSlider.addEventListener('input', (e) => {
      altitudeOffset = parseInt(e.target.value);
      offsetValue.textContent = altitudeOffset;
     
      console.log(`🎚️ Décalage altitude modifié: ${altitudeOffset}m`);
     
      // Recalculer l'affichage si une trace est déjà chargée
      if (currentTraceData) {
        console.log(`🔄 Application du décalage altitude: ${altitudeOffset}m`);
        displayTrace(currentTraceData);
      }
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      selectedFile = e.target.files[0];
      if (!selectedFile) return;
      console.log('📁 Fichier sélectionné:', selectedFile.name, 'Taille:', selectedFile.size);
     
      showGlobalSpinner(true, `Début du chargement...`);
      lockUI(true);
     
      // Petit délai pour laisser le navigateur afficher le spinner
      await new Promise(resolve => setTimeout(resolve, 100));
     
      try {
        console.log('🔄 Début traitement fichier...');
        currentTraceData = await loadTrace(selectedFile);
        console.log('🎉 Traitement terminé, affichage...');
        displayTrace(currentTraceData);
		// Resynchroniser FL115 avec la checkbox après changement de trace
clearFL115();
const fl115Checkbox = document.getElementById('fl115Checkbox');
if (fl115Checkbox && fl115Checkbox.checked) {
  createFL115Grid();
}


      } catch (err) {
        console.error('❌ Erreur chargement:', err);
        showStatus('Échec du chargement: ' + err.message, 'error');
      } finally {
        lockUI(false);
        showGlobalSpinner(false);
        console.log('🏁 Processus terminé');
      }
    });
  }
  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      zRotation = (zRotation + 90) % 360;
      if (currentTraceData) displayTrace(currentTraceData);
      showStatus(`Rotation ${zRotation}°`, 'info', 1500);
    });
  }
  if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
      const scale = parseFloat(e.target.value);
      document.getElementById('scaleValue').textContent = scale;
      if (currentPlane) {
        if (currentPlane.ellipse) {
          currentPlane.ellipse.semiMinorAxis = new Cesium.ConstantProperty(2 * scale);
          currentPlane.ellipse.semiMajorAxis = new Cesium.ConstantProperty(2 * scale);
        } else if (currentPlane.model) {
          currentPlane.model.scale = new Cesium.ConstantProperty(scale);
        }
      }
    });
  }
  // GESTION DU CURSEUR D'ÉCLAIRAGE CORRIGÉE
  if (lightSlider) {
    lightSlider.addEventListener('input', (e) => {
      const lightValue = parseFloat(e.target.value);
      document.getElementById('lightValue').textContent = lightValue.toFixed(1);
     
      if (currentPlane && currentPlane.model) {
        currentPlane.model.imageBasedLightingFactor = new Cesium.ConstantProperty(
          new Cesium.Cartesian2(lightValue, lightValue)
        );
        console.log('💡 Éclairage modifié:', lightValue);
      }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      console.log('🔄 Début réinitialisation complète');
     
      // Libérer les URLs de modèles
      if (currentModelUri) {
        URL.revokeObjectURL(currentModelUri);
        currentModelUri = null;
      }
     
      // Nettoyer Cesium
      if (currentPlane) viewer.entities.remove(currentPlane);
      if (currentTrace) viewer.entities.remove(currentTrace);
      if (traceSegments.length > 0) {
        traceSegments.forEach(segment => viewer.entities.remove(segment));
        traceSegments = [];
      }
      if (fl115Entity) {
        viewer.entities.remove(fl115Entity);
        fl115Entity = null;
      }
	  
      if (fl115Label) {
        viewer.entities.remove(fl115Label);
        fl115Label = null;
      }
	 


      currentPlane = null;
      currentTrace = null;
      currentTraceData = null;
     
      // Réinitialiser l'état
      zRotation = 0;
      altitudeOffset = 0;
      viewer.trackedEntity = undefined;
      viewer.clock.shouldAnimate = false;
     
      // Réinitialiser UI
      fileInput.value = '';
      modelInput.value = '';
      scaleSlider.value = 5;
      document.getElementById('scaleValue').textContent = 5;
      lightSlider.value = 1;
      document.getElementById('lightValue').textContent = '1.0';
      document.getElementById('modelName').style.display = 'none';
      resetBtn.disabled = true;
     
      // Réinitialiser le curseur d'altitude
      if (offsetSlider) {
        offsetSlider.value = 0;
        offsetValue.textContent = 0;
      }
     
      // Recentrage du globe sur la position par défaut
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(2, 46, 4000000),
        orientation: {
          heading: 0,
          pitch: -1.5,
          roll: 0
        },
        duration: 2.0
      });
     
      console.log('✅ Réinitialisation terminée - Globe recentré');
      showStatus('Système réinitialisé - Globe recentré', 'success', 3000);
    });
  }
  document.getElementById('orientCheckbox').addEventListener('change', () => {
    if (currentTraceData) displayTrace(currentTraceData);
  });
 
  document.getElementById('traceCheckbox').addEventListener('change', () => {
    if (currentTraceData) displayTrace(currentTraceData);
  });

  // ✅ Écouteur pour la checkbox coloriage par altitude
  const colorByAltitudeCheckbox = document.getElementById('colorByAltitudeCheckbox');
  if (colorByAltitudeCheckbox) {
    colorByAltitudeCheckbox.addEventListener('change', () => {
      if (currentTraceData) {
        displayTrace(currentTraceData);
      }
    });
  }

  // ✅ NOUVEAU : Écouteur pour la checkbox coloriage par vitesse (prioritaire sur altitude)
  const colorBySpeedCheckbox = document.getElementById('colorBySpeedCheckbox');
  if (colorBySpeedCheckbox) {
    colorBySpeedCheckbox.addEventListener('change', () => {
      if (currentTraceData) {
        displayTrace(currentTraceData);
      }
    });
  }

// ✅ Écouteur pour la checkbox FL115 - synchro stricte
const fl115Checkbox = document.getElementById('fl115Checkbox');

if (fl115Checkbox) {
  fl115Checkbox.addEventListener('change', () => {
    clearFL115();
    if (fl115Checkbox.checked) {
      createFL115Grid();
    } else {
      console.log('✈️ FL115 désactivé');
      showStatus('FL115 désactivé', 'info', 2000);
    }
  });
}

function createFL115Grid() {
  // Calculer le centre (moyenne des points de la trace, ou défaut)
  let avgLon = 2.0; // Défaut : Paris
  let avgLat = 46.0;
  let dimMeters;

  if (currentTraceData && currentTraceData.points.length > 0) {
    let sumLon = 0, sumLat = 0;
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    currentTraceData.points.forEach(point => {
      if (!isNaN(point.lon) && !isNaN(point.lat)) {
        sumLon += point.lon;
        sumLat += point.lat;
        if (point.lat < minLat) minLat = point.lat;
        if (point.lat > maxLat) maxLat = point.lat;
        if (point.lon < minLon) minLon = point.lon;
        if (point.lon > maxLon) maxLon = point.lon;
      }
    });

    avgLon = sumLon / currentTraceData.points.length;
    avgLat = sumLat / currentTraceData.points.length;

    // Emprise en mètres pour dimensionner le carré
    const earthRadius = 6371000;
    const degToRad = Math.PI / 180;
    const dLat = (maxLat - minLat) * degToRad;
    const dLon = (maxLon - minLon) * degToRad;
    const latCenter = (minLat + maxLat) / 2;
    const northSouth = Math.abs(dLat * earthRadius);
    const eastWest = Math.abs(dLon * earthRadius * Math.cos(latCenter * degToRad));

    dimMeters = Math.max(northSouth, eastWest);
    dimMeters = Math.max(dimMeters, 10000); // minimum 10 km
  } else {
    dimMeters = 50000; // pas de trace : taille par défaut
  }

  const fl115Height = 3505;
  const centerPosition = Cesium.Cartesian3.fromDegrees(avgLon, avgLat, fl115Height);

  // Helpers conversion mètres -> degrés
  function metersToDegreesLat(m) {
    return (m / 6371000) * (180 / Math.PI);
  }
  function metersToDegreesLon(m, latDeg) {
    return (m / (6371000 * Math.cos(latDeg * Math.PI / 180))) * (180 / Math.PI);
  }

  const halfDim = dimMeters / 2;
  const dLatDeg = metersToDegreesLat(halfDim);
  const dLonDeg = metersToDegreesLon(halfDim, avgLat);

  // Plan (sans fill)
  fl115Entity = viewer.entities.add({
    position: centerPosition,
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
      centerPosition,
      new Cesium.HeadingPitchRoll(0, 0, 0)
    ),
    plane: {
      dimensions: new Cesium.Cartesian2(dimMeters, dimMeters),
      material: Cesium.Color.RED.withAlpha(0.15),
      fill: false
    }
  });

  // Contour rouge
  const corners = [
    Cesium.Cartesian3.fromDegrees(avgLon - dLonDeg, avgLat - dLatDeg, fl115Height), // SW
    Cesium.Cartesian3.fromDegrees(avgLon + dLonDeg, avgLat - dLatDeg, fl115Height), // SE
    Cesium.Cartesian3.fromDegrees(avgLon + dLonDeg, avgLat + dLatDeg, fl115Height), // NE
    Cesium.Cartesian3.fromDegrees(avgLon - dLonDeg, avgLat + dLatDeg, fl115Height), // NW
    Cesium.Cartesian3.fromDegrees(avgLon - dLonDeg, avgLat - dLatDeg, fl115Height)  // fermer
  ];

  const outlinePolyline = viewer.entities.add({
    polyline: {
      positions: corners,
      width: 3,
      material: Cesium.Color.RED,
      clampToGround: false
    }
  });
  fl115Entity.outlinePolyline = outlinePolyline;

  // Grille 1 km
  const gridStep = 1000;
  const maxOffset = halfDim;
  const gridEntities = [];

  for (let offset = -maxOffset; offset <= maxOffset; offset += gridStep) {
    // Lignes Nord-Sud
    const dLonLine = metersToDegreesLon(offset, avgLat);
    const nsLine = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          avgLon + dLonLine, avgLat - dLatDeg, fl115Height,
          avgLon + dLonLine, avgLat + dLatDeg, fl115Height
        ]),
        width: 1,
        material: Cesium.Color.RED.withAlpha(0.6)
      }
    });
    gridEntities.push(nsLine);

    // Lignes Est-Ouest
    const dLatLine = metersToDegreesLat(offset);
    const ewLine = viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights([
          avgLon - dLonDeg, avgLat + dLatLine, fl115Height,
          avgLon + dLonDeg, avgLat + dLatLine, fl115Height
        ]),
        width: 1,
        material: Cesium.Color.RED.withAlpha(0.6)
      }
    });
    gridEntities.push(ewLine);
  }

  fl115Entity.gridEntities = gridEntities;

  // Label
  const labelPosition = corners[2]; // NE
  fl115Label = viewer.entities.add({
    position: labelPosition,
    label: {
      text: 'Zone interdite',
      font: 'bold 20pt monospace',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      fillColor: Cesium.Color.RED,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e6, 0.5)
    }
  });

  console.log(`✈️ FL115 activé: carré rouge + grille 1km + label NE (${avgLon.toFixed(4)}, ${avgLat.toFixed(4)})`);
  showStatus('FL115 activé (carré rouge + grille 1 km)', 'success', 3000);

  // Recentrage incluant le carré
  if (currentTraceData) {
    const boundingSpherePositions = [];
    currentTraceData.points.forEach(point => {
      if (!isNaN(point.lat) && !isNaN(point.lon)) {
        const elevation = (point.elevation || 0) + altitudeOffset;
        boundingSpherePositions.push(
          Cesium.Cartesian3.fromDegrees(point.lon, point.lat, elevation)
        );
      }
    });
    boundingSpherePositions.push(centerPosition);
    const boundingSphere = Cesium.BoundingSphere.fromPoints(boundingSpherePositions);
    viewer.camera.flyToBoundingSphere(boundingSphere, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(0, -0.4, boundingSphere.radius * 3.0)
    });
  }
}
 
  // Gestionnaire pour le select de modèles
const modelSelect = document.getElementById('modelSelect');
// ✅ Gestionnaire pour le select de modèles (inchangé)
if (modelSelect) {
  modelSelect.addEventListener('change', (e) => {
    const selectedModel = e.target.value;
    loadModelFromModelsFolder(selectedModel);
  });
}
// ✅ Gestionnaire pour le bouton "Charger mon modèle" (intégré proprement)
const loadCustomModelBtn = document.getElementById('loadCustomModelBtn');
const glbFileInput = document.getElementById('glbFileInput');
const modelNameEl = document.getElementById('modelName'); // Renommé pour éviter conflit
if (loadCustomModelBtn && glbFileInput && modelSelect && modelNameEl) {
  loadCustomModelBtn.addEventListener('click', function() {
    glbFileInput.click(); // Ouvre le dialogue de fichier
  });
  glbFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Infos afférentes : nom, taille, type
    const fileInfo = {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB', // Taille en MB
      type: file.type || 'application/octet-stream',
      lastModified: new Date(file.lastModified).toLocaleString('fr-FR')
    };
    // Affichage des infos dans #modelName
    modelNameEl.innerHTML = `<strong>${fileInfo.name}</strong><br>Taille: ${fileInfo.size}<br>Modifié: ${fileInfo.lastModified}`;
    console.log('Infos fichier GLB:', fileInfo); // Pour debug
    // Créer une URL blob pour le fichier et l'assigner comme currentModelUri
    const blobUrl = URL.createObjectURL(file);
   
    // Libérer l'ancienne URL si elle existe
    if (currentModelUri) {
      URL.revokeObjectURL(currentModelUri);
    }
   
    currentModelUri = blobUrl;
   
    // Ajouter l'option au select pour re-sélection
    const option = document.createElement('option');
    option.value = file.name;
    option.textContent = `Custom: ${fileInfo.name}`;
    modelSelect.appendChild(option);
    modelSelect.value = file.name; // Sélectionne auto
    // Recharger la trace si elle existe (pour afficher le nouveau modèle)
    if (currentTraceData) {
      displayTrace(currentTraceData);
    } else {
      showStatus('Modèle custom chargé - Chargez une trace pour l\'afficher', 'info', 3000);
    }
    // Status de succès
    showStatus('Modèle GLB custom chargé avec succès !', 'success', 2000);
  });
}
// ✅ Initialisation des menus (en fin d'initApp)
initEnvironmentMenu();
initModelSelector();
}
// Écouteur global DOMContentLoaded (une seule fois, pour tout init)
window.addEventListener('DOMContentLoaded', initApp);
