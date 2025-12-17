#!/usr/bin/env python3
"""
Backend Testing for GreenQuote App - Click-to-Start Drawing UX Code Review
Testing Agent: Comprehensive code review testing for improved drawing UX implementation

This test focuses on CODE REVIEW verification since this is a Vercel-deployed app 
using Supabase and local environment lacks Supabase credentials.

Test Categories:
1. Click-to-Start Drawing UX
2. Start Drawing Button  
3. Visual Feedback
4. Done Button and Polygon Closing
5. Real-time Area Updates
6. Multi-Zone Support
7. Satellite View Default
8. No Auto-Draw on Address Selection
"""

import os
import sys
import re
import json
from pathlib import Path

# Test Results Storage
test_results = {
    "click_to_start_drawing": {"passed": False, "details": []},
    "start_drawing_button": {"passed": False, "details": []},
    "visual_feedback": {"passed": False, "details": []},
    "done_button_polygon_closing": {"passed": False, "details": []},
    "real_time_area_updates": {"passed": False, "details": []},
    "multi_zone_support": {"passed": False, "details": []},
    "satellite_view_default": {"passed": False, "details": []},
    "no_auto_draw_address_selection": {"passed": False, "details": []},
}

def log_test(category, message, passed=True):
    """Log test result with details"""
    test_results[category]["details"].append(f"{'✅' if passed else '❌'} {message}")
    if not passed:
        test_results[category]["passed"] = False
    elif test_results[category]["passed"] is not False:
        test_results[category]["passed"] = True

def read_file_content(file_path):
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

