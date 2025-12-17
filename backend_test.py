#!/usr/bin/env python3
"""
Backend Testing for GreenQuote App - Multi-User Accounts Feature
Testing Agent: Comprehensive testing for Multi-User Accounts implementation

This test focuses on verifying the Multi-User Accounts feature implementation
including team invites, account membership-based resolution, and API endpoints.

Test Categories:
1. SQL Migration Structure
2. API: POST /api/invites/create
3. API: POST /api/invites/accept
4. API: GET /api/invites/list
5. API: POST /api/invites/revoke
6. Frontend: TeamSettings Page
7. Frontend: AcceptInvite Page
8. AccountService: Membership Resolution
9. App.js Routes
10. Login/Signup Redirect Support
"""

import os
import sys
import re
import json
from pathlib import Path

# Test Results Storage
test_results = {
    "sql_migration_structure": {"passed": None, "details": []},
    "api_invites_create": {"passed": None, "details": []},
    "api_invites_accept": {"passed": None, "details": []},
    "api_invites_list": {"passed": None, "details": []},
    "api_invites_revoke": {"passed": None, "details": []},
    "frontend_team_settings": {"passed": None, "details": []},
    "frontend_accept_invite": {"passed": None, "details": []},
    "account_service_membership": {"passed": None, "details": []},
    "app_routes": {"passed": None, "details": []},
    "login_signup_redirect": {"passed": None, "details": []},
}

def log_test(category, message, passed=True):
    """Log test result with details"""
    test_results[category]["details"].append(f"{'✅' if passed else '❌'} {message}")
    if not passed:
        test_results[category]["passed"] = False
    elif test_results[category]["passed"] is None:  # Initialize to True on first pass
        test_results[category]["passed"] = True

