#!/usr/bin/env python3
"""
Backend Testing for GreenQuote Pro App Viewport-Based Lawn Area Estimation Feature

This test suite verifies the viewport-based lawn area estimation feature in Quote.js:
1. Code Structure - ESTIMATION_CONFIG, autoEstimateLawnArea function signature, confidence state
2. Estimation Logic - viewport/bounds calculation, quality guardrails, min/max bounds
3. Confidence Indicator - high/medium/low confidence based on address precision
4. Polygon Generation - generatePolygonsFromEstimate function, front/back yard splitting
5. UI Feedback - different messages based on confidence level
6. Console Logging - detailed logging for debugging and verification
7. Place Reference Storage - selectedPlaceRef for re-estimation on property type change

Key Changes Tested:
- Removed DEFAULT_AREA_ESTIMATES mock constants
- Added ESTIMATION_CONFIG with viewportToLawnRatio settings
- Viewport-based calculation using place.geometry.viewport/bounds
- Quality guardrails for large (>1.5M sqft) and small (<10K sqft) viewports
- Confidence levels: high (street address), medium (area-level), low (fallback/large)
- UI feedback with different colored messages based on confidence
"""

import os
import sys
import json
import re
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuoteViewportEstimationTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'code_structure': {'status': 'pending', 'details': []},
            'estimation_logic': {'status': 'pending', 'details': []},
            'confidence_indicator': {'status': 'pending', 'details': []},
            'polygon_generation': {'status': 'pending', 'details': []},
            'ui_feedback': {'status': 'pending', 'details': []},
            'console_logging': {'status': 'pending', 'details': []},
            'place_reference_storage': {'status': 'pending', 'details': []}
        }
        
    def test_code_structure(self):
        """Test Quote.js code structure for viewport-based estimation"""
        print("🔍 Testing Code Structure...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['code_structure']['status'] = 'failed'
            self.results['code_structure']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for ESTIMATION_CONFIG (replaced DEFAULT_AREA_ESTIMATES)
            config_checks = [
                ('const ESTIMATION_CONFIG = \{', 'ESTIMATION_CONFIG object exists'),
                ('viewportToLawnRatio.*streetAddress.*0\.25', 'viewportToLawnRatio.streetAddress ~0.25'),
                ('viewportToLawnRatio.*areaLevel.*0\.10', 'viewportToLawnRatio.areaLevel ~0.10'),
                ('minLawnSqFt.*1500', 'minLawnSqFt: 1500'),
                ('maxLawnSqFt.*60000', 'maxLawnSqFt: 60000'),
                ('fallbackRadiusMeters.*40', 'fallbackRadiusMeters: 40'),
                ('frontYardRatio.*0\.30', 'frontYardRatio: 0.30'),
                ('backYardRatio.*0\.70', 'backYardRatio: 0.70'),
            ]
            
            for pattern, description in config_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            # Check for autoEstimateLawnArea function signature (accepts place, propertyType)
            function_checks = [
                ('const autoEstimateLawnArea = useCallback\(\(place, propertyType\)', 'autoEstimateLawnArea function signature accepts (place, propertyType)'),
                ('const generatePolygonsFromEstimate = useCallback', 'generatePolygonsFromEstimate function exists'),
            ]
            
            for pattern, description in function_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            # Check for confidence state variable
            state_checks = [
                ('const \[estimateConfidence, setEstimateConfidence\] = useState\(\'high\'\)', 'estimateConfidence state variable exists'),
                ('const selectedPlaceRef = useRef\(null\)', 'selectedPlaceRef ref exists'),
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            # Verify DEFAULT_AREA_ESTIMATES is removed (should not exist)
            if 'DEFAULT_AREA_ESTIMATES' in content:
                self.results['code_structure']['details'].append('❌ DEFAULT_AREA_ESTIMATES still exists (should be removed)')
                self.results['code_structure']['status'] = 'failed'
                return False
            else:
                self.results['code_structure']['details'].append('✅ DEFAULT_AREA_ESTIMATES removed (replaced with ESTIMATION_CONFIG)')
            
            self.results['code_structure']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['code_structure']['status'] = 'failed'
            self.results['code_structure']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_estimation_logic(self):
        """Test viewport-based estimation algorithm"""
        print("🔍 Testing Estimation Logic...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['estimation_logic']['status'] = 'failed'
            self.results['estimation_logic']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for viewport/bounds detection
            viewport_checks = [
                ('const viewport = place\.geometry\.viewport', 'Accesses place.geometry.viewport'),
                ('const bounds = place\.geometry\.bounds', 'Accesses place.geometry.bounds'),
                ('const box = viewport \|\| bounds', 'Uses viewport or bounds as fallback'),
                ('const ne = box\.getNorthEast\(\)', 'Gets northeast corner'),
                ('const sw = box\.getSouthWest\(\)', 'Gets southwest corner'),
            ]
            
            for pattern, description in viewport_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['estimation_logic']['details'].append(f"❌ {description}")
                    self.results['estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for area calculation
            area_calc_checks = [
                ('const latMeters = latDiff \* 111320', 'Converts lat difference to meters'),
                ('const lngMeters = lngDiff \* 111320 \* Math\.cos', 'Converts lng difference to meters with cos correction'),
                ('const boundsAreaMeters = latMeters \* lngMeters', 'Calculates bounds area in meters'),
                ('boundsArea = boundsAreaMeters \* 10\.7639', 'Converts to square feet'),
            ]
            
            for pattern, description in area_calc_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['estimation_logic']['details'].append(f"❌ {description}")
                    self.results['estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for quality guardrails
            guardrail_checks = [
                ('if \(boundsArea > 1500000\)', 'Large viewport detection (>1.5M sqft)'),
                ('ratio = 0\.05', 'Reduces ratio to 0.05 for large viewports'),
                ('confidence = \'low\'', 'Sets confidence to low for large viewports'),
                ('if \(boundsArea < 10000\)', 'Small viewport detection (<10K sqft)'),
                ('ratio = Math\.min\(0\.5, ratio \* 1\.5\)', 'Increases ratio by 1.5x for small viewports'),
            ]
            
            for pattern, description in guardrail_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['estimation_logic']['details'].append(f"❌ {description}")
                    self.results['estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for min/max bounds
            bounds_checks = [
                ('Math\.max\(.*ESTIMATION_CONFIG\.minLawnSqFt', 'Applies minimum lawn size bound'),
                ('Math\.min\(.*ESTIMATION_CONFIG\.maxLawnSqFt', 'Applies maximum lawn size bound'),
                ('Math\.round\(estimatedLawnSqFt \/ 100\) \* 100', 'Rounds to nearest 100 sqft'),
            ]
            
            for pattern, description in bounds_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['estimation_logic']['details'].append(f"❌ {description}")
                    self.results['estimation_logic']['status'] = 'failed'
                    return False
            
            self.results['estimation_logic']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['estimation_logic']['status'] = 'failed'
            self.results['estimation_logic']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_confidence_indicator(self):
        """Test confidence indicator logic"""
        print("🔍 Testing Confidence Indicator...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['confidence_indicator']['status'] = 'failed'
            self.results['confidence_indicator']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for address precision detection
            precision_checks = [
                ('const hasStreetNumber = place\.address_components\?\.some', 'Detects street number in address components'),
                ('c\.types\.includes\(\'street_number\'\)', 'Checks for street_number type'),
                ('const hasRoute = place\.address_components\?\.some', 'Detects route in address components'),
                ('c\.types\.includes\(\'route\'\)', 'Checks for route type'),
                ('const isStreetAddress = hasStreetNumber && hasRoute', 'Combines street number and route for precision'),
            ]
            
            for pattern, description in precision_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['confidence_indicator']['details'].append(f"✅ {description}")
                else:
                    self.results['confidence_indicator']['details'].append(f"❌ {description}")
                    self.results['confidence_indicator']['status'] = 'failed'
                    return False
            
            # Check for confidence level assignment
            confidence_checks = [
                ('if \(isStreetAddress\).*confidence = \'high\'', 'High confidence for street addresses'),
                ('ratio = ESTIMATION_CONFIG\.viewportToLawnRatio\.streetAddress', 'Uses streetAddress ratio for high confidence'),
                ('else.*confidence = \'medium\'', 'Medium confidence for area-level addresses'),
                ('ratio = ESTIMATION_CONFIG\.viewportToLawnRatio\.areaLevel', 'Uses areaLevel ratio for medium confidence'),
                ('setEstimateConfidence\(confidence\)', 'Sets confidence state'),
            ]
            
            for pattern, description in confidence_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['confidence_indicator']['details'].append(f"✅ {description}")
                else:
                    self.results['confidence_indicator']['details'].append(f"❌ {description}")
                    self.results['confidence_indicator']['status'] = 'failed'
                    return False
            
            # Check for fallback confidence
            fallback_checks = [
                ('No viewport\/bounds - using fallback estimation', 'Fallback estimation message'),
                ('confidence = \'low\'', 'Low confidence for fallback estimation'),
                ('const radiusMeters = ESTIMATION_CONFIG\.fallbackRadiusMeters', 'Uses fallback radius'),
                ('estimatedLawnSqFt = boundsArea \* 0\.4', 'Assumes 40% of circular area is lawn'),
            ]
            
            for pattern, description in fallback_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['confidence_indicator']['details'].append(f"✅ {description}")
                else:
                    self.results['confidence_indicator']['details'].append(f"❌ {description}")
                    self.results['confidence_indicator']['status'] = 'failed'
                    return False
            
            self.results['confidence_indicator']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['confidence_indicator']['status'] = 'failed'
            self.results['confidence_indicator']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_polygon_generation(self):
        """Test polygon generation from estimates"""
        print("🔍 Testing Polygon Generation...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['polygon_generation']['status'] = 'failed'
            self.results['polygon_generation']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for generatePolygonsFromEstimate function
            generation_checks = [
                ('const generatePolygonsFromEstimate = useCallback\(\(center, estimatedSqFt, propertyType\)', 'generatePolygonsFromEstimate function signature'),
                ('const totalSqMeters = estimatedSqFt \/ 10\.7639', 'Converts sqft to square meters'),
                ('const metersToLatOffset = \(meters\) => meters \/ 111320', 'Helper to convert meters to lat offset'),
                ('const metersToLngOffset = \(meters, lat\) => meters \/ \(111320 \* Math\.cos', 'Helper to convert meters to lng offset with cos correction'),
            ]
            
            for pattern, description in generation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['polygon_generation']['details'].append(f"✅ {description}")
                else:
                    self.results['polygon_generation']['details'].append(f"❌ {description}")
                    self.results['polygon_generation']['status'] = 'failed'
                    return False
            
            # Check for residential front/back yard splitting
            residential_checks = [
                ('if \(propertyType === \'residential\'\)', 'Residential property type handling'),
                ('const frontYardSqMeters = totalSqMeters \* ESTIMATION_CONFIG\.frontYardRatio', 'Front yard area calculation (30%)'),
                ('const backYardSqMeters = totalSqMeters \* ESTIMATION_CONFIG\.backYardRatio', 'Back yard area calculation (70%)'),
                ('ESTIMATION_CONFIG\.frontYardAspect', 'Uses front yard aspect ratio'),
                ('ESTIMATION_CONFIG\.backYardAspect', 'Uses back yard aspect ratio'),
                ('id: \'front-yard-\' \+ Date\.now\(\)', 'Front yard polygon ID'),
                ('id: \'back-yard-\' \+ Date\.now\(\)', 'Back yard polygon ID'),
            ]
            
            for pattern, description in residential_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['polygon_generation']['details'].append(f"✅ {description}")
                else:
                    self.results['polygon_generation']['details'].append(f"❌ {description}")
                    self.results['polygon_generation']['status'] = 'failed'
                    return False
            
            # Check for commercial single polygon
            commercial_checks = [
                ('else.*Commercial: single polygon', 'Commercial property handling comment'),
                ('ESTIMATION_CONFIG\.commercialAspect', 'Uses commercial aspect ratio'),
                ('id: \'commercial-\' \+ Date\.now\(\)', 'Commercial polygon ID'),
            ]
            
            for pattern, description in commercial_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['polygon_generation']['details'].append(f"✅ {description}")
                else:
                    self.results['polygon_generation']['details'].append(f"❌ {description}")
                    self.results['polygon_generation']['status'] = 'failed'
                    return False
            
            # Check for rectangle creation helper
            rectangle_checks = [
                ('const createRectangle = \(centerPoint, areaSqMeters, aspectRatio, offsetLat = 0\)', 'createRectangle helper function'),
                ('const width = Math\.sqrt\(areaSqMeters \* aspectRatio\)', 'Calculates width from area and aspect ratio'),
                ('const depth = areaSqMeters \/ width', 'Calculates depth from area and width'),
                ('const halfWidth = metersToLngOffset\(width \/ 2, centerPoint\.lat\)', 'Converts half width to lng offset'),
                ('const halfDepth = metersToLatOffset\(depth \/ 2\)', 'Converts half depth to lat offset'),
            ]
            
            for pattern, description in rectangle_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['polygon_generation']['details'].append(f"✅ {description}")
                else:
                    self.results['polygon_generation']['details'].append(f"❌ {description}")
                    self.results['polygon_generation']['status'] = 'failed'
                    return False
            
            self.results['polygon_generation']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['polygon_generation']['status'] = 'failed'
            self.results['polygon_generation']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_ui_feedback(self):
        """Test UI feedback based on confidence levels"""
        print("🔍 Testing UI Feedback...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['ui_feedback']['status'] = 'failed'
            self.results['ui_feedback']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for conditional rendering based on confidence
            conditional_checks = [
                ('estimateConfidence === \'high\'', 'Conditional rendering for high confidence'),
                ('estimateConfidence === \'medium\'', 'Conditional rendering for medium confidence'),
                ('estimateConfidence === \'low\'', 'Conditional rendering for low confidence'),
                ('text-green-600 bg-green-50', 'Green styling for high confidence'),
                ('text-yellow-700 bg-yellow-50', 'Yellow styling for medium confidence'),
                ('text-orange-600 bg-orange-50', 'Orange styling for low confidence'),
            ]
            
            for pattern, description in conditional_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_feedback']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_feedback']['details'].append(f"❌ {description}")
                    self.results['ui_feedback']['status'] = 'failed'
                    return False
            
            # Check for specific confidence messages
            message_checks = [
                ('Estimated lawn area — drag corners to adjust', 'High confidence message'),
                ('please verify and adjust as needed', 'Medium confidence message'),
                ('Rough estimate — please adjust', 'Low confidence message'),
                ('✓.*Estimated lawn area', 'High confidence checkmark icon'),
                ('⚡.*Estimated lawn area', 'Medium confidence lightning icon'),
                ('⚠️.*Rough estimate', 'Low confidence warning icon'),
            ]
            
            for pattern, description in message_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_feedback']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_feedback']['details'].append(f"❌ {description}")
                    self.results['ui_feedback']['status'] = 'failed'
                    return False
            
            # Check for auto-estimating loading state
            loading_checks = [
                ('isAutoEstimating &&', 'Auto-estimating loading state conditional'),
                ('Detecting lawn area\.\.\.', 'Auto-estimation loading message'),
                ('animate-spin', 'Loading spinner animation'),
                ('text-blue-600 bg-blue-50', 'Blue styling for loading state'),
            ]
            
            for pattern, description in loading_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_feedback']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_feedback']['details'].append(f"❌ {description}")
                    self.results['ui_feedback']['status'] = 'failed'
                    return False
            
            self.results['ui_feedback']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['ui_feedback']['status'] = 'failed'
            self.results['ui_feedback']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_console_logging(self):
        """Test console logging for debugging and verification"""
        print("🔍 Testing Console Logging...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['console_logging']['status'] = 'failed'
            self.results['console_logging']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for auto-estimation start/end logging
            estimation_logging_checks = [
                ('\[Quote\] ===== AUTO-ESTIMATION START =====', 'Auto-estimation start log'),
                ('\[Quote\] ===== AUTO-ESTIMATION END =====', 'Auto-estimation end log'),
                ('\[Quote\] Address:', 'Address logging'),
                ('\[Quote\] Center:', 'Center coordinates logging'),
                ('\[Quote\] Property type:', 'Property type logging'),
            ]
            
            for pattern, description in estimation_logging_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['console_logging']['details'].append(f"✅ {description}")
                else:
                    self.results['console_logging']['details'].append(f"❌ {description}")
                    self.results['console_logging']['status'] = 'failed'
                    return False
            
            # Check for bounds area calculation logging
            bounds_logging_checks = [
                ('\[Quote\] Viewport\/Bounds detected:', 'Viewport/bounds detection log'),
                ('\[Quote\]   - NE:', 'Northeast corner logging'),
                ('\[Quote\]   - SW:', 'Southwest corner logging'),
                ('\[Quote\]   - Dimensions:', 'Dimensions logging'),
                ('\[Quote\]   - Bounds area:', 'Bounds area logging'),
                ('\[Quote\] Bounds area.*sqft', 'Bounds area in sqft logging'),
            ]
            
            for pattern, description in bounds_logging_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['console_logging']['details'].append(f"✅ {description}")
                else:
                    self.results['console_logging']['details'].append(f"❌ {description}")
                    self.results['console_logging']['status'] = 'failed'
                    return False
            
            # Check for estimation calculation logging
            calculation_logging_checks = [
                ('\[Quote\] Estimation ratio:', 'Estimation ratio logging'),
                ('\[Quote\] Raw estimate:', 'Raw estimate logging'),
                ('\[Quote\] Final estimated lawn area:', 'Final estimated lawn area logging'),
                ('\[Quote\] Confidence level:', 'Confidence level logging'),
                ('\[Quote\] Created.*polygon\(s\)', 'Created polygons count logging'),
                ('\[Quote\] Total polygon area:', 'Total polygon area logging'),
            ]
            
            for pattern, description in calculation_logging_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['console_logging']['details'].append(f"✅ {description}")
                else:
                    self.results['console_logging']['details'].append(f"❌ {description}")
                    self.results['console_logging']['status'] = 'failed'
                    return False
            
            # Check for special case logging
            special_case_logging_checks = [
                ('\[Quote\] Large viewport detected, reducing ratio', 'Large viewport detection log'),
                ('\[Quote\] Small viewport detected, increasing ratio', 'Small viewport detection log'),
                ('\[Quote\] No viewport\/bounds - using fallback estimation', 'Fallback estimation log'),
            ]
            
            for pattern, description in special_case_logging_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['console_logging']['details'].append(f"✅ {description}")
                else:
                    self.results['console_logging']['details'].append(f"❌ {description}")
                    self.results['console_logging']['status'] = 'failed'
                    return False
            
            self.results['console_logging']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['console_logging']['status'] = 'failed'
            self.results['console_logging']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_place_reference_storage(self):
        """Test stored place reference for re-estimation"""
        print("🔍 Testing Place Reference Storage...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['place_reference_storage']['status'] = 'failed'
            self.results['place_reference_storage']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for selectedPlaceRef declaration and usage
            place_ref_checks = [
                ('const selectedPlaceRef = useRef\(null\)', 'selectedPlaceRef ref declared'),
                ('selectedPlaceRef\.current = place', 'Stores full place object in ref'),
                ('Store full place object for estimation', 'Comment about storing place object'),
            ]
            
            for pattern, description in place_ref_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['place_reference_storage']['details'].append(f"✅ {description}")
                else:
                    self.results['place_reference_storage']['details'].append(f"❌ {description}")
                    self.results['place_reference_storage']['status'] = 'failed'
                    return False
            
            # Check for property type change re-estimation
            property_type_reestimation_checks = [
                ('const handlePropertyTypeChange = \(value\)', 'handlePropertyTypeChange function'),
                ('if \(selectedPlaceRef\.current\)', 'Checks for stored place reference'),
                ('autoEstimateLawnArea\(selectedPlaceRef\.current, value\)', 'Re-estimates using stored place and new property type'),
                ('Re-estimate when property type changes', 'Comment about re-estimation'),
            ]
            
            for pattern, description in property_type_reestimation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['place_reference_storage']['details'].append(f"✅ {description}")
                else:
                    self.results['place_reference_storage']['details'].append(f"❌ {description}")
                    self.results['place_reference_storage']['status'] = 'failed'
                    return False
            
            # Check for fallback place object creation
            fallback_checks = [
                ('else if \(formData\.latitude && formData\.longitude\)', 'Fallback for coordinates without place object'),
                ('const fallbackPlace = \{', 'Creates fallback place object'),
                ('geometry: \{.*location:', 'Fallback place geometry structure'),
                ('lat: \(\) => formData\.latitude', 'Fallback lat function'),
                ('lng: \(\) => formData\.longitude', 'Fallback lng function'),
                ('formatted_address: formData\.address', 'Fallback formatted address'),
            ]
            
            for pattern, description in fallback_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['place_reference_storage']['details'].append(f"✅ {description}")
                else:
                    self.results['place_reference_storage']['details'].append(f"❌ {description}")
                    self.results['place_reference_storage']['status'] = 'failed'
                    return False
            
            # Check for place object usage in onPlaceChanged
            place_changed_usage_checks = [
                ('const onPlaceChanged = useCallback', 'onPlaceChanged callback function'),
                ('const place = autocompleteRef\.current\.getPlace\(\)', 'Gets place from autocomplete'),
                ('autoEstimateLawnArea\(place, formData\.propertyType\)', 'Passes full place object to estimation'),
                ('setTimeout\(\(\) => \{.*autoEstimateLawnArea\(place', 'Delayed estimation with place object'),
            ]
            
            for pattern, description in place_changed_usage_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['place_reference_storage']['details'].append(f"✅ {description}")
                else:
                    self.results['place_reference_storage']['details'].append(f"❌ {description}")
                    self.results['place_reference_storage']['status'] = 'failed'
                    return False
            
            self.results['place_reference_storage']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['place_reference_storage']['status'] = 'failed'
            self.results['place_reference_storage']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Check Quote.js exists and has proper structure
            quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'ESTIMATION_CONFIG' in quote_content and 'autoEstimateLawnArea' in quote_content:
                    integration_checks.append("✅ Quote.js properly implements viewport-based estimation structure")
                else:
                    integration_checks.append("❌ Quote.js missing key viewport-based estimation features")
            else:
                integration_checks.append("❌ Quote.js file missing")
            
            # 2. Check ESTIMATION_CONFIG configuration
            if quote_file.exists():
                if 'viewportToLawnRatio' in quote_content and 'streetAddress: 0.25' in quote_content:
                    integration_checks.append("✅ ESTIMATION_CONFIG properly configured with viewport ratios")
                else:
                    integration_checks.append("❌ ESTIMATION_CONFIG missing or incomplete")
            
            # 3. Check viewport-based calculation
            if quote_file.exists():
                if 'place.geometry.viewport' in quote_content and 'boundsArea * ratio' in quote_content:
                    integration_checks.append("✅ Viewport-based area calculation implemented")
                else:
                    integration_checks.append("❌ Viewport-based calculation missing or incomplete")
            
            # 4. Check confidence indicator system
            if quote_file.exists():
                if 'estimateConfidence' in quote_content and 'setEstimateConfidence' in quote_content:
                    integration_checks.append("✅ Confidence indicator system implemented")
                else:
                    integration_checks.append("❌ Confidence indicator system missing")
            
            # 5. Check polygon generation from estimates
            if quote_file.exists():
                if 'generatePolygonsFromEstimate' in quote_content and 'frontYardRatio' in quote_content:
                    integration_checks.append("✅ Polygon generation from estimates implemented")
                else:
                    integration_checks.append("❌ Polygon generation from estimates missing")
            
            # 6. Check UI feedback based on confidence
            if quote_file.exists():
                if 'estimateConfidence === \'high\'' in quote_content and 'drag corners to adjust' in quote_content:
                    integration_checks.append("✅ UI feedback based on confidence levels implemented")
                else:
                    integration_checks.append("❌ UI feedback based on confidence incomplete")
            
            # 7. Check console logging
            if quote_file.exists():
                if '[Quote] ===== AUTO-ESTIMATION START =====' in quote_content and 'Final estimated lawn area' in quote_content:
                    integration_checks.append("✅ Comprehensive console logging implemented")
                else:
                    integration_checks.append("❌ Console logging incomplete")
            
            # 8. Check place reference storage
            if quote_file.exists():
                if 'selectedPlaceRef.current = place' in quote_content and 'handlePropertyTypeChange' in quote_content:
                    integration_checks.append("✅ Place reference storage for re-estimation implemented")
                else:
                    integration_checks.append("❌ Place reference storage incomplete")
            
            self.results['integration_flow']['details'] = integration_checks
            
            # Determine overall integration status
            failed_checks = [check for check in integration_checks if check.startswith("❌")]
            if failed_checks:
                self.results['integration_flow']['status'] = 'failed'
                return False
            else:
                self.results['integration_flow']['status'] = 'passed'
                return True
                
        except Exception as e:
            self.results['integration_flow']['status'] = 'failed'
            self.results['integration_flow']['details'].append(f"Error testing integration: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Check Quote.js exists and has proper structure
            quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'const [polygons, setPolygons] = useState([])' in quote_content and 'autoEstimateLawnArea' in quote_content:
                    integration_checks.append("✅ Quote.js properly implements multi-polygon state and auto-estimation")
                else:
                    integration_checks.append("❌ Quote.js missing key multi-polygon features")
            else:
                integration_checks.append("❌ Quote.js file missing")
            
            # 2. Check satellite view configuration
            if quote_file.exists():
                if 'mapTypeId="satellite"' in quote_content and 'mapTypeControl: true' in quote_content:
                    integration_checks.append("✅ Map properly configured with satellite view by default")
                else:
                    integration_checks.append("❌ Map satellite view configuration incomplete")
            
            # 3. Check editable polygon options
            if quote_file.exists():
                if 'editable: true' in quote_content and 'editablePolygonOptions' in quote_content:
                    integration_checks.append("✅ Editable polygon options properly configured")
                else:
                    integration_checks.append("❌ Editable polygon options missing or incomplete")
            
            # 4. Check auto-estimation after address selection
            if quote_file.exists():
                if 'onPlaceChanged' in quote_content and 'autoEstimateLawnArea' in quote_content and 'setTimeout' in quote_content:
                    integration_checks.append("✅ Auto-estimation properly triggered after address selection")
                else:
                    integration_checks.append("❌ Auto-estimation integration incomplete")
            
            # 5. Check multi-polygon rendering
            if quote_file.exists():
                if 'polygons.map((polygon, index)' in quote_content and 'key={polygon.id}' in quote_content:
                    integration_checks.append("✅ Multi-polygon rendering with proper React keys")
                else:
                    integration_checks.append("❌ Multi-polygon rendering incomplete")
            
            # 6. Check UI controls
            if quote_file.exists():
                if '➕ Add Zone' in quote_content and '🗑️ Clear All' in quote_content and 'deletePolygon(index)' in quote_content:
                    integration_checks.append("✅ UI controls for polygon management implemented")
                else:
                    integration_checks.append("❌ UI controls incomplete")
            
            # 7. Check data model integration
            if quote_file.exists():
                if 'totalCalculatedArea' in quote_content and 'recalculateTotalArea' in quote_content and 'polygons: polygons' in quote_content:
                    integration_checks.append("✅ Data model properly integrates with quote saving")
                else:
                    integration_checks.append("❌ Data model integration incomplete")
            
            # 8. Check event handlers
            if quote_file.exists():
                if 'handlePolygonPathChange' in quote_content and 'handlePropertyTypeChange' in quote_content and 'set_at' in quote_content:
                    integration_checks.append("✅ Event handlers for polygon editing and property type changes")
                else:
                    integration_checks.append("❌ Event handlers incomplete")
            
            self.results['integration_flow']['details'] = integration_checks
            
            # Determine overall integration status
            failed_checks = [check for check in integration_checks if check.startswith("❌")]
            if failed_checks:
                self.results['integration_flow']['status'] = 'failed'
                return False
            else:
                self.results['integration_flow']['status'] = 'passed'
                return True
                
        except Exception as e:
            self.results['integration_flow']['status'] = 'failed'
            self.results['integration_flow']['details'].append(f"Error testing integration: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and return results"""
        print("🚀 Starting GreenQuote Pro App Viewport-Based Lawn Area Estimation Feature Tests\n")
        
        tests = [
            ('Code Structure', self.test_code_structure),
            ('Estimation Logic', self.test_estimation_logic),
            ('Confidence Indicator', self.test_confidence_indicator),
            ('Polygon Generation', self.test_polygon_generation),
            ('UI Feedback', self.test_ui_feedback),
            ('Console Logging', self.test_console_logging),
            ('Place Reference Storage', self.test_place_reference_storage),
            ('Integration Flow', self.test_integration_flow)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if result:
                    passed += 1
                    print(f"✅ {test_name}: PASSED")
                else:
                    print(f"❌ {test_name}: FAILED")
            except Exception as e:
                print(f"💥 {test_name}: ERROR - {str(e)}")
            print()
        
        return passed, total, self.results
    
    def print_detailed_results(self):
        """Print detailed test results"""
        print("📋 DETAILED TEST RESULTS")
        print("=" * 50)
        
        for test_name, result in self.results.items():
            status_emoji = "✅" if result['status'] == 'passed' else "❌" if result['status'] == 'failed' else "⏳"
            print(f"\n{status_emoji} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")
            
            for detail in result['details']:
                print(f"  {detail}")

def main():
    """Main test execution"""
    tester = GreenQuoteViewportEstimationTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Viewport-based lawn area estimation feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
