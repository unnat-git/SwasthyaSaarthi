'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, getDashboardRoute } from '../lib/auth';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    if (auth?.access_token && auth?.role) {
      router.replace(getDashboardRoute(auth.role));
    }
  }, [router]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', position: 'relative', background: '#f8fafc' }}>
      {/* Translucent Aesthetic Background Image strictly for Landing Page */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 0,
          backgroundImage: `linear-gradient(to right, rgba(248, 250, 252, 0.85) 0%, rgba(248, 250, 252, 0.35) 60%, rgba(248, 250, 252, 0.15) 100%), url('/bg_.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.9,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        padding: '0 48px', height: 64, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#00685f',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>health_and_safety</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#00685f' }}>Swastya Saarthi</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 20px', border: '1.5px solid #00685f',
            borderRadius: 8, color: '#00685f', fontWeight: 600,
            fontSize: 14, textDecoration: 'none', background: '#fff',
            transition: 'background 0.15s'
          }}>Sign In</Link>
          <Link href="/auth/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 40, padding: '0 20px', background: '#00685f',
            borderRadius: 8, color: '#fff', fontWeight: 600,
            fontSize: 14, textDecoration: 'none', border: 'none'
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Split Hero Section: Green Banner on Left + Uncovered Woman's Portrait on Right */}
      <section style={{
        position: 'relative',
        minHeight: 520,
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        background: '#f8fafc'
      }}>
        {/* Right Side: Crystal Clear Portrait of Rural Woman */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: '52%',
          backgroundImage: "url('/bg_.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 15%',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }} />

        {/* Left Side: Deep Green Hero Card with smooth gradient fade into right image */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '65%',
          background: 'linear-gradient(115deg, #005f57 0%, #004943 65%, rgba(0, 73, 67, 0.95) 85%, rgba(0, 73, 67, 0) 100%)',
          padding: '80px 48px 80px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 100,
            padding: '6px 16px', marginBottom: 24, fontSize: 13, fontWeight: 600, width: 'fit-content'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
            AI-Powered · Offline-First · Built for Rural India
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 800, margin: '0 0 18px', lineHeight: 1.15, maxWidth: 560 }}>
            Early Disease Risk Prediction<br />for Rural Healthcare
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', maxWidth: 520, margin: '0 0 36px', lineHeight: 1.6 }}>
            Swastya Saarthi empowers ASHA workers, PHC staff, and District Health Officers to identify
            health risks early — even in areas with no internet connectivity.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/auth/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 50, padding: '0 30px', background: '#fff',
              color: '#00685f', borderRadius: 10, fontWeight: 700,
              fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
              Create Account
            </Link>
            <Link href="/auth/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 50, padding: '0 30px', background: 'transparent',
              border: '2px solid rgba(255,255,255,0.6)', color: '#fff',
              borderRadius: 10, fontWeight: 600, fontSize: 15, textDecoration: 'none'
            }}>Sign In</Link>
          </div>
        </div>
      </section>

      {/* 4 Prediction Areas */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
            What We Detect
          </h2>
          <p style={{ color: '#64748b', fontSize: 17 }}>
            AI models trained on clinical data to flag risk early — before symptoms worsen.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
          {[
            { icon: 'water_drop', title: 'Diabetes', color: '#4648d4', bg: '#eef2ff',
              desc: 'Detect elevated blood glucose and diabetes risk from vitals and lifestyle data.' },
            { icon: 'monitor_heart', title: 'Hypertension', color: '#dc2626', bg: '#fef2f2',
              desc: 'Identify high blood pressure risk before it leads to organ damage.' },
            { icon: 'favorite', title: 'Cardiovascular Disease', color: '#ea580c', bg: '#fff7ed',
              desc: 'Assess heart attack and stroke risk using cholesterol, BP and lifestyle factors.' },
          ].map(item => (
            <div key={item.title} style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: '28px 24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                width: 48, height: 48, background: item.bg, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 24 }}>
                  {item.icon}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{item.title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#fff', padding: '80px 48px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>How It Works</h2>
            <p style={{ color: '#64748b', fontSize: 17 }}>A simple, powerful workflow designed for field healthcare workers</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '01', icon: 'login', title: 'Sign Up & Select Role', desc: 'Register as an ASHA Worker, PHC staff, District Officer, or Admin.' },
              { step: '02', icon: 'person_add', title: 'Register Patient', desc: 'Enter patient details manually or use Voice Input to fill the form hands-free.' },
              { step: '03', icon: 'analytics', title: 'AI Risk Assessment', desc: 'Our ML models predict risk for Diabetes, Hypertension, and Cardiovascular Disease.' },
              { step: '04', icon: 'assignment_ind', title: 'Review & Act', desc: 'See a detailed patient profile with risk scores and recommended next actions.' },
            ].map(item => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, background: '#f0fdf4', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#00685f', fontSize: 26 }}>
                    {item.icon}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00685f', marginBottom: 6, letterSpacing: 1 }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #00685f, #004d46)',
        padding: '72px 48px', textAlign: 'center', color: '#fff'
      }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 16px' }}>
          Ready to improve rural healthcare outcomes?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, margin: '0 0 36px' }}>
          Join healthcare workers across India using AI to predict disease risk early.
        </p>
        <Link href="/auth/signup" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 52, padding: '0 36px', background: '#fff',
          color: '#00685f', borderRadius: 10, fontWeight: 700,
          fontSize: 16, textDecoration: 'none'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rocket_launch</span>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0f172a', color: '#94a3b8',
        padding: '32px 48px', textAlign: 'center', fontSize: 14
      }}>
        <p style={{ margin: 0 }}>
          © 2024 Swastya Saarthi — AI-Powered Rural Health Risk Platform. Built for Track 01: Healthcare.
        </p>
      </footer>
      {/* Animated Waving Woman Cutout Assistant Widget (Bottom-Right) */}
      <div style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        animation: 'gentleFloat 3.5s ease-in-out infinite',
        filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.18))'
      }}>
        {/* Speech Bubble */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid #00685f',
          borderRadius: '16px 16px 4px 16px',
          padding: '12px 18px',
          maxWidth: 240,
          boxShadow: '0 8px 24px rgba(0,104,95,0.15)',
          position: 'relative'
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00685f', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Swasthya Saarthi AI</span>
            <span style={{ fontSize: 16, animation: 'wavingHand 1.8s ease-in-out infinite', transformOrigin: '70% 70%', display: 'inline-block' }}>👋</span>
          </div>
          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.45, fontWeight: 500 }}>
            Namaste! 🙏 Need help predicting rural patient health risk?
          </div>
          <Link href="/auth/login" style={{
            display: 'inline-block',
            marginTop: 8,
            fontSize: 11,
            fontWeight: 700,
            color: '#ffffff',
            background: '#00685f',
            padding: '5px 12px',
            borderRadius: 6,
            textDecoration: 'none'
          }}>
            Screen Patient Now →
          </Link>
        </div>

        {/* Woman Image Cutout Badge */}
        <Link href="/auth/login" style={{ textDecoration: 'none', position: 'relative' }}>
          <div style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3.5px solid #00685f',
            boxShadow: '0 0 0 4px rgba(0,104,95,0.2), 0 10px 24px rgba(0,0,0,0.2)',
            background: '#fff',
            position: 'relative',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: "url('/bg_.jpg')",
              backgroundSize: '180%',
              backgroundPosition: '54% 18%',
              backgroundRepeat: 'no-repeat'
            }} />
          </div>
          {/* Animated Waving Hand Pill */}
          <div style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#00685f',
            color: '#fff',
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            border: '2px solid #fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            animation: 'wavingHand 1.6s ease-in-out infinite',
            transformOrigin: '70% 70%'
          }}>
            👋
          </div>
        </Link>
      </div>
      </div>
    </div>
  );
}
