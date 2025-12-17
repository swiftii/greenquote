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
    
    def test_multi_polygon_support(self):
        """Test multi-polygon support implementation"""
        print("🔍 Testing Multi-Polygon Support...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['multi_polygon_support']['status'] = 'failed'
            self.results['multi_polygon_support']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for multi-polygon state management
            polygon_state_checks = [
                ('const \[polygons, setPolygons\] = useState\(\[\]\)', 'Polygons array state (not single path)'),
                ('\{id, path: \[\{lat, lng\}\], areaSqFt\}', 'Polygon data structure with id, path, and area'),
                ('const recalculateTotalArea = useCallback\(\(currentPolygons\)', 'Recalculate total from all polygons'),
                ('total \+= areaSqFt', 'Sums areas from all polygons'),
                ('setTotalCalculatedArea\(total\)', 'Updates total calculated area state'),
            ]
            
            for pattern, description in polygon_state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_support']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_support']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_support']['status'] = 'failed'
                    return False
            
            # Check for polygon rendering with map iterator
            rendering_checks = [
                ('\{polygons\.map\(\(polygon, index\)', 'Polygons rendered with .map() iterator'),
                ('<Polygon.*key=\{polygon\.id\}', 'Each polygon has key={polygon.id}'),
                ('paths=\{polygon\.path\}', 'Polygon paths from state'),
                ('options=\{editablePolygonOptions\}', 'Uses editable polygon options'),
            ]
            
            for pattern, description in rendering_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_support']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_support']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_support']['status'] = 'failed'
                    return False
            
            # Check for polygon management functions
            management_checks = [
                ('const deletePolygon = \(index\)', 'Delete individual polygon function'),
                ('const clearAllPolygons = \(\)', 'Clear all polygons function'),
                ('const finishDrawing = \(\)', 'Finish drawing new polygon function'),
                ('const startDrawing = \(\)', 'Start drawing new polygon function'),
                ('updated = \[\.\.\.prev, newPolygon\]', 'Adds new polygon to array'),
                ('updated = prev\.filter\(\(_, i\) => i !== index\)', 'Removes polygon by index'),
            ]
            
            for pattern, description in management_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_support']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_support']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_support']['status'] = 'failed'
                    return False
            
            self.results['multi_polygon_support']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['multi_polygon_support']['status'] = 'failed'
            self.results['multi_polygon_support']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_editable_polygons(self):
        """Test editable polygons with draggable vertices"""
        print("🔍 Testing Editable Polygons...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['editable_polygons']['status'] = 'failed'
            self.results['editable_polygons']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for editable polygon options
            editable_options_checks = [
                ('const editablePolygonOptions = \{', 'editablePolygonOptions constant defined'),
                ('editable: true', 'Polygons are editable (vertex dragging enabled)'),
                ('fillColor.*fillOpacity', 'Fill styling properties'),
                ('strokeColor.*strokeWeight', 'Stroke styling properties'),
                ('clickable: true', 'Polygons are clickable'),
                ('draggable: false', 'Polygon dragging disabled (vertices only)'),
            ]
            
            for pattern, description in editable_options_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['editable_polygons']['details'].append(f"✅ {description}")
                else:
                    self.results['editable_polygons']['details'].append(f"❌ {description}")
                    self.results['editable_polygons']['status'] = 'failed'
                    return False
            
            # Check for path change event listeners
            event_listener_checks = [
                ('const handlePolygonPathChange = useCallback\(\(polygonIndex, newPath\)', 'handlePolygonPathChange function'),
                ('window\.google\.maps\.event\.addListener\(path, \'set_at\'', 'set_at event listener for vertex drag'),
                ('window\.google\.maps\.event\.addListener\(path, \'insert_at\'', 'insert_at event listener for vertex insertion'),
                ('window\.google\.maps\.event\.addListener\(path, \'remove_at\'', 'remove_at event listener for vertex removal'),
                ('handlePolygonPathChange\(index, newPath\)', 'Calls path change handler on vertex changes'),
            ]
            
            for pattern, description in event_listener_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['editable_polygons']['details'].append(f"✅ {description}")
                else:
                    self.results['editable_polygons']['details'].append(f"❌ {description}")
                    self.results['editable_polygons']['status'] = 'failed'
                    return False
            
            # Check for polygon refs management
            refs_checks = [
                ('const polygonRefs = useRef\(\[\]\)', 'Polygon refs array for Google Maps instances'),
                ('onLoad=\{\(polygonInstance\)', 'Polygon onLoad handler'),
                ('polygonRefs\.current\[index\] = polygonInstance', 'Stores polygon instance in refs'),
                ('const path = polygonInstance\.getPath\(\)', 'Gets polygon path from instance'),
                ('path\.getLength\(\)', 'Gets path length for iteration'),
                ('path\.getAt\(i\)', 'Gets point at index from path'),
            ]
            
            for pattern, description in refs_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['editable_polygons']['details'].append(f"✅ {description}")
                else:
                    self.results['editable_polygons']['details'].append(f"❌ {description}")
                    self.results['editable_polygons']['status'] = 'failed'
                    return False
            
            self.results['editable_polygons']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['editable_polygons']['status'] = 'failed'
            self.results['editable_polygons']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_ui_controls(self):
        """Test UI controls for polygon management"""
        print("🔍 Testing UI Controls...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['ui_controls']['status'] = 'failed'
            self.results['ui_controls']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for UI control buttons
            button_checks = [
                ('➕ Add Zone', 'Add Zone button text'),
                ('onClick=\{startDrawing\}', 'Add Zone button calls startDrawing'),
                ('🗑️ Clear All', 'Clear All button text'),
                ('onClick=\{clearAllPolygons\}', 'Clear All button calls clearAllPolygons'),
                ('↩️ Undo', 'Undo button for drawing'),
                ('onClick=\{undoLastPoint\}', 'Undo button calls undoLastPoint'),
                ('✓ Done', 'Done button for finishing drawing'),
                ('onClick=\{finishDrawing\}', 'Done button calls finishDrawing'),
            ]
            
            for pattern, description in button_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_controls']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_controls']['details'].append(f"❌ {description}")
                    self.results['ui_controls']['status'] = 'failed'
                    return False
            
            # Check for individual polygon delete buttons
            delete_checks = [
                ('Service Zones \(\{polygons\.length\}\)', 'Zone list showing polygon count'),
                ('Zone \{index \+ 1\}:', 'Individual zone numbering'),
                ('\{polygon\.areaSqFt\?\.toLocaleString\(\)', 'Individual polygon area display'),
                ('onClick=\{\(\) => deletePolygon\(index\)\}', 'Individual delete button per polygon'),
                ('✕', 'Delete button icon'),
            ]
            
            for pattern, description in delete_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_controls']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_controls']['details'].append(f"❌ {description}")
                    self.results['ui_controls']['status'] = 'failed'
                    return False
            
            # Check for status messages and loading states
            status_checks = [
                ('\{isAutoEstimating && \(', 'Auto-estimating loading state conditional'),
                ('Detecting lawn area\.\.\.', 'Auto-estimation loading message'),
                ('animate-spin', 'Loading spinner animation'),
                ('We estimated your lawn area', 'Auto-estimation success message'),
                ('drag corners to adjust', 'User instruction for editing'),
                ('Click on the map to add boundary points', 'Drawing instruction message'),
            ]
            
            for pattern, description in status_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['ui_controls']['details'].append(f"✅ {description}")
                else:
                    self.results['ui_controls']['details'].append(f"❌ {description}")
                    self.results['ui_controls']['status'] = 'failed'
                    return False
            
            self.results['ui_controls']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['ui_controls']['status'] = 'failed'
            self.results['ui_controls']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_data_model(self):
        """Test data model for polygons and area calculation"""
        print("🔍 Testing Data Model...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['data_model']['status'] = 'failed'
            self.results['data_model']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for polygon data structure
            data_structure_checks = [
                ('\{id, path: \[\{lat, lng\}\], areaSqFt\}', 'Polygon object structure with id, path, and area'),
                ('id: \'manual-\' \+ Date\.now\(\)', 'Manual polygon ID generation'),
                ('path: currentDrawingPath', 'Path from drawing coordinates'),
                ('areaSqFt: 0', 'Initial area set to 0 (calculated later)'),
                ('const updatedPolygons = currentPolygons\.map\(p => \{', 'Updates polygon areas in array'),
            ]
            
            for pattern, description in data_structure_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['data_model']['details'].append(f"✅ {description}")
                else:
                    self.results['data_model']['details'].append(f"❌ {description}")
                    self.results['data_model']['status'] = 'failed'
                    return False
            
            # Check for area calculation logic
            area_calculation_checks = [
                ('const calculateSinglePolygonArea = useCallback\(\(path\)', 'Single polygon area calculation function'),
                ('window\.google\.maps\.geometry\.spherical\.computeArea', 'Uses Google Maps spherical geometry'),
                ('Math\.round\(areaInSqMeters \* 10\.7639\)', 'Converts square meters to square feet'),
                ('const areaSqFt = calculateSinglePolygonArea\(p\.path\)', 'Calculates area for each polygon'),
                ('total \+= areaSqFt', 'Sums all polygon areas'),
                ('return \{ \.\.\.p, areaSqFt \}', 'Updates polygon with calculated area'),
            ]
            
            for pattern, description in area_calculation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['data_model']['details'].append(f"✅ {description}")
                else:
                    self.results['data_model']['details'].append(f"❌ {description}")
                    self.results['data_model']['status'] = 'failed'
                    return False
            
            # Check for total area state management
            total_area_checks = [
                ('const \[totalCalculatedArea, setTotalCalculatedArea\]', 'Total calculated area state'),
                ('setTotalCalculatedArea\(total\)', 'Updates total calculated area'),
                ('lawnSizeSqFt: total > 0 \? total\.toString\(\)', 'Updates form lawn size from total'),
                ('areaSource: total > 0 \? \'measured\' : \'manual\'', 'Sets area source based on measurement'),
                ('Total: \{totalCalculatedArea\.toLocaleString\(\)', 'Displays total area with formatting'),
            ]
            
            for pattern, description in total_area_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['data_model']['details'].append(f"✅ {description}")
                else:
                    self.results['data_model']['details'].append(f"❌ {description}")
                    self.results['data_model']['status'] = 'failed'
                    return False
            
            # Check for quote save data inclusion
            save_data_checks = [
                ('polygons: polygons', 'Polygons array included in quote save data'),
                ('totalAreaSqFt: totalCalculatedArea', 'Total area included in quote save data'),
                ('areaSource: formData\.areaSource', 'Area source (measured/manual) included'),
                ('\{polygons\.length > 1 && \(', 'Multi-zone display logic'),
                ('\(\{polygons\.length\} zones\)', 'Zone count display'),
            ]
            
            for pattern, description in save_data_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['data_model']['details'].append(f"✅ {description}")
                else:
                    self.results['data_model']['details'].append(f"❌ {description}")
                    self.results['data_model']['status'] = 'failed'
                    return False
            
            self.results['data_model']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['data_model']['status'] = 'failed'
            self.results['data_model']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_event_handlers(self):
        """Test event handlers for property type changes and polygon interactions"""
        print("🔍 Testing Event Handlers...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['event_handlers']['status'] = 'failed'
            self.results['event_handlers']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for property type change handler
            property_type_checks = [
                ('const handlePropertyTypeChange = \(value\)', 'handlePropertyTypeChange function'),
                ('handleInputChange\(\'propertyType\', value\)', 'Updates property type in form data'),
                ('if \(formData\.latitude && formData\.longitude\)', 'Checks for existing coordinates'),
                ('setPolygons\(\[\]\)', 'Clears existing polygons on property type change'),
                ('autoEstimateLawnArea\(.*value\)', 'Re-triggers estimation with new property type'),
                ('onValueChange=\{handlePropertyTypeChange\}', 'Property type select calls handler'),
            ]
            
            for pattern, description in property_type_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['event_handlers']['details'].append(f"✅ {description}")
                else:
                    self.results['event_handlers']['details'].append(f"❌ {description}")
                    self.results['event_handlers']['status'] = 'failed'
                    return False
            
            # Check for map interaction handlers
            map_interaction_checks = [
                ('const onMapClick = useCallback\(\(event\)', 'Map click handler for drawing'),
                ('if \(!isDrawing\) return', 'Only handles clicks when drawing'),
                ('lat: event\.latLng\.lat\(\)', 'Extracts latitude from click event'),
                ('lng: event\.latLng\.lng\(\)', 'Extracts longitude from click event'),
                ('setCurrentDrawingPath\(prev => \[\.\.\.prev, newPoint\]\)', 'Adds point to current drawing path'),
                ('onClick=\{onMapClick\}', 'Map component uses click handler'),
            ]
            
            for pattern, description in map_interaction_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['event_handlers']['details'].append(f"✅ {description}")
                else:
                    self.results['event_handlers']['details'].append(f"❌ {description}")
                    self.results['event_handlers']['status'] = 'failed'
                    return False
            
            # Check for polygon path change handling
            path_change_checks = [
                ('const handlePolygonPathChange = useCallback\(\(polygonIndex, newPath\)', 'Polygon path change handler'),
                ('updated\[polygonIndex\] = \{', 'Updates specific polygon by index'),
                ('path: newPath', 'Updates polygon path with new coordinates'),
                ('return recalculateTotalArea\(updated\)', 'Recalculates total area after path change'),
                ('onMouseUp=\{\(\) => \{', 'Mouse up handler for polygon editing'),
            ]
            
            for pattern, description in path_change_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['event_handlers']['details'].append(f"✅ {description}")
                else:
                    self.results['event_handlers']['details'].append(f"❌ {description}")
                    self.results['event_handlers']['status'] = 'failed'
                    return False
            
            # Check for drawing state management
            drawing_state_checks = [
                ('const startDrawing = \(\)', 'Start drawing function'),
                ('setIsDrawing\(true\)', 'Sets drawing state to true'),
                ('setCurrentDrawingPath\(\[\]\)', 'Clears current drawing path'),
                ('const finishDrawing = \(\)', 'Finish drawing function'),
                ('if \(currentDrawingPath\.length >= 3\)', 'Validates minimum 3 points for polygon'),
                ('setIsDrawing\(false\)', 'Sets drawing state to false'),
            ]
            
            for pattern, description in drawing_state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['event_handlers']['details'].append(f"✅ {description}")
                else:
                    self.results['event_handlers']['details'].append(f"❌ {description}")
                    self.results['event_handlers']['status'] = 'failed'
                    return False
            
            self.results['event_handlers']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['event_handlers']['status'] = 'failed'
            self.results['event_handlers']['details'].append(f"Error reading Quote.js: {str(e)}")
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
        print("🚀 Starting GreenQuote Pro App Quote.js Property Drawing Feature Tests\n")
        
        tests = [
            ('Code Structure', self.test_code_structure),
            ('Satellite View Configuration', self.test_satellite_view_config),
            ('Auto-Estimation Logic', self.test_auto_estimation_logic),
            ('Multi-Polygon Support', self.test_multi_polygon_support),
            ('Editable Polygons', self.test_editable_polygons),
            ('UI Controls', self.test_ui_controls),
            ('Data Model', self.test_data_model),
            ('Event Handlers', self.test_event_handlers),
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
    tester = GreenQuotePropertyDrawingTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Quote.js property drawing feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
