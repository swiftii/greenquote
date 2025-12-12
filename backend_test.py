#!/usr/bin/env python3
"""
Backend Testing for GreenQuote Pro Reply-To Email Feature

This test suite verifies the Reply-To email feature implementation:
1. SQL migration file syntax and structure
2. Vercel serverless function accepts and uses replyToEmail parameter
3. Frontend Settings.js properly handles customer_reply_email field
4. Frontend Quote.js uses settings.customer_reply_email with fallback
5. Email service integration passes correct replyToEmail parameter

Since this is a Supabase-based app with external dependencies, we focus on:
- Code syntax and logic verification
- Integration point validation
- Parameter passing verification
"""

import os
import sys
import json
import re
import requests
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuoteReplyToTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'sql_migration': {'status': 'pending', 'details': []},
            'vercel_function': {'status': 'pending', 'details': []},
            'settings_page': {'status': 'pending', 'details': []},
            'quote_page': {'status': 'pending', 'details': []},
            'email_service': {'status': 'pending', 'details': []},
            'integration': {'status': 'pending', 'details': []}
        }
        
    def test_sql_migration(self):
        """Test the SQL migration file for Reply-To email feature"""
        print("🔍 Testing SQL Migration File...")
        
        migration_file = self.app_dir / 'SUPABASE_REPLY_TO_MIGRATION.sql'
        
        if not migration_file.exists():
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append('Migration file not found')
            return False
            
        try:
            content = migration_file.read_text()
            
            # Check for required SQL elements
            checks = [
                ('ALTER TABLE account_settings', 'ALTER TABLE statement present'),
                ('ADD COLUMN.*customer_reply_email', 'customer_reply_email column addition'),
                ('TEXT DEFAULT NULL', 'Correct column type and default'),
                ('COMMENT ON COLUMN', 'Column documentation present'),
                ('IF NOT EXISTS', 'Safe column addition with IF NOT EXISTS')
            ]
            
            for pattern, description in checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for verification query
            if 'information_schema.columns' in content:
                self.results['sql_migration']['details'].append("✅ Verification query included")
            
            self.results['sql_migration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append(f"Error reading migration file: {str(e)}")
            return False
    
    def test_vercel_function(self):
        """Test the Vercel serverless function for Reply-To support"""
        print("🔍 Testing Vercel Serverless Function...")
        
        function_file = self.app_dir / 'api' / 'send-quote-email.js'
        
        if not function_file.exists():
            self.results['vercel_function']['status'] = 'failed'
            self.results['vercel_function']['details'].append('Vercel function file not found')
            return False
            
        try:
            content = function_file.read_text()
            
            # Check for replyToEmail parameter handling
            checks = [
                ('replyToEmail', 'replyToEmail parameter extracted from request body'),
                ('reply_to.*replyToEmail', 'reply_to header set conditionally'),
                ('if.*replyToEmail', 'Conditional logic for reply_to header'),
                ('emailOptions\.reply_to', 'reply_to property added to email options')
            ]
            
            for pattern, description in checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['vercel_function']['details'].append(f"✅ {description}")
                else:
                    self.results['vercel_function']['details'].append(f"❌ {description}")
                    self.results['vercel_function']['status'] = 'failed'
                    return False
            
            # Check that the function properly handles the reply_to field
            if 'emailOptions.reply_to = replyToEmail' in content:
                self.results['vercel_function']['details'].append("✅ reply_to correctly assigned")
            else:
                self.results['vercel_function']['details'].append("❌ reply_to assignment not found")
                self.results['vercel_function']['status'] = 'failed'
                return False
            
            self.results['vercel_function']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['vercel_function']['status'] = 'failed'
            self.results['vercel_function']['details'].append(f"Error reading function file: {str(e)}")
            return False
    
    def test_settings_page(self):
        """Test Settings.js for customer_reply_email field implementation"""
        print("🔍 Testing Settings Page Implementation...")
        
        settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
        
        if not settings_file.exists():
            self.results['settings_page']['status'] = 'failed'
            self.results['settings_page']['details'].append('Settings.js file not found')
            return False
            
        try:
            content = settings_file.read_text()
            
            # Check for Email Settings card
            if 'Email Settings' in content:
                self.results['settings_page']['details'].append("✅ Email Settings card present")
            else:
                self.results['settings_page']['details'].append("❌ Email Settings card not found")
                self.results['settings_page']['status'] = 'failed'
                return False
            
            # Check for customer_reply_email field handling
            checks = [
                ('customerReplyEmail:', 'customerReplyEmail in form state'),
                ('userSettings.*customer_reply_email', 'customer_reply_email loaded from settings'),
                ('customer_reply_email.*formData\.customerReplyEmail', 'customer_reply_email saved to settings'),
                ('Customer Reply-To Email', 'Proper field label'),
                ('type="email"', 'Email input type validation'),
                ('placeholder.*user.*email', 'Fallback placeholder showing user email')
            ]
            
            for pattern, description in checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['settings_page']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_page']['details'].append(f"❌ {description}")
                    self.results['settings_page']['status'] = 'failed'
                    return False
            
            # Check for proper form data initialization
            if 'customerReplyEmail: userSettings?.customer_reply_email' in content:
                self.results['settings_page']['details'].append("✅ Form data properly initialized from settings")
            else:
                self.results['settings_page']['details'].append("❌ Form data initialization not found")
                self.results['settings_page']['status'] = 'failed'
                return False
            
            # Check for help text explaining the feature
            if 'When customers reply to quote emails' in content:
                self.results['settings_page']['details'].append("✅ Help text explaining feature present")
            else:
                self.results['settings_page']['details'].append("❌ Help text not found")
            
            self.results['settings_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['settings_page']['status'] = 'failed'
            self.results['settings_page']['details'].append(f"Error reading settings file: {str(e)}")
            return False
    
    def test_quote_page(self):
        """Test Quote.js for using customer_reply_email with fallback"""
        print("🔍 Testing Quote Page Implementation...")
        
        quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
        
        if not quote_file.exists():
            self.results['quote_page']['status'] = 'failed'
            self.results['quote_page']['details'].append('Quote.js file not found')
            return False
            
        try:
            content = quote_file.read_text()
            
            # Check for replyToEmail logic
            if 'settings?.customer_reply_email || user?.email' in content:
                self.results['quote_page']['details'].append("✅ Reply-to email with proper fallback logic")
            else:
                self.results['quote_page']['details'].append("❌ Reply-to email fallback logic not found")
                self.results['quote_page']['status'] = 'failed'
                return False
            
            # Check for replyToEmail parameter in sendQuoteEmail call
            if 'replyToEmail:' in content and 'sendQuoteEmail' in content:
                self.results['quote_page']['details'].append("✅ replyToEmail parameter passed to sendQuoteEmail")
            else:
                self.results['quote_page']['details'].append("❌ replyToEmail parameter not passed to sendQuoteEmail")
                self.results['quote_page']['status'] = 'failed'
                return False
            
            # Check for console logging of reply-to email
            if 'Using Reply-To email' in content:
                self.results['quote_page']['details'].append("✅ Debug logging for reply-to email present")
            else:
                self.results['quote_page']['details'].append("❌ Debug logging not found")
            
            # Verify the email service import
            if 'sendQuoteEmail' in content and 'from' in content and 'emailService' in content:
                self.results['quote_page']['details'].append("✅ Email service properly imported")
            else:
                self.results['quote_page']['details'].append("❌ Email service import not found")
                self.results['quote_page']['status'] = 'failed'
                return False
            
            self.results['quote_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['quote_page']['status'] = 'failed'
            self.results['quote_page']['details'].append(f"Error reading quote file: {str(e)}")
            return False
    
    def test_email_service(self):
        """Test emailService.js for replyToEmail parameter handling"""
        print("🔍 Testing Email Service Implementation...")
        
        email_service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'emailService.js'
        
        if not email_service_file.exists():
            self.results['email_service']['status'] = 'failed'
            self.results['email_service']['details'].append('emailService.js file not found')
            return False
            
        try:
            content = email_service_file.read_text()
            
            # Check for replyToEmail parameter in function signature
            if 'replyToEmail' in content and 'params.replyToEmail' in content:
                self.results['email_service']['details'].append("✅ replyToEmail parameter in function signature")
            else:
                self.results['email_service']['details'].append("❌ replyToEmail parameter not in function signature")
                self.results['email_service']['status'] = 'failed'
                return False
            
            # Check for replyToEmail in request body
            if 'replyToEmail,' in content and 'JSON.stringify' in content:
                self.results['email_service']['details'].append("✅ replyToEmail included in API request body")
            else:
                self.results['email_service']['details'].append("❌ replyToEmail not included in request body")
                self.results['email_service']['status'] = 'failed'
                return False
            
            # Check for proper API endpoint
            if '/api/send-quote-email' in content:
                self.results['email_service']['details'].append("✅ Correct API endpoint used")
            else:
                self.results['email_service']['details'].append("❌ API endpoint not found")
                self.results['email_service']['status'] = 'failed'
                return False
            
            # Check for JSDoc documentation
            if '@param' in content and 'replyToEmail' in content:
                self.results['email_service']['details'].append("✅ JSDoc documentation includes replyToEmail")
            else:
                self.results['email_service']['details'].append("❌ JSDoc documentation incomplete")
            
            self.results['email_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['email_service']['status'] = 'failed'
            self.results['email_service']['details'].append(f"Error reading email service file: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            # Check that all components are properly connected
            integration_checks = []
            
            # 1. Settings page saves customer_reply_email to account_settings table
            settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
            if settings_file.exists():
                settings_content = settings_file.read_text()
                if 'customer_reply_email' in settings_content and 'updateAccountSettings' in settings_content:
                    integration_checks.append("✅ Settings page saves customer_reply_email")
                else:
                    integration_checks.append("❌ Settings page doesn't save customer_reply_email")
            
            # 2. Quote page loads settings and uses customer_reply_email
            quote_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Quote.js'
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'ensureUserAccount' in quote_content and 'settings?.customer_reply_email' in quote_content:
                    integration_checks.append("✅ Quote page loads and uses customer_reply_email")
                else:
                    integration_checks.append("❌ Quote page doesn't properly use customer_reply_email")
            
            # 3. Email service passes replyToEmail to API
            email_service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'emailService.js'
            if email_service_file.exists():
                email_content = email_service_file.read_text()
                if 'replyToEmail' in email_content and 'JSON.stringify' in email_content:
                    integration_checks.append("✅ Email service passes replyToEmail to API")
                else:
                    integration_checks.append("❌ Email service doesn't pass replyToEmail")
            
            # 4. Vercel function uses replyToEmail in email headers
            function_file = self.app_dir / 'api' / 'send-quote-email.js'
            if function_file.exists():
                function_content = function_file.read_text()
                if 'reply_to' in function_content and 'replyToEmail' in function_content:
                    integration_checks.append("✅ Vercel function sets reply_to header")
                else:
                    integration_checks.append("❌ Vercel function doesn't set reply_to header")
            
            # 5. Check for proper fallback logic
            if quote_file.exists():
                quote_content = quote_file.read_text()
                if 'user?.email' in quote_content and '||' in quote_content:
                    integration_checks.append("✅ Proper fallback to user email")
                else:
                    integration_checks.append("❌ No fallback to user email")
            
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
        print("🚀 Starting GreenQuote Pro Reply-To Email Feature Tests\n")
        
        tests = [
            ('SQL Migration', self.test_sql_migration),
            ('Vercel Function', self.test_vercel_function),
            ('Settings Page', self.test_settings_page),
            ('Quote Page', self.test_quote_page),
            ('Email Service', self.test_email_service),
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
    tester = GreenQuoteReplyToTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Reply-To email feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)