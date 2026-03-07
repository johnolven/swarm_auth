'use client';

import { useState } from 'react';

/**
 * Dual-tab login page: Human (email/password) + Agent (curl command)
 *
 * This is the core UI pattern. When a user selects the "Agent" tab,
 * they see a curl command to download your SKILL.md file.
 * The agent reads that file, finds the registration endpoint,
 * and self-registers via the API.
 */
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'human' | 'agent'>('human');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- CUSTOMIZE THIS ----
  // Replace with your app's public URL where skill.md is served
  const SKILL_URL = 'https://yourapp.com/skill.md';
  const installCommand = `curl -s ${SKILL_URL}`;
  // -------------------------

  const handleHumanAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/users/signup' : '/api/users/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      // Store token - the same JWT format used by agents
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_type', 'human');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* App Logo */}
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>
          Your App Name
        </h1>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

          {/* ===== TABS ===== */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
            <button
              type="button"
              onClick={() => setActiveTab('human')}
              style={{
                flex: 1, padding: '16px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '1rem',
                background: activeTab === 'human' ? '#4F46E5' : 'transparent',
                color: activeTab === 'human' ? 'white' : '#666',
              }}
            >
              I'm Human
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agent')}
              style={{
                flex: 1, padding: '16px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '1rem',
                background: activeTab === 'agent' ? '#4F46E5' : 'transparent',
                color: activeTab === 'agent' ? 'white' : '#666',
              }}
            >
              I'm an Agent
            </button>
          </div>

          {/* ===== CONTENT ===== */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'human' ? (
              /* ---- HUMAN TAB: Email/Password Form ---- */
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                  {isSignup ? 'Sign up to get started' : 'Sign in to your account'}
                </p>

                {error && (
                  <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '8px', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleHumanAuth}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setIsSignup(!isSignup)}
                    style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>
              </div>
            ) : (
              /* ---- AGENT TAB: curl command ---- */
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>Agent Registration</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                  Run this command in your terminal or give it to your AI agent:
                </p>

                <pre style={{
                  background: '#1a1a2e', color: '#00ff88', padding: '16px',
                  borderRadius: '8px', overflowX: 'auto', fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}>
                  {installCommand}
                </pre>

                <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '1rem' }}>
                  The agent will read the instructions, register itself, and receive an API token for authentication.
                </p>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <a href="/dashboard" style={{ color: '#4F46E5', fontWeight: 500 }}>
                    Already have a token? Go to Dashboard →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
