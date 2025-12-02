// Lawn Care Quote Widget - Main JavaScript
// This widget is designed to work as a standalone HTML/CSS/JS system
// hosted on GitHub Pages and embedded via iframe.

(function() {
    'use strict';
    
    // Configuration
    let config = null;
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
        addressSource: 'none', // 'autocomplete', 'geocode', or 'none'
        preferredTime: '',
        estimatedPerVisit: 0,
        estimatedMonthlyTotal: 0,
        measuredAreaSqft: 0,
        estimatedAreaSqft: 0,
        areaSource: 'none', // 'measured', 'estimated', or 'none'
        placeData: null
    };
    
    // Google Maps objects
    let map = null;
    let drawingManager = null;
    let currentPolygon = null;
    let autocomplete = null;
    let selectedPlace = null; // Store selected place from autocomplete
    
    // Initialize the widget
    function init() {
        console.log('[Widget] Initializing lawn care quote widget');
        loadConfig();
    }
    
    // Load configuration based on URL parameter
    function loadConfig() {
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('client') || 'default';
        
        console.log('[Widget] Loading config for client:', clientId);
        
        // Try to load client-specific config
        fetch(`../../../configs/${clientId}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Client config not found');
                }
                return response.json();
            })
            .catch(() => {
                console.log('[Widget] Client config not found, loading default');
                return fetch('../../../configs/default.json').then(r => r.json());
            })
            .then(data => {
                config = data;
                console.log('[Widget] Config loaded:', config);
                applyTheme();
                loadGoogleMapsAPI();
            })
            .catch(error => {
                console.error('[Widget] Error loading config:', error);
                showError('There was an issue loading this quote widget. Please contact the business.');
            });
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
            { id: 'mowing', label: 'Lawn Mowing' },
            { id: 'fertilization', label: 'Fertilization' },
            { id: 'aeration', label: 'Aeration' },
            { id: 'overseeding', label: 'Overseeding' },
            { id: 'leaf_cleanup', label: 'Leaf Cleanup' }
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
                        const label = freq.replace('_', '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
            // Map already exists, trigger resize and reinitialize autocomplete
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
            // Show message in map container
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#666;text-align:center;padding:20px;"><div><p style="margin-bottom:8px;font-weight:600;">Map Preview Unavailable</p><p style="font-size:13px;">Add Google Maps API key to see satellite view and drawing tools.</p></div></div>';
            }
            return;
        }
        
        try {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
                zoom: 4,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                tilt: 0
            });
            
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#2e7d32',
                    fillOpacity: 0.35,
                    strokeWeight: 3,
                    strokeColor: '#1b5e20',
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
                
                // Add listeners for polygon editing
                google.maps.event.addListener(polygon.getPath(), 'set_at', calculatePolygonArea);
                google.maps.event.addListener(polygon.getPath(), 'insert_at', calculatePolygonArea);
                google.maps.event.addListener(polygon.getPath(), 'remove_at', calculatePolygonArea);
                
                calculatePolygonArea();
                document.getElementById('draw-btn').disabled = false;
                document.getElementById('clear-btn').disabled = false;
                
                // Update instructions
                const instructions = document.querySelector('.map-instructions');
                if (instructions) {
                    instructions.textContent = '✓ Measured area! Drag corners to adjust. This measured area will be used for your quote.';
                }
            });
            
            // Initialize Places Autocomplete
            initAutocomplete();
            
            // Trigger resize to ensure map renders correctly
            google.maps.event.trigger(map, 'resize');
            
            console.log('[Widget] Google Maps initialized successfully');
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
        if (!addressInput) {
            console.log('[Widget] Address input not found');
            return;
        }
        
        try {
            autocomplete = new google.maps.places.Autocomplete(addressInput, {
                types: ['address'],
                fields: ['address_components', 'geometry', 'formatted_address', 'name']
            });
            
            // Bias results to current map viewport
            if (map) {
                autocomplete.bindTo('bounds', map);
            }
            
            // Listen for place selection
            autocomplete.addListener('place_changed', onPlaceChanged);
            
            console.log('[Widget] Places Autocomplete initialized');
        } catch (error) {
            console.error('[Widget] Error initializing autocomplete:', error);
        }
    }
    
    // Handle place selection from autocomplete
    function onPlaceChanged() {
        const place = autocomplete.getPlace();
        
        // Validate place has required data
        if (!place || !place.geometry || !place.geometry.location) {
            console.warn('[Widget] Selected place missing geometry or location');
            
            // Show helpful message
            const instructions = document.querySelector('.map-instructions');
            if (instructions) {
                instructions.innerHTML = '⚠️ Please select a complete address from the dropdown suggestions.';
                instructions.style.background = '#fff3cd';
                instructions.style.borderLeft = '4px solid #ffc107';
            }
            return;
        }
        
        console.log('[Widget] Place selected from autocomplete:', place);
        
        // Store the selected place as source of truth
        selectedPlace = place;
        
        // Store place data in state
        state.placeData = place;
        state.address = place.formatted_address || place.name || '';
        state.addressSource = 'autocomplete'; // Track how address was obtained
        
        // Extract ZIP code
        extractZipCode(place);
        
        // Update address input to show formatted address
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = state.address;
        }
        
        // Recenter and zoom map to selected place
        if (map && typeof google !== 'undefined') {
            recenterMapToPlace(place);
        }
        
        // Estimate area if no polygon drawn
        if (!currentPolygon) {
            estimateAreaFromAddress();
        }
        
        // Enable buttons
        const drawBtn = document.getElementById('draw-btn');
        const clearBtn = document.getElementById('clear-btn');
        if (drawBtn) drawBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        // Update instructions with success message
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            instructions.innerHTML = '<strong>✓ Property located!</strong> Area estimated at ' + 
                state.lawnSizeSqFt.toLocaleString() + ' sq ft. Draw a boundary for precise measurement.';
            instructions.style.background = '#d4edda';
            instructions.style.borderLeft = '4px solid #28a745';
        }
        
        console.log('[Widget] Address selected via autocomplete:', state.address, 'ZIP:', state.zipCode);
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
        
        console.log('[Widget] ZIP code extracted:', state.zipCode);
    }
    
    // Recenter map to selected place
    function recenterMapToPlace(place) {
        if (!map || !place || !place.geometry) {
            console.warn('[Widget] Cannot recenter map - invalid place or map not initialized');
            return;
        }
        
        console.log('[Widget] Recentering map to place');
        
        // Determine if this is a full street address
        const hasStreetNumber = place.address_components && 
            place.address_components.some(c => c.types && c.types.includes('street_number'));
        
        const hasStreetAddress = place.address_components && 
            place.address_components.some(c => c.types && c.types.includes('route'));
        
        const isFullAddress = hasStreetNumber && hasStreetAddress;
        
        if (place.geometry.viewport) {
            // Use viewport bounds if available
            map.fitBounds(place.geometry.viewport);
            
            // After fitting to viewport, zoom in closer for property-level view
            google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
                const currentZoom = map.getZoom();
                
                if (isFullAddress && currentZoom < 19) {
                    // Full street address: zoom to parcel level (20)
                    map.setZoom(20);
                } else if (!isFullAddress && currentZoom < 14) {
                    // ZIP or city only: zoom to neighborhood level
                    map.setZoom(14);
                }
            });
        } else if (place.geometry.location) {
            // No viewport, use location directly
            map.setCenter(place.geometry.location);
            
            // Set appropriate zoom level
            if (isFullAddress) {
                // Full address: zoom to individual property (parcel-like)
                map.setZoom(20);
                console.log('[Widget] Zooming to parcel level (20) for street address');
            } else if (state.zipCode) {
                // ZIP only: zoom to neighborhood level
                map.setZoom(14);
                console.log('[Widget] Zooming to neighborhood level (14) for ZIP');
            } else {
                // Generic location: moderate zoom
                map.setZoom(16);
                console.log('[Widget] Zooming to moderate level (16) for generic location');
            }
        }
        
        // Trigger map resize to ensure proper rendering
        setTimeout(() => {
            google.maps.event.trigger(map, 'resize');
        }, 100);
        
        console.log('[Widget] Map recentered successfully');
    }
    
    // Estimate area from address using config defaults
    function estimateAreaFromAddress() {
        if (!config.defaultAreaEstimates) {
            console.log('[Widget] No default area estimates in config');
            return;
        }
        
        let estimatedArea = 0;
        
        // Check for ZIP-specific override
        if (state.zipCode && config.defaultAreaEstimates.zipOverrides) {
            const zipOverride = config.defaultAreaEstimates.zipOverrides[state.zipCode];
            if (zipOverride) {
                estimatedArea = zipOverride;
                console.log('[Widget] Using ZIP override for', state.zipCode, ':', estimatedArea, 'sq ft');
            }
        }
        
        // Fall back to property type default
        if (!estimatedArea) {
            if (state.propertyType === 'commercial') {
                estimatedArea = config.defaultAreaEstimates.commercial || 15000;
            } else {
                estimatedArea = config.defaultAreaEstimates.residential || 8000;
            }
            console.log('[Widget] Using', state.propertyType, 'default:', estimatedArea, 'sq ft');
        }
        
        // Set estimated area
        state.estimatedAreaSqft = estimatedArea;
        state.lawnSizeSqFt = estimatedArea;
        state.areaSource = 'estimated';
        
        // Update display
        updateLawnSizeDisplay(true);
        
        console.log('[Widget] Area estimated:', estimatedArea, 'sq ft');
    }
    
    // Locate property - uses selected place first, falls back to geocoding
    function calculatePropertySize() {
        const addressInput = document.getElementById('address-input');
        const address = addressInput ? addressInput.value.trim() : '';
        
        if (!address) {
            showAddressError('Please enter a property address to continue.');
            return;
        }
        
        // Mock mode handling
        if (typeof google === 'undefined') {
            const mockSize = Math.floor(Math.random() * 15000) + 3000;
            state.lawnSizeSqFt = mockSize;
            state.estimatedAreaSqft = mockSize;
            state.areaSource = 'estimated';
            state.address = address;
            updateLawnSizeDisplay(true);
            document.getElementById('draw-btn').disabled = true;
            document.getElementById('clear-btn').disabled = false;
            
            const instructions = document.querySelector('.map-instructions');
            if (instructions) {
                instructions.innerHTML = '<strong>Mock Mode:</strong> Property size estimated. Add Google Maps API key to see satellite view and draw precise boundaries.';
            }
            console.log('[Widget] Mock property size calculated:', mockSize);
            return;
        }
        
        // Disable button during processing
        const calcBtn = document.getElementById('calculate-btn');
        if (calcBtn) {
            calcBtn.disabled = true;
            calcBtn.textContent = 'Locating...';
        }
        
        // Strategy 1: Use selected place from autocomplete if available
        if (selectedPlace && selectedPlace.geometry && selectedPlace.geometry.location) {
            console.log('[Widget] Using selected place from autocomplete');
            
            // Re-use the already selected place
            processSelectedPlace(selectedPlace, 'autocomplete');
            
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.textContent = 'Locate Property';
            }
            return;
        }
        
        // Strategy 2: Fallback to geocoding the raw address text
        console.log('[Widget] No selected place, attempting geocode of:', address);
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (calcBtn) {
                calcBtn.disabled = false;
                calcBtn.textContent = 'Locate Property';
            }
            
            if (status === 'OK' && results && results.length > 0) {
                console.log('[Widget] Geocoding successful');
                
                // Convert geocode result to place-like object
                const place = {
                    geometry: results[0].geometry,
                    formatted_address: results[0].formatted_address,
                    address_components: results[0].address_components,
                    name: results[0].formatted_address
                };
                
                // Store as selected place for future use
                selectedPlace = place;
                
                // Process the geocoded place
                processSelectedPlace(place, 'geocode');
                
            } else {
                // Geocoding failed - show helpful error
                handleGeocodeError(status, address);
            }
        });
    }
    
    // Process a selected place (from autocomplete or geocoding)
    function processSelectedPlace(place, source) {
        console.log('[Widget] Processing place from', source);
        
        // Store in state
        state.placeData = place;
        state.address = place.formatted_address || place.name || '';
        state.addressSource = source;
        
        // Update address input
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.value = state.address;
        }
        
        // Extract ZIP code
        extractZipCode(place);
        
        // Recenter and zoom map
        if (map) {
            recenterMapToPlace(place);
        }
        
        // Estimate area if no polygon drawn
        if (!currentPolygon) {
            estimateAreaFromAddress();
        }
        
        // Enable drawing tools
        const drawBtn = document.getElementById('draw-btn');
        const clearBtn = document.getElementById('clear-btn');
        if (drawBtn) drawBtn.disabled = false;
        if (clearBtn) clearBtn.disabled = false;
        
        // Update instructions with success message
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            const areaText = state.lawnSizeSqFt > 0 ? 
                state.lawnSizeSqFt.toLocaleString() + ' sq ft' : 'default';
            
            instructions.innerHTML = '<strong>✓ Property located!</strong> Area estimated at ' + 
                areaText + '. Click "Draw Boundary" to measure your exact service area.';
            instructions.style.background = '#d4edda';
            instructions.style.borderLeft = '4px solid #28a745';
        }
        
        console.log('[Widget] Place processed successfully:', state.address, 'ZIP:', state.zipCode);
    }
    
    // Handle geocoding errors with helpful messages
    function handleGeocodeError(status, address) {
        console.error('[Widget] Geocoding failed with status:', status);
        
        let errorMessage = '';
        let suggestion = '';
        
        switch (status) {
            case 'ZERO_RESULTS':
                errorMessage = 'Address Not Found';
                suggestion = 'The address "' + address + '" could not be located. Please try:';
                break;
            case 'INVALID_REQUEST':
                errorMessage = 'Invalid Address Format';
                suggestion = 'Please check the address and try again. Make sure to include street number, name, city, and state.';
                break;
            case 'OVER_QUERY_LIMIT':
                errorMessage = 'Service Temporarily Unavailable';
                suggestion = 'Too many requests. Please wait a moment and try again.';
                break;
            case 'REQUEST_DENIED':
                errorMessage = 'Service Error';
                suggestion = 'Unable to verify address at this time. Please contact support if this continues.';
                break;
            default:
                errorMessage = 'Unable to Locate Address';
                suggestion = 'We couldn\'t find that address. Please try:';
        }
        
        // Show error in instructions area
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            let helpText = '<strong>❌ ' + errorMessage + '</strong><br>';
            helpText += suggestion;
            
            if (status === 'ZERO_RESULTS' || status === 'INVALID_REQUEST') {
                helpText += '<br>• Start typing and <strong>select from the dropdown suggestions</strong>';
                helpText += '<br>• Include full address (street, city, state, ZIP)';
                helpText += '<br>• Check spelling and try variations';
            }
            
            instructions.innerHTML = helpText;
            instructions.style.background = '#f8d7da';
            instructions.style.borderLeft = '4px solid #dc3545';
        }
        
        // Also show alert for immediate feedback
        if (status === 'ZERO_RESULTS') {
            showAddressError(
                'Address not found. Please start typing and select from the dropdown suggestions, ' +
                'or try including more details (street number, city, state).'
            );
        } else {
            showAddressError(suggestion);
        }
    }
    
    // Show address error message
    function showAddressError(message) {
        alert(message);
    }
    
    // Enable manual drawing
    function enableDrawing() {
        if (typeof google === 'undefined') {
            alert('Google Maps is required for drawing. Please add your API key in the admin panel.');
            return;
        }
        
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        state.lawnSizeSqFt = 0;
        document.getElementById('lawn-size-display').classList.add('hidden');
        
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        
        // Update button state
        document.getElementById('draw-btn').textContent = 'Drawing...';
        document.getElementById('draw-btn').style.background = config.theme.primaryColor;
        document.getElementById('draw-btn').style.color = 'white';
        
        // Update instructions
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            instructions.innerHTML = '<strong>Draw Mode:</strong> Click on the map to create points around your service area. Double-click to complete.';
            instructions.style.background = '#fff3cd';
            instructions.style.borderLeft = '4px solid #ffc107';
        }
        
        console.log('[Widget] Drawing mode enabled');
    }
    
    // Clear polygon
    function clearPolygon() {
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        
        // Clear measured area
        state.measuredAreaSqft = 0;
        
        // If we have an address, fall back to estimated area
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
        
        // Reset instructions
        const instructions = document.querySelector('.map-instructions');
        if (instructions) {
            if (state.address) {
                instructions.innerHTML = 'Boundary cleared. Using estimated area. Draw boundary for accurate measurement.';
                instructions.style.background = '#fff3cd';
                instructions.style.borderLeft = '4px solid #ffc107';
            } else {
                instructions.innerHTML = 'Enter your address and select from suggestions to locate your property.';
                instructions.style.background = '';
                instructions.style.borderLeft = '';
            }
        }
        
        validateStep2();
        console.log('[Widget] Polygon cleared, reverted to estimated area');
    }
    
    // Calculate polygon area
    function calculatePolygonArea() {
        if (!currentPolygon) return;
        
        if (typeof google === 'undefined') {
            console.log('[Widget] Cannot calculate area without Google Maps');
            return;
        }
        
        try {
            const area = google.maps.geometry.spherical.computeArea(currentPolygon.getPath());
            const sqFt = Math.round(area * 10.7639); // Convert sq meters to sq feet
            
            // This is measured area from polygon
            state.measuredAreaSqft = sqFt;
            state.lawnSizeSqFt = sqFt;
            state.estimatedAreaSqft = 0; // Clear estimated
            state.areaSource = 'measured';
            
            updateLawnSizeDisplay(false); // false = measured, not estimated
            
            // Reset draw button after completing polygon
            const drawBtn = document.getElementById('draw-btn');
            if (drawBtn) {
                drawBtn.textContent = 'Adjust Boundary';
                drawBtn.style.background = '';
                drawBtn.style.color = '';
            }
            
            console.log('[Widget] Measured area calculated:', state.measuredAreaSqft, 'sq ft');
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
    
    // Calculate pricing
    function calculatePricing() {
        // Determine lawn size tier
        state.lawnSizeTier = config.lawnSizeTiers.find(tier => {
            if (tier.id === 'small') return state.lawnSizeSqFt <= 5000;
            if (tier.id === 'medium') return state.lawnSizeSqFt > 5000 && state.lawnSizeSqFt <= 10000;
            if (tier.id === 'large') return state.lawnSizeSqFt > 10000 && state.lawnSizeSqFt <= 20000;
            return state.lawnSizeSqFt > 20000;
        });
        
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
        
        console.log('[Widget] Quote calculated:', {
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
        
        const frequencyLabel = state.frequency.replace('_', '-').split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');
        
        container.innerHTML = `
            <div class="quote-summary">
                <h3>Your Estimated Quote</h3>
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
        console.log('[Widget] Form submission attempt');
        
        // Capture UTM parameters and tracking codes
        const urlParams = new URLSearchParams(window.location.search);
        const trackingData = {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_term: urlParams.get('utm_term'),
            utm_content: urlParams.get('utm_content'),
            gclid: urlParams.get('gclid'),
            fbclid: urlParams.get('fbclid'),
            ref: urlParams.get('ref')
        };
        
        // Build payload
        const payload = {
            clientId: config.clientId,
            monthlyQuoteLimit: config.monthlyQuoteLimit || 100,
            timestamp: new Date().toISOString(),
            propertyType: state.propertyType,
            primaryService: state.primaryService,
            addOns: state.addOns,
            lawnSizeSqFt: state.lawnSizeSqFt,
            lawnSizeTier: state.lawnSizeTier.id,
            frequency: state.frequency,
            areaData: {
                measuredAreaSqft: state.measuredAreaSqft,
                estimatedAreaSqft: state.estimatedAreaSqft,
                areaSource: state.areaSource, // 'measured', 'estimated', or 'none'
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
                preferredTime: state.preferredTime
            },
            tracking: trackingData
        };
        
        console.log('[Widget] Submitting payload:', payload);
        
        // Submit to central webhook
        const webhookUrl = config.centralWebhookUrl || 'https://mock-webhook.example.com/quotes';
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                console.log('[Widget] Form submission success');
                console.log('[Widget] Usage info from server:', data);
                console.log('Plan status:', data.planStatus, 'Used this month:', data.usedThisMonth);
                
                // Trigger custom event for tracking
                window.dispatchEvent(new CustomEvent('LawnQuoteSubmitted', { detail: payload }));
                
                // Always show success message regardless of plan status
                showSuccessMessage();
            })
            .catch(error => {
                console.error('[Widget] Form submission error:', error);
                // Still show success to user even if tracking fails
                showSuccessMessage();
            });
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
                    ${message}
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