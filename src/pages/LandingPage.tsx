import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, Shield, BarChart2, Sparkles,
  ChevronRight, Play, Star
} from 'lucide-react';

const features = [
  { icon: <Zap size={22} />, title: 'Viral SEO Title', desc: 'AI-powered CTR-optimized titles in Bangla & English' },
  { icon: <TrendingUp size={22} />, title: 'Trending Tags', desc: 'Smart SEO tags with long-tail & viral keywords' },
  { icon: <Sparkles size={22} />, title: 'Thumbnail AI', desc: 'Cinematic thumbnail prompts with Bangla typography' },
  { icon: <BarChart2 size={22} />, title: 'Viral Score', desc: 'CTR prediction & emotion-based scoring engine' },
  { icon: <Shield size={22} />, title: 'Content Strategy', desc: 'Hook, upload time, CTA & video structure guide' },
  { icon: <Star size={22} />, title: 'Creator Memory', desc: 'AI learns your style & gives personalized output' },
];

const stats = [
  { value: '10K+', label: 'Content Creators' },
  { value: '500K+', label: 'AI Generations' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '5x', label: 'CTR Improvement' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '18px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
            Smart Video <span className="text-gradient">AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 14 }}
            onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="btn-brand" style={{ padding: '9px 22px', fontSize: 14 }}
            onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 1,
        paddingTop: 140, paddingBottom: 80,
        textAlign: 'center', padding: '140px 20px 80px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#6c47ff15', border: '1px solid #6c47ff30',
            borderRadius: 99, padding: '6px 16px', marginBottom: 28,
            fontSize: 13, color: '#a78bfa',
          }}>
            <Sparkles size={13} />
            বাংলাদেশের প্রথম AI Creator Growth System
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-2px', marginBottom: 24,
          }}>
            From Idea to Viral<br />
            <span className="text-gradient">Powered by AI</span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text-secondary)',
            maxWidth: 600, margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Viral SEO Titles, Thumbnail Strategy, SEO Tags, Bangla Typography & Content Strategy — সব কিছু এক জায়গায়, এক ক্লিকে।
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              className="btn-brand pulse-glow"
              style={{ fontSize: 16, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap size={18} /> Start Now — ৳999/mo
            </motion.button>
            <motion.button
              className="btn-outline"
              style={{ fontSize: 16, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 8 }}
              whileHover={{ scale: 1.03 }}
            >
              <Play size={16} /> Watch Demo
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            display: 'flex', justifyContent: 'center', gap: '40px',
            marginTop: 64, flexWrap: 'wrap',
          }}
        >
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}
                className="text-gradient">{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 20px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1px' }}>
            Everything a Creator Needs
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 16 }}>
            AI-powered tools built specifically for Bangla content creators
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card glass-card-hover"
              style={{ padding: 28 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#6c47ff20', border: '1px solid #6c47ff30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a78bfa', marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '60px 20px 100px',
      }}>
        <motion.div
          className="glass-card"
          style={{ maxWidth: 600, margin: '0 auto', padding: '52px 40px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-1px' }}>
            Ready to Go Viral?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
            Join thousands of Bangla creators using Smart Video AI
          </p>
          <button
            className="btn-brand"
            style={{ fontSize: 16, padding: '14px 36px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate('/register')}
          >
            Get Pro Access <ChevronRight size={18} />
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            Pro plan starts at ৳999/month • Cancel anytime
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 40px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        position: 'relative', zIndex: 1,
      }}>
        © 2026 Smart Video AI — Built for Bangla Creators
      </footer>
    </div>
  );
}
