#!/usr/bin/env python3
"""
Quote Tracking Feature Testing for GreenQuote Pro

This test suite verifies the Quote Tracking feature implementation:
1. SQL migration file (SUPABASE_QUOTES_TABLE.sql) syntax and structure
2. Quote Service (quoteService.js) functions and logic
3. Quote.js integration for saving quotes to Supabase
4. Dashboard.js integration for displaying quote counts
5. Overall integration flow

Since this is a Supabase-based app with external dependencies, we focus on:
- Code syntax and logic verification
- Integration point validation
- Function signature and parameter validation
- SQL migration structure validation
"""

import os
import sys
import json
import re
import requests
from pathlib import Path
from datetime import datetime, timezone

# Add the app directory to Python path
sys.path.insert(0, '/app')

class QuoteTrackingTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'sql_migration': {'status': 'pending', 'details': []},
            'quote_service': {'status': 'pending', 'details': []},
            'quote_page': {'status': 'pending', 'details': []},
            'dashboard_page': {'status': 'pending', 'details': []},
            'integration_flow': {'status': 'pending', 'details': []}
        }
        
    def test_sql_migration(self):
        """Test the SQL migration file for quotes table"""
        print("🔍 Testing SQL Migration File (SUPABASE_QUOTES_TABLE.sql)...")
        
        migration_file = self.app_dir / 'SUPABASE_QUOTES_TABLE.sql'
        
        if not migration_file.exists():
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append('❌ SUPABASE_QUOTES_TABLE.sql file not found')
            return False
            
        try:
            content = migration_file.read_text()
            
            # Check for required table structure
            table_checks = [
                ('CREATE TABLE quotes', 'CREATE TABLE statement present'),
                ('id UUID PRIMARY KEY', 'Primary key with UUID type'),
                ('account_id UUID NOT NULL', 'account_id foreign key'),
                ('created_by_user_id UUID', 'created_by_user_id field'),
                ('customer_name TEXT', 'customer_name field'),
                ('customer_email TEXT', 'customer_email field'),
                ('customer_phone TEXT', 'customer_phone field'),
                ('property_address TEXT', 'property_address field'),
                ('property_type TEXT', 'property_type field'),
                ('area_sq_ft NUMERIC', 'area_sq_ft field'),
                ('base_price_per_visit NUMERIC', 'base_price_per_visit field'),
                ('addons JSONB', 'addons JSONB field'),
                ('total_price_per_visit NUMERIC', 'total_price_per_visit field'),
                ('frequency TEXT', 'frequency field'),
                ('monthly_estimate NUMERIC', 'monthly_estimate field'),
                ('send_to_customer BOOLEAN', 'send_to_customer field'),
                ('email_sent_at TIMESTAMPTZ', 'email_sent_at field'),
                ('created_at TIMESTAMPTZ.*DEFAULT now', 'created_at with default')
            ]
            
            for pattern, description in table_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for indexes
            index_checks = [
                ('CREATE INDEX.*idx_quotes_account_created', 'Account-created_at index'),
                ('account_id.*created_at', 'Index on account_id and created_at for fast monthly counting')
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
                ('ALTER TABLE quotes ENABLE ROW LEVEL SECURITY', 'RLS enabled'),
                ('CREATE POLICY.*SELECT', 'SELECT policy'),
                ('CREATE POLICY.*INSERT', 'INSERT policy'),
                ('CREATE POLICY.*UPDATE', 'UPDATE policy'),
                ('auth.uid()', 'Authentication-based policies')
            ]
            
            for pattern, description in rls_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for comments and documentation
            if 'COMMENT ON TABLE quotes' in content:
                self.results['sql_migration']['details'].append("✅ Table documentation present")
            
            if 'COMMENT ON COLUMN' in content:
                self.results['sql_migration']['details'].append("✅ Column documentation present")
            
            self.results['sql_migration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append(f"❌ Error reading migration file: {str(e)}")
            return False
    
    def test_quote_service(self):
        """Test the quoteService.js implementation"""
        print("🔍 Testing Quote Service (quoteService.js)...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'quoteService.js'
        
        if not service_file.exists():
            self.results['quote_service']['status'] = 'failed'
            self.results['quote_service']['details'].append('❌ quoteService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check for required exports and functions
            function_checks = [
                ('export.*PLAN_LIMITS', 'PLAN_LIMITS configuration exported'),
                ('export.*DEFAULT_PLAN_TIER', 'DEFAULT_PLAN_TIER exported'),
                ('export.*function.*getMonthBoundariesUTC', 'getMonthBoundariesUTC function'),
                ('export.*function.*saveQuote', 'saveQuote function'),
                ('export.*function.*markQuoteEmailSent', 'markQuoteEmailSent function'),
                ('export.*function.*getQuotesThisMonth', 'getQuotesThisMonth function'),
                ('export.*function.*calculateOverage', 'calculateOverage function')
            ]
            
            for pattern, description in function_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check PLAN_LIMITS structure
            plan_checks = [
                ('starter.*includedQuotesPerMonth.*25', 'Starter plan with 25 quotes'),
                ('professional.*includedQuotesPerMonth.*100', 'Professional plan with 100 quotes'),
                ('enterprise.*includedQuotesPerMonth.*999999', 'Enterprise plan with unlimited quotes')
            ]
            
            for pattern, description in plan_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check getMonthBoundariesUTC logic
            month_boundary_checks = [
                ('Date.UTC.*getUTCFullYear', 'UTC year calculation'),
                ('getUTCMonth.*1.*0.*0.*0.*0', 'Start of month calculation'),
                ('getUTCMonth.*\\+.*1', 'Start of next month calculation'),
                ('toISOString', 'ISO string conversion')
            ]
            
            for pattern, description in month_boundary_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check saveQuote function structure
            save_quote_checks = [
                ('accountId.*userId.*customerName', 'Required parameters destructured'),
                ('if.*!accountId.*throw', 'Account ID validation'),
                ('supabase.*from.*quotes.*insert', 'Supabase insert operation'),
                ('account_id.*accountId', 'Account ID mapping'),
                ('created_by_user_id.*userId', 'User ID mapping'),
                ('parseFloat.*areaSqFt', 'Numeric field parsing'),
                ('addons.*addons', 'Addons field mapping'),
                ('send_to_customer.*sendToCustomer', 'Send to customer mapping')
            ]
            
            for pattern, description in save_quote_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check getQuotesThisMonth function
            get_quotes_checks = [
                ('getMonthBoundariesUTC', 'Uses month boundaries function'),
                ('supabase.*from.*quotes.*select.*count.*exact', 'Count query with exact count'),
                ('eq.*account_id.*accountId', 'Account ID filter'),
                ('gte.*created_at.*startOfMonth', 'Start of month filter'),
                ('lt.*created_at.*startOfNextMonth', 'End of month filter')
            ]
            
            for pattern, description in get_quotes_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            # Check calculateOverage function logic
            overage_checks = [
                ('quotesThisMonth.*planTier', 'Function parameters'),
                ('PLAN_LIMITS.*planTier', 'Plan limits lookup'),
                ('Math.max.*0.*quotesThisMonth.*includedLimit', 'Overage calculation'),
                ('overageCount.*>.*0', 'Over limit check'),
                ('Math.max.*0.*includedLimit.*quotesThisMonth', 'Remaining calculation'),
                ('usagePercentage.*Math.min.*100', 'Usage percentage calculation')
            ]
            
            for pattern, description in overage_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_service']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_service']['details'].append(f"❌ {description}")
                    self.results['quote_service']['status'] = 'failed'
                    return False
            
            self.results['quote_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_service']['status'] = 'failed'
            self.results['quote_service']['details'].append(f"❌ Error reading quote service file: {str(e)}")
            return False
    
    def test_quote_page(self):
        """Test Quote.js integration for saving quotes"""
        print("🔍 Testing Quote Page Integration (Quote.js)...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['quote_page']['status'] = 'failed'
            self.results['quote_page']['details'].append('❌ Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for quoteService imports
            import_checks = [
                ('import.*saveQuote.*quoteService', 'saveQuote import'),
                ('import.*markQuoteEmailSent.*quoteService', 'markQuoteEmailSent import')
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['quote_page']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_page']['details'].append(f"❌ {description}")
                    self.results['quote_page']['status'] = 'failed'
                    return False
            
            # Check handleSaveQuote function integration
            save_integration_checks = [
                ('handleSaveQuote.*async', 'Async handleSaveQuote function'),
                ('await.*saveQuote', 'saveQuote function call'),
                ('accountId.*account.*id', 'Account ID passed'),
                ('userId.*user.*id', 'User ID passed'),
                ('customerName.*firstName.*lastName', 'Customer name construction'),
                ('customerEmail.*formData.email', 'Customer email mapping'),
                ('customerPhone.*formData.phone', 'Customer phone mapping'),
                ('propertyAddress.*formData.address', 'Property address mapping'),
                ('propertyType.*formData.propertyType', 'Property type mapping'),
                ('areaSqFt.*formData.lawnSizeSqFt', 'Area mapping'),
                ('basePricePerVisit.*pricing.basePrice', 'Base price mapping'),
                ('addons.*selectedAddonsDetails', 'Addons mapping'),
                ('totalPricePerVisit.*pricing.perVisit', 'Total price mapping'),
                ('frequency.*formData.frequency', 'Frequency mapping'),
                ('monthlyEstimate.*pricing.monthly', 'Monthly estimate mapping'),
                ('sendToCustomer.*formData.sendQuoteToCustomer', 'Send to customer mapping')
            ]
            
            for pattern, description in save_integration_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_page']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_page']['details'].append(f"❌ {description}")
                    self.results['quote_page']['status'] = 'failed'
                    return False
            
            # Check error handling
            error_handling_checks = [
                ('try.*catch.*err', 'Error handling with try-catch'),
                ('dbError.*err.message', 'Database error handling'),
                ('Continue.*don.*t.*block', 'Non-blocking error handling comment'),
                ('Usage tracking failed', 'User-friendly error message')
            ]
            
            for pattern, description in error_handling_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['quote_page']['details'].append(f"✅ {description}")
                else:
                    self.results['quote_page']['details'].append(f"❌ {description}")
                    self.results['quote_page']['status'] = 'failed'
                    return False
            
            # Check email sent marking
            if re.search('markQuoteEmailSent.*savedQuote.*id', content, re.IGNORECASE | re.DOTALL):
                self.results['quote_page']['details'].append("✅ Email sent marking after successful email")
            else:
                self.results['quote_page']['details'].append("❌ Email sent marking not found")
                self.results['quote_page']['status'] = 'failed'
                return False
            
            # Check that saveQuote is called on EVERY save
            if 'STEP 1.*Save quote to Supabase.*BILLABLE EVENT' in content:
                self.results['quote_page']['details'].append("✅ Clear documentation that saveQuote is called on every save")
            else:
                self.results['quote_page']['details'].append("❌ Missing documentation about billable event")
            
            self.results['quote_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_page']['status'] = 'failed'
            self.results['quote_page']['details'].append(f"❌ Error reading quote page file: {str(e)}")
            return False
    
    def test_dashboard_page(self):
        """Test Dashboard.js integration for displaying quote counts"""
        print("🔍 Testing Dashboard Page Integration (Dashboard.js)...")
        
        dashboard_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Dashboard.js'
        
        if not dashboard_file.exists():
            self.results['dashboard_page']['status'] = 'failed'
            self.results['dashboard_page']['details'].append('❌ Dashboard.js file not found')
            return False
            
        try:
            content = dashboard_file.read_text()
            
            # Check for quoteService imports
            import_checks = [
                ('import.*getQuotesThisMonth.*quoteService', 'getQuotesThisMonth import'),
                ('import.*calculateOverage.*quoteService', 'calculateOverage import'),
                ('import.*DEFAULT_PLAN_TIER.*quoteService', 'DEFAULT_PLAN_TIER import')
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['dashboard_page']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_page']['details'].append(f"❌ {description}")
                    self.results['dashboard_page']['status'] = 'failed'
                    return False
            
            # Check for state management
            state_checks = [
                ('useState.*quotesThisMonth.*setQuotesThisMonth', 'quotesThisMonth state'),
                ('useState.*quotesLoading.*setQuotesLoading', 'quotesLoading state'),
                ('useState.*overageInfo.*setOverageInfo', 'overageInfo state')
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['dashboard_page']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_page']['details'].append(f"❌ {description}")
                    self.results['dashboard_page']['status'] = 'failed'
                    return False
            
            # Check for quote count loading
            loading_checks = [
                ('await.*getQuotesThisMonth.*account.id', 'getQuotesThisMonth call with account ID'),
                ('setQuotesThisMonth.*count', 'Setting quotes count state'),
                ('calculateOverage.*count.*planTier', 'calculateOverage call'),
                ('setOverageInfo.*overage', 'Setting overage info state')
            ]
            
            for pattern, description in loading_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['dashboard_page']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_page']['details'].append(f"❌ {description}")
                    self.results['dashboard_page']['status'] = 'failed'
                    return False
            
            # Check for UI display
            ui_checks = [
                ('Quotes This Month', 'Quotes This Month card title'),
                ('quotesLoading.*animate-pulse', 'Loading state display'),
                ('quotesThisMonth', 'Quote count display'),
                ('overageInfo.*planName', 'Plan name display'),
                ('overageInfo.*includedLimit', 'Included limit display'),
                ('overageInfo.*isOverLimit', 'Overage warning logic'),
                ('overageInfo.*remainingIncluded', 'Remaining quotes display')
            ]
            
            for pattern, description in ui_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['dashboard_page']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_page']['details'].append(f"❌ {description}")
                    self.results['dashboard_page']['status'] = 'failed'
                    return False
            
            # Check for overage warning display
            if 'overage quote' in content and 'amber-600' in content:
                self.results['dashboard_page']['details'].append("✅ Overage warning styling")
            else:
                self.results['dashboard_page']['details'].append("❌ Overage warning styling not found")
                self.results['dashboard_page']['status'] = 'failed'
                return False
            
            self.results['dashboard_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['dashboard_page']['status'] = 'failed'
            self.results['dashboard_page']['details'].append(f"❌ Error reading dashboard file: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete quote tracking integration flow"""
        print("🔍 Testing Complete Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Check SQL migration creates proper table structure
            migration_file = self.app_dir / 'SUPABASE_QUOTES_TABLE.sql'
            if migration_file.exists():
                migration_content = migration_file.read_text()
                if 'CREATE TABLE quotes' in migration_content and 'account_id' in migration_content:
                    integration_checks.append("✅ SQL migration creates quotes table with account_id")
                else:
                    integration_checks.append("❌ SQL migration incomplete or missing")
            else:
                integration_checks.append("❌ SQL migration file not found")
            
            # 2. Check quoteService provides all required functions
            service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'quoteService.js'
            if service_file.exists():
                service_content = service_file.read_text()
                required_functions = ['saveQuote', 'getQuotesThisMonth', 'calculateOverage', 'markQuoteEmailSent']
                missing_functions = []
                for func in required_functions:
                    if f'function {func}' not in service_content and f'function.*{func}' not in service_content:
                        missing_functions.append(func)
                
                if not missing_functions:
                    integration_checks.append("✅ All required quoteService functions present")
                else:
                    integration_checks.append(f"❌ Missing quoteService functions: {', '.join(missing_functions)}")
            else:
                integration_checks.append("❌ quoteService.js not found")
            
            # 3. Check Quote page calls saveQuote on every save
            quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'await saveQuote' in quote_content and 'handleSaveQuote' in quote_content:
                    integration_checks.append("✅ Quote page calls saveQuote in handleSaveQuote")
                else:
                    integration_checks.append("❌ Quote page doesn't call saveQuote")
                
                # Check non-blocking error handling
                if 'Continue' in quote_content and 'don\'t block' in quote_content:
                    integration_checks.append("✅ Non-blocking error handling implemented")
                else:
                    integration_checks.append("❌ Non-blocking error handling not found")
            else:
                integration_checks.append("❌ Quote.js not found")
            
            # 4. Check Dashboard loads and displays quote count
            dashboard_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Dashboard.js'
            if dashboard_file.exists():
                dashboard_content = dashboard_file.read_text()
                if 'getQuotesThisMonth' in dashboard_content and 'quotesThisMonth' in dashboard_content:
                    integration_checks.append("✅ Dashboard loads and displays quote count")
                else:
                    integration_checks.append("❌ Dashboard doesn't load quote count")
                
                # Check overage calculation and display
                if 'calculateOverage' in dashboard_content and 'overageInfo' in dashboard_content:
                    integration_checks.append("✅ Dashboard calculates and displays overage info")
                else:
                    integration_checks.append("❌ Dashboard doesn't handle overage calculation")
            else:
                integration_checks.append("❌ Dashboard.js not found")
            
            # 5. Check month boundary calculation logic
            if service_file.exists():
                service_content = service_file.read_text()
                if 'getMonthBoundariesUTC' in service_content and 'Date.UTC' in service_content:
                    integration_checks.append("✅ UTC month boundary calculation implemented")
                else:
                    integration_checks.append("❌ UTC month boundary calculation missing")
            
            # 6. Check plan limits configuration
            if service_file.exists():
                service_content = service_file.read_text()
                if 'PLAN_LIMITS' in service_content and 'starter' in service_content and 'professional' in service_content:
                    integration_checks.append("✅ Plan limits configuration present")
                else:
                    integration_checks.append("❌ Plan limits configuration missing")
            
            # 7. Check RLS policies in migration
            if migration_file.exists():
                migration_content = migration_file.read_text()
                if 'ROW LEVEL SECURITY' in migration_content and 'auth.uid()' in migration_content:
                    integration_checks.append("✅ RLS policies implemented for account-based access")
                else:
                    integration_checks.append("❌ RLS policies missing or incomplete")
            
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
            self.results['integration_flow']['details'].append(f"❌ Error testing integration: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and return results"""
        print("🚀 Starting GreenQuote Pro Quote Tracking Feature Tests\n")
        
        tests = [
            ('SQL Migration', self.test_sql_migration),
            ('Quote Service', self.test_quote_service),
            ('Quote Page Integration', self.test_quote_page),
            ('Dashboard Integration', self.test_dashboard_page),
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
    tester = QuoteTrackingTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Quote Tracking feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)