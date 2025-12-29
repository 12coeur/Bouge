// ===========================================
// DASHBOARD MOBILE - GESTION
// ===========================================

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  // Récupérer les éléments
  const dashboard = document.getElementById('dashboard');
  const showDashboardBtn = document.getElementById('showDashboardBtn');
  const closeDashboardBtn = document.getElementById('closeDashboard');
  const minimizeDashboardBtn = document.getElementById('minimizeDashboard');
  const dashboardTitleBar = document.getElementById('dashboardTitleBar');

  // Si le dashboard n'existe pas, ne rien faire
  if (!dashboard) {
    console.warn('Dashboard non trouvé dans le DOM');
    return;
  }

  // Variables pour le drag & drop
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // État du dashboard
  let dashboardMinimized = false;
  let dashboardPaused = false;
  let dashboardData = {
    speed: 0,
    altitude: 0,
    distance: 0,
    remaining: 0,
    elapsed: 0,
    remainingTime: 0
   };

  // ===========================================
  // FONCTIONS DE BASE
  // ===========================================

  // Afficher le dashboard
  function showDashboard() {
    dashboard.style.display = 'block';
    // Positionner au centre par défaut
    const centerX = Math.max(10, (window.innerWidth - dashboard.offsetWidth) / 2);
    const centerY = Math.max(10, 150); // 150px du haut
    dashboard.style.left = `${centerX}px`;
    dashboard.style.top = `${centerY}px`;
    
    // Mettre à jour les données immédiatement
    updateDashboardData();
    
    // Si une trace est chargée, utiliser ses données
    if (window.currentTraceData) {
      updateDashboardFromTrace(window.currentTraceData);
      console.log("Données de trace reçues :", window.currentTraceData); // Corrigé : window.currentTraceData au lieu de traceData
    }
  }

  // Cacher le dashboard
  function hideDashboard() {
    dashboard.style.display = 'none';
  }

  // Basculer la minimisation
  function toggleMinimize() {
    dashboardMinimized = !dashboardMinimized;
    if (dashboardMinimized) {
      dashboard.style.height = '30px';
      dashboard.querySelector('.dashboard-content').style.display = 'none';
    } else {
      dashboard.style.height = '';
      dashboard.querySelector('.dashboard-content').style.display = 'block';
    }
  }

 

  // Mettre à jour les données du dashboard
  function updateDashboardData() {
    console.log("Mise à jour du tableau de bord avec :", dashboardData); // pour confirmation
    // Mettre à jour les valeurs dans le tableau de bord
    document.getElementById('speedValue').textContent = dashboardData.speed?.toFixed(1) || '0';
    document.getElementById('altitudeValue').textContent = dashboardData.altitude?.toFixed(0) || '0';
    document.getElementById('distanceValue').textContent = dashboardData.distance?.toFixed(2) || '0';
    document.getElementById('elapsedTimeValue').textContent = formatTime(dashboardData.elapsed || 0);
  }

  // Mettre à jour les données à partir d'une trace
  function updateDashboardFromTrace(traceData) {
	    console.log("updateDashboardFromTrace reçu :", traceData);
    if (!traceData || !traceData.points || traceData.points.length === 0) {
      console.warn('Aucune donnée de trace valide fournie.');
      return;
    }
    
    const points = traceData.points;
    const currentIndex = traceData.currentIndex || 0;
    const currentPoint = points[currentIndex];
    
    if (currentPoint) {
      // Vitesse (convertir m/s en km/h si nécessaire)
      dashboardData.speed = currentPoint.speed ? currentPoint.speed * 3.6 : 0;
      
      // Altitude
      dashboardData.altitude = currentPoint.altitude || 0;
      
      // Distance parcourue (calcul approximatif)
      let totalDistance = 0;
      for (let i = 1; i <= currentIndex && i < points.length; i++) {
        const prev = points[i-1];
        const curr = points[i];
        totalDistance += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      }
      dashboardData.distance = totalDistance / 1000; // en km
      
      // Distance totale estimée
      let totalPathDistance = 0;
      for (let i = 1; i < points.length; i++) {
        totalPathDistance += calculateDistance(points[i-1].latitude, points[i-1].longitude, 
                                               points[i].latitude, points[i].longitude);
      }
      dashboardData.remaining = (totalPathDistance / 1000) - dashboardData.distance;
      
      // Temps
      const startTime = points[0].timestamp || new Date();
      const currentTime = currentPoint.timestamp || new Date();
      dashboardData.elapsed = (currentTime - startTime) / 1000; // secondes
      
      // Temps restant estimé (basé sur la vitesse moyenne)
      const avgSpeed = dashboardData.speed > 0 ? dashboardData.speed : 1;
      dashboardData.remainingTime = (dashboardData.remaining * 1000) / avgSpeed; // secondes
    }
    
    updateDashboardData();
  }

  // Formater le temps en HH:MM:SS
  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Fonction pour calculer la distance entre deux points GPS (en mètres)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180; // φ, λ en radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // en mètres
  }

  // ===========================================
  // ÉVÉNEMENTS
  // ===========================================

  // Bouton pour afficher le dashboard
  if (showDashboardBtn) {
    showDashboardBtn.addEventListener('click', showDashboard);
  }

  // Boutons du dashboard
  if (closeDashboardBtn) {
    closeDashboardBtn.addEventListener('click', hideDashboard);
  }

  if (minimizeDashboardBtn) {
    minimizeDashboardBtn.addEventListener('click', toggleMinimize);
  }

  // Mettre à jour les données régulièrement si actif
  setInterval(function() {
    if (dashboard.style.display !== 'none') {
      updateDashboardData();
    }
  }, 1000); // Mise à jour chaque seconde

  // Exposer la fonction pour la mise à jour depuis script.js
  window.updateDashboardFromTrace = updateDashboardFromTrace;
  window.showDashboard = showDashboard;
  
  // Pour debug: afficher un message
  console.log('Dashboard mobile initialisé');
});

	
