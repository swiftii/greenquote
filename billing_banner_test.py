#!/usr/bin/env python3
"""
Billing Banner and Settings Testing for GreenQuote Pro

This test suite verifies the Trial Countdown Banner and Billing Settings implementation:
1. API Route: /api/billing/portal.js - Creates Stripe Customer Portal session
2. BillingSettings Page: Displays subscription status and manages billing
3. BillingBanner Component: Shows trial countdown and billing warnings
4. BillingService: Portal session creation function
5. Dashboard Integration: BillingBanner display
6. Settings Integration: Billing settings card
7. App Routing: /settings/billing route configuration

Testing Focus:
- Code syntax and logic verification
- Integration point validation
- Component state management
- Route configuration
- API parameter handling
"""

import os
import sys
import json
import re
import requests
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, '/app')

class BillingBannerTester:
    def __init__(self):
        self.app_dir = Path('/app')
        self.results = {
            'portal_api': {'status': 'pending', 'details': []},
            'billing_settings': {'status': 'pending', 'details': []},
            'billing_banner': {'status': 'pending', 'details': []},
            'billing_service': {'status': 'pending', 'details': []},
            'dashboard_integration': {'status': 'pending', 'details': []},
            'settings_integration': {'status': 'pending', 'details': []},
            'app_routing': {'status': 'pending', 'details': []},
            'integration_flow': {'status': 'pending', 'details': []}
        }
        
    def test_portal_api(self):
        """Test the /api/billing/portal.js API route"""
        print("🔍 Testing Portal API Route...")
        
        portal_file = self.app_dir / 'api' / 'billing' / 'portal.js'
        
        if not portal_file.exists():
            self.results['portal_api']['status'] = 'failed'
            self.results['portal_api']['details'].append('❌ Portal API file not found')
            return False
            
        try:
            content = portal_file.read_text()
            
            # Check for required imports and setup
            checks = [
                ('import Stripe from', 'Stripe import present'),
                ('import.*createClient.*@supabase', 'Supabase client import'),
                ('process.env.STRIPE_SECRET_KEY', 'Stripe secret key configuration'),
                ('process.env.SUPABASE_URL', 'Supabase URL configuration'),
                ('process.env.SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key')
            ]
            
            for pattern, description in checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['portal_api']['details'].append(f"✅ {description}")
                else:
                    self.results['portal_api']['details'].append(f"❌ {description}")
                    self.results['portal_api']['status'] = 'failed'
                    return False
            
            # Check API functionality
            api_checks = [
                ('req.method.*POST', 'POST method validation'),
                ('accountId.*req.body', 'accountId parameter extraction'),
                ('stripe_customer_id', 'Stripe customer ID lookup'),
                ('stripe.billingPortal.sessions.create', 'Stripe portal session creation'),
                ('customer:.*stripe_customer_id', 'Customer ID passed to Stripe'),
                ('return_url', 'Return URL configuration'),
                ('res.status.*200.*json', 'Success response with URL')
            ]
            
            for pattern, description in api_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['portal_api']['details'].append(f"✅ {description}")
                else:
                    self.results['portal_api']['details'].append(f"❌ {description}")
                    self.results['portal_api']['status'] = 'failed'
                    return False
            
            # Check error handling
            error_checks = [
                ('error.*Account ID is required', 'Account ID validation'),
                ('error.*Account not found', 'Account existence check'),
                ('error.*No billing account found', 'Stripe customer validation'),
                ('catch.*error', 'Error handling present'),
                ('StripeInvalidRequestError', 'Stripe-specific error handling')
            ]
            
            for pattern, description in error_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['portal_api']['details'].append(f"✅ {description}")
                else:
                    self.results['portal_api']['details'].append(f"❌ {description}")
            
            self.results['portal_api']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['portal_api']['status'] = 'failed'
            self.results['portal_api']['details'].append(f"❌ Error reading portal API file: {str(e)}")
            return False
    
    def test_billing_settings(self):
        """Test BillingSettings.js page implementation"""
        print("🔍 Testing BillingSettings Page...")
        
        settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'BillingSettings.js'
        
        if not settings_file.exists():
            self.results['billing_settings']['status'] = 'failed'
            self.results['billing_settings']['details'].append('❌ BillingSettings.js file not found')
            return False
            
        try:
            content = settings_file.read_text()
            
            # Check imports and hooks
            import_checks = [
                ('useAuth.*@/hooks/useAuth', 'useAuth hook import'),
                ('ensureUserAccount.*@/services/accountService', 'Account service import'),
                ('getBillingStatus.*createPortalSession.*@/services/billingService', 'Billing service imports'),
                ('useNavigate.*react-router-dom', 'Navigation hook import'),
                ('Card.*CardContent.*@/components/ui', 'UI components import')
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_settings']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_settings']['details'].append(f"❌ {description}")
                    self.results['billing_settings']['status'] = 'failed'
                    return False
            
            # Check state management
            state_checks = [
                ('useState.*account', 'Account state'),
                ('useState.*billingStatus', 'Billing status state'),
                ('useState.*loading', 'Loading state'),
                ('useState.*portalLoading', 'Portal loading state'),
                ('useState.*error', 'Error state')
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_settings']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_settings']['details'].append(f"❌ {description}")
            
            # Check billing status display logic
            status_checks = [
                ('getStatusLabel.*billingStatus.status', 'Status label function'),
                ('formatTrialEnd.*billingStatus.trialEnd', 'Trial end formatting'),
                ('getStatusMessage.*switch.*billingStatus.status', 'Status message logic'),
                ('getStatusColor.*switch.*billingStatus.status', 'Status color logic'),
                ('trialing.*active.*past_due.*canceled', 'Multiple status handling')
            ]
            
            for pattern, description in status_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_settings']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_settings']['details'].append(f"❌ {description}")
            
            # Check portal management
            portal_checks = [
                ('handleManageBilling.*async', 'Portal management function'),
                ('createPortalSession.*account.id', 'Portal session creation'),
                ('window.location.href.*url', 'Portal redirect'),
                ('portalLoading.*Opening', 'Portal loading state'),
                ('hasStripeCustomer.*disabled', 'Stripe customer validation')
            ]
            
            for pattern, description in portal_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_settings']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_settings']['details'].append(f"❌ {description}")
            
            # Check UI elements
            ui_checks = [
                ('Current Plan.*CardTitle', 'Current plan section'),
                ('Pro Plan', 'Pro plan display'),
                ('trialDaysRemaining.*days remaining', 'Trial days display'),
                ('Next billing.*periodEndFormatted', 'Next billing date'),
                ('Payment Required.*past_due', 'Past due warning'),
                ('Subscription Canceled.*canceled', 'Canceled status'),
                ('Manage Billing.*Button', 'Manage billing button')
            ]
            
            for pattern, description in ui_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_settings']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_settings']['details'].append(f"❌ {description}")
            
            self.results['billing_settings']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_settings']['status'] = 'failed'
            self.results['billing_settings']['details'].append(f"❌ Error reading BillingSettings file: {str(e)}")
            return False
    
    def test_billing_banner(self):
        """Test BillingBanner.js component implementation"""
        print("🔍 Testing BillingBanner Component...")
        
        banner_file = self.app_dir / 'frontend' / 'src' / 'components' / 'BillingBanner.js'
        
        if not banner_file.exists():
            self.results['billing_banner']['status'] = 'failed'
            self.results['billing_banner']['details'].append('❌ BillingBanner.js file not found')
            return False
            
        try:
            content = banner_file.read_text()
            
            # Check imports and setup
            import_checks = [
                ('useAuth.*@/hooks/useAuth', 'useAuth hook import'),
                ('ensureUserAccount.*@/services/accountService', 'Account service import'),
                ('getBillingStatus.*createPortalSession.*@/services/billingService', 'Billing service imports'),
                ('Button.*@/components/ui/button', 'Button component import')
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
                    self.results['billing_banner']['status'] = 'failed'
                    return False
            
            # Check state and data loading
            state_checks = [
                ('useState.*account', 'Account state'),
                ('useState.*billingStatus', 'Billing status state'),
                ('useState.*loading', 'Loading state'),
                ('loadBillingData.*useCallback', 'Data loading function'),
                ('useEffect.*loadBillingData', 'Effect hook for data loading')
            ]
            
            for pattern, description in state_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
            
            # Check banner display logic
            banner_checks = [
                ('status.*trialing.*trialEnd', 'Trial banner condition'),
                ('status.*past_due.*unpaid', 'Past due banner condition'),
                ('status.*canceled', 'Canceled banner condition'),
                ('return null', 'No banner for active status'),
                ('formatDate.*dateStr', 'Date formatting function')
            ]
            
            for pattern, description in banner_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
            
            # Check trial banner content
            trial_checks = [
                ('Free trial ends in.*trialDaysRemaining.*days', 'Trial countdown text'),
                ('on.*endDate', 'Trial end date display'),
                ('bg-blue-600.*text-white', 'Trial banner styling'),
                ('Add Payment Method', 'Trial CTA button'),
                ('clock.*svg', 'Trial icon')
            ]
            
            for pattern, description in trial_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
            
            # Check warning banners
            warning_checks = [
                ('Payment issue detected', 'Past due warning text'),
                ('bg-red-600.*text-white', 'Past due banner styling'),
                ('Update Payment Method', 'Past due CTA'),
                ('subscription is.*canceled', 'Canceled warning text'),
                ('bg-gray-700.*text-white', 'Canceled banner styling'),
                ('Reactivate Subscription', 'Canceled CTA')
            ]
            
            for pattern, description in warning_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
            
            # Check portal integration
            portal_checks = [
                ('handleManageBilling.*async', 'Portal handler function'),
                ('createPortalSession.*account.id', 'Portal session creation'),
                ('window.location.href.*url', 'Portal redirect'),
                ('portalLoading.*Loading', 'Portal loading state')
            ]
            
            for pattern, description in portal_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_banner']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_banner']['details'].append(f"❌ {description}")
            
            self.results['billing_banner']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_banner']['status'] = 'failed'
            self.results['billing_banner']['details'].append(f"❌ Error reading BillingBanner file: {str(e)}")
            return False
    
    def test_billing_service(self):
        """Test billingService.js createPortalSession function"""
        print("🔍 Testing Billing Service...")
        
        service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'billingService.js'
        
        if not service_file.exists():
            self.results['billing_service']['status'] = 'failed'
            self.results['billing_service']['details'].append('❌ billingService.js file not found')
            return False
            
        try:
            content = service_file.read_text()
            
            # Check createPortalSession function
            portal_checks = [
                ('export.*async.*function.*createPortalSession', 'createPortalSession function export'),
                ('accountId.*createPortalSession', 'accountId parameter'),
                ('getApiBaseUrl', 'API base URL function'),
                ('fetch.*api/billing/portal', 'Portal API endpoint'),
                ('method.*POST', 'POST method'),
                ('Content-Type.*application/json', 'JSON content type'),
                ('JSON.stringify.*accountId', 'Request body with accountId'),
                ('originUrl.*window.location.origin', 'Origin URL handling')
            ]
            
            for pattern, description in portal_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_service']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_service']['details'].append(f"❌ {description}")
                    self.results['billing_service']['status'] = 'failed'
                    return False
            
            # Check error handling
            error_checks = [
                ('if.*!response.ok', 'Response status check'),
                ('response.json.*catch', 'JSON parsing error handling'),
                ('throw new Error', 'Error throwing'),
                ('catch.*error', 'Error catching'),
                ('console.error.*BillingService', 'Error logging')
            ]
            
            for pattern, description in error_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_service']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_service']['details'].append(f"❌ {description}")
            
            # Check other billing functions
            other_checks = [
                ('getBillingStatus', 'getBillingStatus function'),
                ('formatTrialEnd', 'formatTrialEnd function'),
                ('getStatusLabel', 'getStatusLabel function'),
                ('hasAccess', 'hasAccess function')
            ]
            
            for pattern, description in other_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['billing_service']['details'].append(f"✅ {description}")
                else:
                    self.results['billing_service']['details'].append(f"❌ {description}")
            
            self.results['billing_service']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['billing_service']['status'] = 'failed'
            self.results['billing_service']['details'].append(f"❌ Error reading billingService file: {str(e)}")
            return False
    
    def test_dashboard_integration(self):
        """Test Dashboard.js BillingBanner integration"""
        print("🔍 Testing Dashboard Integration...")
        
        dashboard_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Dashboard.js'
        
        if not dashboard_file.exists():
            self.results['dashboard_integration']['status'] = 'failed'
            self.results['dashboard_integration']['details'].append('❌ Dashboard.js file not found')
            return False
            
        try:
            content = dashboard_file.read_text()
            
            # Check BillingBanner integration
            integration_checks = [
                ('import.*BillingBanner.*@/components/BillingBanner', 'BillingBanner import'),
                ('<BillingBanner.*/?>', 'BillingBanner component usage'),
                ('Billing Banner.*shows trial countdown', 'BillingBanner comment/documentation')
            ]
            
            for pattern, description in integration_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['dashboard_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_integration']['details'].append(f"❌ {description}")
                    self.results['dashboard_integration']['status'] = 'failed'
                    return False
            
            # Check placement in layout
            layout_checks = [
                ('BillingBanner.*header', 'BillingBanner placed before header'),
                ('min-h-screen.*bg-gradient', 'Proper page layout'),
                ('header.*bg-white.*shadow', 'Header styling maintained')
            ]
            
            for pattern, description in layout_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['dashboard_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['dashboard_integration']['details'].append(f"❌ {description}")
            
            self.results['dashboard_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['dashboard_integration']['status'] = 'failed'
            self.results['dashboard_integration']['details'].append(f"❌ Error reading Dashboard file: {str(e)}")
            return False
    
    def test_settings_integration(self):
        """Test Settings.js billing card integration"""
        print("🔍 Testing Settings Integration...")
        
        settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
        
        if not settings_file.exists():
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append('❌ Settings.js file not found')
            return False
            
        try:
            content = settings_file.read_text()
            
            # Check billing settings card
            billing_checks = [
                ('Billing.*Subscription.*CardTitle', 'Billing & Subscription card title'),
                ('Manage your subscription.*payment method', 'Billing card description'),
                ('navigate.*settings/billing', 'Navigation to billing settings'),
                ('Manage Billing.*Button', 'Manage Billing button'),
                ('bg-green-600.*hover:bg-green-700', 'Button styling')
            ]
            
            for pattern, description in billing_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
                    self.results['settings_integration']['status'] = 'failed'
                    return False
            
            # Check card placement and structure
            structure_checks = [
                ('Card.*mb-6', 'Card spacing'),
                ('CardHeader.*CardContent', 'Card structure'),
                ('flex.*items-center.*justify-between', 'Card layout'),
                ('text-sm.*text-gray-600', 'Description styling')
            ]
            
            for pattern, description in structure_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['settings_integration']['details'].append(f"✅ {description}")
                else:
                    self.results['settings_integration']['details'].append(f"❌ {description}")
            
            self.results['settings_integration']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['settings_integration']['status'] = 'failed'
            self.results['settings_integration']['details'].append(f"❌ Error reading Settings file: {str(e)}")
            return False
    
    def test_app_routing(self):
        """Test App.js routing configuration"""
        print("🔍 Testing App Routing...")
        
        app_file = self.app_dir / 'frontend' / 'src' / 'App.js'
        
        if not app_file.exists():
            self.results['app_routing']['status'] = 'failed'
            self.results['app_routing']['details'].append('❌ App.js file not found')
            return False
            
        try:
            content = app_file.read_text()
            
            # Check imports
            import_checks = [
                ('import.*BillingSettings.*@/pages/BillingSettings', 'BillingSettings import'),
                ('import.*SubscriptionGuard.*@/components/SubscriptionGuard', 'SubscriptionGuard import'),
                ('import.*ProtectedRoute.*@/components/ProtectedRoute', 'ProtectedRoute import')
            ]
            
            for pattern, description in import_checks:
                if re.search(pattern, content, re.IGNORECASE):
                    self.results['app_routing']['details'].append(f"✅ {description}")
                else:
                    self.results['app_routing']['details'].append(f"❌ {description}")
                    self.results['app_routing']['status'] = 'failed'
                    return False
            
            # Check route configuration
            route_checks = [
                ('path="/settings/billing"', '/settings/billing route path'),
                ('<ProtectedRoute>.*<SubscriptionGuard>.*<BillingSettings', 'Route protection with SubscriptionGuard'),
                ('</SubscriptionGuard>.*</ProtectedRoute>', 'Proper route nesting'),
                ('element=.*BillingSettings', 'BillingSettings component as element')
            ]
            
            for pattern, description in route_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['app_routing']['details'].append(f"✅ {description}")
                else:
                    self.results['app_routing']['details'].append(f"❌ {description}")
                    self.results['app_routing']['status'] = 'failed'
                    return False
            
            # Check other protected routes for consistency
            consistency_checks = [
                ('path="/dashboard".*ProtectedRoute.*SubscriptionGuard', 'Dashboard route protection'),
                ('path="/settings".*ProtectedRoute.*SubscriptionGuard', 'Settings route protection'),
                ('path="/quote".*ProtectedRoute.*SubscriptionGuard', 'Quote route protection')
            ]
            
            for pattern, description in consistency_checks:
                if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                    self.results['app_routing']['details'].append(f"✅ {description}")
                else:
                    self.results['app_routing']['details'].append(f"❌ {description}")
            
            self.results['app_routing']['status'] = 'passed'
            return True
            
        except Exception as e:
            self.results['app_routing']['status'] = 'failed'
            self.results['app_routing']['details'].append(f"❌ Error reading App file: {str(e)}")
            return False
    
    def test_integration_flow(self):
        """Test the complete integration flow"""
        print("🔍 Testing Integration Flow...")
        
        try:
            integration_checks = []
            
            # 1. Dashboard displays BillingBanner
            dashboard_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Dashboard.js'
            if dashboard_file.exists():
                dashboard_content = dashboard_file.read_text()
                if 'BillingBanner' in dashboard_content and 'import' in dashboard_content:
                    integration_checks.append("✅ Dashboard displays BillingBanner")
                else:
                    integration_checks.append("❌ Dashboard doesn't display BillingBanner")
            
            # 2. BillingBanner loads billing status and shows appropriate banner
            banner_file = self.app_dir / 'frontend' / 'src' / 'components' / 'BillingBanner.js'
            if banner_file.exists():
                banner_content = banner_file.read_text()
                if 'getBillingStatus' in banner_content and 'trialing' in banner_content and 'past_due' in banner_content:
                    integration_checks.append("✅ BillingBanner handles multiple status types")
                else:
                    integration_checks.append("❌ BillingBanner doesn't handle status types properly")
            
            # 3. Settings page links to billing settings
            settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'Settings.js'
            if settings_file.exists():
                settings_content = settings_file.read_text()
                if 'settings/billing' in settings_content and 'Manage Billing' in settings_content:
                    integration_checks.append("✅ Settings page links to billing settings")
                else:
                    integration_checks.append("❌ Settings page doesn't link to billing settings")
            
            # 4. BillingSettings page manages portal sessions
            billing_settings_file = self.app_dir / 'frontend' / 'src' / 'pages' / 'BillingSettings.js'
            if billing_settings_file.exists():
                billing_content = billing_settings_file.read_text()
                if 'createPortalSession' in billing_content and 'handleManageBilling' in billing_content:
                    integration_checks.append("✅ BillingSettings manages portal sessions")
                else:
                    integration_checks.append("❌ BillingSettings doesn't manage portal sessions")
            
            # 5. BillingService connects to portal API
            service_file = self.app_dir / 'frontend' / 'src' / 'services' / 'billingService.js'
            if service_file.exists():
                service_content = service_file.read_text()
                if 'createPortalSession' in service_content and '/api/billing/portal' in service_content:
                    integration_checks.append("✅ BillingService connects to portal API")
                else:
                    integration_checks.append("❌ BillingService doesn't connect to portal API")
            
            # 6. Portal API creates Stripe sessions
            portal_file = self.app_dir / 'api' / 'billing' / 'portal.js'
            if portal_file.exists():
                portal_content = portal_file.read_text()
                if 'stripe.billingPortal.sessions.create' in portal_content and 'stripe_customer_id' in portal_content:
                    integration_checks.append("✅ Portal API creates Stripe sessions")
                else:
                    integration_checks.append("❌ Portal API doesn't create Stripe sessions")
            
            # 7. App routing protects billing settings
            app_file = self.app_dir / 'frontend' / 'src' / 'App.js'
            if app_file.exists():
                app_content = app_file.read_text()
                if '/settings/billing' in app_content and 'SubscriptionGuard' in app_content:
                    integration_checks.append("✅ App routing protects billing settings")
                else:
                    integration_checks.append("❌ App routing doesn't protect billing settings")
            
            # 8. Components handle loading and error states
            components_with_loading = [
                (banner_file, 'BillingBanner'),
                (billing_settings_file, 'BillingSettings')
            ]
            
            loading_handled = True
            for file_path, component_name in components_with_loading:
                if file_path.exists():
                    content = file_path.read_text()
                    if 'loading' in content and 'error' in content:
                        integration_checks.append(f"✅ {component_name} handles loading and error states")
                    else:
                        integration_checks.append(f"❌ {component_name} doesn't handle loading/error states")
                        loading_handled = False
            
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
        print("🚀 Starting Billing Banner and Settings Feature Tests\n")
        
        tests = [
            ('Portal API', self.test_portal_api),
            ('Billing Settings', self.test_billing_settings),
            ('Billing Banner', self.test_billing_banner),
            ('Billing Service', self.test_billing_service),
            ('Dashboard Integration', self.test_dashboard_integration),
            ('Settings Integration', self.test_settings_integration),
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
    tester = BillingBannerTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n" + "=" * 60)
    print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
    print("=" * 60)
    
    tester.print_detailed_results()
    
    # Determine overall result
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Billing Banner and Settings feature is properly implemented.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)