def read_file_content(file_path):
    """Read file content safely"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

def test_sql_migration_structure():
    """
    TEST CASE 1: SQL Migration Structure
    - Verify account_members table schema (id, account_id, user_id, role, created_at)
    - Verify account_invites table schema
    - Verify RLS policies exist
    - Verify backfill query for existing owners
    - Verify trigger for new accounts
    """
    print("\n🔍 Testing SQL Migration Structure...")
    
    migration_content = read_file_content('/app/SUPABASE_TEAM_MEMBERS_MIGRATION.sql')
    if not migration_content:
        log_test("sql_migration_structure", "Could not read SUPABASE_TEAM_MEMBERS_MIGRATION.sql file", False)
        return
    
    # Test 1.1: Check account_members table creation
    account_members_pattern = r'CREATE TABLE.*account_members.*\('
    if re.search(account_members_pattern, migration_content, re.DOTALL):
        log_test("sql_migration_structure", "account_members table creation found")
    else:
        log_test("sql_migration_structure", "account_members table creation not found", False)
    
    # Test 1.2: Check account_invites table creation
    account_invites_pattern = r'CREATE TABLE.*account_invites.*\('
    if re.search(account_invites_pattern, migration_content, re.DOTALL):
        log_test("sql_migration_structure", "account_invites table creation found")
    else:
        log_test("sql_migration_structure", "account_invites table creation not found", False)
    
    # Test 1.3: Check RLS policies
    rls_policies_pattern = r'CREATE POLICY.*account_members'
    if re.search(rls_policies_pattern, migration_content):
        log_test("sql_migration_structure", "RLS policies for account_members found")
    else:
        log_test("sql_migration_structure", "RLS policies for account_members not found", False)
    
    # Test 1.4: Check backfill query
    backfill_pattern = r'INSERT INTO.*account_members.*SELECT.*owner_user_id'
    if re.search(backfill_pattern, migration_content, re.DOTALL):
        log_test("sql_migration_structure", "Backfill query for existing owners found")
    else:
        log_test("sql_migration_structure", "Backfill query for existing owners not found", False)
    
    # Test 1.5: Check trigger creation
    trigger_pattern = r'CREATE TRIGGER.*on_account_created_add_owner'
    if re.search(trigger_pattern, migration_content):
        log_test("sql_migration_structure", "Trigger for new accounts found")
    else:
        log_test("sql_migration_structure", "Trigger for new accounts not found", False)
    
    # Test 1.6: Check role constraints
    role_constraint_pattern = r"role.*CHECK.*role IN.*'owner'.*'admin'.*'member'"
    if re.search(role_constraint_pattern, migration_content):
        log_test("sql_migration_structure", "Role constraints (owner/admin/member) found")
    else:
        log_test("sql_migration_structure", "Role constraints not found", False)

def test_api_invites_create():
    """
    TEST CASE 2: API: POST /api/invites/create
    - Verify requires Authorization header
    - Verify validates invited_email
    - Verify checks user is owner/admin via account_members
    - Verify creates invite record with token
    - Verify sends email via Resend
    - Verify returns { ok: true }
    """
    print("\n🔍 Testing API: POST /api/invites/create...")
    
    create_content = read_file_content('/app/api/invites/create.js')
    if not create_content:
        log_test("api_invites_create", "Could not read /api/invites/create.js file", False)
        return
    
    # Test 2.1: Check Authorization header validation
    auth_pattern = r'authHeader.*Bearer'
    if re.search(auth_pattern, create_content):
        log_test("api_invites_create", "Authorization header validation found")
    else:
        log_test("api_invites_create", "Authorization header validation not found", False)
    
    # Test 2.2: Check email validation
    email_validation_pattern = r'invited_email.*toLowerCase.*trim'
    if re.search(email_validation_pattern, create_content):
        log_test("api_invites_create", "Email validation and normalization found")
    else:
        log_test("api_invites_create", "Email validation not found", False)
    
    # Test 2.3: Check membership lookup for owner/admin
    membership_pattern = r'account_members.*owner.*admin'
    if re.search(membership_pattern, create_content):
        log_test("api_invites_create", "Owner/admin membership check found")
    else:
        log_test("api_invites_create", "Owner/admin membership check not found", False)
    
    # Test 2.4: Check token generation
    token_pattern = r'generateToken.*crypto\.randomBytes'
    if re.search(token_pattern, create_content):
        log_test("api_invites_create", "Secure token generation found")
    else:
        log_test("api_invites_create", "Secure token generation not found", False)
    
    # Test 2.5: Check Resend email integration
    resend_pattern = r'resend\.emails\.send'
    if re.search(resend_pattern, create_content):
        log_test("api_invites_create", "Resend email integration found")
    else:
        log_test("api_invites_create", "Resend email integration not found", False)
    
    # Test 2.6: Check success response
    success_pattern = r'ok: true'
    if re.search(success_pattern, create_content):
        log_test("api_invites_create", "Success response format found")
    else:
        log_test("api_invites_create", "Success response format not found", False)

def test_api_invites_accept():
    """
    TEST CASE 3: API: POST /api/invites/accept
    - Verify requires Authorization header
    - Verify validates token parameter
    - Verify checks invite status is pending
    - Verify checks expiration
    - Verify email matches (case-insensitive)
    - Verify creates account_members entry
    - Verify updates invite status to accepted
    - Verify idempotent (handles existing membership)
    """
    print("\n🔍 Testing API: POST /api/invites/accept...")
    
    accept_content = read_file_content('/app/api/invites/accept.js')
    if not accept_content:
        log_test("api_invites_accept", "Could not read /api/invites/accept.js file", False)
        return
    
    # Test 3.1: Check Authorization header validation
    auth_pattern = r'authHeader.*Bearer'
    if re.search(auth_pattern, accept_content):
        log_test("api_invites_accept", "Authorization header validation found")
    else:
        log_test("api_invites_accept", "Authorization header validation not found", False)
    
    # Test 3.2: Check token parameter validation
    token_validation_pattern = r'token.*typeof.*string'
    if re.search(token_validation_pattern, accept_content):
        log_test("api_invites_accept", "Token parameter validation found")
    else:
        log_test("api_invites_accept", "Token parameter validation not found", False)
    
    # Test 3.3: Check invite status validation
    status_check_pattern = r"invite\.status.*pending"
    if re.search(status_check_pattern, accept_content):
        log_test("api_invites_accept", "Invite status pending check found")
    else:
        log_test("api_invites_accept", "Invite status pending check not found", False)
    
    # Test 3.4: Check expiration validation
    expiration_pattern = r'expires_at.*new Date'
    if re.search(expiration_pattern, accept_content):
        log_test("api_invites_accept", "Expiration check found")
    else:
        log_test("api_invites_accept", "Expiration check not found", False)
    
    # Test 3.5: Check email matching (case-insensitive)
    email_match_pattern = r'toLowerCase.*invitedEmail.*toLowerCase'
    if re.search(email_match_pattern, accept_content):
        log_test("api_invites_accept", "Case-insensitive email matching found")
    else:
        log_test("api_invites_accept", "Case-insensitive email matching not found", False)
    
    # Test 3.6: Check account_members insertion
    members_insert_pattern = r'account_members.*insert'
    if re.search(members_insert_pattern, accept_content):
        log_test("api_invites_accept", "Account members insertion found")
    else:
        log_test("api_invites_accept", "Account members insertion not found", False)
    
    # Test 3.7: Check invite status update to accepted
    status_update_pattern = r"status.*accepted"
    if re.search(status_update_pattern, accept_content):
        log_test("api_invites_accept", "Invite status update to accepted found")
    else:
        log_test("api_invites_accept", "Invite status update to accepted not found", False)
    
    # Test 3.8: Check idempotent handling
    existing_membership_pattern = r'existingMembership.*already a member'
    if re.search(existing_membership_pattern, accept_content):
        log_test("api_invites_accept", "Idempotent handling for existing membership found")
    else:
        log_test("api_invites_accept", "Idempotent handling not found", False)

def test_api_invites_list():
    """
    TEST CASE 4: API: GET /api/invites/list
    - Verify requires Authorization header
    - Verify returns members array with user details
    - Verify returns pending_invites array
    - Verify returns can_manage_team flag
    """
    print("\n🔍 Testing API: GET /api/invites/list...")
    
    list_content = read_file_content('/app/api/invites/list.js')
    if not list_content:
        log_test("api_invites_list", "Could not read /api/invites/list.js file", False)
        return
    
    # Test 4.1: Check Authorization header validation
    auth_pattern = r'authHeader.*Bearer'
    if re.search(auth_pattern, list_content):
        log_test("api_invites_list", "Authorization header validation found")
    else:
        log_test("api_invites_list", "Authorization header validation not found", False)
    
    # Test 4.2: Check members array with user details
    members_pattern = r'account_members.*select.*user_id.*role'
    if re.search(members_pattern, list_content):
        log_test("api_invites_list", "Members query with user details found")
    else:
        log_test("api_invites_list", "Members query not found", False)
    
    # Test 4.3: Check user details fetching
    user_details_pattern = r'getUserById.*userData'
    if re.search(user_details_pattern, list_content):
        log_test("api_invites_list", "User details fetching found")
    else:
        log_test("api_invites_list", "User details fetching not found", False)
    
    # Test 4.4: Check pending invites query
    pending_invites_pattern = r'account_invites.*pending.*expires_at'
    if re.search(pending_invites_pattern, list_content):
        log_test("api_invites_list", "Pending invites query found")
    else:
        log_test("api_invites_list", "Pending invites query not found", False)
    
    # Test 4.5: Check can_manage_team flag
    manage_team_pattern = r'can_manage_team.*owner.*admin'
    if re.search(manage_team_pattern, list_content):
        log_test("api_invites_list", "can_manage_team flag logic found")
    else:
        log_test("api_invites_list", "can_manage_team flag logic not found", False)
    
    # Test 4.6: Check response structure
    response_structure_pattern = r'members.*pending_invites.*current_user_role'
    if re.search(response_structure_pattern, list_content):
        log_test("api_invites_list", "Complete response structure found")
    else:
        log_test("api_invites_list", "Complete response structure not found", False)

def test_api_invites_revoke():
    """
    TEST CASE 5: API: POST /api/invites/revoke
    - Verify requires Authorization header
    - Verify requires owner/admin role
    - Verify updates invite status to revoked
    """
    print("\n🔍 Testing API: POST /api/invites/revoke...")
    
    revoke_content = read_file_content('/app/api/invites/revoke.js')
    if not revoke_content:
        log_test("api_invites_revoke", "Could not read /api/invites/revoke.js file", False)
        return
    
    # Test 5.1: Check Authorization header validation
    auth_pattern = r'authHeader.*Bearer'
    if re.search(auth_pattern, revoke_content):
        log_test("api_invites_revoke", "Authorization header validation found")
    else:
        log_test("api_invites_revoke", "Authorization header validation not found", False)
    
    # Test 5.2: Check invite_id parameter validation
    invite_id_pattern = r'invite_id.*required'
    if re.search(invite_id_pattern, revoke_content):
        log_test("api_invites_revoke", "Invite ID parameter validation found")
    else:
        log_test("api_invites_revoke", "Invite ID parameter validation not found", False)
    
    # Test 5.3: Check owner/admin role requirement
    role_check_pattern = r'owner.*admin.*revoke'
    if re.search(role_check_pattern, revoke_content):
        log_test("api_invites_revoke", "Owner/admin role requirement found")
    else:
        log_test("api_invites_revoke", "Owner/admin role requirement not found", False)
    
    # Test 5.4: Check invite ownership verification
    ownership_pattern = r'invite\.account_id.*accountId'
    if re.search(ownership_pattern, revoke_content):
        log_test("api_invites_revoke", "Invite ownership verification found")
    else:
        log_test("api_invites_revoke", "Invite ownership verification not found", False)
    
    # Test 5.5: Check status update to revoked
    revoked_update_pattern = r"status.*revoked"
    if re.search(revoked_update_pattern, revoke_content):
        log_test("api_invites_revoke", "Status update to revoked found")
    else:
        log_test("api_invites_revoke", "Status update to revoked not found", False)
    
    # Test 5.6: Check already revoked/accepted handling
    already_handled_pattern = r'already been revoked.*already been accepted'
    if re.search(already_handled_pattern, revoke_content):
        log_test("api_invites_revoke", "Already revoked/accepted handling found")
    else:
        log_test("api_invites_revoke", "Already revoked/accepted handling not found", False)

def test_frontend_team_settings():
    """
    TEST CASE 6: Frontend: TeamSettings Page
    - Verify shows members list with roles
    - Verify shows pending invites for owner/admin
    - Verify invite form exists for owner/admin
    - Verify revoke button works
    """
    print("\n🔍 Testing Frontend: TeamSettings Page...")
    
    team_settings_content = read_file_content('/app/frontend/src/pages/TeamSettings.js')
    if not team_settings_content:
        log_test("frontend_team_settings", "Could not read TeamSettings.js file", False)
        return
    
    # Test 6.1: Check members list display
    members_list_pattern = r'members\.map.*member.*role'
    if re.search(members_list_pattern, team_settings_content):
        log_test("frontend_team_settings", "Members list with roles display found")
    else:
        log_test("frontend_team_settings", "Members list display not found", False)
    
    # Test 6.2: Check pending invites display for owner/admin
    pending_invites_pattern = r'canManageTeam.*pendingInvites'
    if re.search(pending_invites_pattern, team_settings_content):
        log_test("frontend_team_settings", "Pending invites display for owner/admin found")
    else:
        log_test("frontend_team_settings", "Pending invites display not found", False)
    
    # Test 6.3: Check invite form for owner/admin
    invite_form_pattern = r'handleSendInvite.*inviteEmail.*inviteRole'
    if re.search(invite_form_pattern, team_settings_content):
        log_test("frontend_team_settings", "Invite form for owner/admin found")
    else:
        log_test("frontend_team_settings", "Invite form not found", False)
    
    # Test 6.4: Check revoke button functionality
    revoke_button_pattern = r'handleRevokeInvite.*Revoke'
    if re.search(revoke_button_pattern, team_settings_content):
        log_test("frontend_team_settings", "Revoke button functionality found")
    else:
        log_test("frontend_team_settings", "Revoke button functionality not found", False)
    
    # Test 6.5: Check API integration
    api_integration_pattern = r'/api/invites/create.*api/invites/list.*api/invites/revoke'
    if re.search(api_integration_pattern, team_settings_content, re.DOTALL):
        log_test("frontend_team_settings", "API integration with invite endpoints found")
    else:
        log_test("frontend_team_settings", "API integration not found", False)
    
    # Test 6.6: Check role badge display
    role_badge_pattern = r'getRoleBadgeClass.*owner.*admin.*member'
    if re.search(role_badge_pattern, team_settings_content):
        log_test("frontend_team_settings", "Role badge display logic found")
    else:
        log_test("frontend_team_settings", "Role badge display logic not found", False)

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
    
    # Test 8.4: Check drawing mode is NOT started automatically in onPlaceChanged
    # Extract onPlaceChanged function content
    onplace_start = quote_content.find('const onPlaceChanged = useCallback(() => {')
    if onplace_start != -1:
        # Find the end of the function (matching braces)
        brace_count = 0
        func_start = onplace_start
        func_end = func_start
        for i, char in enumerate(quote_content[func_start:]):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    func_end = func_start + i
                    break
        
        onplace_content = quote_content[func_start:func_end]
        
        if 'setIsDrawing(true)' in onplace_content:
            log_test("no_auto_draw_address_selection", "Auto-start drawing found in onPlaceChanged - should not happen", False)
        else:
            log_test("no_auto_draw_address_selection", "No auto-start drawing mode in onPlaceChanged")
    else:
        log_test("no_auto_draw_address_selection", "onPlaceChanged function not found for auto-start check", False)
    
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