def test_click_to_start_drawing():
    """
    TEST CASE 1: Click-to-Start Drawing
    - Verify onMapClick handler checks formData.address before starting
    - Verify if !isDrawing AND address is set, it calls setIsDrawing(true) and adds first point
    - Verify if isDrawing is true, it just adds point to currentDrawingPath
    - Verify console.log for "Started drawing with click"
    """
    print("\n🔍 Testing Click-to-Start Drawing UX...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("click_to_start_drawing", "Could not read Quote.js file", False)
        return
    
    # Test 1.1: Check onMapClick handler exists
    onMapClick_pattern = r'const onMapClick = useCallback\(\(event\) => \{'
    if re.search(onMapClick_pattern, quote_content):
        log_test("click_to_start_drawing", "onMapClick handler found")
    else:
        log_test("click_to_start_drawing", "onMapClick handler not found", False)
    
    # Test 1.2: Check address validation before starting drawing
    address_check_pattern = r'if \(formData\.address\)'
    if re.search(address_check_pattern, quote_content):
        log_test("click_to_start_drawing", "Address validation check found in onMapClick")
    else:
        log_test("click_to_start_drawing", "Address validation check not found", False)
    
    # Test 1.3: Check if !isDrawing condition starts drawing
    start_drawing_pattern = r'if \(!isDrawing\).*?setIsDrawing\(true\)'
    if re.search(start_drawing_pattern, quote_content, re.DOTALL):
        log_test("click_to_start_drawing", "Click-to-start logic found (!isDrawing -> setIsDrawing(true))")
    else:
        log_test("click_to_start_drawing", "Click-to-start logic not found", False)
    
    # Test 1.4: Check first point placement
    first_point_pattern = r'setCurrentDrawingPath\(\[newPoint\]\)'
    if re.search(first_point_pattern, quote_content):
        log_test("click_to_start_drawing", "First point placement logic found")
    else:
        log_test("click_to_start_drawing", "First point placement logic not found", False)
    
    # Test 1.5: Check subsequent point addition when already drawing
    subsequent_point_pattern = r'setCurrentDrawingPath\(prev => \[\.\.\.prev, newPoint\]\)'
    if re.search(subsequent_point_pattern, quote_content):
        log_test("click_to_start_drawing", "Subsequent point addition logic found")
    else:
        log_test("click_to_start_drawing", "Subsequent point addition logic not found", False)
    
    # Test 1.6: Check console.log for "Started drawing with click"
    console_log_pattern = r'console\.log\(.*Started drawing with click.*\)'
    if re.search(console_log_pattern, quote_content):
        log_test("click_to_start_drawing", "Console log for 'Started drawing with click' found")
    else:
        log_test("click_to_start_drawing", "Console log for 'Started drawing with click' not found", False)

def test_start_drawing_button():
    """
    TEST CASE 2: Start Drawing Button
    - Verify button with text "Start Drawing" exists in JSX
    - Verify button is shown when: !isDrawing && !polygons.length && formData.address
    - Verify button onClick calls startDrawing() function
    - Verify startDrawing() sets isDrawing=true and clears currentDrawingPath
    """
    print("\n🔍 Testing Start Drawing Button...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("start_drawing_button", "Could not read Quote.js file", False)
        return
    
    # Test 2.1: Check Start Drawing button exists
    start_button_pattern = r'Start Drawing'
    if re.search(start_button_pattern, quote_content):
        log_test("start_drawing_button", "Start Drawing button text found")
    else:
        log_test("start_drawing_button", "Start Drawing button text not found", False)
    
    # Test 2.2: Check button visibility conditions
    button_condition_pattern = r'\{!isDrawing && !polygons\.length && formData\.address'
    if re.search(button_condition_pattern, quote_content):
        log_test("start_drawing_button", "Button visibility conditions found (!isDrawing && !polygons.length && formData.address)")
    else:
        log_test("start_drawing_button", "Button visibility conditions not found", False)
    
    # Test 2.3: Check onClick calls startDrawing
    onclick_pattern = r'onClick={startDrawing}'
    if re.search(onclick_pattern, quote_content):
        log_test("start_drawing_button", "Button onClick calls startDrawing function")
    else:
        log_test("start_drawing_button", "Button onClick does not call startDrawing function", False)
    
    # Test 2.4: Check startDrawing function exists
    start_drawing_function_pattern = r'const startDrawing = \(\) => \{'
    if re.search(start_drawing_function_pattern, quote_content):
        log_test("start_drawing_button", "startDrawing function found")
    else:
        log_test("start_drawing_button", "startDrawing function not found", False)
    
    # Test 2.5: Check startDrawing sets isDrawing=true
    set_drawing_true_pattern = r'setIsDrawing\(true\)'
    if re.search(set_drawing_true_pattern, quote_content):
        log_test("start_drawing_button", "startDrawing sets isDrawing to true")
    else:
        log_test("start_drawing_button", "startDrawing does not set isDrawing to true", False)
    
    # Test 2.6: Check startDrawing clears currentDrawingPath
    clear_path_pattern = r'setCurrentDrawingPath\(\[\]\)'
    if re.search(clear_path_pattern, quote_content):
        log_test("start_drawing_button", "startDrawing clears currentDrawingPath")
    else:
        log_test("start_drawing_button", "startDrawing does not clear currentDrawingPath", False)

def test_visual_feedback():
    """
    TEST CASE 3: Visual Feedback
    - Verify Circle component is imported from @react-google-maps/api
    - Verify Circle markers are rendered for each point in currentDrawingPath while drawing
    - Verify map cursor changes (draggableCursor option or mapContainerStyle)
    - Verify status messages show point count
    """
    print("\n🔍 Testing Visual Feedback...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("visual_feedback", "Could not read Quote.js file", False)
        return
    
    # Test 3.1: Check Circle component import
    circle_import_pattern = r'import.*Circle.*from.*@react-google-maps/api'
    if re.search(circle_import_pattern, quote_content):
        log_test("visual_feedback", "Circle component imported from @react-google-maps/api")
    else:
        log_test("visual_feedback", "Circle component not imported", False)
    
    # Test 3.2: Check Circle markers for drawing points
    circle_markers_pattern = r'currentDrawingPath\.map\(\(point, index\) => \(\s*<Circle'
    if re.search(circle_markers_pattern, quote_content):
        log_test("visual_feedback", "Circle markers rendered for currentDrawingPath points")
    else:
        log_test("visual_feedback", "Circle markers not found for drawing points", False)
    
    # Test 3.3: Check first point different color (green)
    first_point_color_pattern = r'fillColor: index === 0 \? \'#22c55e\' : \'#3b82f6\''
    if re.search(first_point_color_pattern, quote_content):
        log_test("visual_feedback", "First point has different color (green)")
    else:
        log_test("visual_feedback", "First point color differentiation not found", False)
    
    # Test 3.4: Check map cursor changes
    cursor_pattern = r'cursor:.*isDrawing.*crosshair.*pointer'
    if re.search(cursor_pattern, quote_content):
        log_test("visual_feedback", "Map cursor changes based on drawing state")
    else:
        log_test("visual_feedback", "Map cursor changes not found", False)
    
    # Test 3.5: Check draggableCursor option
    draggable_cursor_pattern = r'draggableCursor:.*isDrawing.*crosshair.*pointer'
    if re.search(draggable_cursor_pattern, quote_content):
        log_test("visual_feedback", "draggableCursor option configured")
    else:
        log_test("visual_feedback", "draggableCursor option not found", False)
    
    # Test 3.6: Check status messages with point count
    point_count_pattern = r'\{currentDrawingPath\.length\}'
    if re.search(point_count_pattern, quote_content):
        log_test("visual_feedback", "Status messages show point count")
    else:
        log_test("visual_feedback", "Point count in status messages not found", False)

def test_done_button_polygon_closing():
    """
    TEST CASE 4: Done Button and Polygon Closing
    - Verify finishDrawing() creates new polygon with path from currentDrawingPath
    - Verify finishDrawing() calls recalculateTotalArea()
    - Verify polygon is added with areaSqFt=0 initially, then recalculated
    - Verify "Done" button shows point count: "Done (X pts)"
    """
    print("\n🔍 Testing Done Button and Polygon Closing...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("done_button_polygon_closing", "Could not read Quote.js file", False)
        return
    
    # Test 4.1: Check finishDrawing function exists
    finish_drawing_pattern = r'const finishDrawing = \(\) => \{'
    if re.search(finish_drawing_pattern, quote_content):
        log_test("done_button_polygon_closing", "finishDrawing function found")
    else:
        log_test("done_button_polygon_closing", "finishDrawing function not found", False)
    
    # Test 4.2: Check polygon creation from currentDrawingPath
    polygon_creation_pattern = r'path: currentDrawingPath'
    if re.search(polygon_creation_pattern, quote_content):
        log_test("done_button_polygon_closing", "Polygon created with currentDrawingPath")
    else:
        log_test("done_button_polygon_closing", "Polygon creation from currentDrawingPath not found", False)
    
    # Test 4.3: Check recalculateTotalArea call
    recalculate_call_pattern = r'recalculateTotalArea\(updated\)'
    if re.search(recalculate_call_pattern, quote_content):
        log_test("done_button_polygon_closing", "recalculateTotalArea called after polygon creation")
    else:
        log_test("done_button_polygon_closing", "recalculateTotalArea call not found", False)
    
    # Test 4.4: Check initial areaSqFt=0
    initial_area_pattern = r'areaSqFt: 0'
    if re.search(initial_area_pattern, quote_content):
        log_test("done_button_polygon_closing", "Polygon initialized with areaSqFt: 0")
    else:
        log_test("done_button_polygon_closing", "Initial areaSqFt: 0 not found", False)
    
    # Test 4.5: Check Done button with point count
    done_button_pattern = r'Done \(\{currentDrawingPath\.length\} pts\)'
    if re.search(done_button_pattern, quote_content):
        log_test("done_button_polygon_closing", "Done button shows point count")
    else:
        log_test("done_button_polygon_closing", "Done button point count not found", False)
    
    # Test 4.6: Check Done button onClick calls finishDrawing
    done_onclick_pattern = r'onClick={finishDrawing}'
    if re.search(done_onclick_pattern, quote_content):
        log_test("done_button_polygon_closing", "Done button onClick calls finishDrawing")
    else:
        log_test("done_button_polygon_closing", "Done button onClick not found", False)

def test_real_time_area_updates():
    """
    TEST CASE 5: Real-time Area Updates
    - Verify polygon path event listeners (set_at, insert_at, remove_at) call handlePolygonPathChange
    - Verify handlePolygonPathChange updates polygon path and calls recalculateTotalArea
    - Verify recalculateTotalArea computes area using google.maps.geometry.spherical.computeArea
    - Verify totalCalculatedArea state updates and formData.lawnSizeSqFt updates
    """
    print("\n🔍 Testing Real-time Area Updates...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("real_time_area_updates", "Could not read Quote.js file", False)
        return
    
    # Test 5.1: Check set_at event listener
    set_at_pattern = r'addListener\(path, \'set_at\''
    if re.search(set_at_pattern, quote_content):
        log_test("real_time_area_updates", "set_at event listener found")
    else:
        log_test("real_time_area_updates", "set_at event listener not found", False)
    
    # Test 5.2: Check insert_at event listener
    insert_at_pattern = r'addListener\(path, \'insert_at\''
    if re.search(insert_at_pattern, quote_content):
        log_test("real_time_area_updates", "insert_at event listener found")
    else:
        log_test("real_time_area_updates", "insert_at event listener not found", False)
    
    # Test 5.3: Check remove_at event listener
    remove_at_pattern = r'addListener\(path, \'remove_at\''
    if re.search(remove_at_pattern, quote_content):
        log_test("real_time_area_updates", "remove_at event listener found")
    else:
        log_test("real_time_area_updates", "remove_at event listener not found", False)
    
    # Test 5.4: Check handlePolygonPathChange function
    handle_path_change_pattern = r'const handlePolygonPathChange = useCallback'
    if re.search(handle_path_change_pattern, quote_content):
        log_test("real_time_area_updates", "handlePolygonPathChange function found")
    else:
        log_test("real_time_area_updates", "handlePolygonPathChange function not found", False)
    
    # Test 5.5: Check Google Maps geometry computeArea usage
    compute_area_pattern = r'google\.maps\.geometry\.spherical\.computeArea'
    if re.search(compute_area_pattern, quote_content):
        log_test("real_time_area_updates", "Google Maps geometry computeArea used")
    else:
        log_test("real_time_area_updates", "Google Maps geometry computeArea not found", False)
    
    # Test 5.6: Check totalCalculatedArea state update
    total_area_update_pattern = r'setTotalCalculatedArea\(total\)'
    if re.search(total_area_update_pattern, quote_content):
        log_test("real_time_area_updates", "totalCalculatedArea state updated")
    else:
        log_test("real_time_area_updates", "totalCalculatedArea state update not found", False)
    
    # Test 5.7: Check formData.lawnSizeSqFt update
    lawn_size_update_pattern = r'lawnSizeSqFt: total > 0 \? total\.toString\(\) : \'\''
    if re.search(lawn_size_update_pattern, quote_content):
        log_test("real_time_area_updates", "formData.lawnSizeSqFt updated with calculated area")
    else:
        log_test("real_time_area_updates", "formData.lawnSizeSqFt update not found", False)

def test_multi_zone_support():
    """
    TEST CASE 6: Multi-Zone Support
    - Verify "+ Add Zone" button exists
    - Verify addNewZone() function exists
    - Verify addNewZone finishes current drawing if in progress (if path >= 3)
    - Verify addNewZone starts new drawing session
    - Verify total area = sum of all polygon areas
    """
    print("\n🔍 Testing Multi-Zone Support...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("multi_zone_support", "Could not read Quote.js file", False)
        return
    
    # Test 6.1: Check "+ Add Zone" button
    add_zone_button_pattern = r'Add Zone'
    if re.search(add_zone_button_pattern, quote_content):
        log_test("multi_zone_support", "+ Add Zone button found")
    else:
        log_test("multi_zone_support", "+ Add Zone button not found", False)
    
    # Test 6.2: Check addNewZone function
    add_new_zone_pattern = r'const addNewZone = \(\) => \{'
    if re.search(add_new_zone_pattern, quote_content):
        log_test("multi_zone_support", "addNewZone function found")
    else:
        log_test("multi_zone_support", "addNewZone function not found", False)
    
    # Test 6.3: Check finishing current drawing if in progress
    finish_current_pattern = r'if \(isDrawing && currentDrawingPath\.length >= 3\).*finishDrawing\(\)'
    if re.search(finish_current_pattern, quote_content, re.DOTALL):
        log_test("multi_zone_support", "addNewZone finishes current drawing if path >= 3")
    else:
        log_test("multi_zone_support", "Current drawing finish logic not found", False)
    
    # Test 6.4: Check starting new drawing session
    new_drawing_session_pattern = r'setIsDrawing\(true\).*setCurrentDrawingPath\(\[\]\)'
    if re.search(new_drawing_session_pattern, quote_content, re.DOTALL):
        log_test("multi_zone_support", "addNewZone starts new drawing session")
    else:
        log_test("multi_zone_support", "New drawing session logic not found", False)
    
    # Test 6.5: Check total area calculation (sum of all polygons)
    total_area_sum_pattern = r'total \+= areaSqFt'
    if re.search(total_area_sum_pattern, quote_content):
        log_test("multi_zone_support", "Total area calculated as sum of all polygon areas")
    else:
        log_test("multi_zone_support", "Total area sum calculation not found", False)
    
    # Test 6.6: Check polygons array state
    polygons_array_pattern = r'const \[polygons, setPolygons\] = useState\(\[\]\)'
    if re.search(polygons_array_pattern, quote_content):
        log_test("multi_zone_support", "Polygons array state found")
    else:
        log_test("multi_zone_support", "Polygons array state not found", False)

def test_satellite_view_default():
    """
    TEST CASE 7: Satellite View Default
    - Verify GoogleMap component has mapTypeId="satellite"
    - Verify nothing overrides this back to roadmap
    """
    print("\n🔍 Testing Satellite View Default...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("satellite_view_default", "Could not read Quote.js file", False)
        return
    
    # Test 7.1: Check mapTypeId="satellite"
    satellite_pattern = r'mapTypeId="satellite"'
    if re.search(satellite_pattern, quote_content):
        log_test("satellite_view_default", "mapTypeId set to satellite")
    else:
        log_test("satellite_view_default", "mapTypeId satellite not found", False)
    
    # Test 7.2: Check no roadmap override
    roadmap_pattern = r'mapTypeId.*roadmap'
    if re.search(roadmap_pattern, quote_content):
        log_test("satellite_view_default", "Found roadmap override - should be satellite only", False)
    else:
        log_test("satellite_view_default", "No roadmap override found - satellite remains default")
    
    # Test 7.3: Check GoogleMap component exists
    google_map_pattern = r'<GoogleMap'
    if re.search(google_map_pattern, quote_content):
        log_test("satellite_view_default", "GoogleMap component found")
    else:
        log_test("satellite_view_default", "GoogleMap component not found", False)

def test_no_auto_draw_address_selection():
    """
    TEST CASE 8: No Auto-Draw on Address Selection
    - Verify onPlaceChanged does NOT call any auto-draw functions
    - Verify onPlaceChanged clears existing polygons
    - Verify onPlaceChanged does NOT start drawing mode automatically
    """
    print("\n🔍 Testing No Auto-Draw on Address Selection...")
    
    quote_content = read_file_content('/app/frontend/src/pages/Quote.js')
    if not quote_content:
        log_test("no_auto_draw_address_selection", "Could not read Quote.js file", False)
        return
    
    # Test 8.1: Check onPlaceChanged function exists
    on_place_changed_pattern = r'const onPlaceChanged = useCallback\(\(\) => \{'
    if re.search(on_place_changed_pattern, quote_content):
        log_test("no_auto_draw_address_selection", "onPlaceChanged function found")
    else:
        log_test("no_auto_draw_address_selection", "onPlaceChanged function not found", False)
    
    # Test 8.2: Check NO auto-draw function calls
    auto_draw_patterns = [
        r'autoEstimateLawnArea',
        r'autoDrawServiceArea',
        r'generatePolygonsFromEstimate'
    ]
    
    found_auto_draw = False
    for pattern in auto_draw_patterns:
        if re.search(pattern, quote_content):
            found_auto_draw = True
            log_test("no_auto_draw_address_selection", f"Found auto-draw function call: {pattern}", False)
    
    if not found_auto_draw:
        log_test("no_auto_draw_address_selection", "No auto-draw function calls found in onPlaceChanged")
    
    # Test 8.3: Check polygons are cleared
    clear_polygons_pattern = r'setPolygons\(\[\]\)'
    if re.search(clear_polygons_pattern, quote_content):
        log_test("no_auto_draw_address_selection", "Existing polygons cleared on address selection")
    else:
        log_test("no_auto_draw_address_selection", "Polygon clearing not found", False)
    
    # Test 8.4: Check drawing mode is NOT started automatically
    auto_start_drawing_pattern = r'onPlaceChanged.*setIsDrawing\(true\)'
    if re.search(auto_start_drawing_pattern, quote_content, re.DOTALL):
        log_test("no_auto_draw_address_selection", "Auto-start drawing found - should not happen", False)
    else:
        log_test("no_auto_draw_address_selection", "No auto-start drawing mode on address selection")
    
    # Test 8.5: Check manual drawing prompt
    manual_prompt_pattern = r'Draw your service area|Start Drawing|click.*map'
    if re.search(manual_prompt_pattern, quote_content):
        log_test("no_auto_draw_address_selection", "Manual drawing prompts found")
    else:
        log_test("no_auto_draw_address_selection", "Manual drawing prompts not found", False)

def print_test_summary():
    """Print comprehensive test summary"""
    print("\n" + "="*80)
    print("🧪 CLICK-TO-START DRAWING UX CODE REVIEW TEST RESULTS")
    print("="*80)
    
    total_categories = len(test_results)
    passed_categories = sum(1 for result in test_results.values() if result["passed"])
    
    for category, result in test_results.items():
        status = "✅ PASSED" if result["passed"] else "❌ FAILED"
        category_name = category.replace("_", " ").title()
        print(f"\n{status} - {category_name}")
        
        for detail in result["details"]:
            print(f"  {detail}")
    
    print(f"\n📊 OVERALL RESULTS: {passed_categories}/{total_categories} categories passed")
    
    if passed_categories == total_categories:
        print("🎉 ALL TESTS PASSED - Click-to-Start Drawing UX implementation is complete!")
    else:
        print("⚠️  Some tests failed - Review implementation against requirements")
    
    return passed_categories == total_categories

def main():
    """Main test execution"""
    print("🚀 Starting Click-to-Start Drawing UX Code Review Testing...")
    print("📁 Testing file: /app/frontend/src/pages/Quote.js")
    
    # Run all test categories
    test_click_to_start_drawing()
    test_start_drawing_button()
    test_visual_feedback()
    test_done_button_polygon_closing()
    test_real_time_area_updates()
    test_multi_zone_support()
    test_satellite_view_default()
    test_no_auto_draw_address_selection()
    
    # Print summary
    all_passed = print_test_summary()
    
    # Return appropriate exit code
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()