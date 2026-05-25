'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Play, RefreshCw, BarChart3, Database, FileText, 
  CheckCircle, XCircle, AlertTriangle, Eye, Heart, Bookmark, 
  Video, Lock, ShieldAlert, LogOut, Sliders, Globe, AlertCircle 
} from 'lucide-react';
import { AnalyticsSummary, GenerationJob, LogEntry, SystemConfig } from '@/lib/types';
import { CATEGORIES, STYLES } from '@/lib/constants';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom manual override category and style
  const [customCat, setCustomCat] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  // Dynamic system configurations
  const [config, setConfig] = useState<SystemConfig>({
    siteName: 'DreamRooms AI',
    generationInterval: 240,
    homeVideosLimit: 9,
    useMockData: false,
    heroVideoId: null,
    gcpProjectId: 'lifeos-agent-260515',
    gcpLocation: 'us-central1',
    vertexModel: 'omni-video-generate-001'
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Engagement reset states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Setup Google Identity Services & local session auth check
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('dreamrooms_admin_auth');
    const savedEmail = sessionStorage.getItem('dreamrooms_admin_email');
    if (savedAuth === 'true' && savedEmail === 'vipul.chaudhari.1984@gmail.com') {
      setIsAuthenticated(true);
      setAuthEmail(savedEmail);
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        if ((window as any).google) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignInCallback
          });
          (window as any).google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'dark', size: 'large', text: 'signin_with', shape: 'pill' }
          );
        }
      };

      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  };

  const handleGoogleSignInCallback = (response: any) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const payload = decodeJwt(response.credential);
      if (payload && payload.email) {
        const email = payload.email.toLowerCase();
        if (email === 'vipul.chaudhari.1984@gmail.com') {
          sessionStorage.setItem('dreamrooms_admin_auth', 'true');
          sessionStorage.setItem('dreamrooms_admin_email', email);
          setIsAuthenticated(true);
          setAuthEmail(email);
        } else {
          setAuthError(`Access Denied: Email "${email}" is not authorized.`);
        }
      } else {
        setAuthError('Authentication failed: Invalid credential payload.');
      }
    } catch (err: any) {
      setAuthError(`Authentication error: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Graceful developer mock login sandbox for vipul.chaudhari.1984@gmail.com
  const handleSandboxLogin = () => {
    setAuthLoading(true);
    setAuthError('');
    setTimeout(() => {
      sessionStorage.setItem('dreamrooms_admin_auth', 'true');
      sessionStorage.setItem('dreamrooms_admin_email', 'vipul.chaudhari.1984@gmail.com');
      setIsAuthenticated(true);
      setAuthEmail('vipul.chaudhari.1984@gmail.com');
      setAuthLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dreamrooms_admin_auth');
    sessionStorage.removeItem('dreamrooms_admin_email');
    setIsAuthenticated(false);
    setAuthEmail('');
  };

  // Fetch admin console details
  const fetchDetails = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setLogs(data.logs);
        setJobs(data.jobs);
      }

      const configRes = await fetch('/api/admin/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDetails();
    }
  }, [isAuthenticated]);

  // Trigger manual generation pipeline (async — polls for completion)
  const handleTriggerGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSuccessMsg('');
    
    try {
      // 1. Start generation — returns immediately with jobId
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: customCat || undefined,
          style: customStyle || undefined
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert('Generation failed to start: ' + data.error);
        return;
      }

      const { jobId } = data;
      setSuccessMsg(`⏳ Generating video (Job: ${jobId.slice(-8)})… This takes 3–8 minutes. Page will update automatically.`);

      // 2. Poll /api/generate/status every 10s until done
      const maxPolls = 60; // 10 min max
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, 10000));
        
        try {
          const statusRes = await fetch(`/api/generate/status?jobId=${jobId}`);
          const statusData = await statusRes.json();
          
          if (statusData.status === 'success') {
            setSuccessMsg(`✅ Video published successfully! Refreshing feed…`);
            await fetchDetails();
            break;
          } else if (statusData.status === 'failed') {
            alert('Video generation failed: ' + (statusData.error || 'Unknown error'));
            break;
          } else {
            // Still pending — update message with elapsed time
            const elapsedMin = Math.floor(((i + 1) * 10) / 60);
            const elapsedSec = ((i + 1) * 10) % 60;
            setSuccessMsg(`⏳ Generating video… ${elapsedMin > 0 ? elapsedMin + 'm ' : ''}${elapsedSec}s elapsed. Please wait.`);
          }
        } catch (pollErr) {
          console.warn('Status poll failed, retrying...', pollErr);
        }
      }
    } catch (err: any) {
      alert('Pipeline execution failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };


  // Save system configuration parameters
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSuccess(false);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 4000);
        await fetchDetails();
      } else {
        alert('Failed to save configuration');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  // Reset Metrics to 0
  const handleResetMetrics = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST'
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setSuccessMsg('All engagement metrics (views, appreciations, saves) have been reset to 0!');
        await fetchDetails();
      } else {
        alert('Failed to reset metrics.');
      }
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Render Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-6">
          <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2 border border-amber-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">
              Control Room Login
            </h1>
            <p className="text-xs text-neutral-400 max-w-[280px] mx-auto leading-relaxed">
              Verify your administrator Google Account to manage generators, timers, and metrics settings.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-2">
            {/* Real Google GSI Button Mount */}
            <div id="google-signin-btn" className="flex justify-center w-full min-h-[44px]" />

            {/* Sandbox Developer Account Chooser (Works instantly out of the box!) */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Developer Sandbox</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                onClick={handleSandboxLogin}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full glass-panel border border-white/10 hover:border-amber-500/30 text-xs font-bold text-neutral-200 hover:text-white transition-luxury shadow-md"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden text-[9px] font-extrabold text-neutral-900">
                      G
                    </div>
                    <span className="truncate">Continue as vipul.chaudhari.1984@gmail.com</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Authenticated)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-neutral-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Loading Control Room Cockpit...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-amber-500" />
            Vertex AI Control Room
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Signed in as: <span className="text-amber-500 font-mono text-xs">{authEmail}</span> • Full admin cockpit enabled.
          </p>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/5 hover:border-rose-500/20 text-neutral-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wider transition-luxury shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Warning/Success Toast Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg('')} 
            className="text-[10px] text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Quick Stats Overview Grid */}
      {analytics && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Views */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Views</p>
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mt-0.5">{analytics.totalViews}</h3>
            </div>
          </div>

          {/* Total Appreciations */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/10">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Appreciations</p>
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mt-0.5">{analytics.totalLikes}</h3>
            </div>
          </div>

          {/* Bookmarked Items */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Bookmarks</p>
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mt-0.5">{analytics.totalSaves}</h3>
            </div>
          </div>

          {/* Generated Loops */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 shadow-md flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Generated Loops</p>
              <h3 className="text-xl md:text-2xl font-bold font-display text-white mt-0.5">{analytics.totalGeneratedVideos}</h3>
            </div>
          </div>
        </section>
      )}

      {/* 2. System Configurations Panel */}
      <section className="glass-panel p-6 md:p-8 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -right-32 -bottom-32 w-64 h-64 rounded-full bg-amber-500/2 blur-3xl pointer-events-none" />
        
        <div>
          <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            Dynamic System Customizations
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Adjust site variables, automatic video generation timers, homepage limits, and Vertex AI parameters.
          </p>
        </div>

        <form onSubmit={handleSaveConfig} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Site Name Option */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Site Name Branding</label>
              <input
                type="text"
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                required
                placeholder="DreamRooms AI"
                className="px-3.5 py-2.5 text-xs rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/40 focus:bg-neutral-950/80 transition-luxury"
              />
            </div>

            {/* Video Generation Interval slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Generation Interval</label>
                <span className="text-xs text-amber-400 font-mono font-bold">{config.generationInterval} minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="15"
                  max="1440"
                  step="15"
                  value={config.generationInterval}
                  onChange={(e) => setConfig({ ...config, generationInterval: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 bg-neutral-800 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Number of Videos displayed on Home Page */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Videos Per Homepage Limit</label>
              <select
                value={config.homeVideosLimit}
                onChange={(e) => setConfig({ ...config, homeVideosLimit: parseInt(e.target.value, 10) })}
                className="px-3.5 py-2.5 text-xs rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/40 focus:bg-neutral-950/80 transition-luxury"
              >
                {[1, 2, 3, 4, 5, 6, 8, 9, 12].map(num => (
                  <option key={num} value={num}>{num} Videos</option>
                ))}
              </select>
            </div>

          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[9px] text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-1">
              <Globe className="w-3 h-3" /> Vertex AI Engine Parameters
            </span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GCP Project ID */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">GCP Project ID</label>
              <input
                type="text"
                value={config.gcpProjectId}
                onChange={(e) => setConfig({ ...config, gcpProjectId: e.target.value })}
                required
                placeholder="lifeos-agent-260515"
                className="px-3.5 py-2.5 text-xs font-mono rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/40 focus:bg-neutral-950/80 transition-luxury"
              />
            </div>

            {/* GCP Location */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">GCP Location/Region</label>
              <input
                type="text"
                value={config.gcpLocation}
                onChange={(e) => setConfig({ ...config, gcpLocation: e.target.value })}
                required
                placeholder="us-central1"
                className="px-3.5 py-2.5 text-xs font-mono rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/40 focus:bg-neutral-950/80 transition-luxury"
              />
            </div>

            {/* Vertex AI Omni Model */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Omni Generator Model</label>
              <input
                type="text"
                value={config.vertexModel}
                onChange={(e) => setConfig({ ...config, vertexModel: e.target.value })}
                required
                placeholder="omni-video-generate-001"
                className="px-3.5 py-2.5 text-xs font-mono rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/40 focus:bg-neutral-950/80 transition-luxury"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
            <span className="text-[10px] text-neutral-500">
              * Active system updates are written directly to <span className="font-mono text-neutral-400">db.json</span> and take effect instantly.
            </span>
            
            <div className="flex items-center gap-3">
              {configSuccess && (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Configuration Saved!
                </span>
              )}
              
              <button
                type="submit"
                disabled={configSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:shadow-lg shadow-amber-500/10 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-luxury shrink-0"
              >
                {configSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Config</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* 3. Manual Trigger Console & Metrics Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Manual Vertex AI Trigger Console */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-6">
          <div>
            <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
              <Play className="w-5 h-5 text-amber-500 fill-amber-500" />
              Manual Veo Pipeline Trigger
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Trigger a manual generation job using Vertex AI {config.vertexModel}. Leave overrides empty for random coherent configurations.
            </p>
          </div>

          <form onSubmit={handleTriggerGeneration} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Category Override */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Category Override</label>
                <select
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  className="px-3.5 py-2.5 text-xs rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/30"
                >
                  <option value="">Random Category (Coherent)</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Style Override */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Style Override</label>
                <select
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  className="px-3.5 py-2.5 text-xs rounded-lg glass-panel border border-white/10 text-neutral-200 focus:outline-none focus:border-amber-500/30"
                >
                  <option value="">Random Style (Coherent)</option>
                  {STYLES.map(sty => (
                    <option key={sty} value={sty}>{sty}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-neutral-500">
                Quota: seq-pipeline avoids resources exhausted error.
              </span>
              <button
                type="submit"
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:shadow-lg shadow-amber-500/10 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition-luxury shrink-0"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Vertex Rendering Loop...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Render & Publish Video</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Analytics Highlights (CTR, Watchtime, Top charts) */}
        {analytics && (
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-md flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Retention Metrics
            </h3>

            <div className="flex flex-col gap-4">
              {/* CTR */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-400">Click-Through Rate (CTR)</span>
                  <span className="text-white font-bold">{analytics.ctrToDetail}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${analytics.ctrToDetail}%` }} />
                </div>
              </div>

              {/* Watch Time ratio */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-400">Avg Loop Watchtime</span>
                  <span className="text-white font-bold">{analytics.averageWatchTime}s / 10s</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(analytics.averageWatchTime / 10) * 100}%` }} />
                </div>
              </div>

              {/* Retention Ratio */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-neutral-400">Visitor Retention Rate</span>
                  <span className="text-white font-bold">{analytics.retentionRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.retentionRate}%` }} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Top Room Category</span>
                <span className="text-amber-500 font-bold capitalize">{analytics.topCategory.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Top Design Style</span>
                <span className="text-neutral-300 font-bold capitalize">{analytics.topStyle.name}</span>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* 4. Generation Jobs & Live System Logs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        
        {/* Background Jobs Queue list */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-4">
          <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            Background Scheduler Queue
          </h3>

          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-1.5 max-w-[70%]">
                    <span className="font-semibold text-neutral-200 capitalize">
                      Generate Room: {job.style} {job.category}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono truncate block" title={job.prompt}>
                      {job.prompt}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      Scheduled: {new Date(job.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {job.status === 'SUCCESS' ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      SUCCESS
                    </span>
                  ) : job.status === 'PENDING' ? (
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      PENDING
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-bold text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      FAILED
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-neutral-500 text-xs">
                No pipeline jobs run in this session. Trigger one manually above.
              </div>
            )}
          </div>
        </div>

        {/* Live system logs list */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col gap-4">
          <h3 className="font-display font-bold text-lg text-neutral-200 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Live Cloud Run Logging Console
          </h3>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 font-mono text-[10px] bg-black/50 p-4 rounded-xl border border-white/5">
            {logs.length > 0 ? (
              logs.map((log) => {
                let lvlColor = 'text-blue-400';

                if (log.level === 'warn') {
                  lvlColor = 'text-amber-400';
                } else if (log.level === 'error') {
                  lvlColor = 'text-rose-400';
                }

                return (
                  <div key={log.id} className="flex items-start gap-2 border-b border-white/5 pb-1.5 mb-1.5 last:border-b-0 last:pb-0 last:mb-0">
                    <span className="text-neutral-500 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`font-bold shrink-0 uppercase ${lvlColor}`}>
                      {log.level}
                    </span>
                    <span className="text-neutral-300">
                      {log.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-neutral-500">
                Logging buffer empty.
              </div>
            )}
          </div>
        </div>

      </section>

      {/* 5. Danger Zone - Reset Database Panel */}
      <section className="glass-panel p-6 md:p-8 rounded-2xl border border-rose-500/20 bg-rose-950/5 shadow-lg flex flex-col gap-6 relative overflow-hidden">
        <div>
          <h3 className="font-display font-bold text-lg text-rose-400 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Danger Zone
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Perform destructive operations on the mock interior database file. Verify all inputs before clicking.
          </p>
        </div>

        {!showResetConfirm ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div className="flex flex-col gap-1 max-w-xl">
              <span className="text-xs font-bold text-neutral-200">Reset All Database Metrics to 0</span>
              <span className="text-[11px] text-neutral-400 leading-relaxed">
                This will set views, appreciations (likes), and bookmark saves of all generated interior video templates in the database back to exactly 0. It also clears all registered user log views and bookmark references inside `db.json`.
              </span>
            </div>
            
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-6 py-2.5 rounded-full border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50 text-rose-400 text-xs font-bold uppercase tracking-wider transition-luxury shrink-0"
            >
              Reset All Metrics
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5 rounded-xl bg-rose-950/20 border border-rose-500/30 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Are you absolutely sure?</span>
                <span className="text-[11px] text-neutral-300 leading-relaxed font-semibold">
                  This destructive operation is permanent and cannot be undone. All active user bookmark collections will be cleared and the homepage feed metrics will start fresh from zero.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-rose-500/10 pt-4 mt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-full glass-panel border border-white/5 hover:border-white/10 text-xs font-bold text-neutral-400 hover:text-white transition-luxury"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetMetrics}
                className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-luxury"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting Database...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Confirm Destructive Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
