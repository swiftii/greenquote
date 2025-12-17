import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TeamSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Team data
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  // Load team data
  const loadTeamData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${BACKEND_URL}/api/invites/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load team data');
      }
      
      setMembers(data.members || []);
      setPendingInvites(data.pending_invites || []);
      setCanManageTeam(data.can_manage_team || false);
      setCurrentUserRole(data.current_user_role || 'member');
      
    } catch (err) {
      console.error('[TeamSettings] Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadTeamData();
    }
  }, [authLoading, user, loadTeamData]);

  // Send invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    try {
      setInviting(true);
      setError(null);
      setSuccess(null);
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const response = await fetch(`${BACKEND_URL}/api/invites/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invited_email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      
      // Reload team data
      await loadTeamData();
      
    } catch (err) {
      console.error('[TeamSettings] Invite error:', err);
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }
    
    try {
      setError(null);
      
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const response = await fetch(`${BACKEND_URL}/api/invites/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invite_id: inviteId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke invitation');
      }
      
      setSuccess('Invitation revoked');
      
      // Reload team data
      await loadTeamData();
      
    } catch (err) {
      console.error('[TeamSettings] Revoke error:', err);
      setError(err.message);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get role badge color
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-xl font-bold text-green-600">
                🌱 GreenQuote Pro
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link to="/settings" className="text-gray-600 hover:text-gray-900">
                ← Back to Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your team and invite new members to your account.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Team Members Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              People who have access to this account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {members.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.name || 'Unknown'}
                        {member.is_current_user && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(member.joined_at)}
                    </span>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-gray-500 py-4">No team members found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites Card - Only visible to owner/admin */}
        {canManageTeam && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-200">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{invite.invited_email}</p>
                      <p className="text-sm text-gray-500">
                        Expires {formatDate(invite.expires_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeClass(invite.role)}`}>
                        {invite.role}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingInvites.length === 0 && (
                  <p className="text-gray-500 py-4">No pending invitations.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite Form - Only visible to owner/admin */}
        {canManageTeam && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>
                Send an invitation to add a new member to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teammate@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Admins can invite/remove team members. Members have view/edit access.
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Permission notice for non-admin users */}
        {!canManageTeam && (
          <Card>
            <CardContent className="py-6">
              <p className="text-gray-500 text-center">
                Only account owners and admins can invite team members.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
