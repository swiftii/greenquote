#!/usr/bin/env python3
"""
Backend Testing for GreenQuote Pro Widget Integration Feature

This test suite verifies the Widget Integration feature implementation:
1. SQL migration file for widget_installations table
2. Widget Config API endpoint (/api/widget/config.js)
3. Widget Save Quote API endpoint (/api/widget/save-quote.js)
4. Widget Service functions (ensureWidgetInstallation, generateEmbedCode, etc.)
5. Settings page widget management integration
6. Widget runtime JavaScript (widgets/lawn/v1/widget.js)
7. Quote service source field integration
8. Vercel configuration for widget routes

Since this is a Supabase-based app with Vercel serverless functions, we focus on:
- Code syntax and logic verification
- API endpoint structure validation
- Widget service implementation
- Settings page integration
- Widget runtime functionality
"""

import os
import sys
import json
import re
import requests
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuoteWidgetIntegrationTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'sql_migration': {'status': 'pending', 'details': []},
            'widget_config_api': {'status': 'pending', 'details': []},
            'widget_save_quote_api': {'status': 'pending', 'details': []},
            'widget_service': {'status': 'pending', 'details': []},
            'settings_integration': {'status': 'pending', 'details': []},
            'widget_runtime': {'status': 'pending', 'details': []},
            'quote_service_integration': {'status': 'pending', 'details': []},
            'vercel_config': {'status': 'pending', 'details': []},
            'integration': {'status': 'pending', 'details': []}
        }
        
    def test_sql_migration(self):
        """Test the SQL migration file for Widget Integration feature"""
        print("🔍 Testing SQL Migration File...")
        
        migration_file = self.app_dir / 'SUPABASE_WIDGET_INSTALLATIONS.sql'
        
        if not migration_file.exists():
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append('Migration file not found')
            return False
            
        try:
            content = migration_file.read_text()
            
            # Check for widget_installations table creation
            widget_table_checks = [
                ('CREATE TABLE.*widget_installations', 'widget_installations table creation'),
                ('account_id.*REFERENCES accounts', 'account relationship'),
                ('public_widget_id.*TEXT.*UNIQUE', 'public_widget_id column with unique constraint'),
                ('is_active.*BOOLEAN.*DEFAULT true', 'is_active column with default'),
                ('created_at.*TIMESTAMPTZ', 'created_at timestamp column'),
                ('updated_at.*TIMESTAMPTZ', 'updated_at timestamp column'),
            ]
            
            for pattern, description in widget_table_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for indexes
            index_checks = [
                ('CREATE INDEX.*widget_installations_account_id', 'account_id index'),
                ('CREATE INDEX.*widget_installations_public_widget_id', 'public_widget_id index'),
            ]
            
            for pattern, description in index_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for RLS policies
            rls_checks = [
                ('ENABLE ROW LEVEL SECURITY', 'RLS enabled for widget_installations'),
                ('CREATE POLICY.*view own widget installations', 'SELECT policy'),
                ('CREATE POLICY.*create widget installations', 'INSERT policy'),
                ('CREATE POLICY.*update own widget installations', 'UPDATE policy'),
                ('CREATE POLICY.*delete own widget installations', 'DELETE policy'),
            ]
            
            for pattern, description in rls_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for quotes table source column
            if re.search(r'ALTER TABLE quotes.*ADD COLUMN.*source', content, re.IGNORECASE | re.DOTALL):
                self.results['sql_migration']['details'].append("✅ source column added to quotes table")
            else:
                self.results['sql_migration']['details'].append("❌ source column not added to quotes table")
                self.results['sql_migration']['status'] = 'failed'
                return False
            
            # Check for verification queries
            if 'information_schema.columns' in content:
                self.results['sql_migration']['details'].append("✅ Verification queries included")
            
            self.results['sql_migration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append(f"Error reading migration file: {str(e)}")
            return False
    
    def test_widget_config_api(self):
        """Test Widget Config API endpoint"""
        print("🔍 Testing Widget Config API...")
        
        api_file = self.app_dir / 'api' / 'widget' / 'config.js'
        
        if not api_file.exists():
            self.results['widget_config_api']['status'] = 'failed'
            self.results['widget_config_api']['details'].append('Widget Config API file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for required imports and setup
            setup_checks = [
                ('import.*createClient.*@supabase/supabase-js', 'Supabase client import'),
                ('export default.*function handler', 'Default handler function export'),
                ('SUPABASE_SERVICE_ROLE_KEY', 'Service role key usage'),
                ('req.method.*GET', 'GET method validation'),
            ]
            
            for pattern, description in setup_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_config_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_config_api']['details'].append(f"❌ {description}")
                    self.results['widget_config_api']['status'] = 'failed'
                    return False
            
            # Check for CORS headers
            cors_checks = [
                ('Access-Control-Allow-Origin', 'CORS origin header'),
                ('Access-Control-Allow-Methods', 'CORS methods header'),
                ('Access-Control-Allow-Headers', 'CORS headers header'),
            ]
            
            for pattern, description in cors_checks:
                if pattern in content:
                    self.results['widget_config_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_config_api']['details'].append(f"❌ {description}")
                    self.results['widget_config_api']['status'] = 'failed'
                    return False
            
            # Check for widget ID validation
            validation_checks = [
                ('wid.*req.query', 'Widget ID parameter extraction'),
                ('wid.startsWith.*wg_', 'Widget ID format validation'),
                ('widget_installations.*public_widget_id.*wid', 'Widget lookup query'),
                ('is_active', 'Widget active status check'),
            ]
            
            for pattern, description in validation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_config_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_config_api']['details'].append(f"❌ {description}")
                    self.results['widget_config_api']['status'] = 'failed'
                    return False
            
            # Check for account settings loading
            settings_checks = [
                ('account_settings.*min_price_per_visit', 'Account settings query'),
                ('use_tiered_sqft_pricing', 'Tiered pricing setting'),
                ('sqft_pricing_tiers', 'Pricing tiers loading'),
                ('account_addons.*is_active.*true', 'Active addons loading'),
            ]
            
            for pattern, description in settings_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_config_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_config_api']['details'].append(f"❌ {description}")
                    self.results['widget_config_api']['status'] = 'failed'
                    return False
            
            # Check for response payload structure
            payload_checks = [
                ('accountId.*businessName', 'Basic account info in payload'),
                ('pricing.*minPricePerVisit', 'Pricing configuration'),
                ('addons.*map', 'Addons mapping'),
                ('frequency.*multiplier', 'Frequency configuration'),
            ]
            
            for pattern, description in payload_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_config_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_config_api']['details'].append(f"❌ {description}")
                    self.results['widget_config_api']['status'] = 'failed'
                    return False
            
            self.results['widget_config_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['widget_config_api']['status'] = 'failed'
            self.results['widget_config_api']['details'].append(f"Error reading widget config API: {str(e)}")
            return False
    
    def test_widget_save_quote_api(self):
        """Test Widget Save Quote API endpoint"""
        print("🔍 Testing Widget Save Quote API...")
        
        api_file = self.app_dir / 'api' / 'widget' / 'save-quote.js'
        
        if not api_file.exists():
            self.results['widget_save_quote_api']['status'] = 'failed'
            self.results['widget_save_quote_api']['details'].append('Widget Save Quote API file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for required imports and setup
            setup_checks = [
                ('import.*createClient.*@supabase/supabase-js', 'Supabase client import'),
                ('export default.*function handler', 'Default handler function export'),
                ('SUPABASE_SERVICE_ROLE_KEY', 'Service role key usage'),
                ('req.method.*POST', 'POST method validation'),
            ]
            
            for pattern, description in setup_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_save_quote_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_save_quote_api']['details'].append(f"❌ {description}")
                    self.results['widget_save_quote_api']['status'] = 'failed'
                    return False
            
            # Check for CORS headers
            cors_checks = [
                ('Access-Control-Allow-Origin', 'CORS origin header'),
                ('Access-Control-Allow-Methods', 'CORS methods header'),
                ('Access-Control-Allow-Headers', 'CORS headers header'),
            ]
            
            for pattern, description in cors_checks:
                if pattern in content:
                    self.results['widget_save_quote_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_save_quote_api']['details'].append(f"❌ {description}")
                    self.results['widget_save_quote_api']['status'] = 'failed'
                    return False
            
            # Check for request validation
            validation_checks = [
                ('widgetId.*accountId.*req.body', 'Required fields extraction'),
                ('widget_installations.*public_widget_id.*widgetId', 'Widget verification'),
                ('account_id.*accountId', 'Account verification'),
                ('is_active', 'Widget active status verification'),
            ]
            
            for pattern, description in validation_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_save_quote_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_save_quote_api']['details'].append(f"❌ {description}")
                    self.results['widget_save_quote_api']['status'] = 'failed'
                    return False
            
            # Check for quote insertion
            quote_checks = [
                ('servicesSnapshot.*baseService.*addons', 'Services snapshot structure'),
                ('quotes.*insert', 'Quote insertion'),
                ('source.*widget', 'Source field set to widget'),
                ('status.*pending', 'Status set to pending'),
                ('pricing_mode.*pricingTiersSnapshot', 'Pricing snapshot fields'),
            ]
            
            for pattern, description in quote_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_save_quote_api']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_save_quote_api']['details'].append(f"❌ {description}")
                    self.results['widget_save_quote_api']['status'] = 'failed'
                    return False
            
            self.results['widget_save_quote_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['widget_save_quote_api']['status'] = 'failed'
            self.results['widget_save_quote_api']['details'].append(f"Error reading widget save quote API: {str(e)}")
            return False
    
    def test_widget_service(self):
        """Test widgetService.js functions"""
        print("🔍 Testing Widget Service...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'widgetService.js'
        
        if not service_file.exists():
            self.results['widget_service']['status'] = 'failed'
            self.results['widget_service']['details'].append('widgetService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check for required functions
            functions = [
                ('function generateWidgetId', 'generateWidgetId function'),
                ('export.*function ensureWidgetInstallation', 'ensureWidgetInstallation function exported'),
                ('export.*function updateWidgetInstallation', 'updateWidgetInstallation function exported'),
                ('export.*function generateEmbedCode', 'generateEmbedCode function exported'),
                ('export.*function getWidgetHostUrl', 'getWidgetHostUrl function exported'),
            ]
            
            for pattern, description in functions:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['widget_service']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_service']['details'].append(f"❌ {description}")
                    self.results['widget_service']['status'] = 'failed'
                    return False
            
            # Check function implementations
            impl_checks = [
                ('wg_.*chars.*20', 'generateWidgetId creates wg_ prefixed ID with 20 chars'),
                ('widget_installations.*account_id', 'ensureWidgetInstallation queries by account'),
                ('PGRST116.*no rows found', 'ensureWidgetInstallation handles no existing widget'),
                ('iframe.*widgets/lawn/v1.*wid', 'generateEmbedCode creates iframe with correct URL'),
                ('window.location.origin', 'getWidgetHostUrl uses current origin'),
            ]
            
            for pattern, description in impl_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_service']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_service']['details'].append(f"❌ {description}")
                    self.results['widget_service']['status'] = 'failed'
                    return False
            
            self.results['widget_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['widget_service']['status'] = 'failed'
            self.results['widget_service']['details'].append(f"Error reading widget service file: {str(e)}")
            return False
    
    def test_settings_integration(self):
        """Test Settings.js widget integration"""
        print("🔍 Testing Settings Page Widget Integration...")
        
        settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
        
        if not settings_file.exists():
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append('Settings.js file not found')
            return False
            
        try:
            content = settings_file.read_text()
            
            # Check for widget service imports
            import_checks = [
                ('import.*ensureWidgetInstallation.*updateWidgetInstallation.*generateEmbedCode.*widgetService', 'Widget service functions imported'),
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for widget state management
            state_checks = [
                ('widgetInstallation.*setWidgetInstallation', 'Widget installation state'),
                ('widgetLoading.*setWidgetLoading', 'Widget loading state'),
                ('embedCodeCopied.*setEmbedCodeCopied', 'Embed code copied state'),
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for widget loading in useEffect
            loading_checks = [
                ('ensureWidgetInstallation.*userAccount.id', 'Widget installation loading'),
                ('setWidgetInstallation.*widget', 'Widget installation state setting'),
            ]
            
            for pattern, description in loading_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check for widget UI components
            ui_checks = [
                ('Website Widget.*CardTitle', 'Widget card section'),
                ('Widget ID.*public_widget_id', 'Widget ID display'),
                ('Embed Code.*generateEmbedCode', 'Embed code display'),
                ('Switch.*widgetActive.*is_active', 'Widget toggle switch'),
                ('navigator.clipboard.writeText', 'Copy to clipboard functionality'),
            ]
            
            for pattern, description in ui_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            self.results['settings_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append(f"Error reading settings file: {str(e)}")
            return False
    
    def test_widget_runtime(self):
        """Test widget runtime JavaScript"""
        print("🔍 Testing Widget Runtime...")
        
        widget_file = self.app_dir / 'widgets' / 'lawn' / 'v1' / 'widget.js'
        
        if not widget_file.exists():
            self.results['widget_runtime']['status'] = 'failed'
            self.results['widget_runtime']['details'].append('Widget runtime file not found')
            return False
            
        try:
            content = widget_file.read_text()
            
            # Check for widget ID parameter reading
            param_checks = [
                ('window.location.search', 'URL parameter reading'),
                ('urlParams.get.*wid', 'Widget ID parameter extraction'),
                ('urlParams.get.*client', 'Legacy client parameter support'),
            ]
            
            for pattern, description in param_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_runtime']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_runtime']['details'].append(f"❌ {description}")
                    self.results['widget_runtime']['status'] = 'failed'
                    return False
            
            # Check for API configuration loading
            api_checks = [
                ('api/widget/config.*wid', 'Config API endpoint call'),
                ('transformApiConfig', 'API config transformation function'),
                ('accountId.*data.accountId', 'Account ID extraction'),
            ]
            
            for pattern, description in api_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_runtime']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_runtime']['details'].append(f"❌ {description}")
                    self.results['widget_runtime']['status'] = 'failed'
                    return False
            
            # Check for pricing calculations
            pricing_checks = [
                ('calculateTieredPrice', 'Tiered pricing calculation function'),
                ('useTieredPricing.*pricingTiers', 'Tiered pricing usage'),
                ('pricingMode.*tiered.*flat', 'Pricing mode handling'),
                ('frequencyMultipliers', 'Frequency multiplier application'),
            ]
            
            for pattern, description in pricing_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_runtime']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_runtime']['details'].append(f"❌ {description}")
                    self.results['widget_runtime']['status'] = 'failed'
                    return False
            
            # Check for quote submission
            submission_checks = [
                ('submitQuote', 'Quote submission function'),
                ('api/widget/save-quote', 'Save quote API endpoint call'),
                ('widgetId.*accountId.*payload', 'Required payload fields'),
                ('pricingTiersSnapshot.*flatRateSnapshot', 'Pricing snapshot in payload'),
            ]
            
            for pattern, description in submission_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['widget_runtime']['details'].append(f"✅ {description}")
                else:
                    self.results['widget_runtime']['details'].append(f"❌ {description}")
                    self.results['widget_runtime']['status'] = 'failed'
                    return False
            
            # Check for volume discount messaging
            if re.search(r'Larger lawns receive automatic volume discounts', content, re.IGNORECASE | re.DOTALL):
                self.results['widget_runtime']['details'].append("✅ Volume discount note for tiered pricing")
            else:
                self.results['widget_runtime']['details'].append("❌ Volume discount note missing")
                self.results['widget_runtime']['status'] = 'failed'
                return False
            
            self.results['widget_runtime']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['widget_runtime']['status'] = 'failed'
            self.results['widget_runtime']['details'].append(f"Error reading widget runtime file: {str(e)}")
            return False
    
    def test_quote_service_integration(self):
        """Test Quote Service source field integration"""
        print("🔍 Testing Quote Service Integration...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'quoteService.js'
        
        if not service_file.exists():
            self.results['quote_service_integration']['status'] = 'failed'
            self.results['quote_service_integration']['details'].append('quoteService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check for source field in saveQuote function
            source_checks = [
                ('source.*pro_app.*widget', 'Source field documentation'),
                ('source.*source.*pro_app', 'Source field in saveQuote parameters and default'),
            ]
            
            for pattern, description in source_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service_integration']['details'].append(f"❌ {description}")
                    self.results['quote_service_integration']['status'] = 'failed'
                    return False
            
            self.results['quote_service_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_service_integration']['status'] = 'failed'
            self.results['quote_service_integration']['details'].append(f"Error reading quote service file: {str(e)}")
            return False
    
    def test_vercel_config(self):
        """Test Vercel configuration for widget routes"""
        print("🔍 Testing Vercel Configuration...")
        
        vercel_file = self.app_dir / 'vercel.json'
        
        if not vercel_file.exists():
            self.results['vercel_config']['status'] = 'failed'
            self.results['vercel_config']['details'].append('vercel.json file not found')
            return False
            
        try:
            content = vercel_file.read_text()
            
            # Check for widget API routes
            route_checks = [
                ('api/widget/config.*api/widget/config.js', 'Widget config API route'),
                ('api/widget/save-quote.*api/widget/save-quote.js', 'Widget save quote API route'),
                ('widgets/.*widgets/', 'Widget static files route'),
            ]
            
            for pattern, description in route_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['vercel_config']['details'].append(f"✅ {description}")
                else:
                    self.results['vercel_config']['details'].append(f"❌ {description}")
                    self.results['vercel_config']['status'] = 'failed'
                    return False
            
            self.results['vercel_config']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['vercel_config']['status'] = 'failed'
            self.results['vercel_config']['details'].append(f"Error reading vercel config: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete widget integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Settings page can manage widget
            settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
            if settings_file.exists():
                settings_content = settings_file.read_text()
                if 'ensureWidgetInstallation' in settings_content and 'generateEmbedCode' in settings_content:
                    integration_checks.append("✅ Settings page manages widget installation and embed code")
                else:
                    integration_checks.append("❌ Settings page doesn't manage widget properly")
            
            # 2. Widget runtime loads config from API
            widget_file = self.app_dir / 'widgets' / 'lawn' / 'v1' / 'widget.js'
            if widget_file.exists():
                widget_content = widget_file.read_text()
                if 'api/widget/config' in widget_content and 'transformApiConfig' in widget_content:
                    integration_checks.append("✅ Widget runtime loads config from API")
                else:
                    integration_checks.append("❌ Widget runtime doesn't load config properly")
            
            # 3. Widget saves quotes via API
            if widget_file.exists():
                widget_content = widget_file.read_text()
                if 'api/widget/save-quote' in widget_content and 'submitQuote' in widget_content:
                    integration_checks.append("✅ Widget saves quotes via API")
                else:
                    integration_checks.append("❌ Widget doesn't save quotes properly")
            
            # 4. Config API returns account settings
            config_api_file = self.app_dir / 'api' / 'widget' / 'config.js'
            if config_api_file.exists():
                config_content = config_api_file.read_text()
                if 'account_settings' in config_content and 'account_addons' in config_content:
                    integration_checks.append("✅ Config API returns account settings and addons")
                else:
                    integration_checks.append("❌ Config API doesn't return proper settings")
            
            # 5. Save Quote API validates widget and saves to database
            save_api_file = self.app_dir / 'api' / 'widget' / 'save-quote.js'
            if save_api_file.exists():
                save_content = save_api_file.read_text()
                if 'widget_installations' in save_content and '.from(\'quotes\')' in save_content and '.insert(' in save_content:
                    integration_checks.append("✅ Save Quote API validates widget and saves quotes")
                else:
                    integration_checks.append("❌ Save Quote API doesn't validate or save properly")
            
            # 6. Vercel routes are configured
            vercel_file = self.app_dir / 'vercel.json'
            if vercel_file.exists():
                vercel_content = vercel_file.read_text()
                if 'api/widget/config' in vercel_content and 'api/widget/save-quote' in vercel_content:
                    integration_checks.append("✅ Vercel routes configured for widget APIs")
                else:
                    integration_checks.append("❌ Vercel routes not properly configured")
            
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
            self.results['integration']['details'].append(f"Error testing integration: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and return results"""
        print("🚀 Starting GreenQuote Pro Widget Integration Feature Tests\n")
        
        tests = [
            ('SQL Migration', self.test_sql_migration),
            ('Widget Config API', self.test_widget_config_api),
            ('Widget Save Quote API', self.test_widget_save_quote_api),
            ('Widget Service', self.test_widget_service),
            ('Settings Integration', self.test_settings_integration),
            ('Widget Runtime', self.test_widget_runtime),
            ('Quote Service Integration', self.test_quote_service_integration),
            ('Vercel Configuration', self.test_vercel_config),
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
    tester = GreenQuoteWidgetIntegrationTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Widget Integration feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
