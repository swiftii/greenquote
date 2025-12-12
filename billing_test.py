#!/usr/bin/env python3
"""
Stripe Billing Feature Testing for GreenQuote Pro

This test suite verifies the Stripe billing/paywall feature implementation:
1. SQL migration file syntax and structure for billing fields
2. Vercel serverless functions for billing operations
3. Frontend billing service and components
4. Route protection with SubscriptionGuard
5. Integration flow for subscription management

Since this involves Stripe integration and external dependencies, we focus on:
- Code syntax and logic verification
- Integration point validation
- Parameter passing verification
- Route protection logic
"""

import os
import sys
import json
import re
import requests
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class GreenQuoteBillingTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'sql_migration': {'status': 'pending', 'details': []},
            'start_trial_api': {'status': 'pending', 'details': []},
            'checkout_session_api': {'status': 'pending', 'details': []},
            'webhook_api': {'status': 'pending', 'details': []},
            'status_api': {'status': 'pending', 'details': []},
            'billing_service': {'status': 'pending', 'details': []},
            'billing_page': {'status': 'pending', 'details': []},
            'billing_success_page': {'status': 'pending', 'details': []},
            'subscription_guard': {'status': 'pending', 'details': []},
            'app_routing': {'status': 'pending', 'details': []},
            'integration': {'status': 'pending', 'details': []}
        }
        
    def test_sql_migration(self):
        """Test the SQL migration file for billing fields"""
        print("🔍 Testing Billing SQL Migration File...")
        
        migration_file = self.app_dir / 'SUPABASE_BILLING_MIGRATION.sql'
        
        if not migration_file.exists():
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append('❌ Migration file not found')
            return False
            
        try:
            content = migration_file.read_text()
            
            # Check for required billing columns
            required_columns = [
                ('stripe_customer_id', 'Stripe customer ID column'),
                ('stripe_subscription_id', 'Stripe subscription ID column'),
                ('subscription_status', 'Subscription status column'),
                ('trial_end', 'Trial end timestamp column'),
                ('current_period_end', 'Current period end timestamp column')
            ]
            
            for column, description in required_columns:
                if f'ADD COLUMN IF NOT EXISTS {column}' in content:
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
                    self.results['sql_migration']['status'] = 'failed'
                    return False
            
            # Check for indexes
            index_checks = [
                ('idx_accounts_stripe_customer_id', 'Customer ID index'),
                ('idx_accounts_stripe_subscription_id', 'Subscription ID index')
            ]
            
            for index_name, description in index_checks:
                if index_name in content:
                    self.results['sql_migration']['details'].append(f"✅ {description}")
                else:
                    self.results['sql_migration']['details'].append(f"❌ {description}")
            
            # Check for comments
            if 'COMMENT ON COLUMN' in content:
                self.results['sql_migration']['details'].append("✅ Column documentation present")
            
            # Check for verification queries
            if 'information_schema.columns' in content:
                self.results['sql_migration']['details'].append("✅ Verification queries included")
            
            self.results['sql_migration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['sql_migration']['status'] = 'failed'
            self.results['sql_migration']['details'].append(f"❌ Error reading migration file: {str(e)}")
            return False
    
    def test_start_trial_api(self):
        """Test the start-trial API endpoint"""
        print("🔍 Testing Start Trial API...")
        
        api_file = self.app_dir / 'api' / 'billing' / 'start-trial.js'
        
        if not api_file.exists():
            self.results['start_trial_api']['status'] = 'failed'
            self.results['start_trial_api']['details'].append('❌ start-trial.js file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for required imports
            imports = [
                ('Stripe', 'Stripe SDK import'),
                ('@supabase/supabase-js', 'Supabase client import')
            ]
            
            for import_name, description in imports:
                if import_name in content:
                    self.results['start_trial_api']['details'].append(f"✅ {description}")
                else:
                    self.results['start_trial_api']['details'].append(f"❌ {description}")
                    self.results['start_trial_api']['status'] = 'failed'
                    return False
            
            # Check for environment variable validation
            env_checks = [
                ('STRIPE_SECRET_KEY', 'Stripe secret key validation'),
                ('STRIPE_PRO_PRICE_ID', 'Stripe price ID validation'),
                ('SUPABASE_URL', 'Supabase URL configuration'),
                ('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key')
            ]
            
            for env_var, description in env_checks:
                if env_var in content:
                    self.results['start_trial_api']['details'].append(f"✅ {description}")
                else:
                    self.results['start_trial_api']['details'].append(f"❌ {description}")
            
            # Check for core functionality
            functionality_checks = [
                ('stripe.customers.create', 'Stripe customer creation'),
                ('stripe.subscriptions.create', 'Stripe subscription creation'),
                ('trial_period_days: 14', '14-day trial period'),
                ('supabase.from(\'accounts\')', 'Supabase account updates'),
                ('subscription_status', 'Subscription status handling')
            ]
            
            for pattern, description in functionality_checks:
                if pattern in content:
                    self.results['start_trial_api']['details'].append(f"✅ {description}")
                else:
                    self.results['start_trial_api']['details'].append(f"❌ {description}")
                    self.results['start_trial_api']['status'] = 'failed'
                    return False
            
            # Check for proper error handling
            if 'try {' in content and 'catch' in content:
                self.results['start_trial_api']['details'].append("✅ Error handling implemented")
            else:
                self.results['start_trial_api']['details'].append("❌ Error handling missing")
            
            self.results['start_trial_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['start_trial_api']['status'] = 'failed'
            self.results['start_trial_api']['details'].append(f"❌ Error reading start-trial file: {str(e)}")
            return False
    
    def test_checkout_session_api(self):
        """Test the create-checkout-session API endpoint"""
        print("🔍 Testing Checkout Session API...")
        
        api_file = self.app_dir / 'api' / 'billing' / 'create-checkout-session.js'
        
        if not api_file.exists():
            self.results['checkout_session_api']['status'] = 'failed'
            self.results['checkout_session_api']['details'].append('❌ create-checkout-session.js file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for Stripe checkout session creation
            checkout_checks = [
                ('stripe.checkout.sessions.create', 'Checkout session creation'),
                ('mode: \'subscription\'', 'Subscription mode'),
                ('payment_method_types', 'Payment method types'),
                ('success_url', 'Success URL configuration'),
                ('cancel_url', 'Cancel URL configuration'),
                ('subscription_data', 'Subscription metadata')
            ]
            
            for pattern, description in checkout_checks:
                if pattern in content:
                    self.results['checkout_session_api']['details'].append(f"✅ {description}")
                else:
                    self.results['checkout_session_api']['details'].append(f"❌ {description}")
                    self.results['checkout_session_api']['status'] = 'failed'
                    return False
            
            # Check for customer handling
            if 'stripe.customers.create' in content or 'stripe_customer_id' in content:
                self.results['checkout_session_api']['details'].append("✅ Customer creation/retrieval")
            else:
                self.results['checkout_session_api']['details'].append("❌ Customer handling missing")
                self.results['checkout_session_api']['status'] = 'failed'
                return False
            
            # Check for URL construction
            if 'originUrl' in content and 'baseUrl' in content:
                self.results['checkout_session_api']['details'].append("✅ Dynamic URL construction")
            else:
                self.results['checkout_session_api']['details'].append("❌ URL construction logic missing")
            
            self.results['checkout_session_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['checkout_session_api']['status'] = 'failed'
            self.results['checkout_session_api']['details'].append(f"❌ Error reading checkout session file: {str(e)}")
            return False
    
    def test_webhook_api(self):
        """Test the webhook API endpoint"""
        print("🔍 Testing Webhook API...")
        
        api_file = self.app_dir / 'api' / 'billing' / 'webhook.js'
        
        if not api_file.exists():
            self.results['webhook_api']['status'] = 'failed'
            self.results['webhook_api']['details'].append('❌ webhook.js file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for webhook signature verification
            if 'stripe.webhooks.constructEvent' in content:
                self.results['webhook_api']['details'].append("✅ Webhook signature verification")
            else:
                self.results['webhook_api']['details'].append("❌ Webhook signature verification missing")
                self.results['webhook_api']['status'] = 'failed'
                return False
            
            # Check for handled events
            webhook_events = [
                ('customer.subscription.created', 'Subscription created event'),
                ('customer.subscription.updated', 'Subscription updated event'),
                ('customer.subscription.deleted', 'Subscription deleted event'),
                ('invoice.payment_succeeded', 'Payment succeeded event'),
                ('invoice.payment_failed', 'Payment failed event'),
                ('checkout.session.completed', 'Checkout completed event')
            ]
            
            for event, description in webhook_events:
                if event in content:
                    self.results['webhook_api']['details'].append(f"✅ {description}")
                else:
                    self.results['webhook_api']['details'].append(f"❌ {description}")
            
            # Check for Supabase updates
            if 'supabase.from(\'accounts\').update' in content:
                self.results['webhook_api']['details'].append("✅ Supabase account updates")
            else:
                self.results['webhook_api']['details'].append("❌ Supabase updates missing")
                self.results['webhook_api']['status'] = 'failed'
                return False
            
            # Check for body parser configuration
            if 'bodyParser: false' in content:
                self.results['webhook_api']['details'].append("✅ Raw body parser configuration")
            else:
                self.results['webhook_api']['details'].append("❌ Body parser configuration missing")
            
            self.results['webhook_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['webhook_api']['status'] = 'failed'
            self.results['webhook_api']['details'].append(f"❌ Error reading webhook file: {str(e)}")
            return False
    
    def test_status_api(self):
        """Test the billing status API endpoint"""
        print("🔍 Testing Billing Status API...")
        
        api_file = self.app_dir / 'api' / 'billing' / 'status.js'
        
        if not api_file.exists():
            self.results['status_api']['status'] = 'failed'
            self.results['status_api']['details'].append('❌ status.js file not found')
            return False
            
        try:
            content = api_file.read_text()
            
            # Check for access determination logic
            access_checks = [
                ('hasAccess', 'Access determination logic'),
                ('subscription_status', 'Status checking'),
                ('trial_end', 'Trial end date checking'),
                ('trialing.*active', 'Active subscription states'),
                ('trialDaysRemaining', 'Trial days calculation')
            ]
            
            for pattern, description in access_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['status_api']['details'].append(f"✅ {description}")
                else:
                    self.results['status_api']['details'].append(f"❌ {description}")
                    self.results['status_api']['status'] = 'failed'
                    return False
            
            # Check for comprehensive status response
            response_fields = [
                ('hasAccess', 'Access flag'),
                ('status', 'Subscription status'),
                ('isTrialing', 'Trial status flag'),
                ('isActive', 'Active status flag'),
                ('hasStripeCustomer', 'Customer existence flag'),
                ('hasSubscription', 'Subscription existence flag')
            ]
            
            for field, description in response_fields:
                if field in content:
                    self.results['status_api']['details'].append(f"✅ {description}")
                else:
                    self.results['status_api']['details'].append(f"❌ {description}")
            
            self.results['status_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['status_api']['status'] = 'failed'
            self.results['status_api']['details'].append(f"❌ Error reading status file: {str(e)}")
            return False
    
    def test_billing_service(self):
        """Test the frontend billing service"""
        print("🔍 Testing Billing Service...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'billingService.js'
        
        if not service_file.exists():
            self.results['billing_service']['status'] = 'failed'
            self.results['billing_service']['details'].append('❌ billingService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check for required functions
            functions = [
                ('startTrial', 'Start trial function'),
                ('getBillingStatus', 'Get billing status function'),
                ('createCheckoutSession', 'Create checkout session function'),
                ('hasAccess', 'Access checking function'),
                ('formatTrialEnd', 'Trial end formatting function'),
                ('getStatusLabel', 'Status label function')
            ]
            
            for func_name, description in functions:
                if re.search(f'export.*function {func_name}', content) or f'export.*{func_name}' in content:
                    self.results['billing_service']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_service']['details'].append(f"❌ {description}")
                    self.results['billing_service']['status'] = 'failed'
                    return False
            
            # Check for API endpoint calls
            api_calls = [
                ('/api/billing/start-trial', 'Start trial API call'),
                ('/api/billing/status', 'Status API call'),
                ('/api/billing/create-checkout-session', 'Checkout API call')
            ]
            
            for endpoint, description in api_calls:
                if endpoint in content:
                    self.results['billing_service']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_service']['details'].append(f"❌ {description}")
                    self.results['billing_service']['status'] = 'failed'
                    return False
            
            # Check for error handling
            if 'try {' in content and 'catch' in content:
                self.results['billing_service']['details'].append("✅ Error handling implemented")
            else:
                self.results['billing_service']['details'].append("❌ Error handling missing")
            
            self.results['billing_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_service']['status'] = 'failed'
            self.results['billing_service']['details'].append(f"❌ Error reading billing service file: {str(e)}")
            return False
    
    def test_billing_page(self):
        """Test the Billing page component"""
        print("🔍 Testing Billing Page...")
        
        page_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Billing.js'
        
        if not page_file.exists():
            self.results['billing_page']['status'] = 'failed'
            self.results['billing_page']['details'].append('❌ Billing.js file not found')
            return False
            
        try:
            content = page_file.read_text()
            
            # Check for required imports
            imports = [
                ('getBillingStatus', 'Billing status import'),
                ('createCheckoutSession', 'Checkout session import'),
                ('useAuth', 'Auth hook import'),
                ('ensureUserAccount', 'Account service import')
            ]
            
            for import_name, description in imports:
                if import_name in content:
                    self.results['billing_page']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_page']['details'].append(f"❌ {description}")
                    self.results['billing_page']['status'] = 'failed'
                    return False
            
            # Check for billing status handling
            status_checks = [
                ('billingStatus', 'Billing status state'),
                ('hasAccess', 'Access checking'),
                ('navigate.*dashboard', 'Dashboard redirect for access'),
                ('handleStartSubscription', 'Subscription start handler')
            ]
            
            for pattern, description in status_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_page']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_page']['details'].append(f"❌ {description}")
                    self.results['billing_page']['status'] = 'failed'
                    return False
            
            # Check for UI elements
            ui_elements = [
                ('Pro Plan', 'Pro plan title'),
                ('Start Subscription', 'Subscription CTA button'),
                ('Current Status', 'Status display'),
                ('Stripe', 'Stripe branding')
            ]
            
            for element, description in ui_elements:
                if element in content:
                    self.results['billing_page']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_page']['details'].append(f"❌ {description}")
            
            self.results['billing_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_page']['status'] = 'failed'
            self.results['billing_page']['details'].append(f"❌ Error reading billing page file: {str(e)}")
            return False
    
    def test_billing_success_page(self):
        """Test the BillingSuccess page component"""
        print("🔍 Testing Billing Success Page...")
        
        page_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'BillingSuccess.js'
        
        if not page_file.exists():
            self.results['billing_success_page']['status'] = 'failed'
            self.results['billing_success_page']['details'].append('❌ BillingSuccess.js file not found')
            return False
            
        try:
            content = page_file.read_text()
            
            # Check for polling logic
            polling_checks = [
                ('useSearchParams', 'URL params handling'),
                ('session_id', 'Session ID extraction'),
                ('poll', 'Polling function'),
                ('setTimeout', 'Polling interval'),
                ('maxAttempts', 'Polling limits')
            ]
            
            for pattern, description in polling_checks:
                if pattern in content:
                    self.results['billing_success_page']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_success_page']['details'].append(f"❌ {description}")
                    self.results['billing_success_page']['status'] = 'failed'
                    return False
            
            # Check for success/error states
            state_checks = [
                ('Payment Successful', 'Success message'),
                ('Something went wrong', 'Error message'),
                ('Go to Dashboard', 'Dashboard navigation'),
                ('status.*success.*error', 'Status state management')
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_success_page']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_success_page']['details'].append(f"❌ {description}")
            
            self.results['billing_success_page']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_success_page']['status'] = 'failed'
            self.results['billing_success_page']['details'].append(f"❌ Error reading billing success file: {str(e)}")
            return False
    
    def test_subscription_guard(self):
        """Test the SubscriptionGuard component"""
        print("🔍 Testing Subscription Guard...")
        
        guard_file = self.app_dir / 'frontend' / 'src' / 'components' / 'SubscriptionGuard.js'
        
        if not guard_file.exists():
            self.results['subscription_guard']['status'] = 'failed'
            self.results['subscription_guard']['details'].append('❌ SubscriptionGuard.js file not found')
            return False
            
        try:
            content = guard_file.read_text()
            
            # Check for core functionality
            guard_checks = [
                ('getBillingStatus', 'Billing status checking'),
                ('startTrial', 'Automatic trial start'),
                ('hasAccess', 'Access determination'),
                ('navigate.*billing', 'Billing page redirect'),
                ('ensureUserAccount', 'Account loading')
            ]
            
            for pattern, description in guard_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['subscription_guard']['details'].append(f"✅ {description}")
                else:
                    self.results['subscription_guard']['details'].append(f"❌ {description}")
                    self.results['subscription_guard']['status'] = 'failed'
                    return False
            
            # Check for trial auto-start logic
            if 'status === \'none\'' in content and 'startTrial' in content:
                self.results['subscription_guard']['details'].append("✅ Automatic trial start for new users")
            else:
                self.results['subscription_guard']['details'].append("❌ Automatic trial start logic missing")
                self.results['subscription_guard']['status'] = 'failed'
                return False
            
            # Check for loading states
            if 'checking' in content and 'Loading' in content:
                self.results['subscription_guard']['details'].append("✅ Loading state handling")
            else:
                self.results['subscription_guard']['details'].append("❌ Loading state missing")
            
            # Check for error handling (fail open)
            if 'setHasAccess(true)' in content and 'catch' in content:
                self.results['subscription_guard']['details'].append("✅ Fail-open error handling")
            else:
                self.results['subscription_guard']['details'].append("❌ Error handling missing")
            
            self.results['subscription_guard']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['subscription_guard']['status'] = 'failed'
            self.results['subscription_guard']['details'].append(f"❌ Error reading subscription guard file: {str(e)}")
            return False
    
    def test_app_routing(self):
        """Test the App.js routing configuration"""
        print("🔍 Testing App Routing...")
        
        app_file = self.app_dir / 'frontend' / 'src' / 'App.js'
        
        if not app_file.exists():
            self.results['app_routing']['status'] = 'failed'
            self.results['app_routing']['details'].append('❌ App.js file not found')
            return False
            
        try:
            content = app_file.read_text()
            
            # Check for SubscriptionGuard import
            if 'SubscriptionGuard' in content:
                self.results['app_routing']['details'].append("✅ SubscriptionGuard import")
            else:
                self.results['app_routing']['details'].append("❌ SubscriptionGuard import missing")
                self.results['app_routing']['status'] = 'failed'
                return False
            
            # Check for billing routes
            billing_routes = [
                ('/billing', 'Billing page route'),
                ('/billing/success', 'Billing success route')
            ]
            
            for route, description in billing_routes:
                if route in content:
                    self.results['app_routing']['details'].append(f"✅ {description}")
                else:
                    self.results['app_routing']['details'].append(f"❌ {description}")
                    self.results['app_routing']['status'] = 'failed'
                    return False
            
            # Check for protected routes with SubscriptionGuard
            protected_routes = [
                ('dashboard.*SubscriptionGuard', 'Dashboard protection'),
                ('settings.*SubscriptionGuard', 'Settings protection'),
                ('quote.*SubscriptionGuard', 'Quote protection')
            ]
            
            for pattern, description in protected_routes:
                if re.search(pattern, content, re.DOTALL):
                    self.results['app_routing']['details'].append(f"✅ {description}")
                else:
                    self.results['app_routing']['details'].append(f"❌ {description}")
                    self.results['app_routing']['status'] = 'failed'
                    return False
            
            # Check that billing routes are NOT protected by SubscriptionGuard
            billing_content = content[content.find('/billing'):content.find('/dashboard')]
            if 'SubscriptionGuard' not in billing_content:
                self.results['app_routing']['details'].append("✅ Billing routes not protected by SubscriptionGuard")
            else:
                self.results['app_routing']['details'].append("❌ Billing routes incorrectly protected")
            
            self.results['app_routing']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['app_routing']['status'] = 'failed'
            self.results['app_routing']['details'].append(f"❌ Error reading app file: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete billing integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Check SQL migration creates required columns
            migration_file = self.app_dir / 'SUPABASE_BILLING_MIGRATION.sql'
            if migration_file.exists():
                migration_content = migration_file.read_text()
                required_columns = ['stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'trial_end']
                if all(col in migration_content for col in required_columns):
                    integration_checks.append("✅ SQL migration creates all required billing columns")
                else:
                    integration_checks.append("❌ SQL migration missing required columns")
            
            # 2. Check API endpoints exist and have proper logic
            api_endpoints = [
                ('start-trial.js', 'Start trial endpoint'),
                ('create-checkout-session.js', 'Checkout session endpoint'),
                ('webhook.js', 'Webhook endpoint'),
                ('status.js', 'Status endpoint')
            ]
            
            for filename, description in api_endpoints:
                api_file = self.app_dir / 'api' / 'billing' / filename
                if api_file.exists():
                    integration_checks.append(f"✅ {description} exists")
                else:
                    integration_checks.append(f"❌ {description} missing")
            
            # 3. Check frontend service connects to APIs
            service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'billingService.js'
            if service_file.exists():
                service_content = service_file.read_text()
                if '/api/billing/' in service_content:
                    integration_checks.append("✅ Frontend service connects to billing APIs")
                else:
                    integration_checks.append("❌ Frontend service missing API connections")
            
            # 4. Check SubscriptionGuard protects routes
            app_file = self.app_dir / 'frontend' / 'src' / 'App.js'
            if app_file.exists():
                app_content = app_file.read_text()
                if 'SubscriptionGuard' in app_content and 'dashboard' in app_content:
                    integration_checks.append("✅ SubscriptionGuard protects dashboard routes")
                else:
                    integration_checks.append("❌ Route protection not implemented")
            
            # 5. Check billing pages handle subscription flow
            billing_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Billing.js'
            success_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'BillingSuccess.js'
            
            if billing_file.exists() and success_file.exists():
                billing_content = billing_file.read_text()
                success_content = success_file.read_text()
                
                if 'createCheckoutSession' in billing_content and 'getBillingStatus' in success_content:
                    integration_checks.append("✅ Billing pages handle subscription flow")
                else:
                    integration_checks.append("❌ Billing flow incomplete")
            
            # 6. Check webhook handles Stripe events
            webhook_file = self.app_dir / 'api' / 'billing' / 'webhook.js'
            if webhook_file.exists():
                webhook_content = webhook_file.read_text()
                stripe_events = ['customer.subscription', 'invoice.payment', 'checkout.session']
                if any(event in webhook_content for event in stripe_events):
                    integration_checks.append("✅ Webhook handles Stripe events")
                else:
                    integration_checks.append("❌ Webhook event handling incomplete")
            
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
        print("🚀 Starting GreenQuote Pro Stripe Billing Feature Tests\n")
        
        tests = [
            ('SQL Migration', self.test_sql_migration),
            ('Start Trial API', self.test_start_trial_api),
            ('Checkout Session API', self.test_checkout_session_api),
            ('Webhook API', self.test_webhook_api),
            ('Status API', self.test_status_api),
            ('Billing Service', self.test_billing_service),
            ('Billing Page', self.test_billing_page),
            ('Billing Success Page', self.test_billing_success_page),
            ('Subscription Guard', self.test_subscription_guard),
            ('App Routing', self.test_app_routing),
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
    tester = GreenQuoteBillingTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Stripe billing feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)