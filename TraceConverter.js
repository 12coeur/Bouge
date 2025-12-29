// TraceConverter.js
/**
 * TraceConverter - Convertisseur universel de traces GPS
 * Supporte: GPX, KML, IGC, TCX
 * Version 2.1 - AJOUT DE LA FONCTION LOAD (CORRECTION ERREUR)
 */

(function(global) {
    'use strict';
    
    const TraceConverter = {
        
        /**
         * CHARGEUR PRINCIPAL : Lit le fichier et détermine le format (AJOUT)
         */
        load: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target.result;
                    const fileName = file.name;
                    // Déduction du format à partir de l'extension
                    const format = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
                    try {
                        // Utilise la méthode parse existante
                        const data = this.parse(fileContent, format);
                        resolve(data);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = (e) => {
                    reject(new Error("Erreur de lecture du fichier."));
                };
                reader.readAsText(file);
            });
        },
  
        /**
         * Parse une trace brute (string) pour extraire les points GPS
         */
        parse: function(fileContent, format) {
            console.log('🎯 TRACECONVERTER.parse APPELÉ');
            console.log('📝 Format reçu:', format);
            console.log('📏 Longueur contenu:', fileContent.length);
            
            const cleanFormat = format.toLowerCase().trim();
            console.log('🧹 Format nettoyé:', cleanFormat);
            
            // Debug du switch
            console.log('🔀 Entrée dans switch avec:', cleanFormat);
            
            switch(cleanFormat) {
                case 'gpx':
                    console.log('➡️ Branch GPX');
                    return this.parseGPX(fileContent);
                case 'kml':
                    console.log('➡️ Branch KML');
                    return this.parseKML(fileContent);
                case 'igc':
                    console.log('➡️ Branch IGC');
                    return this.parseIGC(fileContent);
                case 'tcx':
                    console.log('➡️ Branch TCX');
                    return this.parseTCX(fileContent);
                default:
                    console.log('❌ Format non supporté:', cleanFormat);
                    throw new Error(`Format non supporté: ${format}`);
            }
        },

        /**
         * Parse un fichier GPX
         */
        parseGPX: function(xmlString) {
            console.log('🔍 === DEBUT parseGPX ===');
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            console.log('📄 Document XML créé');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                console.error('❌ Erreur XML GPX:', xmlDoc.getElementsByTagName('parsererror')[0]?.textContent);
                throw new Error('XML invalide pour GPX');
            }

            const points = [];
            
            // DEBUG CRITIQUE : Chercher TOUTES les balises trkpt
            const trkpts = xmlDoc.getElementsByTagName('trkpt');
            console.log(`🔍 ${trkpts.length} balises <trkpt> trouvées`);
            
            // Afficher les 3 premiers trkpt pour debug
            for (let i = 0; i < Math.min(3, trkpts.length); i++) {
                const pt = trkpts[i];
                console.log(`📌 trkpt ${i}:`, pt.outerHTML);
                const lat = pt.getAttribute('lat');
                const lon = pt.getAttribute('lon');
                console.log(`   lat="${lat}", lon="${lon}"`);
            }

            Array.from(trkpts).forEach(pt => {
                const lat = parseFloat(pt.getAttribute('lat'));
                const lon = parseFloat(pt.getAttribute('lon'));
                
                const eleNode = pt.getElementsByTagName('ele')[0];
                const timeNode = pt.getElementsByTagName('time')[0];
                
                if (!isNaN(lat) && !isNaN(lon)) {
                    points.push({
                        lat,
                        lon,
                        elevation: eleNode ? parseFloat(eleNode.textContent) : 0,
                        timestamp: timeNode ? new Date(timeNode.textContent) : null
                    });
                }
            });

            console.log(`✅ parseGPX: ${points.length} points extraits`);
            console.log('🔍 === FIN parseGPX ===');
            
            const nameNode = xmlDoc.getElementsByTagName('name')[0];
            const descNode = xmlDoc.getElementsByTagName('desc')[0];

            return {
                format: 'GPX',
                points,
                name: nameNode?.textContent || 'Trace GPS',
                description: descNode?.textContent || ''
            };
        },

        /**
         * Parse un fichier KML - CORRECTION DU TIMESTAMP POUR ÉVITER LE BLOCAGE
         */
        parseKML: function(xmlString) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                console.error('Erreur de parsing XML (KML):', xmlDoc.getElementsByTagName('parsererror')[0]?.textContent);
                throw new Error('XML invalide pour KML');
            }

            const points = [];
            const placemarks = xmlDoc.getElementsByTagName('Placemark');
            
            console.log(`[CONVERTER] KML: ${placemarks.length} Placemarks trouvés.`);

            Array.from(placemarks).forEach(pm => {
                // Tenter d'obtenir l'horodatage au niveau du Placemark
                const timestampNode = pm.getElementsByTagName('TimeStamp')[0] || pm.getElementsByTagName('when')[0];
                const defaultTimestamp = timestampNode ? new Date(timestampNode.textContent) : new Date();
                
                const lineString = pm.getElementsByTagName('LineString')[0];
                if (lineString) {
                    const coordsText = lineString.getElementsByTagName('coordinates')[0]?.textContent || '';
                    
                    const coords = coordsText.trim().split(/\s+/).filter(c => c.trim());
                    
                    let initialTimeMs = defaultTimestamp.getTime();
                    const timeIncrementMs = 1000;

                    coords.forEach(coord => {
                        const parts = coord.trim().split(',').map(parseFloat);
                        // KML = lon, lat, alt
                        const lon = parts[0];
                        const lat = parts[1];
                        const elevation = parts[2];

                        if (!isNaN(lat) && !isNaN(lon)) {
                            points.push({
                                lat,
                                lon,
                                elevation: elevation || 0,
                                timestamp: new Date(initialTimeMs)
                            });
                            initialTimeMs += timeIncrementMs;
                        }
                    });
                }
            });

            const nameNode = xmlDoc.getElementsByTagName('name')[0];
            const descNode = xmlDoc.getElementsByTagName('description')[0];

            return {
                format: 'KML',
                points,
                name: nameNode?.textContent || 'Trace GPS',
                description: descNode?.textContent || ''
            };
        },

        /**
         * Parse un fichier IGC (format aviation) - VERSION CORRIGÉE AVEC FALLBACK DATE
         * CORRECTION : Garantit un timestamp valide même sans HFDTE
         */
        parseIGC: function(fileContent) {
            const lines = fileContent.split('\n');
            const points = [];
            let name = 'Trace IGC';
            let dayEpochMs = null; 
            let displayDate = 'Inconnue'; 
            
            // FALLBACK CRITIQUE : utiliser la date actuelle si HFDTE manquant
            const fallbackDate = new Date();
            const fallbackEpochMs = Date.UTC(
                fallbackDate.getUTCFullYear(), 
                fallbackDate.getUTCMonth(), 
                fallbackDate.getUTCDate()
            );
            console.log(`[CONVERTER IGC] Date de fallback: ${fallbackDate.toISOString()}`);

            lines.forEach((line, index) => {
                const code = line.substring(0, 1);
                
                // Ligne de date (HFDTE) - Traitée en premier
                if (code === 'H' && line.includes('HFDTE')) {
                    const dateStr = line.substring(6, 12);
                    const day = parseInt(dateStr.substring(0, 2));
                    const month = parseInt(dateStr.substring(2, 4)) - 1;
                    const year = parseInt(dateStr.substring(4, 6)) + 2000;
                    
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        dayEpochMs = Date.UTC(year, month, day);
                        displayDate = new Date(dayEpochMs).toLocaleDateString();
                        console.log(`[CONVERTER IGC] Date de vol (HFDTE): ${displayDate}. Epoch du jour (ms): ${dayEpochMs}`);
                    } else {
                        dayEpochMs = null; 
                    }
                }
                
                // Ligne de fixation (point GPS)
                if (code === 'B') {
                    const hour = parseInt(line.substring(1, 3));
                    const minute = parseInt(line.substring(3, 5));
                    const second = parseInt(line.substring(5, 7));
                    
                    // Parsing des coordonnées
                    const latDeg = parseInt(line.substring(7, 9));
                    const latMin = parseFloat(line.substring(9, 14));
                    const latHem = line.substring(14, 15);
                    const lonDeg = parseInt(line.substring(15, 18));
                    const lonMin = parseFloat(line.substring(18, 23));
                    const lonHem = line.substring(23, 24);
                    const pressureAlt = parseInt(line.substring(25, 30));
                    const gpsAlt = parseInt(line.substring(30, 35));

                    const latMinutes = latMin / 1000;
                    const lonMinutes = lonMin / 1000;
                    const lat = latDeg + latMinutes / 60;
                    const lon = lonDeg + lonMinutes / 60;
            
                    // CALCUL TIMESTAMP AVEC FALLBACK
                    let timestamp = null;
                    
                    // UTILISATION DU FALLBACK SI HFDTE MANQUANT
                    const baseEpochMs = dayEpochMs !== null ? dayEpochMs : fallbackEpochMs;
                    
                    if (!isNaN(hour) && !isNaN(minute) && !isNaN(second)) {
                        const timeMsSinceMidnight = (hour * 3600000) + (minute * 60000) + (second * 1000);
                        const totalEpochMs = baseEpochMs + timeMsSinceMidnight;
                        const tempTimestamp = new Date(totalEpochMs);
                        
                        if (!isNaN(tempTimestamp.getTime())) {
                            timestamp = tempTimestamp;
                        }
                    }
                    
                    // Final push avec timestamp garanti
                    if (!isNaN(lat) && !isNaN(lon)) { 
                        const newPoint = {
                            lat: latHem === 'S' ? -lat : lat,
                            lon: lonHem === 'W' ? -lon : lon,
                            elevation: gpsAlt || pressureAlt,
                            timestamp: timestamp // Maintenant toujours valide grâce au fallback
                        };
                        points.push(newPoint);

                        // Log des premiers points pour vérification
                        if (points.length <= 3) {
                            console.log(`[CONVERTER IGC] Point #${points.length}: ${hour}:${minute}:${second} -> ${timestamp ? timestamp.toISOString() : 'INVALIDE'}`);
                        }
                    }
                }
                
                // Nom du vol (HFPLT)
                if (code === 'H' && line.includes('HFPLT')) {
                    name = line.substring(8).trim();
                }
            });
            
            console.log(`[CONVERTER IGC] FINAL: ${points.length} points, ${points.filter(p => p.timestamp).length} avec timestamp`);
            console.log(`[CONVERTER IGC] Date utilisée: ${displayDate}${dayEpochMs === null ? ' (FALLBACK)' : ''}`);

            return {
                format: 'IGC',
                points,
                name: name || 'Trace IGC',
                description: `Date: ${displayDate}${dayEpochMs === null ? ' (date estimée)' : ''}`
            };
        },

        /**
         * Parse un fichier TCX (Garmin Training Center)
         */
        parseTCX: function(xmlString) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                console.error('Erreur de parsing XML (TCX):', xmlDoc.getElementsByTagName('parsererror')[0]?.textContent);
                throw new Error('XML invalide pour TCX');
            }

            const points = [];
            const trackpoints = xmlDoc.getElementsByTagName('Trackpoint');
            
            console.log(`[CONVERTER] TCX: ${trackpoints.length} Trackpoints trouvés.`);

            Array.from(trackpoints).forEach(tp => {
                const posNode = tp.getElementsByTagName('Position')[0];
                const altNode = tp.getElementsByTagName('AltitudeMeters')[0];
                const timeNode = tp.getElementsByTagName('Time')[0];
                
                if (posNode) {
                    const lat = parseFloat(posNode.getElementsByTagName('LatitudeDegrees')[0]?.textContent);
                    const lon = parseFloat(posNode.getElementsByTagName('LongitudeDegrees')[0]?.textContent);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({
                            lat,
                            lon,
                            elevation: altNode ? parseFloat(altNode.textContent) : 0,
                            timestamp: timeNode ? new Date(timeNode.textContent) : null
                        });
                    }
                }
            });
            
            const idNode = xmlDoc.getElementsByTagName('Id')[0];

            return {
                format: 'TCX',
                points,
                name: idNode?.textContent || 'Trace TCX',
                description: ''
            };
        },
            
        // --- Fonctions de conversion export ---
        
        toGPX: function(traceData) { 
            let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TraceConverter">
  <trk>
    <name>${this.escapeXml(traceData.name)}</name>
    <trkseg>`;
            
            traceData.points.forEach(point => {
                gpx += `
      <trkpt lat="${point.lat}" lon="${point.lon}">
        <ele>${point.elevation || 0}</ele>
        ${point.timestamp ? `<time>${point.timestamp.toISOString()}</time>` : ''}
      </trkpt>`;
            });
            
            gpx += `
    </trkseg>
  </trk>
</gpx>`;
            return gpx;
        },
        
        toKML: function(traceData) { 
            let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Placemark>
    <name>${this.escapeXml(traceData.name)}</name>
    <LineString>
      <coordinates>`;
            
            traceData.points.forEach(point => {
                kml += `${point.lon},${point.lat},${point.elevation || 0} `;
            });
            
            kml += `</coordinates>
    </LineString>
  </Placemark>
</kml>`;
            return kml;
        },
        
        toIGC: function(traceData) { 
            const now = new Date();
            let igc = `A TraceConverter
HFDTE${now.getUTCDate().toString().padStart(2, '0')}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCFullYear().toString().substring(2)}
HFPLT${this.escapeIGC(traceData.name)}
`;
            
            traceData.points.forEach(point => {
                const date = point.timestamp || now;
                const hours = date.getUTCHours().toString().padStart(2, '0');
                const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                const seconds = date.getUTCSeconds().toString().padStart(2, '0');
                
                // Conversion des coordonnées décimales en format IGC
                const latDeg = Math.abs(Math.floor(point.lat));
                const latMin = (Math.abs(point.lat) - latDeg) * 60;
                const latHem = point.lat >= 0 ? 'N' : 'S';
                
                const lonDeg = Math.abs(Math.floor(point.lon));
                const lonMin = (Math.abs(point.lon) - lonDeg) * 60;
                const lonHem = point.lon >= 0 ? 'E' : 'W';
                
                igc += `B${hours}${minutes}${seconds}${latDeg.toString().padStart(2, '0')}${Math.floor(latMin * 1000).toString().padStart(5, '0')}${latHem}${lonDeg.toString().padStart(3, '0')}${Math.floor(lonMin * 1000).toString().padStart(5, '0')}${lonHem}A00000${Math.floor(point.elevation || 0).toString().padStart(5, '0')}\n`;
            });
            
            return igc;
        },
        
        toTCX: function(traceData) { 
            let tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity>
      <Id>${new Date().toISOString()}</Id>
      <Lap>
        <Track>`;
            
            traceData.points.forEach(point => {
                tcx += `
          <Trackpoint>
            <Time>${point.timestamp ? point.timestamp.toISOString() : new Date().toISOString()}</Time>
            <Position>
              <LatitudeDegrees>${point.lat}</LatitudeDegrees>
              <LongitudeDegrees>${point.lon}</LongitudeDegrees>
            </Position>
            <AltitudeMeters>${point.elevation || 0}</AltitudeMeters>
          </Trackpoint>`;
            });
            
            tcx += `
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
            return tcx;
        },

        /**
         * Utilitaires
         */
        escapeXml: function(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')	
                .replace(/'/g, '&apos;');
        },

        escapeIGC: function(str) {
            if (!str) return '';
            return String(str).replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 20);
        }
    };

    // Exportation universelle
    if (typeof module !== 'undefined' && module.exports) {
        // Environnement Node.js
        module.exports = TraceConverter;
    } else {
        // Environnement navigateur
        global.TraceConverter = TraceConverter;
    }
    
    console.log("✅ TraceConverter v2.1 chargé - Avec fonction load()");

})(this);
window.TraceConverter = TraceConverter;  // Rend TraceConverter accessible globalement

