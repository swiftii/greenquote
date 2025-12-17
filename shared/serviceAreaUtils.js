/**
 * GreenQuote Service Area Utilities
 * 
 * Provides auto-estimation and multi-polygon support for lawn service area calculation.
 * Used by both the public widget and Pro App.
 */

// Default styling for polygons
const DEFAULT_POLYGON_STYLES = {
    fillColor: '#16a34a',
    fillOpacity: 0.35,
    strokeWeight: 3,
    strokeColor: '#166534',
    editable: true,
    draggable: false
};

/**
 * ServiceAreaManager - Manages multi-polygon service areas
 */
class ServiceAreaManager {
    constructor(map, options = {}) {
        this.map = map;
        this.polygons = [];
        this.onAreaChange = options.onAreaChange || (() => {});
        this.onPolygonsCreated = options.onPolygonsCreated || (() => {});
        this.styles = { ...DEFAULT_POLYGON_STYLES, ...options.styles };
        this.debugMode = options.debugMode || false;
    }

    /**
     * Log debug messages
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[ServiceArea]', ...args);
        }
    }

    /**
     * Clear all existing polygons
     */
    clearAll() {
        this.polygons.forEach(polygon => {
            polygon.setMap(null);
        });
        this.polygons = [];
        this.log('Cleared all polygons');
    }

    /**
     * Add a polygon and set up event listeners
     */
    addPolygon(polygon, silent = false) {
        polygon.setMap(this.map);
        this.polygons.push(polygon);

        // Add edit listeners
        const path = polygon.getPath();
        google.maps.event.addListener(path, 'set_at', () => this.recalculateTotal());
        google.maps.event.addListener(path, 'insert_at', () => this.recalculateTotal());
        google.maps.event.addListener(path, 'remove_at', () => this.recalculateTotal());

        if (!silent) {
            this.recalculateTotal();
        }

        this.log('Added polygon, total:', this.polygons.length);
        return polygon;
    }

    /**
     * Remove a specific polygon
     */
    removePolygon(polygon) {
        const index = this.polygons.indexOf(polygon);
        if (index > -1) {
            polygon.setMap(null);
            this.polygons.splice(index, 1);
            this.recalculateTotal();
            this.log('Removed polygon, remaining:', this.polygons.length);
        }
    }

    /**
     * Calculate total area from all polygons
     */
    recalculateTotal() {
        let totalSqMeters = 0;
        const breakdown = [];

        this.polygons.forEach((polygon, index) => {
            const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
            const sqFt = Math.round(area * 10.7639);
            totalSqMeters += area;
            breakdown.push({
                index,
                sqMeters: area,
                sqFt
            });
        });

        const totalSqFt = Math.round(totalSqMeters * 10.7639);
        
        this.log('Total area:', totalSqFt, 'sq ft from', this.polygons.length, 'polygons');
        this.onAreaChange(totalSqFt, breakdown);

        return { totalSqFt, breakdown };
    }

    /**
     * Get total square footage
     */
    getTotalSqFt() {
        return this.recalculateTotal().totalSqFt;
    }

    /**
     * Get number of polygons
     */
    getPolygonCount() {
        return this.polygons.length;
    }

    /**
     * Get all polygon coordinates for storage
     */
    getCoordinatesSnapshot() {
        return this.polygons.map(polygon => {
            const path = polygon.getPath();
            const coords = [];
            for (let i = 0; i < path.getLength(); i++) {
                const point = path.getAt(i);
                coords.push({ lat: point.lat(), lng: point.lng() });
            }
            return coords;
        });
    }

    /**
     * Create a single rectangular polygon centered on a point
     */
    createRectangle(center, sqFtTarget, options = {}) {
        const {
            aspectRatio = 1.5, // width/height ratio
            rotation = 0 // degrees
        } = options;

        // Calculate dimensions
        const sqMeters = sqFtTarget / 10.7639;
        const height = Math.sqrt(sqMeters / aspectRatio);
        const width = height * aspectRatio;

        // Convert to lat/lng offsets (approximate)
        const latOffset = (height / 2) / 111320; // meters to degrees lat
        const lngOffset = (width / 2) / (111320 * Math.cos(center.lat * Math.PI / 180)); // meters to degrees lng

        // Create corners (before rotation)
        let corners = [
            { lat: center.lat - latOffset, lng: center.lng - lngOffset },
            { lat: center.lat - latOffset, lng: center.lng + lngOffset },
            { lat: center.lat + latOffset, lng: center.lng + lngOffset },
            { lat: center.lat + latOffset, lng: center.lng - lngOffset }
        ];

        // Apply rotation if specified
        if (rotation !== 0) {
            corners = this.rotatePolygon(corners, center, rotation);
        }

        return this.createPolygonFromCoords(corners);
    }

    /**
     * Create a polygon from coordinate array
     */
    createPolygonFromCoords(coords) {
        const polygon = new google.maps.Polygon({
            paths: coords,
            ...this.styles
        });
        return polygon;
    }

