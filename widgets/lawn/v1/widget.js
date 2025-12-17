// Lawn Care Quote Widget - Main JavaScript
// This widget loads configuration from the GreenQuote Pro API
// and saves quotes to the account's Supabase database.

(function() {
    'use strict';
    
    // Configuration loaded from API
    let config = null;
    let widgetId = null;
    let accountId = null;
    let currentStep = 1;
    const TOTAL_STEPS = 3;
    
    // State
    const state = {
        propertyType: 'residential',
        primaryService: '',
        addOns: [],
        lawnSizeSqFt: 0,
        lawnSizeTier: null,
        frequency: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        zipCode: '',
        addressSource: 'none',
        preferredTime: '',
        estimatedPerVisit: 0,
        estimatedMonthlyTotal: 0,
        measuredAreaSqft: 0,
        estimatedAreaSqft: 0,
        areaSource: 'none',
        placeData: null,
        // Pricing snapshot for saving
        pricingMode: 'flat',
        pricingTiersSnapshot: null,
        flatRateSnapshot: null,
        basePricePerVisit: 0,
        // Multi-polygon support
        polygonCoords: [] // Array of coordinate arrays for persistence
    };
    
    // Google Maps objects
    let map = null;
    let drawingManager = null;
    let serviceAreaManager = null; // Multi-polygon manager
    let autocomplete = null;
    let selectedPlace = null;
    
    // Get API base URL (same origin or configured)
    function getApiBaseUrl() {
        // Check for explicit API URL in query params or use current origin
        const urlParams = new URLSearchParams(window.location.search);
        const apiUrl = urlParams.get('api');
        if (apiUrl) return apiUrl;
        
        // Default to relative path (same Vercel deployment)
        return '';
    }
    
    // Initialize the widget
    function init() {
        console.log('[Widget] Initializing lawn care quote widget');
        loadConfig();
    }
    
    // Load configuration from API endpoint
    function loadConfig() {
        const urlParams = new URLSearchParams(window.location.search);
        widgetId = urlParams.get('wid');
        
        // Fallback to legacy 'client' param for backward compatibility
        const legacyClientId = urlParams.get('client');
        
        if (!widgetId && !legacyClientId) {
            showError('Widget ID missing. Please contact the business owner.');
            return;
        }
        
        // If using wid param, load from API
        if (widgetId) {
            console.log('[Widget] Loading config for widget ID:', widgetId);
            
            const apiBase = getApiBaseUrl();
            fetch(`${apiBase}/api/widget/config?wid=${encodeURIComponent(widgetId)}`)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            throw new Error('Widget not found');
                        } else if (response.status === 403) {
                            throw new Error('Widget is disabled');
                        }
                        throw new Error('Failed to load widget configuration');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('[Widget] Config loaded from API:', data);
                    
                    // Store account ID for quote saving
                    accountId = data.accountId;
                    
                    // Transform API response to widget config format
                    config = transformApiConfig(data);
                    
                    // Store pricing mode info
                    state.pricingMode = config.useTieredPricing ? 'tiered' : 'flat';
                    state.pricingTiersSnapshot = config.useTieredPricing ? config.pricingTiers : null;
                    state.flatRateSnapshot = !config.useTieredPricing ? config.pricePerSqFt : null;
                    
                    applyTheme();
                    loadGoogleMapsAPI();
                })
                .catch(error => {
                    console.error('[Widget] Error loading config:', error);
                    showError('Widget unavailable. ' + error.message);
                });
        } else {
            // Legacy mode: load from static JSON config
            console.log('[Widget] Legacy mode - loading config for client:', legacyClientId);
            
            fetch(`../../../configs/${legacyClientId}.json`)
                .then(response => {
                    if (!response.ok) throw new Error('Config not found');
                    return response.json();
                })
                .catch(() => {
                    return fetch('../../../configs/default.json').then(r => r.json());
                })
                .then(data => {
                    config = data;
                    console.log('[Widget] Legacy config loaded:', config);
                    applyTheme();
                    loadGoogleMapsAPI();
                })
                .catch(error => {
                    console.error('[Widget] Error loading config:', error);
                    showError('There was an issue loading this quote widget. Please contact the business.');
                });
        }
    }
    
    // Transform API config to widget format
    function transformApiConfig(apiData) {
        return {
            businessName: apiData.businessName || 'Lawn Care Service',
            clientId: widgetId,
            currencySymbol: '$',
            
            // Pricing from API
            minPricePerVisit: apiData.pricing?.minPricePerVisit || 50,
            pricePerSqFt: apiData.pricing?.pricePerSqFt || 0.01,
            useTieredPricing: apiData.pricing?.useTieredPricing ?? true,
            pricingTiers: apiData.pricing?.tiers || [
                { up_to_sqft: 5000, rate_per_sqft: 0.012 },
                { up_to_sqft: 20000, rate_per_sqft: 0.008 },
                { up_to_sqft: null, rate_per_sqft: 0.005 }
            ],
            
            // Services (default set)
            services: [
                { id: 'mowing', label: 'Lawn Mowing' },
                { id: 'fertilization', label: 'Fertilization' },
                { id: 'aeration', label: 'Aeration' },
                { id: 'overseeding', label: 'Overseeding' },
                { id: 'leaf_cleanup', label: 'Leaf Cleanup' }
            ],
            
            // Add-ons from API
            addOns: (apiData.addons || []).map(addon => ({
                id: addon.id,
                label: addon.name,
                pricePerVisit: addon.pricePerVisit || 0
            })),
            
            // Frequency multipliers from API
            frequencyMultipliers: {
                one_time: apiData.frequency?.one_time?.multiplier || 1.2,
                weekly: apiData.frequency?.weekly?.multiplier || 0.85,
                bi_weekly: apiData.frequency?.bi_weekly?.multiplier || 1.0,
                monthly: apiData.frequency?.monthly?.multiplier || 1.1
            },
            
            // Frequency visits per month
            frequencyVisits: {
                one_time: 1,
                weekly: 4,
                bi_weekly: 2,
                monthly: 1
            },
            
            // Default area estimates
            defaultAreaEstimates: {
                residential: 8000,
                commercial: 15000
            },
            
            // Theme (default green)
            theme: {
                primaryColor: '#16a34a',
                accentColor: '#22c55e',
                borderRadius: '12px'
            },
            
            // Google Maps API key (from environment, not exposed)
            googleMapsApiKey: null // Will use mock mode if not set
        };
    }
    
    // Apply theme from config
    function applyTheme() {
        if (config.theme) {
            document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);
            document.documentElement.style.setProperty('--accent-color', config.theme.accentColor);
            document.documentElement.style.setProperty('--border-radius', config.theme.borderRadius);
        }
    }
    
    // Load Google Maps API
    function loadGoogleMapsAPI() {
        if (!config.googleMapsApiKey) {
            console.log('[Widget] No Google Maps API key provided, will use mock data');
            renderWidget();
            return;
        }
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places,drawing,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('[Widget] Google Maps API loaded');
            renderWidget();
        };
        script.onerror = () => {
            console.error('[Widget] Error loading Google Maps API');
            renderWidget();
        };
        document.head.appendChild(script);
    }
    
    // Render the widget
    function renderWidget() {
        const root = document.getElementById('widget-root');
        root.innerHTML = `
            <div class="widget-card">
                <div class="widget-header">
                    <h1>${config.businessName}</h1>
                    <p>Get your instant lawn care quote</p>
                </div>
                
                <div class="progress-indicator">
                    <div class="progress-step" data-step="1">
                        <div class="progress-dot">1</div>
                        <span>Service</span>
                    </div>
                    <div class="progress-divider"></div>
                    <div class="progress-step" data-step="2">
                        <div class="progress-dot">2</div>
                        <span>Property</span>
                    </div>
                    <div class="progress-divider"></div>
                    <div class="progress-step" data-step="3">
                        <div class="progress-dot">3</div>
                        <span>Quote</span>
                    </div>
                </div>
                
                <div id="step-content"></div>
            </div>
        `;
        
        renderStep(1);
    }
    
    // Render specific step
    function renderStep(step) {
        currentStep = step;
        updateProgressIndicator();
        
        const content = document.getElementById('step-content');
        console.log(`[Widget] Step ${step} loaded`);
        
        switch(step) {
            case 1:
                renderStep1(content);
                break;
            case 2:
                renderStep2(content);
                break;
            case 3:
                renderStep3(content);
                break;
        }
    }
    
    // Update progress indicator
    function updateProgressIndicator() {
        document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                stepEl.classList.add('active');
            } else if (stepNum < currentStep) {
                stepEl.classList.add('completed');
            }
        });
    }
    
    // Step 1: Service Selection
    function renderStep1(container) {
        const serviceOptions = config.services || [
            { id: 'mowing', label: 'Lawn Mowing' }
        ];
        
        container.innerHTML = `
            <div class="form-group">
                <label class="form-label required">Property Type</label>
                <select class="form-select" id="property-type">
                    <option value="residential" ${state.propertyType === 'residential' ? 'selected' : ''}>Residential</option>
                    <option value="commercial" ${state.propertyType === 'commercial' ? 'selected' : ''}>Commercial</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Primary Service</label>
                <select class="form-select" id="primary-service">
                    <option value="">Select a service</option>
                    ${serviceOptions.map(service => 
                        `<option value="${service.id}" ${state.primaryService === service.id ? 'selected' : ''}>${service.label}</option>`
                    ).join('')}
                </select>
            </div>
            
            ${config.addOns && config.addOns.length > 0 ? `
            <div class="form-group">
                <label class="form-label">Add-ons (optional)</label>
                <div class="checkbox-group">
                    ${config.addOns.map(addon => `
                        <label class="checkbox-item">
                            <input type="checkbox" value="${addon.id}" ${state.addOns.includes(addon.id) ? 'checked' : ''}>
                            <span class="checkbox-label">
                                <span>${addon.label}</span>
                                <span class="checkbox-price">+${config.currencySymbol}${addon.pricePerVisit}</span>
                            </span>
                        </label>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="button-group">
                <button class="btn btn-primary" id="next-btn">Next</button>
            </div>
        `;
        
        // Event listeners
        document.getElementById('property-type').addEventListener('change', (e) => {
            state.propertyType = e.target.value;
        });
        
        document.getElementById('primary-service').addEventListener('change', (e) => {
            state.primaryService = e.target.value;
            validateStep1();
        });
        
        document.querySelectorAll('.checkbox-item input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.addOns.push(e.target.value);
                } else {
                    state.addOns = state.addOns.filter(id => id !== e.target.value);
                }
            });
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            if (validateStep1()) {
                console.log('[Widget] Step 1 completed');
                renderStep(2);
            }
        });
        
        validateStep1();
    }
    
    // Validate step 1
    function validateStep1() {
        const isValid = state.primaryService !== '';
        document.getElementById('next-btn').disabled = !isValid;
        return isValid;
    }
    
    // Step 2: Property Details
    function renderStep2(container) {
        container.innerHTML = `
            <div class="form-group">
                <label class="form-label required">Property Address</label>
                <input type="text" class="form-input" id="address-input" placeholder="Start typing your address..." value="${state.address}" autocomplete="off">
                <p style="font-size: 12px; color: #666; margin-top: 6px;">Select your address from the dropdown suggestions for best results.</p>
            </div>
            
            <div class="map-container">
                <div id="map"></div>
                <div class="map-instructions">
                    Start typing your address above and select from the suggestions. The map will automatically locate your property.
                </div>
                <div class="map-controls">
                    <button class="map-btn" id="calculate-btn">Locate Property</button>
                    <button class="map-btn" id="draw-btn" disabled>Draw Boundary</button>
                    <button class="map-btn" id="clear-btn" disabled>Clear</button>
                </div>
                <div class="lawn-size-display hidden" id="lawn-size-display">
                    Lawn Size: <span id="lawn-size-value">0</span> sq ft
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label required">Service Frequency</label>
                <div class="radio-group">
                    ${Object.keys(config.frequencyMultipliers).map(freq => {
                        const label = freq.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        return `
                            <label class="radio-item">
                                <input type="radio" name="frequency" value="${freq}" ${state.frequency === freq ? 'checked' : ''}>
                                <span class="radio-label">${label}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="button-group">
                <button class="btn btn-secondary" id="back-btn">Back</button>
                <button class="btn btn-primary" id="next-btn" disabled>Next</button>
            </div>
        `;
        
        // Initialize map if not already initialized
        if (!map) {
            initMap();
        } else {
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize');
                if (state.placeData && state.placeData.geometry) {
                    recenterMapToPlace(state.placeData);
                }
                initAutocomplete();
            }, 100);
        }
        
        // Event listeners
        document.querySelectorAll('input[name="frequency"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.frequency = e.target.value;
                validateStep2();
            });
        });
        
        document.getElementById('calculate-btn').addEventListener('click', calculatePropertySize);
        document.getElementById('draw-btn').addEventListener('click', enableDrawing);
        document.getElementById('clear-btn').addEventListener('click', clearPolygon);
        
        document.getElementById('back-btn').addEventListener('click', () => {
            renderStep(1);
        });
        
        document.getElementById('next-btn').addEventListener('click', () => {
            if (validateStep2()) {
                calculatePricing();
                console.log('[Widget] Step 2 completed');
                renderStep(3);
            }
        });
        
        validateStep2();
    }
    
    // Initialize Google Map
    function initMap() {
        if (typeof google === 'undefined') {
            console.log('[Widget] Google Maps not available, using mock mode');
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#666;text-align:center;padding:20px;"><div><p style="margin-bottom:8px;font-weight:600;">Map Preview Unavailable</p><p style="font-size:13px;">Enter your address and lawn size manually.</p></div></div>';
            }
            return;
        }
        
        try {
            // Initialize map with SATELLITE view by default
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 39.8283, lng: -98.5795 },
                zoom: 4,
                mapTypeId: 'satellite', // Satellite view by default
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true, // Allow users to switch map type
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    position: google.maps.ControlPosition.TOP_RIGHT
                },
                fullscreenControl: false,
                tilt: 0
            });
            
            // Initialize Service Area Manager for multi-polygon support
            serviceAreaManager = new ServiceAreaManager(map, {
                debugMode: true,
                styles: {
                    fillColor: '#16a34a',
                    fillOpacity: 0.35,
                    strokeWeight: 3,
                    strokeColor: '#166534',
                    editable: true,
                    draggable: false
                },
                onAreaChange: (totalSqFt, breakdown) => {
                    state.lawnSizeSqFt = totalSqFt;
                    state.measuredAreaSqft = totalSqFt;
                    state.areaSource = 'measured';
                    state.polygonCoords = serviceAreaManager.getCoordinatesSnapshot();
                    updateLawnSizeDisplay(false);
                    console.log('[Widget] Area updated:', totalSqFt, 'sq ft from', breakdown.length, 'polygons');
                },
                onPolygonsCreated: (count) => {
                    console.log('[Widget] Auto-created', count, 'polygon(s)');
                    const instructions = document.querySelector('.map-instructions');
                    if (instructions) {
                        const msg = count > 1 
                            ? `✓ We estimated your lawn area (${count} zones) — drag corners to adjust.`
                            : '✓ We estimated your lawn area — drag corners to adjust.';
                        instructions.innerHTML = `<strong>${msg}</strong>`;
                        instructions.style.background = '#d4edda';
                        instructions.style.borderLeft = '4px solid #28a745';
                    }
                }
            });
            
            // Drawing manager for manual drawing fallback
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#16a34a',
                    fillOpacity: 0.35,
                    strokeWeight: 3,
                    strokeColor: '#166534',
                    editable: true,
                    draggable: false
                }
            });
            
            drawingManager.setMap(map);
            
            // Handle manually drawn polygons
            google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
                // Clear auto-estimated polygons and use manual drawing
                serviceAreaManager.clearAll();
                serviceAreaManager.addPolygon(polygon);
                drawingManager.setDrawingMode(null);
                
                document.getElementById('draw-btn').disabled = false;
                document.getElementById('clear-btn').disabled = false;
                document.getElementById('draw-btn').textContent = 'Adjust Boundary';
                document.getElementById('draw-btn').style.background = '';
                document.getElementById('draw-btn').style.color = '';
                
                const instructions = document.querySelector('.map-instructions');
                if (instructions) {
                    instructions.innerHTML = '<strong>✓ Area measured!</strong> Drag corners to adjust.';
                    instructions.style.background = '#d4edda';
                    instructions.style.borderLeft = '4px solid #28a745';
                }
            });
            
            initAutocomplete();
            google.maps.event.trigger(map, 'resize');
            
            console.log('[Widget] Google Maps initialized successfully with satellite view');
        } catch (error) {
            console.error('[Widget] Error initializing Google Maps:', error);
        }
    }
    
    // Initialize Google Places Autocomplete
    function initAutocomplete() {
        if (typeof google === 'undefined' || !google.maps.places) {
            console.log('[Widget] Google Places API not available');
            return;
        }
        
        const addressInput = document.getElementById('address-input');
        if (!addressInput) return;
        
        try {
            autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                fields: ['address_components', 'geometry', 'formatted_address', 'name']
            });
            
            if (map) {
                autocomplete.bindTo('bounds', map);
            }
            
            autocomplete.addListener('place_changed', onPlaceChanged);
            console.log('[Widget] Places Autocomplete initialized');
        } catch (error) {
            console.error('[Widget] Error initializing autocomplete:', error);
        }
    }
    
    // Handle place selection
    function onPlaceChanged() {
        const place = autocomplete.getPlace();
        
        if (!place || !place.geometry || !place.geometry.location) {
            console.warn('[Widget] Selected place missing geometry');
            return;
        }
        
        console.log('[Widget] Place selected:', place);
        selectedPlace = place;
        state.placeData = place;
        state.address = place.formatted_address || place.name || '';
        state.addressSource = 'autocomplete';
        
        extractZipCode(place);
        
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = state.address;
        }
        
        if (map && typeof google !== 'undefined') {
            recenterMapToPlace(place);
            
            // Auto-draw estimated service area after centering
            setTimeout(() => {
                autoDrawServiceArea(place);
            }, 500);
        }
        
        const drawBtn = document.getElementById('draw-btn');
        const clearBtn = document.getElementById('clear-btn');
        if (drawBtn) drawBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        console.log('[Widget] Address selected:', state.address, 'ZIP:', state.zipCode);
    }
    
    /**
     * Auto-draw estimated service area polygons
     */
    function autoDrawServiceArea(place) {
        if (!serviceAreaManager || !place) {
            console.log('[Widget] Cannot auto-draw: missing manager or place');
            estimateAreaFromAddress(); // Fallback to simple estimate
            return;
        }
        
        try {
            const defaultAreas = {
                residential: config.defaultAreaEstimates?.residential || 8000,
                commercial: config.defaultAreaEstimates?.commercial || 15000
            };
            
            const result = serviceAreaManager.autoEstimate(place, state.propertyType, defaultAreas);
            
            if (result && result.totalSqFt > 0) {
                state.lawnSizeSqFt = result.totalSqFt;
                state.estimatedAreaSqft = result.totalSqFt;
                state.areaSource = 'auto-estimated';
                state.polygonCoords = serviceAreaManager.getCoordinatesSnapshot();
                
                updateLawnSizeDisplay(true);
                
                console.log('[Widget] Auto-drew', result.polygonCount, 'polygon(s),', 
                    result.totalSqFt, 'sq ft total');
            } else {
                // Fallback if auto-estimation fails
                console.warn('[Widget] Auto-estimation returned no results, using fallback');
                estimateAreaFromAddress();
                showAutoDrawFallback();
            }
        } catch (error) {
            console.error('[Widget] Error auto-drawing service area:', error);
            estimateAreaFromAddress();
            showAutoDrawFallback();
        }
    }
    
    /**
     * Show fallback message when auto-draw fails
     */
    function showAutoDrawFallback() {
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            instructions.innerHTML = '<strong>⚠️ Couldn\'t auto-detect lawn.</strong> Please click "Draw Boundary" to outline your service area.';
            instructions.style.background = '#fff3cd';
            instructions.style.borderLeft = '4px solid #ffc107';
        }
    }
    
    // Extract ZIP code from place
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
    
    // Recenter map to selected place
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
            map.setZoom(isFullAddress ? 20 : 14);
        }
        
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
        }, 100);
    }
    
    // Estimate area from address
    function estimateAreaFromAddress() {
        let estimatedArea = state.propertyType === 'commercial' 
            ? (config.defaultAreaEstimates?.commercial || 15000)
            : (config.defaultAreaEstimates?.residential || 8000);
        
        state.estimatedAreaSqft = estimatedArea;
        state.lawnSizeSqFt = estimatedArea;
        state.areaSource = 'estimated';
        
        updateLawnSizeDisplay(true);
        console.log('[Widget] Area estimated:', estimatedArea, 'sq ft');
    }
    
    // Locate property
    function calculatePropertySize() {
        const addressInput = document.getElementById('address-input');
        const address = addressInput ? addressInput.value.trim() : '';
        
        if (!address) {
            alert('Please enter a property address to continue.');
            return;
        }
        
        // Mock mode
        if (typeof google === 'undefined') {
            const mockSize = Math.floor(Math.random() * 15000) + 3000;
            state.lawnSizeSqFt = mockSize;
            state.estimatedAreaSqft = mockSize;
            state.areaSource = 'estimated';
            state.address = address;
            updateLawnSizeDisplay(true);
            document.getElementById('draw-btn').disabled = true;
            document.getElementById('clear-btn').disabled = false;
            return;
        }
        
        const calcBtn = document.getElementById('calculate-btn');
        if (calcBtn) {
            calcBtn.disabled = true;
            calcBtn.textContent = 'Locating...';
        }
        
        if (selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location) {
            processSelectedPlace(selectedPlace, 'autocomplete');
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.textContent = 'Locate Property';
            }
            return;
        }
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.textContent = 'Locate Property';
            }
            
            if (status === 'OK' && results && results.length > 0) {
                const place = {
                    geometry: results[0].geometry,
                    formatted_address: results[0].formatted_address,
                    address_components: results[0].address_components,
                    name: results[0].formatted_address
                };
                selectedPlace = place;
                processSelectedPlace(place, 'geocode');
            } else {
                alert('Address not found. Please try again or use the dropdown suggestions.');
            }
        });
    }
    
    // Process selected place
    function processSelectedPlace(place, source) {
        state.placeData = place;
        state.address = place.formatted_address || place.name || '';
        state.addressSource = source;
        
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = state.address;
        }
        
        extractZipCode(place);
        
        if (map) {
            recenterMapToPlace(place);
        }
        
        if (!currentPolygon) {
            estimateAreaFromAddress();
        }
        
        const drawBtn = document.getElementById('draw-btn');
        const clearBtn = document.getElementById('clear-btn');
        if (drawBtn) drawBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            instructions.innerHTML = '<strong>✓ Property located!</strong> Click "Draw Boundary" to measure your exact service area.';
            instructions.style.background = '#d4edda';
            instructions.style.borderLeft = '4px solid #28a745';
        }
    }
    
    // Enable drawing
    function enableDrawing() {
        if (typeof google === 'undefined') {
            alert('Google Maps is required for drawing.');
            return;
        }
        
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        state.lawnSizeSqFt = 0;
        document.getElementById('lawn-size-display').classList.add('hidden');
        
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        
        document.getElementById('draw-btn').textContent = 'Drawing...';
        document.getElementById('draw-btn').style.background = config.theme.primaryColor;
        document.getElementById('draw-btn').style.color = 'white';
        
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            instructions.innerHTML = '<strong>Draw Mode:</strong> Click to create points around your service area. Double-click to complete.';
            instructions.style.background = '#fff3cd';
            instructions.style.borderLeft = '4px solid #ffc107';
        }
    }
    
    // Clear polygon
    function clearPolygon() {
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        state.measuredAreaSqft = 0;
        
        if (state.placeData || state.address) {
            estimateAreaFromAddress();
            document.getElementById('draw-btn').disabled = false;
        } else {
            state.lawnSizeSqFt = 0;
            state.estimatedAreaSqft = 0;
            state.areaSource = 'none';
            document.getElementById('lawn-size-display').classList.add('hidden');
            document.getElementById('draw-btn').disabled = false;
        }
        
        document.getElementById('draw-btn').textContent = 'Adjust Boundary';
        document.getElementById('draw-btn').style.background = '';
        document.getElementById('draw-btn').style.color = '';
        
        validateStep2();
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
            
            updateLawnSizeDisplay(false);
            
            const drawBtn = document.getElementById('draw-btn');
            if (drawBtn) {
                drawBtn.textContent = 'Adjust Boundary';
                drawBtn.style.background = '';
                drawBtn.style.color = '';
            }
            
            console.log('[Widget] Measured area:', state.measuredAreaSqft, 'sq ft');
        } catch (error) {
            console.error('[Widget] Error calculating polygon area:', error);
        }
    }
    
    // Update lawn size display
    function updateLawnSizeDisplay(isEstimated = false) {
        const displayElement = document.getElementById('lawn-size-display');
        const valueElement = document.getElementById('lawn-size-value');
        
        if (isEstimated) {
            valueElement.textContent = state.lawnSizeSqFt.toLocaleString() + ' (estimated)';
            displayElement.style.background = '#fff3cd';
            displayElement.style.color = '#856404';
        } else {
            valueElement.textContent = state.lawnSizeSqFt.toLocaleString() + ' (measured)';
            displayElement.style.background = config.theme.primaryColor;
            displayElement.style.color = 'white';
        }
        
        displayElement.classList.remove('hidden');
        validateStep2();
    }
    
    // Validate step 2
    function validateStep2() {
        const isValid = state.lawnSizeSqFt > 0 && state.frequency !== '';
        document.getElementById('next-btn').disabled = !isValid;
        return isValid;
    }
    
    // Calculate tiered price (blended rate like tax brackets)
    function calculateTieredPrice(totalSqFt, tiers) {
        if (!totalSqFt || totalSqFt <= 0) {
            return { totalPrice: 0, breakdown: [] };
        }
        
        const sortedTiers = [...(tiers || config.pricingTiers)]
            .sort((a, b) => {
                if (a.up_to_sqft === null) return 1;
                if (b.up_to_sqft === null) return -1;
                return a.up_to_sqft - b.up_to_sqft;
            });
        
        let remainingSqFt = totalSqFt;
        let totalPrice = 0;
        let previousMax = 0;
        const breakdown = [];
        
        for (const tier of sortedTiers) {
            const tierMax = tier.up_to_sqft ?? Infinity;
            const tierSize = tierMax - previousMax;
            const sqftInTier = Math.min(remainingSqFt, tierSize);
            
            if (sqftInTier > 0) {
                const tierPrice = sqftInTier * tier.rate_per_sqft;
                totalPrice += tierPrice;
                
                breakdown.push({
                    sqftInTier,
                    rate: tier.rate_per_sqft,
                    price: tierPrice
                });
                
                remainingSqFt -= sqftInTier;
                previousMax = tierMax;
            }
            
            if (remainingSqFt <= 0) break;
        }
        
        return {
            totalPrice: Math.round(totalPrice * 100) / 100,
            breakdown
        };
    }
    
    // Calculate pricing
    function calculatePricing() {
        const sqFt = state.lawnSizeSqFt;
        const minPrice = config.minPricePerVisit || 50;
        
        let calculatedFromArea = 0;
        
        // Use tiered or flat pricing
        if (config.useTieredPricing && config.pricingTiers) {
            const { totalPrice } = calculateTieredPrice(sqFt, config.pricingTiers);
            calculatedFromArea = totalPrice;
            state.pricingMode = 'tiered';
            state.pricingTiersSnapshot = config.pricingTiers;
            state.flatRateSnapshot = null;
        } else {
            calculatedFromArea = sqFt * (config.pricePerSqFt || 0.01);
            state.pricingMode = 'flat';
            state.pricingTiersSnapshot = null;
            state.flatRateSnapshot = config.pricePerSqFt;
        }
        
        // Enforce minimum price
        const basePrice = Math.max(calculatedFromArea, minPrice);
        state.basePricePerVisit = Math.round(basePrice);
        
        // Add add-ons
        let addonsTotal = 0;
        state.addOns.forEach(addonId => {
            const addon = config.addOns.find(a => a.id === addonId);
            if (addon) {
                addonsTotal += addon.pricePerVisit || 0;
            }
        });
        
        // Apply frequency multiplier
        const frequencyMultiplier = config.frequencyMultipliers[state.frequency] || 1.0;
        state.estimatedPerVisit = Math.round((basePrice + addonsTotal) * frequencyMultiplier);
        
        // Calculate monthly total
        const visitsPerMonth = config.frequencyVisits?.[state.frequency] || 1;
        state.estimatedMonthlyTotal = state.estimatedPerVisit * visitsPerMonth;
        
        console.log('[Widget] Quote calculated:', {
            pricingMode: state.pricingMode,
            perVisit: state.estimatedPerVisit,
            monthly: state.estimatedMonthlyTotal
        });
    }
    
    // Step 3: Quote and Lead Capture
    function renderStep3(container) {
        const selectedService = config.services ? 
            config.services.find(s => s.id === state.primaryService)?.label || state.primaryService :
            state.primaryService;
        
        const selectedAddOns = state.addOns.map(id => {
            const addon = config.addOns.find(a => a.id === id);
            return addon ? addon.label : id;
        }).join(', ') || 'None';
        
        const frequencyLabel = state.frequency.replace('_', ' ').split(' ').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        
        container.innerHTML = `
            <div class="quote-summary">
                <h3>Your Estimated Quote</h3>
                ${state.pricingMode === 'tiered' ? `
                <p style="font-size: 12px; color: #16a34a; margin-bottom: 12px;">💡 Larger lawns receive automatic volume discounts.</p>
                ` : ''}
                <div class="quote-details">
                    <div class="quote-detail-item">
                        <span>Service:</span>
                        <span>${selectedService}</span>
                    </div>
                    <div class="quote-detail-item">
                        <span>Add-ons:</span>
                        <span>${selectedAddOns}</span>
                    </div>
                    <div class="quote-detail-item">
                        <span>Lawn Size:</span>
                        <span>${state.lawnSizeSqFt.toLocaleString()} sq ft ${state.areaSource === 'measured' ? '(measured)' : '(estimated)'}</span>
                    </div>
                    <div class="quote-detail-item">
                        <span>Frequency:</span>
                        <span>${frequencyLabel}</span>
                    </div>
                </div>
                <div class="quote-pricing">
                    <div class="quote-price-item">
                        <span class="quote-price-label">Per Visit:</span>
                        <span class="quote-price-value">${config.currencySymbol}${state.estimatedPerVisit}</span>
                    </div>
                    <div class="quote-price-item">
                        <span class="quote-price-label">Est. Monthly:</span>
                        <span class="quote-price-value">${config.currencySymbol}${state.estimatedMonthlyTotal}</span>
                    </div>
                </div>
            </div>
            
            <div id="lead-form">
                <div class="form-group">
                    <label class="form-label required">First Name</label>
                    <input type="text" class="form-input" id="first-name" value="${state.firstName}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Last Name</label>
                    <input type="text" class="form-input" id="last-name" value="${state.lastName}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Email</label>
                    <input type="email" class="form-input" id="email" value="${state.email}">
                </div>
                
                <div class="form-group">
                    <label class="form-label required">Mobile Phone</label>
                    <input type="tel" class="form-input" id="phone" placeholder="(555) 123-4567" value="${state.phone}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Service Address</label>
                    <textarea class="form-textarea" id="service-address" placeholder="Street address, City, State, ZIP">${state.address}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Preferred Service Day/Time</label>
                    <input type="text" class="form-input" id="preferred-time" placeholder="e.g., Weekdays mornings" value="${state.preferredTime}">
                </div>
                
                <div class="button-group">
                    <button class="btn btn-secondary" id="back-btn">Back</button>
                    <button class="btn btn-primary" id="submit-btn" disabled>Request My Quote</button>
                </div>
            </div>
        `;
        
        // Event listeners
        const inputs = ['first-name', 'last-name', 'email', 'phone'];
        inputs.forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                const field = id.replace('-', '');
                state[field === 'firstname' ? 'firstName' : field === 'lastname' ? 'lastName' : field] = e.target.value;
                validateStep3();
            });
        });
        
        document.getElementById('service-address').addEventListener('input', (e) => {
            state.address = e.target.value;
        });
        
        document.getElementById('preferred-time').addEventListener('input', (e) => {
            state.preferredTime = e.target.value;
        });
        
        document.getElementById('back-btn').addEventListener('click', () => {
            renderStep(2);
        });
        
        document.getElementById('submit-btn').addEventListener('click', submitQuote);
        
        validateStep3();
    }
    
    // Validate step 3
    function validateStep3() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = state.firstName && state.lastName && 
                       emailRegex.test(state.email) && state.phone;
        document.getElementById('submit-btn').disabled = !isValid;
        return isValid;
    }
    
    // Submit quote
    function submitQuote() {
        console.log('[Widget] Submitting quote');
        
        // Build add-ons snapshot
        const addonsSnapshot = state.addOns.map(addonId => {
            const addon = config.addOns.find(a => a.id === addonId);
            return addon ? {
                id: addon.id,
                name: addon.label,
                pricePerVisit: addon.pricePerVisit
            } : null;
        }).filter(Boolean);
        
        const payload = {
            widgetId: widgetId,
            accountId: accountId,
            customerName: `${state.firstName} ${state.lastName}`,
            customerEmail: state.email,
            customerPhone: state.phone,
            propertyAddress: state.address,
            propertyType: state.propertyType,
            areaSqFt: state.lawnSizeSqFt,
            areaSource: state.areaSource,
            primaryService: state.primaryService,
            addons: addonsSnapshot,
            frequency: state.frequency,
            basePricePerVisit: state.basePricePerVisit,
            totalPricePerVisit: state.estimatedPerVisit,
            monthlyEstimate: state.estimatedMonthlyTotal,
            pricingMode: state.pricingMode,
            pricingTiersSnapshot: state.pricingTiersSnapshot,
            flatRateSnapshot: state.flatRateSnapshot,
            preferredTime: state.preferredTime
        };
        
        console.log('[Widget] Payload:', payload);
        
        // If we have widgetId and accountId, save to Supabase via API
        if (widgetId && accountId) {
            const apiBase = getApiBaseUrl();
            fetch(`${apiBase}/api/widget/save-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('[Widget] Quote saved:', data);
                    showSuccessMessage();
                })
                .catch(error => {
                    console.error('[Widget] Error saving quote:', error);
                    // Still show success to user
                    showSuccessMessage();
                });
        } else {
            // Legacy mode or no account - just show success
            console.log('[Widget] Legacy mode - quote not saved to database');
            showSuccessMessage();
        }
        
        // Trigger custom event for tracking
        window.dispatchEvent(new CustomEvent('LawnQuoteSubmitted', { detail: payload }));
    }
    
    // Show success message
    function showSuccessMessage() {
        const content = document.getElementById('step-content');
        content.innerHTML = `
            <div class="success-message">
                <div class="success-icon">
                    <svg viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2>Thank You!</h2>
                <p>We've received your request and will follow up shortly to confirm your quote and schedule your service.</p>
            </div>
        `;
    }
    
    // Show error message
    function showError(message) {
        const root = document.getElementById('widget-root');
        root.innerHTML = `
            <div class="widget-card">
                <div class="error-message">
                    <h3>Widget Unavailable</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }
    
    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
