import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Pro Creator',
      price: '৳999',
      period: '/ month',
      description: 'প্রফেশনাল কন্টেন্ট ক্রিয়েটরদের জন্য',
      features: [
        'Unlimited AI Generations',
        'Advanced Viral Score Analysis',
        'Cinematic Thumbnail Prompts',
        'Typography & Color Guides',
        'Priority Support'
      ],
      cta: 'Get Started',
      popular: true,
      color: '#6c47ff',
      bg: 'linear-gradient(135deg, #6c47ff15 0%, #ff47a305 100%)'
    },
    {
      name: 'Agency',
      price: '৳2999',
      period: '/ month',
      description: 'মাল্টিপল চ্যানেল ম্যানেজমেন্টের জন্য',
      features: [
        'Everything in Pro',
        'Team Collaboration (Coming Soon)',
        'White-label Reports',
        'API Access (Coming Soon)',
        '24/7 Dedicated Support'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: '#22d3a0',
      bg: '#ffffff05'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', background: 'var(--bg-primary)' }}>
      
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 16, letterSpacing: '-1px' }}>
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              আপনার কন্টেন্ট ক্রিয়েশন জার্নি শুরু করুন। কোনো লুকানো চার্জ নেই। 
              যেকোনো সময় বাতিল করতে পারবেন।
            </p>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{
                padding: 40,
                background: plan.bg,
                border: plan.popular ? '1px solid #6c47ff' : '1px solid var(--border)',
                transform: plan.popular ? 'scale(1.03)' : 'scale(1)',
                position: 'relative'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--gradient-brand)', color: '#fff', fontSize: 12, fontWeight: 700,
                  padding: '4px 16px', borderRadius: 99, letterSpacing: '0.5px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Crown size={12} /> MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, minHeight: 40 }}>{plan.description}</p>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
                <span style={{ fontSize: 40, fontWeight: 900 }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Check size={10} color={plan.color} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                className={plan.popular ? "btn-brand pulse-glow" : "btn-outline"}
                style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  if (plan.popular) {
                    navigate('/register');
                  } else {
                    alert('Agency plan — Contact us at support@smartvideoai.com');
                  }
                }}
              >
                {plan.cta} <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
