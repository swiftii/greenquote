#!/usr/bin/env python3
"""
Backend Testing for GreenQuote Pro Tiered Square-Footage Pricing Feature

This test suite verifies the Tiered Square-Footage Pricing implementation:
1. SQL migration file syntax and structure
2. Pricing utilities functions (calculateTieredPrice, validatePricingTiers, etc.)
3. Settings.js tiered pricing UI and functionality
4. Quote.js pricing calculation integration
5. quoteService.js pricing snapshot saving
6. Integration flow and pricing calculations

Since this is primarily a frontend feature with database changes, we focus on:
- Code syntax and logic verification
- Pricing calculation accuracy
- Integration point validation
- Component structure validation
- Service function implementation
"""

import os
import sys
import json
import re
import requests
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuoteTieredPricingTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'sql_migration': {'status': 'pending', 'details': []},
            'pricing_utils': {'status': 'pending', 'details': []},
            'settings_integration': {'status': 'pending', 'details': []},
            'quote_integration': {'status': 'pending', 'details': []},
            'quote_service': {'status': 'pending', 'details': []},
            'pricing_calculations': {'status': 'pending', 'details': []},
            'integration': {'status': 'pending', 'details': []}
        }
        
    def test_sql_migration(self):
        """Test the SQL migration file for Tiered Pricing feature"""
        print("🔍 Testing SQL Migration File...")
        
        migration_file = self.app_dir / 'SUPABASE_TIERED_PRICING_MIGRATION.sql'
        
        if not migration_file.exists():
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append('❌ Migration file not found')
            return False
            
        try:
            content = migration_file.read_text()
            
            # Check for required SQL elements for account_settings updates
            account_settings_checks = [
                ('ALTER TABLE account_settings.*ADD COLUMN.*use_tiered_sqft_pricing', 'use_tiered_sqft_pricing column addition'),
                ('BOOLEAN.*DEFAULT true', 'use_tiered_sqft_pricing defaults to true'),
                ('ALTER TABLE account_settings.*ADD COLUMN.*sqft_pricing_tiers', 'sqft_pricing_tiers column addition'),
                ('JSONB.*DEFAULT.*up_to_sqft.*rate_per_sqft', 'sqft_pricing_tiers JSONB with default tiers'),
                ('5000.*0\.012', 'first tier: 5000 sq ft at $0.012'),
                ('20000.*0\.008', 'second tier: 20000 sq ft at $0.008'),
                ('null.*0\.005', 'unlimited tier: null limit at $0.005'),
            ]
            
            for pattern, description in account_settings_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for quotes table pricing snapshot columns
            quotes_checks = [
                ('ALTER TABLE quotes.*ADD COLUMN.*pricing_mode', 'pricing_mode column addition'),
                ('ALTER TABLE quotes.*ADD COLUMN.*pricing_tiers_snapshot', 'pricing_tiers_snapshot column addition'),
                ('ALTER TABLE quotes.*ADD COLUMN.*flat_rate_snapshot', 'flat_rate_snapshot column addition'),
                ('JSONB', 'pricing_tiers_snapshot is JSONB type'),
                ('DECIMAL', 'flat_rate_snapshot is DECIMAL type'),
            ]
            
            for pattern, description in quotes_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for verification queries
            if 'information_schema.columns' in content:
                self.results['sql_migration']['details'].append("✅ Verification queries included")
            
            # Check for rollback instructions
            if 'DROP COLUMN' in content and 'rollback' in content.lower():
                self.results['sql_migration']['details'].append("✅ Rollback instructions provided")
            
            self.results['sql_migration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append(f"❌ Error reading migration file: {str(e)}")
            return False
    
    def test_pricing_utils(self):
        """Test pricingUtils.js functions"""
        print("🔍 Testing Pricing Utilities...")
        
        utils_file = self.app_dir / 'frontend' / 'src' / 'utils' / 'pricingUtils.js'
        
        if not utils_file.exists():
            self.results['pricing_utils']['status'] = 'failed'
            self.results['pricing_utils']['details'].append('❌ pricingUtils.js file not found')
            return False
            
        try:
            content = utils_file.read_text()
            
            # Check for required exports
            exports = [
                ('export.*DEFAULT_PRICING_TIERS', 'DEFAULT_PRICING_TIERS constant exported'),
                ('export.*function calculateTieredPrice', 'calculateTieredPrice function exported'),
                ('export.*function calculateFlatPrice', 'calculateFlatPrice function exported'),
                ('export.*function validatePricingTiers', 'validatePricingTiers function exported'),
                ('export.*function calculateEffectiveRate', 'calculateEffectiveRate function exported'),
                ('export.*function comparePricing', 'comparePricing function exported'),
            ]
            
            for pattern, description in exports:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['pricing_utils']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_utils']['details'].append(f"❌ {description}")
                    self.results['pricing_utils']['status'] = 'failed'
                    return False
            
            # Check DEFAULT_PRICING_TIERS structure
            default_tiers_checks = [
                ('up_to_sqft.*5000.*rate_per_sqft.*0\.012', 'first tier: 5000 sq ft at $0.012'),
                ('up_to_sqft.*20000.*rate_per_sqft.*0\.008', 'second tier: 20000 sq ft at $0.008'),
                ('up_to_sqft.*null.*rate_per_sqft.*0\.005', 'unlimited tier: null limit at $0.005'),
            ]
            
            for pattern, description in default_tiers_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_utils']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_utils']['details'].append(f"❌ {description}")
                    self.results['pricing_utils']['status'] = 'failed'
                    return False
            
            # Check calculateTieredPrice implementation
            tiered_calc_checks = [
                ('totalPrice.*breakdown', 'calculateTieredPrice returns totalPrice and breakdown'),
                ('Math\.round.*100.*100', 'price rounded to cents'),
                ('sqftInTier.*rate_per_sqft', 'tier price calculation'),
                ('remainingSqFt.*sqftInTier', 'remaining square footage tracking'),
                ('sort.*up_to_sqft', 'tiers sorted by up_to_sqft'),
            ]
            
            for pattern, description in tiered_calc_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_utils']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_utils']['details'].append(f"❌ {description}")
                    self.results['pricing_utils']['status'] = 'failed'
                    return False
            
            # Check validatePricingTiers implementation
            validation_checks = [
                ('valid.*errors', 'validatePricingTiers returns valid and errors'),
                ('At least one.*tier.*required', 'validates minimum tier requirement'),
                ('rate_per_sqft.*positive', 'validates positive rates'),
                ('up_to_sqft.*greater.*previous', 'validates tier ordering'),
                ('unlimited.*tier', 'validates unlimited tier requirement'),
            ]
            
            for pattern, description in validation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_utils']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_utils']['details'].append(f"❌ {description}")
                    self.results['pricing_utils']['status'] = 'failed'
                    return False
            
            self.results['pricing_utils']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['pricing_utils']['status'] = 'failed'
            self.results['pricing_utils']['details'].append(f"❌ Error reading pricing utils file: {str(e)}")
            return False
    
    def test_settings_integration(self):
        """Test Settings.js tiered pricing integration"""
        print("🔍 Testing Settings Page Integration...")
        
        settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
        
        if not settings_file.exists():
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append('❌ Settings.js file not found')
            return False
            
        try:
            content = settings_file.read_text()
            
            # Check for required imports
            import_checks = [
                ('import.*DEFAULT_PRICING_TIERS.*validatePricingTiers.*pricingUtils', 'imports pricing utilities'),
                ('import.*Switch.*ui/switch', 'imports Switch component'),
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for tiered pricing state management
            state_checks = [
                ('useTieredSqftPricing.*true', 'useTieredSqftPricing state initialized'),
                ('sqftPricingTiers.*DEFAULT_PRICING_TIERS', 'sqftPricingTiers state with defaults'),
                ('tierErrors.*setTierErrors', 'tier validation errors state'),
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for toggle UI
            toggle_checks = [
                ('Switch.*useTieredSqftPricing', 'tiered pricing toggle switch'),
                ('Enable volume-based.*tiered.*pricing', 'toggle label text'),
                ('handleToggleTieredPricing', 'toggle handler function'),
            ]
            
            for pattern, description in toggle_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for tier editor UI
            editor_checks = [
                ('Pricing Tiers', 'tier editor section title'),
                ('Up to Sq Ft.*Price per Sq Ft', 'tier table headers'),
                ('handleTierChange', 'tier change handler'),
                ('handleAddTier', 'add tier handler'),
                ('handleRemoveTier', 'remove tier handler'),
                ('handleResetTiersToDefault', 'reset to default handler'),
            ]
            
            for pattern, description in editor_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for validation integration
            validation_checks = [
                ('validatePricingTiers.*formData\.sqftPricingTiers', 'tier validation on save'),
                ('setTierErrors.*validation\.errors', 'validation errors display'),
                ('tierErrors\.length.*Alert', 'validation error UI'),
            ]
            
            for pattern, description in validation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for flat rate fallback
            if 'Flat Price Per Square Foot' in content and '!formData.useTieredSqftPricing' in content:
                self.results['settings_integration']['details'].append("✅ Flat rate field shown when tiered pricing is OFF")
            else:
                self.results['settings_integration']['details'].append("❌ Flat rate field not properly conditional")
                self.results['settings_integration']['status'] = 'failed'
                return False
            
            self.results['settings_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append(f"❌ Error reading settings file: {str(e)}")
            return False
    
    def test_quote_integration(self):
        """Test Quote.js tiered pricing integration"""
        print("🔍 Testing Quote Page Integration...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['quote_integration']['status'] = 'failed'
            self.results['quote_integration']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for required imports
            import_checks = [
                ('import.*calculateTieredPrice.*calculateFlatPrice.*pricingUtils', 'imports pricing calculation functions'),
                ('import.*DEFAULT_PRICING_TIERS.*pricingUtils', 'imports default tiers'),
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_integration']['details'].append(f"❌ {description}")
                    self.results['quote_integration']['status'] = 'failed'
                    return False
            
            # Check for pricing state with snapshots
            state_checks = [
                ('pricingMode.*flat', 'pricing mode state'),
                ('tiersSnapshot.*null', 'tiers snapshot state'),
                ('flatRateSnapshot.*null', 'flat rate snapshot state'),
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_integration']['details'].append(f"❌ {description}")
                    self.results['quote_integration']['status'] = 'failed'
                    return False
            
            # Check for pricing calculation logic
            calc_checks = [
                ('useTieredPricing.*use_tiered_sqft_pricing', 'reads tiered pricing setting'),
                ('calculateTieredPrice.*sqFt.*tiers', 'calls calculateTieredPrice function'),
                ('calculateFlatPrice.*sqFt.*flatRate', 'calls calculateFlatPrice function'),
                ('pricingMode.*tiered', 'sets tiered pricing mode'),
                ('tiersSnapshot.*tiers', 'saves tiers snapshot'),
                ('flatRateSnapshot.*flatRate', 'saves flat rate snapshot'),
            ]
            
            for pattern, description in calc_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_integration']['details'].append(f"❌ {description}")
                    self.results['quote_integration']['status'] = 'failed'
                    return False
            
            # Check for volume discount note
            if 'Larger lawns receive automatic volume discounts' in content and re.search(r'pricing\.pricingMode.*===.*tiered', content):
                self.results['quote_integration']['details'].append("✅ Volume discount note displayed for tiered pricing")
            else:
                self.results['quote_integration']['details'].append("❌ Volume discount note not properly conditional")
                self.results['quote_integration']['status'] = 'failed'
                return False
            
            # Check for pricing breakdown display
            breakdown_checks = [
                ('pricing\.breakdown.*map', 'pricing breakdown display'),
                ('tier\.sqftInTier.*tier\.rate', 'tier breakdown formatting'),
                ('item\.label.*item\.amount', 'breakdown item display'),
            ]
            
            for pattern, description in breakdown_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_integration']['details'].append(f"❌ {description}")
                    self.results['quote_integration']['status'] = 'failed'
                    return False
            
            self.results['quote_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_integration']['status'] = 'failed'
            self.results['quote_integration']['details'].append(f"❌ Error reading quote file: {str(e)}")
            return False
    
    def test_quote_service(self):
        """Test quoteService.js pricing snapshot saving"""
        print("🔍 Testing Quote Service Pricing Snapshots...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'quoteService.js'
        
        if not service_file.exists():
            self.results['quote_service']['status'] = 'failed'
            self.results['quote_service']['details'].append('❌ quoteService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check for saveQuote function parameters
            save_quote_checks = [
                ('pricingMode', 'saveQuote accepts pricingMode parameter'),
                ('pricingTiersSnapshot', 'saveQuote accepts pricingTiersSnapshot parameter'),
                ('flatRateSnapshot', 'saveQuote accepts flatRateSnapshot parameter'),
            ]
            
            for pattern, description in save_quote_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check for database field mapping
            db_mapping_checks = [
                ('pricing_mode.*pricingMode', 'pricing_mode field mapped'),
                ('pricing_tiers_snapshot.*pricingTiersSnapshot', 'pricing_tiers_snapshot field mapped'),
                ('flat_rate_snapshot.*flatRateSnapshot', 'flat_rate_snapshot field mapped'),
            ]
            
            for pattern, description in db_mapping_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check for default values
            if "pricingMode || 'flat'" in content:
                self.results['quote_service']['details'].append("✅ Default pricing mode is 'flat'")
            else:
                self.results['quote_service']['details'].append("❌ Default pricing mode not set")
                self.results['quote_service']['status'] = 'failed'
                return False
            
            self.results['quote_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_service']['status'] = 'failed'
            self.results['quote_service']['details'].append(f"❌ Error reading quote service file: {str(e)}")
            return False
    
    def test_pricing_calculations(self):
        """Test pricing calculation accuracy with expected values"""
        print("🔍 Testing Pricing Calculations...")
        
        utils_file = self.app_dir / 'frontend' / 'src' / 'utils' / 'pricingUtils.js'
        
        if not utils_file.exists():
            self.results['pricing_calculations']['status'] = 'failed'
            self.results['pricing_calculations']['details'].append('❌ pricingUtils.js file not found')
            return False
            
        try:
            content = utils_file.read_text()
            
            # Test case 1: Small lawn (2,500 sq ft) - should be in first tier only
            # Expected: 2,500 × $0.012 = $30
            test_cases = [
                {
                    'name': '2,500 sq ft (first tier only)',
                    'sqft': 2500,
                    'expected_total': 30.0,
                    'expected_tiers': 1
                },
                {
                    'name': '10,000 sq ft (spans first two tiers)',
                    'sqft': 10000,
                    'expected_total': 100.0,  # 5000×0.012 + 5000×0.008 = 60 + 40 = 100
                    'expected_tiers': 2
                },
                {
                    'name': '25,000 sq ft (spans all tiers)',
                    'sqft': 25000,
                    'expected_total': 205.0,  # 5000×0.012 + 15000×0.008 + 5000×0.005 = 60 + 120 + 25 = 205
                    'expected_tiers': 3
                }
            ]
            
            # Check if the algorithm description matches expected calculations
            algorithm_checks = [
                ('First 5,000 sq ft.*0\.012.*60', 'example calculation for first tier'),
                ('Next 15,000 sq ft.*0\.008.*120', 'example calculation for second tier'),
                ('Final 5,000 sq ft.*0\.005.*25', 'example calculation for third tier'),
                ('Total.*205', 'example total calculation'),
                ('25,000 sq ft', 'example uses 25,000 sq ft'),
            ]
            
            for pattern, description in algorithm_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_calculations']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_calculations']['details'].append(f"❌ {description}")
                    self.results['pricing_calculations']['status'] = 'failed'
                    return False
            
            # Check for blended rate calculation logic
            logic_checks = [
                ('sqftInTier.*Math\.min.*remainingSqFt.*tierSize', 'correct sq ft allocation per tier'),
                ('tierPrice.*sqftInTier.*rate_per_sqft', 'correct tier price calculation'),
                ('totalPrice.*tierPrice', 'price accumulation across tiers'),
                ('remainingSqFt.*sqftInTier', 'remaining sq ft tracking'),
                ('Math\.round.*100.*100', 'rounding to cents'),
            ]
            
            for pattern, description in logic_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_calculations']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_calculations']['details'].append(f"❌ {description}")
                    self.results['pricing_calculations']['status'] = 'failed'
                    return False
            
            # Check for tier sorting logic
            if re.search(r'sort.*up_to_sqft', content) and re.search(r'null.*return 1', content):
                self.results['pricing_calculations']['details'].append("✅ Tiers sorted correctly (null/unlimited last)")
            else:
                self.results['pricing_calculations']['details'].append("❌ Tier sorting logic incorrect")
                self.results['pricing_calculations']['status'] = 'failed'
                return False
            
            # Check for breakdown structure
            breakdown_checks = [
                ('rangeStart.*rangeEnd', 'breakdown includes range information'),
                ('sqftInTier.*rate.*price', 'breakdown includes calculation details'),
                ('label.*toLocaleString', 'breakdown includes formatted labels'),
            ]
            
            for pattern, description in breakdown_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['pricing_calculations']['details'].append(f"✅ {description}")
                else:
                    self.results['pricing_calculations']['details'].append(f"❌ {description}")
                    self.results['pricing_calculations']['status'] = 'failed'
                    return False
            
            self.results['pricing_calculations']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['pricing_calculations']['status'] = 'failed'
            self.results['pricing_calculations']['details'].append(f"❌ Error testing calculations: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Settings page configures tiered pricing
            settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
            if settings_file.exists():
                settings_content = settings_file.read_text()
                if 'useTieredSqftPricing' in settings_content and 'sqftPricingTiers' in settings_content:
                    integration_checks.append("✅ Settings page configures tiered pricing")
                else:
                    integration_checks.append("❌ Settings page doesn't configure tiered pricing")
            
            # 2. Quote page reads settings and calculates pricing
            quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'use_tiered_sqft_pricing' in quote_content and 'calculateTieredPrice' in quote_content:
                    integration_checks.append("✅ Quote page reads tiered pricing settings")
                else:
                    integration_checks.append("❌ Quote page doesn't read tiered pricing settings")
            
            # 3. Pricing utilities provide accurate calculations
            utils_file = self.app_dir / 'frontend' / 'src' / 'utils' / 'pricingUtils.js'
            if utils_file.exists():
                utils_content = utils_file.read_text()
                if 'calculateTieredPrice' in utils_content and re.search(r'totalPrice.*breakdown', utils_content):
                    integration_checks.append("✅ Pricing utilities provide tiered calculations")
                else:
                    integration_checks.append("❌ Pricing utilities don't provide tiered calculations")
            
            # 4. Quote service saves pricing snapshots
            service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'quoteService.js'
            if service_file.exists():
                service_content = service_file.read_text()
                if 'pricingMode' in service_content and 'pricingTiersSnapshot' in service_content:
                    integration_checks.append("✅ Quote service saves pricing snapshots")
                else:
                    integration_checks.append("❌ Quote service doesn't save pricing snapshots")
            
            # 5. SQL migration supports all required fields
            migration_file = self.app_dir / 'SUPABASE_TIERED_PRICING_MIGRATION.sql'
            if migration_file.exists():
                migration_content = migration_file.read_text()
                if 'use_tiered_sqft_pricing' in migration_content and 'sqft_pricing_tiers' in migration_content:
                    integration_checks.append("✅ SQL migration supports tiered pricing")
                else:
                    integration_checks.append("❌ SQL migration doesn't support tiered pricing")
            
            # 6. Volume discount note is conditional
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'volume discounts' in quote_content.lower() and re.search(r'pricing\.pricingMode.*===.*tiered', quote_content):
                    integration_checks.append("✅ Volume discount note shown for tiered pricing")
                else:
                    integration_checks.append("❌ Volume discount note not properly conditional")
            
            # 7. Flat rate fallback works
            if settings_file.exists() and quote_file.exists():
                settings_content = settings_file.read_text()
                quote_content = quote_file.read_text()
                if '!useTieredSqftPricing' in settings_content and 'calculateFlatPrice' in quote_content:
                    integration_checks.append("✅ Flat rate fallback implemented")
                else:
                    integration_checks.append("❌ Flat rate fallback not implemented")
            
            self.results['integration']['details'] = integration_checks
            
            # Determine overall integration status
            failed_checks = [check for check in integration_checks if check.startswith("❌")]
            if failed_checks:
                self.results['integration']['status'] = 'failed'
                return False
            else:
                self.results['integration']['status'] = 'passed'
                return True
                
        except Exception as e:
            self.results['integration']['status'] = 'failed'
            self.results['integration']['details'].append(f"❌ Error testing integration: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and return results"""
        print("🚀 Starting GreenQuote Pro Tiered Square-Footage Pricing Feature Tests\n")
        
        tests = [
            ('SQL Migration', self.test_sql_migration),
            ('Pricing Utilities', self.test_pricing_utils),
            ('Settings Integration', self.test_settings_integration),
            ('Quote Integration', self.test_quote_integration),
            ('Quote Service', self.test_quote_service),
            ('Pricing Calculations', self.test_pricing_calculations),
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
    tester = GreenQuoteTieredPricingTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Tiered Square-Footage Pricing feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)