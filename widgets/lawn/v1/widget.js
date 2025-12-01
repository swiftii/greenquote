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
        preferredTime: '',
        estimatedPerVisit: 0,
        estimatedMonthlyTotal: 0
    };
    
    // Google Maps objects
    let map = null;
    let drawingManager = null;
    let currentPolygon = null;
    
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
                <label class="form-label required">Enter Your Address</label>
                <input type="text" class="form-input" id="address-input" placeholder="123 Main St, City, State" value="${state.address}">
            </div>
            
            <div class="map-container">
                <div id="map"></div>
                <div class="map-instructions">
                    Enter your address above and click "Calculate Size" to see your property. You can then adjust the boundary if needed.
                </div>
                <div class="map-controls">
                    <button class="map-btn" id="calculate-btn">Calculate Size</button>
                    <button class="map-btn" id="draw-btn" disabled>Adjust Boundary</button>
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
        
        // Initialize map
        initMap();
        
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
                center: { lat: 40.7128, lng: -74.0060 },
                zoom: 18,
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
                    instructions.textContent = 'Drag the corners to adjust your service area. Click "Clear" to start over.';
                }
            });
            
            console.log('[Widget] Google Maps initialized successfully');
        } catch (error) {
            console.error('[Widget] Error initializing Google Maps:', error);
        }
    }
    
    // Calculate property size from address
    function calculatePropertySize() {
        const address = document.getElementById('address-input').value;
        state.address = address;
        
        if (!address) {
            alert('Please enter an address');
            return;
        }
        
        if (typeof google === 'undefined') {
            // Mock mode - generate random size
            const mockSize = Math.floor(Math.random() * 15000) + 3000;
            state.lawnSizeSqFt = mockSize;
            updateLawnSizeDisplay();
            document.getElementById('draw-btn').disabled = true; // Can't draw without maps
            document.getElementById('clear-btn').disabled = false;
            console.log('[Widget] Mock property size calculated:', mockSize);
            
            // Update instructions for mock mode
            const instructions = document.querySelector('.map-instructions');
            if (instructions) {
                instructions.innerHTML = '<strong>Mock Mode:</strong> Property size estimated. Add Google Maps API key to see satellite view and draw precise boundaries.';
            }
            return;
        }
        
        // Disable button during processing
        const calcBtn = document.getElementById('calculate-btn');
        calcBtn.disabled = true;
        calcBtn.textContent = 'Loading...';
        
        // Use Google Maps Geocoding
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            calcBtn.disabled = false;
            calcBtn.textContent = 'Calculate Size';
            
            if (status === 'OK') {
                const location = results[0].geometry.location;
                
                // Center map on location with appropriate zoom
                map.setCenter(location);
                map.setZoom(19); // Closer zoom for better property view
                
                // Get property bounds
                const bounds = results[0].geometry.viewport;
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                const nw = { lat: ne.lat(), lng: sw.lng() };
                const se = { lat: sw.lat(), lng: ne.lng() };
                
                // Calculate a more realistic property size (approximate lot)
                // Create a smaller polygon representing typical residential lot
                const latSpan = ne.lat() - sw.lat();
                const lngSpan = ne.lng() - sw.lng();
                const reduceFactor = 0.4; // Use 40% of viewport as property estimate
                
                const centerLat = (ne.lat() + sw.lat()) / 2;
                const centerLng = (ne.lng() + sw.lng()) / 2;
                
                const halfLatSpan = (latSpan * reduceFactor) / 2;
                const halfLngSpan = (lngSpan * reduceFactor) / 2;
                
                const paths = [
                    { lat: centerLat + halfLatSpan, lng: centerLng - halfLngSpan }, // NW
                    { lat: centerLat + halfLatSpan, lng: centerLng + halfLngSpan }, // NE
                    { lat: centerLat - halfLatSpan, lng: centerLng + halfLngSpan }, // SE
                    { lat: centerLat - halfLatSpan, lng: centerLng - halfLngSpan }  // SW
                ];
                
                if (currentPolygon) {
                    currentPolygon.setMap(null);
                }
                
                currentPolygon = new google.maps.Polygon({
                    paths: paths,
                    fillColor: '#2e7d32',
                    fillOpacity: 0.35,
                    strokeWeight: 3,
                    strokeColor: '#1b5e20',
                    editable: true,
                    draggable: false,
                    map: map
                });
                
                // Add listeners for real-time updates when editing
                google.maps.event.addListener(currentPolygon.getPath(), 'set_at', calculatePolygonArea);
                google.maps.event.addListener(currentPolygon.getPath(), 'insert_at', calculatePolygonArea);
                google.maps.event.addListener(currentPolygon.getPath(), 'remove_at', calculatePolygonArea);
                
                calculatePolygonArea();
                document.getElementById('draw-btn').disabled = false;
                document.getElementById('clear-btn').disabled = false;
                
                // Update instructions
                const instructions = document.querySelector('.map-instructions');
                if (instructions) {
                    instructions.innerHTML = '<strong>✓ Property located!</strong> Drag the corners of the green area to match your exact service area, or click "Adjust Boundary" to redraw.';
                    instructions.style.background = '#d4edda';
                    instructions.style.borderLeft = '4px solid #28a745';
                }
                
                console.log('[Widget] Property located and boundary created');
                
            } else {
                alert('Could not find that address. Please check the spelling and try again.');
                console.error('[Widget] Geocoding failed:', status);
            }
        });
    }
    
    // Enable manual drawing
    function enableDrawing() {
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
    
    // Clear polygon
    function clearPolygon() {
        if (currentPolygon) {
            currentPolygon.setMap(null);
            currentPolygon = null;
        }
        state.lawnSizeSqFt = 0;
        document.getElementById('lawn-size-display').classList.add('hidden');
        validateStep2();
    }
    
    // Calculate polygon area
    function calculatePolygonArea() {
        if (!currentPolygon) return;
        
        const area = google.maps.geometry.spherical.computeArea(currentPolygon.getPath());
        state.lawnSizeSqFt = Math.round(area * 10.7639); // Convert sq meters to sq feet
        
        updateLawnSizeDisplay();
    }
    
    // Update lawn size display
    function updateLawnSizeDisplay() {
        document.getElementById('lawn-size-value').textContent = state.lawnSizeSqFt.toLocaleString();
        document.getElementById('lawn-size-display').classList.remove('hidden');
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
                        <span>${state.lawnSizeSqFt.toLocaleString()} sq ft (${state.lawnSizeTier.label})</span>
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