    /**
     * Rotate polygon coordinates around a center point
     */
    rotatePolygon(coords, center, angleDegrees) {
        const angleRad = (angleDegrees * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        return coords.map(point => {
            const dx = point.lng - center.lng;
            const dy = point.lat - center.lat;
            return {
                lat: center.lat + (dy * cos - dx * sin),
                lng: center.lng + (dx * cos + dy * sin)
            };
        });
    }

    /**
     * Auto-estimate lawn area and create polygons
     * This is the main entry point for auto-drawing
     */
    autoEstimate(place, propertyType = 'residential', defaultAreas = {}) {
        this.clearAll();

        if (!place || !place.geometry || !place.geometry.location) {
            this.log('No valid place data for estimation');
            return null;
        }

        const center = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };

        // Get estimated total area
        const baseArea = propertyType === 'commercial'
            ? (defaultAreas.commercial || 15000)
            : (defaultAreas.residential || 8000);

        this.log('Auto-estimating for', propertyType, 'property, base area:', baseArea, 'sq ft');

        // Detect lot orientation from road direction
        const roadDirection = this.detectRoadDirection(place);
        this.log('Detected road direction:', roadDirection);

        // Decide on multi-polygon strategy
        const useMultiPolygon = this.shouldUseMultiPolygon(place, propertyType, baseArea);
        
        if (useMultiPolygon) {
            this.log('Using multi-polygon strategy (front/back yards)');
            this.createFrontBackYards(center, baseArea, roadDirection);
        } else {
            this.log('Using single polygon strategy');
            this.createSingleYard(center, baseArea, roadDirection);
        }

        // Notify that polygons were created
        this.onPolygonsCreated(this.polygons.length);

        return {
            polygonCount: this.polygons.length,
            totalSqFt: this.getTotalSqFt(),
            center
        };
    }

    /**
     * Detect road/street direction from place data
     * Returns angle in degrees (0 = north, 90 = east, etc.)
     */
    detectRoadDirection(place) {
        // Default to south-facing (road to south, typical American suburb)
        let roadDirection = 180;

        if (place.address_components) {
            // Look for road name to make educated guess
            const route = place.address_components.find(c => 
                c.types.includes('route')
            );

            if (route) {
                const roadName = route.long_name.toLowerCase();
                
                // Common naming conventions
                if (roadName.includes('north') || roadName.includes(' n ') || roadName.endsWith(' n')) {
                    roadDirection = 0;
                } else if (roadName.includes('south') || roadName.includes(' s ') || roadName.endsWith(' s')) {
                    roadDirection = 180;
                } else if (roadName.includes('east') || roadName.includes(' e ') || roadName.endsWith(' e')) {
                    roadDirection = 90;
                } else if (roadName.includes('west') || roadName.includes(' w ') || roadName.endsWith(' w')) {
                    roadDirection = 270;
                }
            }
        }

        return roadDirection;
    }

    /**
     * Determine if we should use multiple polygons
     */
    shouldUseMultiPolygon(place, propertyType, totalArea) {
        // For larger residential lots, split into front/back
        if (propertyType === 'residential' && totalArea > 5000) {
            return true;
        }

        // Commercial properties typically have connected lawns
        if (propertyType === 'commercial') {
            return false;
        }

        return false;
    }

    /**
     * Create front and back yard polygons
     */
    createFrontBackYards(center, totalArea, roadDirection) {
        // Typical suburban split: 30% front yard, 70% back yard
        const frontYardArea = Math.round(totalArea * 0.3);
        const backYardArea = Math.round(totalArea * 0.7);

        // Calculate offsets based on road direction
        const roadRad = (roadDirection * Math.PI) / 180;
        const perpRad = roadRad + Math.PI / 2;

        // Lot depth in meters (typical suburban lot ~40m deep)
        const lotDepthM = 40;
        const frontOffsetM = lotDepthM * 0.2; // Front yard center
        const backOffsetM = lotDepthM * 0.4; // Back yard center

        // Convert to lat/lng offsets
        const meterToLat = 1 / 111320;
        const meterToLng = 1 / (111320 * Math.cos(center.lat * Math.PI / 180));

        // Front yard center (toward road)
        const frontCenter = {
            lat: center.lat + Math.cos(roadRad) * frontOffsetM * meterToLat,
            lng: center.lng + Math.sin(roadRad) * frontOffsetM * meterToLng
        };

        // Back yard center (away from road)
        const backCenter = {
            lat: center.lat - Math.cos(roadRad) * backOffsetM * meterToLat,
            lng: center.lng - Math.sin(roadRad) * backOffsetM * meterToLng
        };

        // Create front yard (wider, shallower)
        const frontPolygon = this.createRectangle(frontCenter, frontYardArea, {
            aspectRatio: 2.5, // Wider for front yard
            rotation: roadDirection
        });
        this.addPolygon(frontPolygon, true);

        // Create back yard (more square)
        const backPolygon = this.createRectangle(backCenter, backYardArea, {
            aspectRatio: 1.2,
            rotation: roadDirection
        });
        this.addPolygon(backPolygon, true);

        this.recalculateTotal();
    }

    /**
     * Create a single yard polygon
     */
    createSingleYard(center, totalArea, roadDirection) {
        const polygon = this.createRectangle(center, totalArea, {
            aspectRatio: 1.3,
            rotation: roadDirection
        });
        this.addPolygon(polygon, true);
        this.recalculateTotal();
    }

    /**
     * Create a polygon from user drawing
     */
    createFromDrawing(path) {
        const polygon = new google.maps.Polygon({
            paths: path,
            ...this.styles
        });
        this.clearAll(); // Clear auto-estimated polygons
        this.addPolygon(polygon);
        return polygon;
    }

    /**
     * Allow user to add additional polygon
     */
    enableAddMode(drawingManager) {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.ServiceAreaManager = ServiceAreaManager;
    window.DEFAULT_POLYGON_STYLES = DEFAULT_POLYGON_STYLES;
}
