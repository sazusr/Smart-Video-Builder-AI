import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, CheckCircle, Info } from 'lucide-react';

declare global {
  interface Window {
    __pwaInstallPrompt: any;
  }
}

const STORAGE_KEY = 'svai_install_done';

// ── Browser detection ───────────────────────────────────────────────────────
function getBrowserInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edg|OPR/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const supportsNativeInstall = isChrome || isEdge || isSamsung;
  return { isMobile, isChrome, isEdge, isSamsung, isSafari, isFirefox, supportsNativeInstall };
}

export default function InstallPromptModal() {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    // ── Capacitor native app → skip ──────────────────────────────────────
    const isNative =
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:';
    if (isNative) return;

    // ── Already installed flag ─────────────────────────────────────────
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;

    // ── Already running as PWA (standalone) ───────────────────────────
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      localStorage.setItem(STORAGE_KEY, 'true');
      return;
    }

    // ── Read prompt captured early in index.html ────────────────────────
    if (window.__pwaInstallPrompt) {
      promptRef.current = window.__pwaInstallPrompt;
    }

    // ── Listen for prompt that might arrive later ───────────────────────
    const onPromptReady = () => {
      promptRef.current = window.__pwaInstallPrompt;
    };
    const onInstalled = () => {
      setInstalled(true);
      setTimeout(() => setShow(false), 2000);
    };
    window.addEventListener('pwa-prompt-ready', onPromptReady);
    window.addEventListener('pwa-installed', onInstalled);

    // ── Also listen directly (belt-and-suspenders) ──────────────────────
    const onBIP = (e: Event) => {
      e.preventDefault();
      promptRef.current = e;
      window.__pwaInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // ── Show popup after 2s ─────────────────────────────────────────────
    const timer = setTimeout(() => setShow(true), 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('pwa-installed', onInstalled);
      window.removeEventListener('beforeinstallprompt', onBIP);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  const handleInstall = async () => {
    const prompt = promptRef.current || window.__pwaInstallPrompt;

    if (prompt) {
      // ── Native PWA install (Chrome / Edge / Samsung) ─────────────────
      setInstalling(true);
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        window.__pwaInstallPrompt = null;
        promptRef.current = null;

        if (outcome === 'accepted') {
          localStorage.setItem(STORAGE_KEY, 'true');
          setInstalled(true);
          setTimeout(() => setShow(false), 2500);
        } else {
          // Dismissed — don't show again
          localStorage.setItem(STORAGE_KEY, 'true');
          setShow(false);
        }
      } catch {
        localStorage.setItem(STORAGE_KEY, 'true');
        setShow(false);
      } finally {
        setInstalling(false);
      }
    } else {
      // ── No native prompt → show manual guide ──────────────────────────
      setShowManualGuide(true);
    }
  };

  const { isMobile, isChrome, isEdge, isSafari, supportsNativeInstall } = getBrowserInfo();

  // ── Manual install guide text ─────────────────────────────────────────────
  const manualGuideSteps = (() => {
    if (isChrome && !isMobile) {
      return [
        'উপরে address bar-এর ডান দিকে একটি ⊕ বা কম্পিউটার আইকন দেখবেন',
        'সেই আইকনে ক্লিক করুন',
        '"Install Smart Video AI" বাটনে ক্লিক করুন',
        'ডেস্কটপে shortcut যোগ হয়ে যাবে ✓',
      ];
    }
    if (isEdge && !isMobile) {
      return [
        'উপরে address bar-এর ডান দিকে "⊕ অ্যাপ" বা settings (⋯) মেনু খুলুন',
        '"Apps" → "Install this site as an app" সিলেক্ট করুন',
        'Install বাটনে ক্লিক করুন',
        'ডেস্কটপে shortcut যোগ হবে ✓',
      ];
    }
    if (isSafari && isMobile) {
      return [
        'নিচে Share বাটনে (□↑) ট্যাপ করুন',
        '"Add to Home Screen" সিলেক্ট করুন',
        '"Add" ট্যাপ করুন',
        'হোম স্ক্রিনে অ্যাপ আইকন যোগ হবে ✓',
      ];
    }
    if (isMobile) {
      return [
        'Browser-এর মেনু (⋮ বা ⋯) খুলুন',
        '"Add to Home Screen" বা "Install App" ট্যাপ করুন',
        'Confirm করুন',
        'হোম স্ক্রিনে অ্যাপ আইকন যোগ হবে ✓',
      ];
    }
    return [
      'Browser address bar-এ ডান দিকের মেনু খুলুন',
      '"Install" বা "Add to Desktop" অপশন খুঁজুন',
      'ক্লিক করে install confirm করুন',
    ];
  })();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="install-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 0 20px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
        >
          <motion.div
            key="install-card"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 240 }}
            style={{
              background: 'linear-gradient(170deg, #111827 0%, #0a0a1a 100%)',
              width: '100%',
              maxWidth: 440,
              borderRadius: 28,
              padding: '24px 22px 22px',
              border: '1px solid rgba(108,71,255,0.22)',
              boxShadow: '0 -16px 48px rgba(108,71,255,0.18), 0 0 0 1px rgba(255,255,255,0.04)',
              margin: '0 12px',
              position: 'relative',
            }}
          >
            {/* Drag handle */}
            <div style={{
              width: 36, height: 4,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 99, margin: '0 auto 18px',
            }} />

            {/* Close */}
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(255,255,255,0.06)',
                border: 'none', width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>

            <AnimatePresence mode="wait">
              {installed ? (
                /* ── Success ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '16px 0 12px' }}
                >
                  <CheckCircle size={52} color="#22d3a0" style={{ margin: '0 auto 14px', display: 'block' }} />
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                    ইনস্টল সম্পন্ন! 🎉
                  </h3>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>
                    Smart Video AI আপনার ডিভাইসে যুক্ত হয়েছে।
                  </p>
                </motion.div>

              ) : showManualGuide ? (
                /* ── Manual Guide ── */
                <motion.div
                  key="guide"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Info size={16} color="#a78bfa" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      ম্যানুয়ালি ইনস্টল করুন
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                    {manualGuideSteps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(108,71,255,0.2)',
                          border: '1px solid rgba(108,71,255,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#a78bfa',
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleDismiss}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #6c47ff 0%, #3b82f6 100%)',
                      color: '#fff', border: 'none', borderRadius: 14,
                      padding: '13px', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    বুঝেছি, ধন্যবাদ ✓
                  </button>
                </motion.div>

              ) : (
                /* ── Normal Install UI ── */
                <motion.div key="install" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>

                  {/* Logo + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <img
                      src="/logo.png"
                      alt="Smart Video AI"
                      style={{
                        width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                        boxShadow: '0 6px 20px rgba(108,71,255,0.4)',
                        border: '2px solid rgba(108,71,255,0.35)',
                      }}
                    />
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 3 }}>
                        Smart Video AI
                      </h2>
                      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                        ডিভাইসে ইনস্টল করুন — দ্রুত অ্যাক্সেস,<br />
                        নো ব্রাউজার, অফলাইন রেডি
                      </p>
                    </div>
                  </div>

                  {/* Platform hint */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(108,71,255,0.08)',
                    border: '1px solid rgba(108,71,255,0.18)',
                    borderRadius: 10, padding: '9px 12px', marginBottom: 16,
                  }}>
                    {isMobile ? <Smartphone size={15} color="#a78bfa" /> : <Monitor size={15} color="#a78bfa" />}
                    <span style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 500 }}>
                      {supportsNativeInstall
                        ? (isMobile ? 'হোম স্ক্রিনে অ্যাপ আইকন যোগ হবে' : 'ডেস্কটপে শর্টকাট ও অ্যাপ হিসেবে ইনস্টল হবে')
                        : 'ব্রাউজার মেনু থেকে ইনস্টল করুন'
                      }
                    </span>
                  </div>

                  {/* Install button */}
                  <motion.button
                    onClick={handleInstall}
                    disabled={installing}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%',
                      background: installing
                        ? 'rgba(108,71,255,0.25)'
                        : 'linear-gradient(135deg, #6c47ff 0%, #3b82f6 100%)',
                      color: '#fff', border: 'none', borderRadius: 14,
                      padding: '14px', fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: installing ? 'not-allowed' : 'pointer',
                      marginBottom: 10,
                      boxShadow: installing ? 'none' : '0 4px 20px rgba(108,71,255,0.4)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {installing ? (
                      <>
                        <div style={{
                          width: 17, height: 17,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff', borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite', flexShrink: 0,
                        }} />
                        ইনস্টল হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Download size={17} />
                        {supportsNativeInstall ? 'এখনই ইনস্টল করুন' : 'কীভাবে ইনস্টল করবেন দেখুন'}
                      </>
                    )}
                  </motion.button>

                  {/* Dismiss */}
                  <button
                    onClick={handleDismiss}
                    style={{
                      display: 'block', width: '100%',
                      background: 'none', border: 'none',
                      color: '#64748b', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', padding: '7px',
                    }}
                  >
                    পরে করব
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
