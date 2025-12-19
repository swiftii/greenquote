/**
 * GreenQuote Map Satellite Default Utility
 * 
 * Ensures maps always default to satellite view and provides
 * diagnostics for debugging map type changes.
 * 
 * Used by: Widget, Pro App, and React Quote page.
 */

// Enable/disable verbose logging (set to false for production)
const SATELLITE_DEBUG = true;

/**
 * Log satellite enforcement messages
 */
function logSatellite(source, message, ...args) {
    if (SATELLITE_DEBUG) {
        console.log(`[Satellite:${source}]`, message, ...args);
    }
}

/**
 * Apply satellite view as default - IDEMPOTENT
 * Safe to call multiple times.
 * 
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {string} source - Identifier for where this was called (for debugging)
 * @returns {boolean} - True if satellite was applied, false if already satellite
 */
function applySatelliteDefault(map, source = 'unknown') {
    if (!map) {
        logSatellite(source, 'No map instance provided');
        return false;
    }

    const currentType = map.getMapTypeId();
    
    if (currentType !== 'satellite') {
        logSatellite(source, `Enforcing satellite (was: ${currentType})`);
        map.setMapTypeId('satellite');
        return true;
    } else {
        logSatellite(source, 'Already satellite, no change needed');
        return false;
    }
}

/**
 * Add map type change listener for diagnostics
 * Logs whenever the map type changes and captures stack trace.
 * 
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {string} source - Identifier for the map instance
 */
function addMapTypeChangeListener(map, source = 'unknown') {
    if (!map || typeof google === 'undefined') return;

    google.maps.event.addListener(map, 'maptypeid_changed', function() {
        const newType = map.getMapTypeId();
        
        if (SATELLITE_DEBUG) {
            console.log(`[Satellite:${source}] Map type changed to: ${newType}`);
            
            // Log stack trace if changed away from satellite (helps debug)
            if (newType !== 'satellite') {
                console.warn(`[Satellite:${source}] ⚠️ Map type changed AWAY from satellite to: ${newType}`);
                console.trace('Stack trace for map type change');
            }
        }
    });

    logSatellite(source, 'Added map type change listener');
}

/**
 * Get the default map options with satellite enforced
 * Use this when creating a new map instance.
 * 
 * @param {Object} customOptions - Custom options to merge
 * @returns {Object} - Map options with satellite as default
 */
function getSatelliteMapOptions(customOptions = {}) {
    return {
        mapTypeId: 'satellite', // ALWAYS default to satellite
        ...customOptions,
        // Ensure mapTypeId can't be overwritten by customOptions
        // unless explicitly using mapTypeId in customOptions
    };
}

/**
 * Initialize map with satellite default and diagnostics
 * Call this immediately after creating a map instance.
 * 
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {string} source - Identifier for debugging
 */
function initMapWithSatellite(map, source = 'unknown') {
    if (!map) return;

    logSatellite(source, 'Initializing map with satellite enforcement');

    // Enforce satellite immediately
    applySatelliteDefault(map, source + ':init');

    // Add change listener for diagnostics
    addMapTypeChangeListener(map, source);

    // Double-check after a short delay (some libraries reset after init)
    setTimeout(() => {
        applySatelliteDefault(map, source + ':post-init-check');
    }, 100);
}

/**
 * Enforce satellite after viewport changes (fitBounds, setCenter, setZoom)
 * Some code paths may reset the map type after these operations.
 * 
 * @param {google.maps.Map} map - The Google Maps instance
 * @param {string} source - Identifier for debugging
 */
function enforceSatelliteAfterViewportChange(map, source = 'unknown') {
    if (!map) return;

    // Immediate check
    applySatelliteDefault(map, source + ':viewport');

    // Check again after bounds_changed fires (async)
    google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
        applySatelliteDefault(map, source + ':bounds_changed');
    });

    // Safety net after a delay
    setTimeout(() => {
        applySatelliteDefault(map, source + ':viewport-delayed');
    }, 500);
}

// Export for use in different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applySatelliteDefault,
        addMapTypeChangeListener,
        getSatelliteMapOptions,
        initMapWithSatellite,
        enforceSatelliteAfterViewportChange,
        SATELLITE_DEBUG
    };
}

// Also expose globally for non-module usage (widget/pro vanilla JS)
if (typeof window !== 'undefined') {
    window.SatelliteUtils = {
        applySatelliteDefault,
        addMapTypeChangeListener,
        getSatelliteMapOptions,
        initMapWithSatellite,
        enforceSatelliteAfterViewportChange,
        SATELLITE_DEBUG
    };
}
