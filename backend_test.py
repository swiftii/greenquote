#!/usr/bin/env python3
"""
Backend Testing for Auto-Draw Removal Feature
This script performs code review testing to verify auto-draw functionality has been removed
from all three map interfaces while preserving manual drawing and satellite view defaults.
"""

import re
import os
import sys
from pathlib import Path

class AutoDrawRemovalTester:
    def __init__(self):
        self.test_results = []
        self.files_to_test = [
            "/app/frontend/src/pages/Quote.js",
            "/app/widgets/lawn/v1/widget.js", 
            "/app/pro/pro.js"
        ]
        
    def log_result(self, test_name, status, details=""):
        """Log test result"""
        self.test_results.append({
            'test': test_name,
            'status': status,
            'details': details
        })
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"{status_symbol} {test_name}: {details}")
    
    def read_file_content(self, file_path):
        """Read file content safely"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return None
    
    def test_quote_js_auto_draw_removal(self):
        """Test Quote.js for auto-draw removal"""
        print("\n🔍 Testing Quote.js Auto-Draw Removal...")
        
        content = self.read_file_content("/app/frontend/src/pages/Quote.js")
        if not content:
            self.log_result("Quote.js File Access", "FAIL", "Could not read file")
            return
        
        # Test 1: Verify autoEstimateLawnArea function is REMOVED
        if "autoEstimateLawnArea" in content:
            self.log_result("Quote.js - autoEstimateLawnArea Removal", "FAIL", "autoEstimateLawnArea function still exists")
        else:
            self.log_result("Quote.js - autoEstimateLawnArea Removal", "PASS", "autoEstimateLawnArea function removed")
        
        # Test 2: Verify generatePolygonsFromEstimate function is REMOVED
        if "generatePolygonsFromEstimate" in content:
            self.log_result("Quote.js - generatePolygonsFromEstimate Removal", "FAIL", "generatePolygonsFromEstimate function still exists")
        else:
            self.log_result("Quote.js - generatePolygonsFromEstimate Removal", "PASS", "generatePolygonsFromEstimate function removed")
        
        # Test 3: Verify ESTIMATION_CONFIG is NOT referenced
        if "ESTIMATION_CONFIG" in content:
            self.log_result("Quote.js - ESTIMATION_CONFIG Removal", "FAIL", "ESTIMATION_CONFIG still referenced")
        else:
            self.log_result("Quote.js - ESTIMATION_CONFIG Removal", "PASS", "ESTIMATION_CONFIG not referenced")
        
        # Test 4: Verify onPlaceChanged does NOT call auto-estimation
        onplace_match = re.search(r'const onPlaceChanged.*?(?=const|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if onplace_match:
            onplace_content = onplace_match.group(0)
            if "autoEstimate" in onplace_content or "generatePolygons" in onplace_content:
                self.log_result("Quote.js - onPlaceChanged Auto-estimation", "FAIL", "onPlaceChanged still calls auto-estimation")
            else:
                self.log_result("Quote.js - onPlaceChanged Auto-estimation", "PASS", "onPlaceChanged does not call auto-estimation")
        
        # Test 5: Verify handlePropertyTypeChange does NOT trigger re-estimation
        proptype_match = re.search(r'const handlePropertyTypeChange.*?(?=const|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if proptype_match:
            proptype_content = proptype_match.group(0)
            if "autoEstimate" in proptype_content or "generatePolygons" in proptype_content:
                self.log_result("Quote.js - handlePropertyTypeChange Re-estimation", "FAIL", "handlePropertyTypeChange still triggers re-estimation")
            else:
                self.log_result("Quote.js - handlePropertyTypeChange Re-estimation", "PASS", "handlePropertyTypeChange does not trigger re-estimation")
        
        # Test 6: Verify UI messages prompt manual drawing
        manual_draw_messages = [
            "Draw your service area",
            "Add Zone",
            "draw your service area",
            "Click \"Add Zone\"",
            "draw boundary"
        ]
        
        found_manual_messages = any(msg.lower() in content.lower() for msg in manual_draw_messages)
        auto_messages = ["Detecting lawn area", "Auto-estimating", "Estimating area"]
        found_auto_messages = any(msg in content for msg in auto_messages)
        
        if found_manual_messages and not found_auto_messages:
            self.log_result("Quote.js - UI Manual Drawing Messages", "PASS", "UI prompts manual drawing")
        else:
            self.log_result("Quote.js - UI Manual Drawing Messages", "FAIL", f"Manual messages: {found_manual_messages}, Auto messages: {found_auto_messages}")
        
        # Test 7: Verify satellite view default
        if 'mapTypeId="satellite"' in content:
            self.log_result("Quote.js - Satellite View Default", "PASS", "Satellite view set as default")
        else:
            self.log_result("Quote.js - Satellite View Default", "FAIL", "Satellite view not set as default")
    
    def test_widget_js_auto_draw_removal(self):
        """Test widget.js for auto-draw removal"""
        print("\n🔍 Testing widget.js Auto-Draw Removal...")
        
        content = self.read_file_content("/app/widgets/lawn/v1/widget.js")
        if not content:
            self.log_result("Widget.js File Access", "FAIL", "Could not read file")
            return
        
        # Test 1: Verify autoDrawServiceArea function is REMOVED or not called
        if "autoDrawServiceArea" in content:
            # Check if it's actually called anywhere
            auto_draw_calls = re.findall(r'autoDrawServiceArea\s*\(', content)
            if auto_draw_calls:
                self.log_result("Widget.js - autoDrawServiceArea Calls", "FAIL", f"autoDrawServiceArea still called {len(auto_draw_calls)} times")
            else:
                self.log_result("Widget.js - autoDrawServiceArea Calls", "PASS", "autoDrawServiceArea function exists but not called")
        else:
            self.log_result("Widget.js - autoDrawServiceArea Removal", "PASS", "autoDrawServiceArea function removed")
        
        # Test 2: Verify onPlaceChanged does NOT call autoDrawServiceArea
        onplace_match = re.search(r'function onPlaceChanged.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if onplace_match:
            onplace_content = onplace_match.group(0)
            if "autoDrawServiceArea" in onplace_content:
                self.log_result("Widget.js - onPlaceChanged Auto-draw", "FAIL", "onPlaceChanged still calls autoDrawServiceArea")
            else:
                self.log_result("Widget.js - onPlaceChanged Auto-draw", "PASS", "onPlaceChanged does not call autoDrawServiceArea")
        
        # Test 3: Verify processSelectedPlace does NOT call autoDrawServiceArea
        process_match = re.search(r'function processSelectedPlace.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if process_match:
            process_content = process_match.group(0)
            if "autoDrawServiceArea" in process_content:
                self.log_result("Widget.js - processSelectedPlace Auto-draw", "FAIL", "processSelectedPlace still calls autoDrawServiceArea")
            else:
                self.log_result("Widget.js - processSelectedPlace Auto-draw", "PASS", "processSelectedPlace does not call autoDrawServiceArea")
        
        # Test 4: Verify clearPolygon does NOT call autoDrawServiceArea
        clear_match = re.search(r'function clearPolygon.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if clear_match:
            clear_content = clear_match.group(0)
            if "autoDrawServiceArea" in clear_content:
                self.log_result("Widget.js - clearPolygon Auto-draw", "FAIL", "clearPolygon still calls autoDrawServiceArea")
            else:
                self.log_result("Widget.js - clearPolygon Auto-draw", "PASS", "clearPolygon does not call autoDrawServiceArea")
        
        # Test 5: Verify UI instructions prompt manual drawing
        manual_instructions = [
            "Draw Boundary",
            "Click \"Draw Boundary\"",
            "outline your lawn area",
            "manual"
        ]
        
        found_manual = any(instr.lower() in content.lower() for instr in manual_instructions)
        if found_manual:
            self.log_result("Widget.js - Manual Drawing Instructions", "PASS", "UI prompts manual drawing")
        else:
            self.log_result("Widget.js - Manual Drawing Instructions", "FAIL", "No manual drawing instructions found")
        
        # Test 6: Verify satellite view default
        if "mapTypeId: 'satellite'" in content:
            self.log_result("Widget.js - Satellite View Default", "PASS", "Satellite view set as default")
        else:
            self.log_result("Widget.js - Satellite View Default", "FAIL", "Satellite view not set as default")
    
    def test_pro_js_auto_draw_removal(self):
        """Test pro.js for auto-draw removal"""
        print("\n🔍 Testing pro.js Auto-Draw Removal...")
        
        content = self.read_file_content("/app/pro/pro.js")
        if not content:
            self.log_result("Pro.js File Access", "FAIL", "Could not read file")
            return
        
        # Test 1: Verify autoDrawServiceArea function is REMOVED or not called
        if "autoDrawServiceArea" in content:
            auto_draw_calls = re.findall(r'autoDrawServiceArea\s*\(', content)
            if auto_draw_calls:
                self.log_result("Pro.js - autoDrawServiceArea Calls", "FAIL", f"autoDrawServiceArea still called {len(auto_draw_calls)} times")
            else:
                self.log_result("Pro.js - autoDrawServiceArea Calls", "PASS", "autoDrawServiceArea function exists but not called")
        else:
            self.log_result("Pro.js - autoDrawServiceArea Removal", "PASS", "autoDrawServiceArea function removed")
        
        # Test 2: Verify locateProperty does NOT call autoDrawServiceArea
        locate_match = re.search(r'function locateProperty.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if locate_match:
            locate_content = locate_match.group(0)
            if "autoDrawServiceArea" in locate_content:
                self.log_result("Pro.js - locateProperty Auto-draw", "FAIL", "locateProperty still calls autoDrawServiceArea")
            else:
                self.log_result("Pro.js - locateProperty Auto-draw", "PASS", "locateProperty does not call autoDrawServiceArea")
        
        # Test 3: Verify onPlaceChanged does NOT call estimateAreaFromAddress or autoDrawServiceArea
        onplace_match = re.search(r'function onPlaceChanged.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if onplace_match:
            onplace_content = onplace_match.group(0)
            if "autoDrawServiceArea" in onplace_content or "estimateAreaFromAddress" in onplace_content:
                self.log_result("Pro.js - onPlaceChanged Auto-estimation", "FAIL", "onPlaceChanged still calls auto-estimation functions")
            else:
                self.log_result("Pro.js - onPlaceChanged Auto-estimation", "PASS", "onPlaceChanged does not call auto-estimation")
        
        # Test 4: Verify property type change handler does NOT trigger re-estimation
        # Look for property type event listeners
        proptype_listeners = re.findall(r'propertyType.*?addEventListener.*?(?=\n.*?\n)', content, re.DOTALL)
        auto_estimation_in_listeners = any("autoDrawServiceArea" in listener or "estimateAreaFromAddress" in listener for listener in proptype_listeners)
        
        if auto_estimation_in_listeners:
            self.log_result("Pro.js - Property Type Auto-estimation", "FAIL", "Property type change still triggers auto-estimation")
        else:
            self.log_result("Pro.js - Property Type Auto-estimation", "PASS", "Property type change does not trigger auto-estimation")
        
        # Test 5: Verify clearPolygon does NOT call autoDrawServiceArea
        clear_match = re.search(r'function clearPolygon.*?(?=function|\n\s*\/\/|\n\s*$)', content, re.DOTALL)
        if clear_match:
            clear_content = clear_match.group(0)
            if "autoDrawServiceArea" in clear_content:
                self.log_result("Pro.js - clearPolygon Auto-draw", "FAIL", "clearPolygon still calls autoDrawServiceArea")
            else:
                self.log_result("Pro.js - clearPolygon Auto-draw", "PASS", "clearPolygon does not call autoDrawServiceArea")
        
        # Test 6: Verify UI instructions prompt manual drawing
        manual_instructions = [
            "Draw Area",
            "Draw your service area",
            "boundary for accurate pricing",
            "manual"
        ]
        
        found_manual = any(instr.lower() in content.lower() for instr in manual_instructions)
        if found_manual:
            self.log_result("Pro.js - Manual Drawing Instructions", "PASS", "UI prompts manual drawing")
        else:
            self.log_result("Pro.js - Manual Drawing Instructions", "FAIL", "No manual drawing instructions found")
        
        # Test 7: Verify satellite view default
        if "mapTypeId: 'satellite'" in content:
            self.log_result("Pro.js - Satellite View Default", "PASS", "Satellite view set as default")
        else:
            self.log_result("Pro.js - Satellite View Default", "FAIL", "Satellite view not set as default")
    
    def test_manual_drawing_preserved(self):
        """Test that manual drawing functionality is preserved"""
        print("\n🔍 Testing Manual Drawing Preservation...")
        
        for file_path in self.files_to_test:
            content = self.read_file_content(file_path)
            if not content:
                continue
                
            file_name = os.path.basename(file_path)
            
            # Test drawingManager initialization
            if "drawingManager" in content and "DrawingManager" in content:
                self.log_result(f"{file_name} - DrawingManager Init", "PASS", "DrawingManager still initialized")
            else:
                self.log_result(f"{file_name} - DrawingManager Init", "FAIL", "DrawingManager not found")
            
            # Test Draw buttons
            draw_buttons = ["Draw Boundary", "Draw Area", "Add Zone"]
            has_draw_button = any(btn in content for btn in draw_buttons)
            
            if has_draw_button:
                self.log_result(f"{file_name} - Draw Buttons", "PASS", "Draw buttons still functional")
            else:
                self.log_result(f"{file_name} - Draw Buttons", "FAIL", "No draw buttons found")
            
            # Test polygon area calculation
            if "computeArea" in content or "calculatePolygonArea" in content or "calculateSinglePolygonArea" in content:
                self.log_result(f"{file_name} - Area Calculation", "PASS", "Polygon area calculation preserved")
            else:
                self.log_result(f"{file_name} - Area Calculation", "FAIL", "Area calculation not found")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Auto-Draw Removal Code Review Tests...")
        print("=" * 60)
        
        self.test_quote_js_auto_draw_removal()
        self.test_widget_js_auto_draw_removal()
        self.test_pro_js_auto_draw_removal()
        self.test_manual_drawing_preserved()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['test']}: {result['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AutoDrawRemovalTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)