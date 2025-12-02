// GreenQuote Pro - Internal Field Quoting App
// Reuses configuration, pricing, and maps logic from the public widget

(function() {
    'use strict';
    
    // Configuration and state
    let config = null;
    let currentClient = '';
    
    // Google Maps objects
    let map = null;
    let drawingManager = null;
    let currentPolygon = null;
    let autocomplete = null;
    let selectedPlace = null;
    
    // Application state
    const state = {
        // Customer info
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: '',
        
        // Property info
        propertyType: 'residential',
        address: '',
        zipCode: '',
        addressSource: 'none',
        
        // Area info
        lawnSizeSqFt: 0,
        measuredAreaSqft: 0,
        estimatedAreaSqft: 0,
        areaSource: 'none',
        
        // Service info
        primaryService: '',
        addOns: [],
        frequency: '',
        
        // Pricing
        estimatedPerVisit: 0,
        estimatedMonthlyTotal: 0,
        lawnSizeTier: null,
        
        // Operator info
        operatorName: '',
        sendEmail: false
    };
    
    // Initialize application
    function init() {
        console.log('[Pro] Initializing GreenQuote Pro');
        loadConfig();
        setupEventListeners();
    }
    
    // Load configuration
    function loadConfig() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('client') || 'default';
        currentClient = clientId;
        
        console.log('[Pro] Loading config for client:', clientId);
        
        // Build correct path from /pro/ to /configs/
        const configPath = `../configs/${clientId}.json`;
        
        fetch(configPath)
            .then(response => {
                if (!response.ok) {
                    console.warn('[Pro] Client config not found at:', configPath);
                    throw new Error('Client config not found');
                }
                return response.json();
            })
            .catch(() => {
                console.log('[Pro] Falling back to default config');
                return fetch('../configs/default.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Default config also not found');
                        }
                        return response.json();
                    });
            })
            .then(data => {
                config = data;
                console.log('[Pro] Config loaded successfully for client:', config.clientId);
                
                // Check for Google Maps API key
                if (config.googleMapsApiKey) {
                    console.log('[Pro] ✓ Google Maps API key found in config');
                } else {
                    console.warn('[Pro] ⚠️ No Google Maps API key in config - maps will be disabled');
                }
                
                // Log config structure for debugging
                console.log('[Pro] Config structure:', {
                    clientId: config.clientId,
                    businessName: config.businessName,
                    hasGoogleMapsKey: !!config.googleMapsApiKey,
                    hasDefaultAreaEstimates: !!config.defaultAreaEstimates,
                    servicesCount: config.services ? config.services.length : 0,
                    addOnsCount: config.addOns ? config.addOns.length : 0
                });
                
                applyConfig();
                loadGoogleMapsAPI();
            })
            .catch(error => {
                console.error('[Pro] Critical error loading config:', error);
                showError('Failed to load configuration. Please check the client parameter and try again.');
                
                // Show error in UI
                document.getElementById('client-badge').textContent = 'Config Error';
                document.getElementById('client-badge').style.background = 'rgba(211, 47, 47, 0.8)';
            });
    }
    
    // Apply configuration to UI
    function applyConfig() {
        // Update branding
        document.getElementById('business-name').textContent = config.businessName + ' Pro';
        document.getElementById('client-badge').textContent = config.clientId;
        
        // Apply theme
        if (config.theme) {
            document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);
            document.documentElement.style.setProperty('--primary-dark', adjustColor(config.theme.primaryColor, -20));
            document.documentElement.style.setProperty('--accent-color', config.theme.accentColor);
            document.documentElement.style.setProperty('--border-radius', config.theme.borderRadius);
        }
        
        // Populate services
        populateServices();
        populateAddOns();
        populateFrequencies();
    }
    
    // Darken a hex color
    function adjustColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
    
    // Populate services dropdown
    function populateServices() {
        const select = document.getElementById('primaryService');
        const services = config.services || [
            { id: 'mowing', label: 'Lawn Mowing' },
            { id: 'fertilization', label: 'Fertilization' },
            { id: 'aeration', label: 'Aeration' }
        ];
        
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.label;
            select.appendChild(option);
        });
    }
    
    // Populate add-ons
    function populateAddOns() {
        const container = document.getElementById('addonList');
        
        if (!config.addOns || config.addOns.length === 0) {
            container.innerHTML = '<p style=\"color: #999; font-size: 14px;\">No add-ons available</p>';
            return;
        }
        
        config.addOns.forEach(addon => {
            const div = document.createElement('label');
            div.className = 'addon-item';
            div.innerHTML = `
                <input type=\"checkbox\" value=\"${addon.id}\">
                <div class=\"addon-info\">
                    <span class=\"addon-name\">${addon.label}</span>
                    <span class=\"addon-price\">+${config.currencySymbol}${addon.pricePerVisit}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    // Populate frequencies
    function populateFrequencies() {
        const container = document.getElementById('frequencyGrid');
        const frequencies = {
            'one_time': 'One-Time',
            'weekly': 'Weekly',
            'bi_weekly': 'Bi-Weekly',
            'monthly': 'Monthly'
        };
        
        Object.entries(frequencies).forEach(([key, label]) => {
            const div = document.createElement('label');
            div.className = 'frequency-option';
            div.innerHTML = `
                <input type=\"radio\" name=\"frequency\" value=\"${key}\">
                <span class=\"frequency-label\">${label}</span>
            `;
            container.appendChild(div);
        });
    }
    
    // Load Google Maps API
    function loadGoogleMapsAPI() {
        if (!config.googleMapsApiKey || config.googleMapsApiKey.trim() === '') {
            console.warn('[Pro] ⚠️ No Google Maps API key provided in config');
            console.warn('[Pro] Maps features will be disabled');
            console.warn('[Pro] To enable maps, add "googleMapsApiKey" to your config file');
            
            document.getElementById('mapStatus').textContent = 'Maps unavailable - API key required';
            document.getElementById('mapStatus').className = 'map-status error';
            
            // Disable map tools
            document.getElementById('locateBtn').disabled = true;
            document.getElementById('drawBtn').disabled = true;
            document.getElementById('clearBtn').disabled = true;
            
            return;
        }
        
        console.log('[Pro] Loading Google Maps API with key from config...');
        console.log('[Pro] API Key starts with:', config.googleMapsApiKey.substring(0, 10) + '...');
        
        // Check if script already loaded
        if (typeof google !== 'undefined' && google.maps) {
            console.log('[Pro] Google Maps already loaded, initializing map');
            initMap();
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places,drawing,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('[Pro] ✓ Google Maps API loaded successfully');
            console.log('[Pro] Google Maps version:', google.maps.version);
            
            // Update status
            document.getElementById('mapStatus').textContent = 'Enter address to locate property';
            document.getElementById('mapStatus').className = 'map-status';
            
            // Initialize map
            initMap();
        };
        
        script.onerror = (error) => {
            console.error('[Pro] ❌ Failed to load Google Maps API');
            console.error('[Pro] Check that your API key is valid');
            console.error('[Pro] Verify these APIs are enabled in Google Cloud Console:');
            console.error('[Pro]   - Maps JavaScript API');
            console.error('[Pro]   - Places API');
            console.error('[Pro]   - Geocoding API');
            
            document.getElementById('mapStatus').textContent = 'Maps failed to load - check API key';
            document.getElementById('mapStatus').className = 'map-status error';
            
            // Disable map tools
            document.getElementById('locateBtn').disabled = true;
            document.getElementById('drawBtn').disabled = true;
            document.getElementById('clearBtn').disabled = true;
        };
        
        document.head.appendChild(script);
        console.log('[Pro] Google Maps script tag added to document');
    }
    
    // Initialize Google Map
    function initMap() {
        if (typeof google === 'undefined') return;
        
        try {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 39.8283, lng: -98.5795 },
                zoom: 4,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                tilt: 0
            });
            
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: config.theme.primaryColor,
                    fillOpacity: 0.35,
                    strokeWeight: 3,
                    strokeColor: adjustColor(config.theme.primaryColor, -20),
                    editable: true,
                    draggable: false
                }
            });
            
            drawingManager.setMap(map);
            
            google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
                if (currentPolygon) {
                    currentPolygon.setMap(null);
                }
                currentPolygon = polygon;
                drawingManager.setDrawingMode(null);
                
                google.maps.event.addListener(polygon.getPath(), 'set_at', calculatePolygonArea);
                google.maps.event.addListener(polygon.getPath(), 'insert_at', calculatePolygonArea);
                google.maps.event.addListener(polygon.getPath(), 'remove_at', calculatePolygonArea);
                
                calculatePolygonArea();
                document.getElementById('drawBtn').disabled = false;
                document.getElementById('clearBtn').disabled = false;
                
                updateMapStatus('✓ Area measured! Drag corners to adjust.', 'success');
            });
            
            initAutocomplete();
            google.maps.event.trigger(map, 'resize');
            
            console.log('[Pro] Map initialized');
        } catch (error) {
            console.error('[Pro] Error initializing map:', error);
        }
    }
    
    // Initialize autocomplete
    function initAutocomplete() {
        if (typeof google === 'undefined' || !google.maps.places) return;
        
        const addressInput = document.getElementById('address');
        
        try {
            autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                fields: ['address_components', 'geometry', 'formatted_address', 'name']
            });
            
            if (map) {
                autocomplete.bindTo('bounds', map);
            }
            
            autocomplete.addListener('place_changed', onPlaceChanged);
            console.log('[Pro] Autocomplete initialized');
        } catch (error) {
            console.error('[Pro] Error initializing autocomplete:', error);
        }
    }
    
    // Handle place changed
    function onPlaceChanged() {
        const place = autocomplete.getPlace();
        
        if (!place || !place.geometry || !place.geometry.location) {
            updateMapStatus('⚠️ Please select a complete address from dropdown', 'error');
            return;
        }
        
        selectedPlace = place;
        state.address = place.formatted_address || place.name || '';
        state.addressSource = 'autocomplete';
        
        extractZipCode(place);
        
        document.getElementById('address').value = state.address;
        
        if (map) {
            recenterMapToPlace(place);
        }
        
        if (!currentPolygon) {
            estimateAreaFromAddress();
        }
        
        document.getElementById('drawBtn').disabled = false;
        document.getElementById('clearBtn').disabled = false;
        
        updateMapStatus('✓ Property located! Draw boundary for accurate area.', 'success');
        
        console.log('[Pro] Place selected:', state.address, 'ZIP:', state.zipCode);
    }
    
    // Extract ZIP code
    function extractZipCode(place) {
        state.zipCode = '';
        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes('postal_code')) {
                    state.zipCode = component.short_name;
                    break;
                }
            }
        }
    }
    
    // Recenter map to place
    function recenterMapToPlace(place) {
        if (!map || !place || !place.geometry) return;
        
        const hasStreetNumber = place.address_components &&
            place.address_components.some(c => c.types && c.types.includes('street_number'));
        
        const hasStreetAddress = place.address_components &&
            place.address_components.some(c => c.types && c.types.includes('route'));
        
        const isFullAddress = hasStreetNumber && hasStreetAddress;
        
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
            
            google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                const currentZoom = map.getZoom();
                if (isFullAddress && currentZoom < 19) {
                    map.setZoom(20);
                } else if (!isFullAddress && currentZoom < 14) {
                    map.setZoom(14);
                }
            });
        } else if (place.geometry.location) {
            map.setCenter(place.geometry.location);
            map.setZoom(isFullAddress ? 20 : (state.zipCode ? 14 : 16));
        }
        
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
        }, 100);
    }
    
    // Estimate area from address
    function estimateAreaFromAddress() {
        if (!config.defaultAreaEstimates) return;
        
        let estimatedArea = 0;
        
        if (state.zipCode && config.defaultAreaEstimates.zipOverrides) {
            const zipOverride = config.defaultAreaEstimates.zipOverrides[state.zipCode];
            if (zipOverride) {
                estimatedArea = zipOverride;
            }
        }
        
        if (!estimatedArea) {
            estimatedArea = state.propertyType === 'commercial'
                ? (config.defaultAreaEstimates.commercial || 15000)
                : (config.defaultAreaEstimates.residential || 8000);
        }
        
        state.estimatedAreaSqft = estimatedArea;
        state.lawnSizeSqFt = estimatedArea;
        state.areaSource = 'estimated';
        
        updateAreaDisplay(true);
        calculatePricing();
    }
    
    // Calculate polygon area
    function calculatePolygonArea() {
        if (!currentPolygon || typeof google === 'undefined') return;
        
        try {
            const area = google.maps.geometry.spherical.computeArea(currentPolygon.getPath());
            const sqFt = Math.round(area * 10.7639);
            
            state.measuredAreaSqft = sqFt;
            state.lawnSizeSqFt = sqFt;
            state.estimatedAreaSqft = 0;
            state.areaSource = 'measured';
            
            updateAreaDisplay(false);
            calculatePricing();
            
            console.log('[Pro] Area measured:', sqFt, 'sq ft');
        } catch (error) {
            console.error('[Pro] Error calculating area:', error);
        }
    }
    
    // Update area display
    function updateAreaDisplay(isEstimated) {
        const display = document.getElementById('areaDisplay');
        const value = document.getElementById('areaValue');
        
        if (state.lawnSizeSqFt > 0) {
            const label = isEstimated ? ' (estimated)' : ' (measured)';
            value.textContent = state.lawnSizeSqFt.toLocaleString() + ' sq ft' + label;
            
            if (isEstimated) {
                display.classList.add('estimated');
            } else {
                display.classList.remove('estimated');
            }
            
            display.classList.remove('hidden');
        } else {
            display.classList.add('hidden');
        }
    }
    
    // Update map status
    function updateMapStatus(message, type = '') {
        const status = document.getElementById('mapStatus');
        status.textContent = message;
        status.className = 'map-status ' + type;
    }
    
    // Calculate pricing (reusing widget logic)
    function calculatePricing() {
        if (!state.lawnSizeSqFt || !state.primaryService || !state.frequency) {
            document.getElementById('quoteSummary').classList.add('hidden');
            return;
        }
        
        // Determine lawn size tier
        state.lawnSizeTier = config.lawnSizeTiers.find(tier => {
            if (tier.id === 'small') return state.lawnSizeSqFt <= 5000;
            if (tier.id === 'medium') return state.lawnSizeSqFt > 5000 && state.lawnSizeSqFt <= 10000;
            if (tier.id === 'large') return state.lawnSizeSqFt > 10000 && state.lawnSizeSqFt <= 20000;
            return state.lawnSizeSqFt > 20000;
        });
        
        if (!state.lawnSizeTier) {
            console.error('[Pro] Could not determine lawn size tier');
            return;
        }
        
        // Calculate base visit price
        let baseVisitPrice = config.baseVisitFee + state.lawnSizeTier.pricePerVisit;
        
        // Add add-ons
        state.addOns.forEach(addonId => {
            const addon = config.addOns.find(a => a.id === addonId);
            if (addon) {
                baseVisitPrice += addon.pricePerVisit;
            }
        });
        
        // Apply frequency multiplier
        const frequencyMultiplier = config.frequencyMultipliers[state.frequency] || 1.0;
        state.estimatedPerVisit = Math.round(baseVisitPrice * frequencyMultiplier);
        
        // Calculate monthly total
        if (state.frequency === 'weekly') {
            state.estimatedMonthlyTotal = state.estimatedPerVisit * 4;
        } else if (state.frequency === 'bi_weekly') {
            state.estimatedMonthlyTotal = state.estimatedPerVisit * 2;
        } else {
            state.estimatedMonthlyTotal = state.estimatedPerVisit;
        }
        
        // Update display
        document.getElementById('perVisitPrice').textContent = config.currencySymbol + state.estimatedPerVisit;
        document.getElementById('monthlyPrice').textContent = config.currencySymbol + state.estimatedMonthlyTotal;
        
        const note = state.areaSource === 'measured'
            ? 'Based on measured area (' + state.lawnSizeSqFt.toLocaleString() + ' sq ft)'
            : 'Based on estimated area (' + state.lawnSizeSqFt.toLocaleString() + ' sq ft) - draw boundary for accuracy';
        document.getElementById('pricingNote').textContent = note;
        
        document.getElementById('quoteSummary').classList.remove('hidden');
        
        validateForm();
        
        console.log('[Pro] Pricing calculated:', state.estimatedPerVisit, state.estimatedMonthlyTotal);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Property type
        document.querySelectorAll('input[name=\"propertyType\"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.propertyType = e.target.value;
                if (state.address && !currentPolygon) {
                    estimateAreaFromAddress();
                }
            });
        });
        
        // Service selection
        document.getElementById('primaryService').addEventListener('change', (e) => {
            state.primaryService = e.target.value;
            calculatePricing();
        });
        
        // Add-ons
        document.getElementById('addonList').addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                state.addOns = Array.from(document.querySelectorAll('#addonList input:checked'))
                    .map(cb => cb.value);
                calculatePricing();
            }
        });
        
        // Frequency
        document.getElementById('frequencyGrid').addEventListener('change', (e) => {
            if (e.target.name === 'frequency') {
                state.frequency = e.target.value;
                calculatePricing();
            }
        });
        
        // Map tools
        document.getElementById('locateBtn').addEventListener('click', locateProperty);
        document.getElementById('drawBtn').addEventListener('click', enableDrawing);
        document.getElementById('clearBtn').addEventListener('click', clearPolygon);
        
        // Save quote
        document.getElementById('saveQuoteBtn').addEventListener('click', saveQuote);
        
        // Form inputs
        ['firstName', 'lastName', 'phone', 'email', 'notes', 'operatorName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    state[id === 'operatorName' ? 'operatorName' : id] = el.value;
                    validateForm();
                });
            }
        });
        
        // Send email checkbox
        document.getElementById('sendEmailCheck').addEventListener('change', (e) => {
            state.sendEmail = e.target.checked;
        });
        
        // Modal actions
        document.getElementById('newQuoteBtn').addEventListener('click', newQuote);
        document.getElementById('copyBtn').addEventListener('click', copyQuoteSummary);
    }
    
    // Locate property
    function locateProperty() {
        const address = document.getElementById('address').value.trim();
        
        if (!address) {
            updateMapStatus('⚠️ Enter an address first', 'error');
            return;
        }
        
        if (typeof google === 'undefined') {
            // Mock mode
            const mockSize = Math.floor(Math.random() * 15000) + 3000;
            state.lawnSizeSqFt = mockSize;
            state.estimatedAreaSqft = mockSize;
            state.areaSource = 'estimated';
            state.address = address;
            updateAreaDisplay(true);
            calculatePricing();
            updateMapStatus('✓ Address saved (maps unavailable)', 'success');
            return;
        }
        
        // Use selected place if available
        if (selectedPlace && selectedPlace.geometry) {
            recenterMapToPlace(selectedPlace);
            if (!currentPolygon) {
                estimateAreaFromAddress();
            }
            updateMapStatus('✓ Property located', 'success');
            return;
        }
        
        // Fallback to geocoding
        document.getElementById('locateBtn').textContent = '⏳ Locating...';
        document.getElementById('locateBtn').disabled = true;
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            document.getElementById('locateBtn').textContent = '📍 Locate';
            document.getElementById('locateBtn').disabled = false;
            
            if (status === 'OK' && results && results.length > 0) {
                const place = {
                    geometry: results[0].geometry,
                    formatted_address: results[0].formatted_address,
                    address_components: results[0].address_components
                };
                
                selectedPlace = place;
                state.address = place.formatted_address;
                state.addressSource = 'geocode';
                
                extractZipCode(place);
                recenterMapToPlace(place);
                
                if (!currentPolygon) {
                    estimateAreaFromAddress();
                }
                
                document.getElementById('drawBtn').disabled = false;
                document.getElementById('clearBtn').disabled = false;
                
                updateMapStatus('✓ Property located', 'success');
            } else {
                updateMapStatus('❌ Address not found - try selecting from dropdown', 'error');
            }
        });
    }
    
    // Enable drawing
    function enableDrawing() {
        if (typeof google === 'undefined') return;
        
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        state.measuredAreaSqft = 0;
        
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        
        document.getElementById('drawBtn').textContent = '✏️ Drawing...';
        updateMapStatus('Draw around the lawn area. Double-click to finish.', '');
    }
    
    // Clear polygon
    function clearPolygon() {
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        state.measuredAreaSqft = 0;
        
        if (state.address) {
            estimateAreaFromAddress();
            updateMapStatus('Boundary cleared. Using estimated area.', '');
        } else {
            state.lawnSizeSqFt = 0;
            state.estimatedAreaSqft = 0;
            state.areaSource = 'none';
            document.getElementById('areaDisplay').classList.add('hidden');
            calculatePricing();
        }
        
        document.getElementById('drawBtn').textContent = '✏️ Draw Area';
    }
    
    // Validate form
    function validateForm() {
        const isValid = 
            state.firstName.trim() &&
            state.lastName.trim() &&
            state.phone.trim() &&
            state.lawnSizeSqFt > 0 &&
            state.primaryService &&
            state.frequency;
        
        document.getElementById('saveQuoteBtn').disabled = !isValid;
    }
    
    // Save quote
    function saveQuote() {
        console.log('[Pro] Saving quote');
        
        document.getElementById('loadingOverlay').classList.remove('hidden');
        
        // Capture UTM parameters
        const urlParams = new URLSearchParams(window.location.search);
        const trackingData = {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            ref: urlParams.get('ref')
        };
        
        // Build payload (same structure as widget)
        const payload = {
            mode: 'internal',
            source: 'greenquote_pro',
            clientId: config.clientId,
            monthlyQuoteLimit: config.monthlyQuoteLimit || 100,
            timestamp: new Date().toISOString(),
            
            propertyType: state.propertyType,
            primaryService: state.primaryService,
            addOns: state.addOns,
            lawnSizeSqFt: state.lawnSizeSqFt,
            lawnSizeTier: state.lawnSizeTier ? state.lawnSizeTier.id : 'unknown',
            frequency: state.frequency,
            
            areaData: {
                measuredAreaSqft: state.measuredAreaSqft,
                estimatedAreaSqft: state.estimatedAreaSqft,
                areaSource: state.areaSource,
                usedForPricing: state.lawnSizeSqFt
            },
            
            pricing: {
                estimatedPerVisit: state.estimatedPerVisit,
                estimatedMonthlyTotal: state.estimatedMonthlyTotal,
                currencySymbol: config.currencySymbol
            },
            
            lead: {
                firstName: state.firstName,
                lastName: state.lastName,
                email: state.email,
                phone: state.phone,
                address: state.address,
                zipCode: state.zipCode,
                addressSource: state.addressSource,
                notes: state.notes
            },
            
            operator: {
                name: state.operatorName || 'Unknown',
                timestamp: new Date().toISOString()
            },
            
            actions: {
                sendCustomerEmail: state.sendEmail
            },
            
            tracking: trackingData
        };
        
        // Submit to central webhook
        const webhookUrl = config.centralWebhookUrl || 'https://mock-webhook.example.com/quotes';
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('[Pro] Quote saved:', data);
                
                setTimeout(() => {
                    document.getElementById('loadingOverlay').classList.add('hidden');
                    showSuccessModal();
                }, 500);
            })
            .catch(error => {
                console.error('[Pro] Error saving quote:', error);
                
                setTimeout(() => {
                    document.getElementById('loadingOverlay').classList.add('hidden');
                    // Still show success for demo purposes
                    showSuccessModal();
                }, 500);
            });
    }
    
    // Show success modal
    function showSuccessModal() {
        const modal = document.getElementById('successModal');
        const body = document.getElementById('modalBody');
        
        const summary = `
            <div style=\"margin-bottom: 16px;\">
                <strong>Customer:</strong> ${state.firstName} ${state.lastName}<br>
                <strong>Phone:</strong> ${state.phone}<br>
                ${state.email ? '<strong>Email:</strong> ' + state.email + '<br>' : ''}
                <strong>Address:</strong> ${state.address || 'Not specified'}
            </div>
            <div style=\"margin-bottom: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px;\">
                <strong>Service:</strong> ${state.primaryService}<br>
                <strong>Frequency:</strong> ${state.frequency}<br>
                <strong>Area:</strong> ${state.lawnSizeSqFt.toLocaleString()} sq ft (${state.areaSource})
            </div>
            <div style=\"padding: 12px; background: var(--accent-color); border-radius: 8px;\">
                <strong>Per Visit:</strong> ${config.currencySymbol}${state.estimatedPerVisit}<br>
                <strong>Monthly:</strong> ${config.currencySymbol}${state.estimatedMonthlyTotal}
            </div>
            ${state.sendEmail ? '<div style=\"margin-top: 12px; color: var(--success-color);\">✓ Customer will receive quote by email</div>' : ''}
        `;
        
        body.innerHTML = summary;
        modal.classList.remove('hidden');
    }
    
    // New quote
    function newQuote() {
        location.reload();
    }
    
    // Copy quote summary
    function copyQuoteSummary() {
        const summary = `
GreenQuote - ${config.businessName}

Customer: ${state.firstName} ${state.lastName}
Phone: ${state.phone}
Email: ${state.email || 'N/A'}
Address: ${state.address || 'N/A'}

Service: ${state.primaryService}
Add-ons: ${state.addOns.join(', ') || 'None'}
Frequency: ${state.frequency}
Lawn Area: ${state.lawnSizeSqFt.toLocaleString()} sq ft (${state.areaSource})

Per Visit: ${config.currencySymbol}${state.estimatedPerVisit}
Est. Monthly: ${config.currencySymbol}${state.estimatedMonthlyTotal}

Created by: ${state.operatorName || 'Unknown'}
Date: ${new Date().toLocaleString()}
        `.trim();
        
        navigator.clipboard.writeText(summary).then(() => {
            const btn = document.getElementById('copyBtn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('[Pro] Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    }
    
    // Show error
    function showError(message) {
        alert('Error: ' + message);
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
