#!/usr/bin/env python3
"""
Backend Testing for GreenQuote Pro App Quote.js Property Drawing Feature

This test suite verifies the improved property drawing feature in Quote.js page:
1. Satellite View Default - Map initializes with satellite view
2. Auto-Estimation After Address Selection - autoEstimateLawnArea() function
3. Multi-Polygon Support - polygons array state and management
4. Editable Polygons with Draggable Vertices - editablePolygonOptions
5. UI Controls - Add Zone, Clear All, individual delete buttons
6. Data Model - polygons array with individual areas and totalCalculatedArea

Since this is a frontend React feature, we focus on:
- Code structure and logic verification
- State management and event handlers
- Google Maps integration and configuration
- Multi-polygon data model implementation
"""

import os
import sys
import json
import re
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuotePropertyDrawingTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'code_structure': {'status': 'pending', 'details': []},
            'satellite_view_config': {'status': 'pending', 'details': []},
            'auto_estimation_logic': {'status': 'pending', 'details': []},
            'multi_polygon_support': {'status': 'pending', 'details': []},
            'editable_polygons': {'status': 'pending', 'details': []},
            'ui_controls': {'status': 'pending', 'details': []},
            'data_model': {'status': 'pending', 'details': []},
            'event_handlers': {'status': 'pending', 'details': []},
            'integration_flow': {'status': 'pending', 'details': []}
        }
        
    def test_code_structure(self):
        """Test Quote.js code structure and imports"""
        print("🔍 Testing Code Structure...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['code_structure']['status'] = 'failed'
            self.results['code_structure']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for required imports
            import_checks = [
                ('import.*GoogleMap.*useJsApiLoader.*Autocomplete.*Polygon.*@react-google-maps/api', 'Google Maps imports'),
                ('useState.*useEffect.*useCallback.*useRef', 'React hooks imports'),
                ('DEFAULT_AREA_ESTIMATES', 'Default area estimates constant'),
                ('editablePolygonOptions', 'Editable polygon options constant'),
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            # Check for state variables
            state_checks = [
                ('const \\[polygons, setPolygons\\] = useState\\(\\[\\]\\)', 'Polygons array state'),
                ('const \\[totalCalculatedArea, setTotalCalculatedArea\\] = useState\\(0\\)', 'Total calculated area state'),
                ('const \\[isAutoEstimating, setIsAutoEstimating\\] = useState\\(false\\)', 'Auto-estimating state'),
                ('const \\[currentDrawingPath, setCurrentDrawingPath\\] = useState\\(\\[\\]\\)', 'Current drawing path state'),
                ('const polygonRefs = useRef\\(\\[\\]\\)', 'Polygon refs for Google Maps instances'),
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            # Check for key functions
            function_checks = [
                ('const autoEstimateLawnArea = useCallback', 'autoEstimateLawnArea function'),
                ('const recalculateTotalArea = useCallback', 'recalculateTotalArea function'),
                ('const handlePolygonPathChange = useCallback', 'handlePolygonPathChange function'),
                ('const calculateSinglePolygonArea = useCallback', 'calculateSinglePolygonArea function'),
                ('const handlePropertyTypeChange', 'handlePropertyTypeChange function'),
            ]
            
            for pattern, description in function_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['code_structure']['details'].append(f"✅ {description}")
                else:
                    self.results['code_structure']['details'].append(f"❌ {description}")
                    self.results['code_structure']['status'] = 'failed'
                    return False
            
            self.results['code_structure']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['code_structure']['status'] = 'failed'
            self.results['code_structure']['details'].append(f"Error reading Quote.js: {str(e)}")
            return False
    
    def test_widget_integration(self):
        """Test Widget integration with ServiceAreaManager"""
        print("🔍 Testing Widget Integration...")
        
        widget_file = self.app_dir / 'widgets' / 'lawn' / 'v1' / 'widget.js'
        
        if not widget_file.exists():
            self.results['widget_integration']['status'] = 'failed'
            self.results['widget_integration']['details'].append('❌ Widget file not found')
            return False
            
        try:
            content = widget_file.read_text()
            
            # Check for ServiceAreaManager integration
            integration_checks = [
                ('let serviceAreaManager = null', 'ServiceAreaManager variable declaration'),
                ('serviceAreaManager = new ServiceAreaManager\\(map', 'ServiceAreaManager initialization'),
                ('onAreaChange.*totalSqFt, breakdown', 'onAreaChange callback implementation'),
                ('onPolygonsCreated.*count', 'onPolygonsCreated callback implementation'),
                ('state\\.polygonCoords = \\[\\]', 'Multi-polygon coordinates state'),
                ('serviceAreaManager\\.getCoordinatesSnapshot\\(\\)', 'Coordinates snapshot usage'),
            ]
            
            for pattern, description in integration_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_integration']['details'].append(f"❌ {description}")
                    self.results['widget_integration']['status'] = 'failed'
                    return False
            
            # Check for map initialization with satellite view
            map_checks = [
                ('mapTypeId.*satellite', 'Satellite view by default'),
                ('mapTypeControl.*true', 'Map type control enabled'),
                ('mapTypeControlOptions', 'Map type control options'),
            ]
            
            for pattern, description in map_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_integration']['details'].append(f"❌ {description}")
                    self.results['widget_integration']['status'] = 'failed'
                    return False
            
            # Check for auto-draw functionality
            autodraw_checks = [
                ('autoDrawServiceArea\\(place\\)', 'Auto-draw service area function'),
                ('serviceAreaManager\\.autoEstimate\\(place, state\\.propertyType', 'Auto-estimate call'),
                ('showAutoDrawFallback\\(\\)', 'Auto-draw fallback function'),
                ('updateLawnSizeDisplay', 'Lawn size display update'),
            ]
            
            for pattern, description in autodraw_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_integration']['details'].append(f"❌ {description}")
                    self.results['widget_integration']['status'] = 'failed'
                    return False
            
            # Check for polygon count display
            display_checks = [
                ('polygonCount > 1.*zones', 'Multi-zone display logic'),
                ('result\\.polygonCount', 'Polygon count from auto-estimate result'),
                ('serviceAreaManager\\.getPolygonCount\\(\\)', 'Get polygon count method usage'),
            ]
            
            for pattern, description in display_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_integration']['details'].append(f"❌ {description}")
                    self.results['widget_integration']['status'] = 'failed'
                    return False
            
            # Check for manual drawing integration
            drawing_checks = [
                ('serviceAreaManager\\.clearAll\\(\\)', 'Clear all polygons method usage'),
                ('serviceAreaManager\\.addPolygon\\(polygon\\)', 'Add polygon method usage'),
                ('drawingManager\\.setDrawingMode', 'Drawing manager integration'),
            ]
            
            for pattern, description in drawing_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_integration']['details'].append(f"❌ {description}")
                    self.results['widget_integration']['status'] = 'failed'
                    return False
            
            self.results['widget_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['widget_integration']['status'] = 'failed'
            self.results['widget_integration']['details'].append(f"Error reading widget file: {str(e)}")
            return False
    
    def test_pro_app_integration(self):
        """Test Pro App integration with ServiceAreaManager"""
        print("🔍 Testing Pro App Integration...")
        
        pro_file = self.app_dir / 'pro' / 'pro.js'
        
        if not pro_file.exists():
            self.results['pro_app_integration']['status'] = 'failed'
            self.results['pro_app_integration']['details'].append('❌ Pro app file not found')
            return False
            
        try:
            content = pro_file.read_text()
            
            # Check for ServiceAreaManager integration
            integration_checks = [
                ('let serviceAreaManager = null', 'ServiceAreaManager variable declaration'),
                ('serviceAreaManager = new ServiceAreaManager\\(map', 'ServiceAreaManager initialization'),
                ('onAreaChange.*totalSqFt, breakdown', 'onAreaChange callback implementation'),
                ('onPolygonsCreated.*count', 'onPolygonsCreated callback implementation'),
                ('state\\.polygonCoords = \\[\\]', 'Multi-polygon coordinates state'),
                ('serviceAreaManager\\.getCoordinatesSnapshot\\(\\)', 'Coordinates snapshot usage'),
            ]
            
            for pattern, description in integration_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pro_app_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['pro_app_integration']['details'].append(f"❌ {description}")
                    self.results['pro_app_integration']['status'] = 'failed'
                    return False
            
            # Check for map initialization with satellite view
            map_checks = [
                ('mapTypeId.*satellite', 'Satellite view by default'),
                ('mapTypeControl.*true', 'Map type control enabled'),
                ('mapTypeControlOptions', 'Map type control options'),
            ]
            
            for pattern, description in map_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pro_app_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['pro_app_integration']['details'].append(f"❌ {description}")
                    self.results['pro_app_integration']['status'] = 'failed'
                    return False
            
            # Check for auto-draw functionality
            autodraw_checks = [
                ('autoDrawServiceArea\\(place\\)', 'Auto-draw service area function'),
                ('serviceAreaManager\\.autoEstimate\\(place, state\\.propertyType', 'Auto-estimate call'),
                ('updateAreaDisplay', 'Area display update'),
                ('calculatePricing\\(\\)', 'Pricing calculation trigger'),
            ]
            
            for pattern, description in autodraw_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pro_app_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['pro_app_integration']['details'].append(f"❌ {description}")
                    self.results['pro_app_integration']['status'] = 'failed'
                    return False
            
            # Check for property type change handling
            property_checks = [
                ('propertyType.*change.*autoDrawServiceArea', 'Property type change triggers re-estimation'),
                ('state\\.propertyType = e\\.target\\.value', 'Property type state update'),
            ]
            
            for pattern, description in property_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pro_app_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['pro_app_integration']['details'].append(f"❌ {description}")
                    self.results['pro_app_integration']['status'] = 'failed'
                    return False
            
            # Check for polygon count display
            display_checks = [
                ('polygonCount > 1.*zones', 'Multi-zone display logic'),
                ('serviceAreaManager\\.getPolygonCount\\(\\)', 'Get polygon count method usage'),
            ]
            
            for pattern, description in display_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pro_app_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['pro_app_integration']['details'].append(f"❌ {description}")
                    self.results['pro_app_integration']['status'] = 'failed'
                    return False
            
            self.results['pro_app_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['pro_app_integration']['status'] = 'failed'
            self.results['pro_app_integration']['details'].append(f"Error reading pro app file: {str(e)}")
            return False
    
    def test_html_includes(self):
        """Test HTML files include serviceAreaUtils.js"""
        print("🔍 Testing HTML File Includes...")
        
        html_files = [
            ('widgets/lawn/v1/index.html', 'Widget HTML'),
            ('pro/index.html', 'Pro App HTML')
        ]
        
        all_passed = True
        
        for file_path, description in html_files:
            html_file = self.app_dir / file_path
            
            if not html_file.exists():
                self.results['html_includes']['details'].append(f"❌ {description} file not found")
                all_passed = False
                continue
                
            try:
                content = html_file.read_text()
                
                # Check for serviceAreaUtils.js include
                if 'serviceAreaUtils.js' in content:
                    self.results['html_includes']['details'].append(f"✅ {description} includes serviceAreaUtils.js")
                else:
                    self.results['html_includes']['details'].append(f"❌ {description} missing serviceAreaUtils.js include")
                    all_passed = False
                
                # Check for correct path
                if file_path.startswith('widgets'):
                    expected_path = '../../../shared/serviceAreaUtils.js'
                else:  # pro app
                    expected_path = '../shared/serviceAreaUtils.js'
                
                if expected_path in content:
                    self.results['html_includes']['details'].append(f"✅ {description} has correct serviceAreaUtils.js path")
                else:
                    self.results['html_includes']['details'].append(f"❌ {description} has incorrect serviceAreaUtils.js path")
                    all_passed = False
                    
            except Exception as e:
                self.results['html_includes']['details'].append(f"Error reading {description}: {str(e)}")
                all_passed = False
        
        if all_passed:
            self.results['html_includes']['status'] = 'passed'
        else:
            self.results['html_includes']['status'] = 'failed'
        
        return all_passed
    
    def test_vercel_config(self):
        """Test Vercel configuration for shared folder routing"""
        print("🔍 Testing Vercel Configuration...")
        
        vercel_file = self.app_dir / 'vercel.json'
        
        if not vercel_file.exists():
            self.results['vercel_config']['status'] = 'failed'
            self.results['vercel_config']['details'].append('❌ vercel.json file not found')
            return False
            
        try:
            content = vercel_file.read_text()
            
            # Check for shared folder route
            if '/shared/(.*)' in content and '/shared/$1' in content:
                self.results['vercel_config']['details'].append("✅ Shared folder route configured")
            else:
                self.results['vercel_config']['details'].append("❌ Shared folder route not configured")
                self.results['vercel_config']['status'] = 'failed'
                return False
            
            # Check for other required routes
            route_checks = [
                ('/widgets/(.*)', 'Widgets folder route'),
                ('/pro/(.*)', 'Pro app folder route'),
                ('/configs/(.*)', 'Configs folder route'),
            ]
            
            for pattern, description in route_checks:
                if pattern in content:
                    self.results['vercel_config']['details'].append(f"✅ {description}")
                else:
                    self.results['vercel_config']['details'].append(f"❌ {description}")
                    self.results['vercel_config']['status'] = 'failed'
                    return False
            
            self.results['vercel_config']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['vercel_config']['status'] = 'failed'
            self.results['vercel_config']['details'].append(f"Error reading vercel.json: {str(e)}")
            return False
    
    def test_map_initialization(self):
        """Test map initialization with satellite view"""
        print("🔍 Testing Map Initialization...")
        
        files_to_check = [
            ('widgets/lawn/v1/widget.js', 'Widget'),
            ('pro/pro.js', 'Pro App')
        ]
        
        all_passed = True
        
        for file_path, description in files_to_check:
            file_obj = self.app_dir / file_path
            
            if not file_obj.exists():
                self.results['map_initialization']['details'].append(f"❌ {description} file not found")
                all_passed = False
                continue
                
            try:
                content = file_obj.read_text()
                
                # Check for satellite view initialization
                satellite_checks = [
                    ('mapTypeId.*satellite', 'Satellite view by default'),
                    ('mapTypeControl.*true', 'Map type control enabled'),
                    ('mapTypeControlOptions', 'Map type control options configured'),
                    ('google\\.maps\\.MapTypeControlStyle\\.DROPDOWN_MENU', 'Dropdown menu style'),
                    ('google\\.maps\\.ControlPosition\\.TOP_RIGHT', 'Top right position'),
                ]
                
                for pattern, check_desc in satellite_checks:
                    if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                        self.results['map_initialization']['details'].append(f"✅ {description}: {check_desc}")
                    else:
                        self.results['map_initialization']['details'].append(f"❌ {description}: {check_desc}")
                        all_passed = False
                
                # Check for ServiceAreaManager initialization with proper options
                manager_checks = [
                    ('new ServiceAreaManager\\(map', 'ServiceAreaManager initialization'),
                    ('debugMode.*true', 'Debug mode enabled'),
                    ('fillColor.*fillOpacity', 'Polygon styling options'),
                    ('editable.*true', 'Polygons are editable'),
                ]
                
                for pattern, check_desc in manager_checks:
                    if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                        self.results['map_initialization']['details'].append(f"✅ {description}: {check_desc}")
                    else:
                        self.results['map_initialization']['details'].append(f"❌ {description}: {check_desc}")
                        all_passed = False
                        
            except Exception as e:
                self.results['map_initialization']['details'].append(f"Error reading {description}: {str(e)}")
                all_passed = False
        
        if all_passed:
            self.results['map_initialization']['status'] = 'passed'
        else:
            self.results['map_initialization']['status'] = 'failed'
        
        return all_passed
    
    def test_auto_estimation_logic(self):
        """Test auto-estimation logic implementation"""
        print("🔍 Testing Auto-Estimation Logic...")
        
        utils_file = self.app_dir / 'shared' / 'serviceAreaUtils.js'
        
        if not utils_file.exists():
            self.results['auto_estimation_logic']['status'] = 'failed'
            self.results['auto_estimation_logic']['details'].append('❌ serviceAreaUtils.js file not found')
            return False
            
        try:
            content = utils_file.read_text()
            
            # Check for auto-estimation flow
            flow_checks = [
                ('autoEstimate\\(place, propertyType.*defaultAreas', 'Auto-estimate method signature'),
                ('this\\.clearAll\\(\\)', 'Clear existing polygons before estimation'),
                ('place\\.geometry\\.location', 'Place geometry validation'),
                ('detectRoadDirection\\(place\\)', 'Road direction detection'),
                ('shouldUseMultiPolygon\\(place, propertyType, baseArea\\)', 'Multi-polygon decision logic'),
                ('createFrontBackYards.*createSingleYard', 'Conditional polygon creation'),
                ('onPolygonsCreated\\(this\\.polygons\\.length\\)', 'Callback after polygon creation'),
            ]
            
            for pattern, description in flow_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['auto_estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['auto_estimation_logic']['details'].append(f"❌ {description}")
                    self.results['auto_estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for multi-polygon criteria
            criteria_checks = [
                ('propertyType === \'residential\' && totalArea > 5000', 'Residential > 5000 sq ft threshold'),
                ('propertyType === \'commercial\'.*return false', 'Commercial properties use single polygon'),
                ('frontYardArea.*totalArea \\* 0\\.3', '30% front yard allocation'),
                ('backYardArea.*totalArea \\* 0\\.7', '70% back yard allocation'),
            ]
            
            for pattern, description in criteria_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['auto_estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['auto_estimation_logic']['details'].append(f"❌ {description}")
                    self.results['auto_estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for road direction logic
            road_checks = [
                ('roadDirection = 180', 'Default south-facing direction'),
                ('long_name\\.toLowerCase\\(\\)', 'Case-insensitive road name processing'),
                ('includes\\(\'north\'\\).*roadDirection = 0', 'North direction detection'),
                ('includes\\(\'south\'\\).*roadDirection = 180', 'South direction detection'),
                ('includes\\(\'east\'\\).*roadDirection = 90', 'East direction detection'),
                ('includes\\(\'west\'\\).*roadDirection = 270', 'West direction detection'),
            ]
            
            for pattern, description in road_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['auto_estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['auto_estimation_logic']['details'].append(f"❌ {description}")
                    self.results['auto_estimation_logic']['status'] = 'failed'
                    return False
            
            # Check for polygon creation logic
            creation_checks = [
                ('createRectangle\\(center, sqFtTarget, options', 'Rectangle creation method'),
                ('aspectRatio.*rotation', 'Aspect ratio and rotation parameters'),
                ('sqMeters = sqFtTarget / 10\\.7639', 'Square feet to meters conversion'),
                ('Math\\.sqrt\\(sqMeters / aspectRatio\\)', 'Dimension calculation'),
                ('latOffset.*lngOffset', 'Lat/lng offset calculation'),
                ('rotatePolygon\\(corners, center, rotation\\)', 'Polygon rotation'),
            ]
            
            for pattern, description in creation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['auto_estimation_logic']['details'].append(f"✅ {description}")
                else:
                    self.results['auto_estimation_logic']['details'].append(f"❌ {description}")
                    self.results['auto_estimation_logic']['status'] = 'failed'
                    return False
            
            self.results['auto_estimation_logic']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['auto_estimation_logic']['status'] = 'failed'
            self.results['auto_estimation_logic']['details'].append(f"Error reading serviceAreaUtils.js: {str(e)}")
            return False
    
    def test_multi_polygon_behavior(self):
        """Test multi-polygon behavior and event handling"""
        print("🔍 Testing Multi-Polygon Behavior...")
        
        utils_file = self.app_dir / 'shared' / 'serviceAreaUtils.js'
        
        if not utils_file.exists():
            self.results['multi_polygon_behavior']['status'] = 'failed'
            self.results['multi_polygon_behavior']['details'].append('❌ serviceAreaUtils.js file not found')
            return False
            
        try:
            content = utils_file.read_text()
            
            # Check for polygon management
            management_checks = [
                ('this\\.polygons\\.forEach\\(polygon => \\{', 'Iterate through polygons'),
                ('polygon\\.setMap\\(null\\)', 'Remove polygon from map'),
                ('this\\.polygons = \\[\\]', 'Clear polygons array'),
                ('this\\.polygons\\.push\\(polygon\\)', 'Add polygon to array'),
                ('this\\.polygons\\.indexOf\\(polygon\\)', 'Find polygon index'),
                ('this\\.polygons\\.splice\\(index, 1\\)', 'Remove specific polygon'),
            ]
            
            for pattern, description in management_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_behavior']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_behavior']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_behavior']['status'] = 'failed'
                    return False
            
            # Check for event listeners
            event_checks = [
                ('google\\.maps\\.event\\.addListener\\(path, \'set_at\'', 'set_at event listener'),
                ('google\\.maps\\.event\\.addListener\\(path, \'insert_at\'', 'insert_at event listener'),
                ('google\\.maps\\.event\\.addListener\\(path, \'remove_at\'', 'remove_at event listener'),
                ('this\\.recalculateTotal\\(\\)', 'Recalculate on path changes'),
            ]
            
            for pattern, description in event_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_behavior']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_behavior']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_behavior']['status'] = 'failed'
                    return False
            
            # Check for area calculation
            calculation_checks = [
                ('google\\.maps\\.geometry\\.spherical\\.computeArea\\(polygon\\.getPath\\(\\)\\)', 'Spherical area calculation'),
                ('Math\\.round\\(area \\* 10\\.7639\\)', 'Area conversion and rounding'),
                ('totalSqMeters \\+= area', 'Sum areas from all polygons'),
                ('breakdown\\.push\\(\\{', 'Area breakdown per polygon'),
                ('this\\.onAreaChange\\(totalSqFt, breakdown\\)', 'Area change callback'),
            ]
            
            for pattern, description in calculation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_behavior']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_behavior']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_behavior']['status'] = 'failed'
                    return False
            
            # Check for coordinates snapshot
            snapshot_checks = [
                ('getCoordinatesSnapshot\\(\\)', 'Coordinates snapshot method'),
                ('this\\.polygons\\.map\\(polygon => \\{', 'Map over all polygons'),
                ('polygon\\.getPath\\(\\)', 'Get polygon path'),
                ('path\\.getLength\\(\\)', 'Get path length'),
                ('path\\.getAt\\(i\\)', 'Get point at index'),
                ('point\\.lat\\(\\).*point\\.lng\\(\\)', 'Extract lat/lng coordinates'),
            ]
            
            for pattern, description in snapshot_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_behavior']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_behavior']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_behavior']['status'] = 'failed'
                    return False
            
            # Check for polygon styling
            styling_checks = [
                ('DEFAULT_POLYGON_STYLES', 'Default polygon styles constant'),
                ('fillColor.*fillOpacity', 'Fill styling properties'),
                ('strokeWeight.*strokeColor', 'Stroke styling properties'),
                ('editable.*true', 'Editable property'),
                ('draggable.*false', 'Draggable property'),
            ]
            
            for pattern, description in styling_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['multi_polygon_behavior']['details'].append(f"✅ {description}")
                else:
                    self.results['multi_polygon_behavior']['details'].append(f"❌ {description}")
                    self.results['multi_polygon_behavior']['status'] = 'failed'
                    return False
            
            self.results['multi_polygon_behavior']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['multi_polygon_behavior']['status'] = 'failed'
            self.results['multi_polygon_behavior']['details'].append(f"Error reading serviceAreaUtils.js: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Check serviceAreaUtils.js exists and is properly structured
            utils_file = self.app_dir / 'shared' / 'serviceAreaUtils.js'
            if utils_file.exists():
                utils_content = utils_file.read_text()
                if 'class ServiceAreaManager' in utils_content and 'autoEstimate' in utils_content:
                    integration_checks.append("✅ ServiceAreaManager class properly implemented")
                else:
                    integration_checks.append("❌ ServiceAreaManager class incomplete")
            else:
                integration_checks.append("❌ serviceAreaUtils.js file missing")
            
            # 2. Check widget integration
            widget_file = self.app_dir / 'widgets' / 'lawn' / 'v1' / 'widget.js'
            if widget_file.exists():
                widget_content = widget_file.read_text()
                if 'serviceAreaManager = new ServiceAreaManager' in widget_content and 'autoDrawServiceArea' in widget_content:
                    integration_checks.append("✅ Widget properly integrates ServiceAreaManager")
                else:
                    integration_checks.append("❌ Widget ServiceAreaManager integration incomplete")
            else:
                integration_checks.append("❌ Widget file missing")
            
            # 3. Check pro app integration
            pro_file = self.app_dir / 'pro' / 'pro.js'
            if pro_file.exists():
                pro_content = pro_file.read_text()
                if 'serviceAreaManager = new ServiceAreaManager' in pro_content and 'autoDrawServiceArea' in pro_content:
                    integration_checks.append("✅ Pro App properly integrates ServiceAreaManager")
                else:
                    integration_checks.append("❌ Pro App ServiceAreaManager integration incomplete")
            else:
                integration_checks.append("❌ Pro App file missing")
            
            # 4. Check HTML includes
            widget_html = self.app_dir / 'widgets' / 'lawn' / 'v1' / 'index.html'
            pro_html = self.app_dir / 'pro' / 'index.html'
            
            html_includes_ok = True
            if widget_html.exists():
                widget_html_content = widget_html.read_text()
                if 'serviceAreaUtils.js' not in widget_html_content:
                    html_includes_ok = False
            else:
                html_includes_ok = False
                
            if pro_html.exists():
                pro_html_content = pro_html.read_text()
                if 'serviceAreaUtils.js' not in pro_html_content:
                    html_includes_ok = False
            else:
                html_includes_ok = False
            
            if html_includes_ok:
                integration_checks.append("✅ HTML files properly include serviceAreaUtils.js")
            else:
                integration_checks.append("❌ HTML files missing serviceAreaUtils.js includes")
            
            # 5. Check Vercel configuration
            vercel_file = self.app_dir / 'vercel.json'
            if vercel_file.exists():
                vercel_content = vercel_file.read_text()
                if '/shared/(.*)' in vercel_content:
                    integration_checks.append("✅ Vercel configuration supports shared folder routing")
                else:
                    integration_checks.append("❌ Vercel configuration missing shared folder route")
            else:
                integration_checks.append("❌ Vercel configuration file missing")
            
            # 6. Check satellite view initialization
            satellite_ok = True
            for file_path, desc in [('widgets/lawn/v1/widget.js', 'Widget'), ('pro/pro.js', 'Pro App')]:
                file_obj = self.app_dir / file_path
                if file_obj.exists():
                    content = file_obj.read_text()
                    if "mapTypeId: 'satellite'" not in content:
                        satellite_ok = False
                else:
                    satellite_ok = False
            
            if satellite_ok:
                integration_checks.append("✅ Maps initialize with satellite view by default")
            else:
                integration_checks.append("❌ Maps not configured for satellite view")
            
            # 7. Check auto-estimation flow
            auto_estimation_ok = True
            for file_path in ['widgets/lawn/v1/widget.js', 'pro/pro.js']:
                file_obj = self.app_dir / file_path
                if file_obj.exists():
                    content = file_obj.read_text()
                    if 'onPlaceChanged' not in content or 'autoDrawServiceArea' not in content:
                        auto_estimation_ok = False
                else:
                    auto_estimation_ok = False
            
            if auto_estimation_ok:
                integration_checks.append("✅ Auto-estimation flow properly implemented")
            else:
                integration_checks.append("❌ Auto-estimation flow incomplete")
            
            # 8. Check multi-polygon display logic
            display_ok = True
            for file_path in ['widgets/lawn/v1/widget.js', 'pro/pro.js']:
                file_obj = self.app_dir / file_path
                if file_obj.exists():
                    content = file_obj.read_text()
                    if 'polygonCount' not in content or 'zones' not in content:
                        display_ok = False
                else:
                    display_ok = False
            
            if display_ok:
                integration_checks.append("✅ Multi-polygon display logic implemented")
            else:
                integration_checks.append("❌ Multi-polygon display logic missing")
            
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
        print("🚀 Starting GreenQuote Multi-Polygon Auto-Estimation Service Area Feature Tests\n")
        
        tests = [
            ('ServiceAreaManager Class', self.test_service_area_manager),
            ('Widget Integration', self.test_widget_integration),
            ('Pro App Integration', self.test_pro_app_integration),
            ('HTML File Includes', self.test_html_includes),
            ('Vercel Configuration', self.test_vercel_config),
            ('Map Initialization', self.test_map_initialization),
            ('Auto-Estimation Logic', self.test_auto_estimation_logic),
            ('Multi-Polygon Behavior', self.test_multi_polygon_behavior),
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
    tester = GreenQuoteServiceAreaTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Multi-Polygon Auto-Estimation Service Area feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)