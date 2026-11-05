import { useState } from "react";
import {
  Leaf,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  TrendingDown,
  Target,
  Lightbulb,
  Trophy,
  Building2,
  ShieldCheck,
  Zap,
  Globe2,
  Users,
  Sun,
  Moon,
  ChevronRight,
  Compass,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("individual");

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="brand-logo-badge">
              <Leaf size={22} className="brand-icon" />
            </div>
            <span className="brand-title">CarbonTrack</span>
          </div>

          <nav className="landing-links">
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#why-it-matters">Why It Matters</a>
            <a href="#stats">Impact</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button type="button" className="btn-secondary-nav" onClick={onSignIn}>
              Sign In
            </button>

            <button type="button" className="btn-primary-nav" onClick={onGetStarted}>
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} className="badge-sparkle" />
            <span>AI-Driven Sustainability Platform</span>
          </div>

          <h1 className="hero-title">
            Track Your Carbon. <br />
            <span className="hero-gradient-text">Transform Your Future.</span>
          </h1>

          <p className="hero-subtitle">
            Understand your environmental impact, reduce your carbon footprint, and
            build a sustainable future through smarter everyday choices.
          </p>

          <div className="hero-actions">
            <button type="button" className="hero-btn-primary" onClick={onGetStarted}>
              Get Started Free
              <ArrowRight size={18} />
            </button>

            <a href="#features" className="hero-btn-secondary">
              Explore Features
              <ChevronRight size={18} />
            </a>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Real-time EPA & IPCC factors</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Anonymous peer benchmarks</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>100% Free for individuals</span>
            </div>
          </div>
        </div>

        {/* Interactive Dashboard Hero Showcase */}
        <div className="hero-preview-wrapper">
          <div className="hero-preview-card">
            <div className="preview-card-header">
              <div className="preview-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="preview-header-title">
                <Leaf size={14} /> CarbonTrack Live Dashboard
              </div>
              <span className="preview-badge-live">Live Preview</span>
            </div>

            <div className="preview-metrics-row">
              <div className="preview-metric">
                <span className="metric-label">Monthly Footprint</span>
                <strong className="metric-val">142.4 <small>kg CO₂e</small></strong>
                <span className="metric-trend trend-down">
                  <TrendingDown size={14} /> -18.2% vs last month
                </span>
              </div>
              <div className="preview-metric">
                <span className="metric-label">Sustainability Score</span>
                <strong className="metric-val text-emerald">88 / 100</strong>
                <span className="metric-tag">Top 12% in Community</span>
              </div>
              <div className="preview-metric">
                <span className="metric-label">Goal Progress</span>
                <strong className="metric-val text-lime">71% Met</strong>
                <span className="metric-tag">57.6 kg remaining</span>
              </div>
            </div>

            {/* Mini preview chart graphic */}
            <div className="preview-chart-box">
              <div className="chart-header-row">
                <span>Weekly Emissions Breakdown</span>
                <span className="chart-legend">
                  <span className="legend-dot green"></span> Transport
                  <span className="legend-dot blue"></span> Energy
                  <span className="legend-dot amber"></span> Food
                </span>
              </div>
              <div className="mock-chart-bars">
                {[
                  { day: "Mon", h1: 45, h2: 30, h3: 25 },
                  { day: "Tue", h1: 30, h2: 40, h3: 20 },
                  { day: "Wed", h1: 20, h2: 35, h3: 15 },
                  { day: "Thu", h1: 50, h2: 25, h3: 30 },
                  { day: "Fri", h1: 35, h2: 30, h3: 25 },
                  { day: "Sat", h1: 15, h2: 20, h3: 10 },
                  { day: "Sun", h1: 10, h2: 15, h3: 10 },
                ].map((item, idx) => (
                  <div key={idx} className="mock-bar-col">
                    <div className="mock-stacked-bar">
                      <div className="bar-seg amber" style={{ height: `${item.h3}%` }}></div>
                      <div className="bar-seg blue" style={{ height: `${item.h2}%` }}></div>
                      <div className="bar-seg green" style={{ height: `${item.h1}%` }}></div>
                    </div>
                    <span className="bar-day">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-alert-row">
              <Lightbulb size={18} className="alert-bulb" />
              <p>
                <strong>AI Insight:</strong> Switching 2 commutes to rail this week saves an estimated <strong>14.5 kg CO₂e</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Statistics Ticker */}
      <section className="stats-ticker-section" id="stats">
        <div className="stats-grid-inner">
          <div className="ticker-card">
            <span className="ticker-number">48,500+</span>
            <span className="ticker-label">Kilograms of CO₂e Prevented</span>
          </div>
          <div className="ticker-card">
            <span className="ticker-number">12,400+</span>
            <span className="ticker-label">Daily Activities Logged</span>
          </div>
          <div className="ticker-card">
            <span className="ticker-number">92%</span>
            <span className="ticker-label">Habit Retention Rate</span>
          </div>
          <div className="ticker-card">
            <span className="ticker-number">1,500+</span>
            <span className="ticker-label">Active Community Eco-Pioneers</span>
          </div>
        </div>
      </section>

      {/* About CarbonTrack Section */}
      <section className="about-section" id="about">
        <div className="section-header">
          <span className="section-pill">About CarbonTrack</span>
          <h2>Empowering Everyday Environmental Accountability</h2>
          <p className="section-desc">
            CarbonTrack was founded on a simple truth: you cannot manage what you do not measure.
            We turn abstract carbon data into clear, actionable lifestyle insights.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon-box bg-green">
              <Compass size={24} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To democratize sustainability analytics by equipping individuals and organizations
              with scientific tools to eliminate carbon waste and protect the biosphere.
            </p>
          </div>

          <div className="about-card">
            <div className="about-icon-box bg-emerald">
              <Globe2 size={24} />
            </div>
            <h3>Open Scientific Foundation</h3>
            <p>
              Our calculations are calibrated against validated EPA, IPCC, and DEFRA emission
              standards so every gram of CO₂ tracked reflects authentic climate impact.
            </p>
          </div>

          <div className="about-card">
            <div className="about-icon-box bg-lime">
              <Users size={24} />
            </div>
            <h3>Community-Driven Change</h3>
            <p>
              Individual efforts add up. Through collective benchmarking, social leaderboards,
              and team goals, we foster friendly competition that accelerates planetary impact.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <span className="section-pill">Simple 3-Step Flow</span>
          <h2>How CarbonTrack Works</h2>
          <p className="section-desc">
            Start tracking in under 60 seconds. No complicated setups, no guesswork.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon-wrap">
              <Zap size={28} />
            </div>
            <h3>Log Daily Activities</h3>
            <p>
              Enter commutes, electricity consumption, meals, and lifestyle choices.
              Our dynamic engine computes exact CO₂ emissions in real time.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon-wrap">
              <BarChart3 size={28} />
            </div>
            <h3>Analyze Footprint Trends</h3>
            <p>
              Explore daily, weekly, and monthly trends across categories. Identify
              hidden emission drivers and benchmark against peers anonymously.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon-wrap">
              <Target size={28} />
            </div>
            <h3>Target, Reduce & Earn</h3>
            <p>
              Set realistic reduction targets, follow tailored AI suggestions,
              and earn achievements as you make tangible progress for the planet.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-pill">Platform Capabilities</span>
          <h2>Engineered for Seamless Sustainability</h2>
          <p className="section-desc">
            Everything you need to monitor, understand, and reduce your carbon footprint in one place.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-emerald">
              <Zap size={22} />
            </div>
            <h4>Real-Time Emission Preview</h4>
            <p>
              Watch emissions calculate dynamically as you type. Instant feedback helps you understand
              the carbon intensity of your decisions before submitting.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-green">
              <BarChart3 size={22} />
            </div>
            <h4>Interactive Recharts Dashboards</h4>
            <p>
              Interactive bar, pie, and trend line charts provide multi-dimensional clarity
              into your daily, weekly, and monthly footprint.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-lime">
              <Target size={22} />
            </div>
            <h4>Custom Reduction Goals</h4>
            <p>
              Set weekly or monthly carbon allowances. Monitor remaining budgets with automated
              visual progress indicators and streak tracking.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-emerald">
              <Lightbulb size={22} />
            </div>
            <h4>Smart Recommendations</h4>
            <p>
              Receive personalized insights highlighting your top 3 emission drivers with actionable
              alternatives and estimated kilograms of CO₂e saved.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-green">
              <Trophy size={22} />
            </div>
            <h4>Peer Benchmarks & Leaderboards</h4>
            <p>
              Compare your emissions against community averages anonymously. Celebrate green milestones
              and climb the sustainability rankings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-lime">
              <Building2 size={22} />
            </div>
            <h4>Organization Workspaces</h4>
            <p>
              Support for team and company accounts. View collective emission totals, department
              breakdowns, and drive collaborative climate action.
            </p>
          </div>
        </div>
      </section>

      {/* Why Carbon Tracking Matters Section */}
      <section className="why-section" id="why-it-matters">
        <div className="why-container">
          <div className="why-text-col">
            <span className="section-pill">The Climate Imperative</span>
            <h2>Small Conscious Steps Multiply Into Planetary Shifts</h2>
            <p>
              The average individual footprint is over 4,000 kg of CO₂ annually.
              Scientific studies demonstrate that simply visualizing personal energy,
              dietary, and transit habits leads to an immediate <strong>15% to 25% reduction</strong> within
              the first 90 days.
            </p>
            <ul className="why-points">
              <li>
                <CheckCircle2 size={20} className="check-point" />
                <span>Eliminate invisible energy and transit waste from your daily routines.</span>
              </li>
              <li>
                <CheckCircle2 size={20} className="check-point" />
                <span>Save money on household utility bills, fuel, and consumption costs.</span>
              </li>
              <li>
                <CheckCircle2 size={20} className="check-point" />
                <span>Build lasting environmental habits that inspire friends, family, and peers.</span>
              </li>
            </ul>
            <button type="button" className="btn-why-cta" onClick={onGetStarted}>
              Start Your Journey Today
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="why-card-col">
            <div className="impact-showcase-box">
              <h3>The 1-Year Impact of 1 CarbonTracker</h3>
              <div className="impact-stat-item">
                <span className="stat-label">Average Annual Reduction</span>
                <strong>-820 kg CO₂e</strong>
              </div>
              <div className="impact-stat-item">
                <span className="stat-label">Equivalent Trees Planted</span>
                <strong>38 Mature Trees 🌲</strong>
              </div>
              <div className="impact-stat-item">
                <span className="stat-label">Estimated Energy & Fuel Savings</span>
                <strong>$420 Saved / Year ⚡</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="cta-section">
        <div className="cta-box">
          <div className="cta-content">
            <h2>Ready to Take Control of Your Carbon Footprint?</h2>
            <p>
              Join thousands of individuals and forward-thinking organizations using CarbonTrack
              to build a cleaner, greener tomorrow.
            </p>
            <div className="cta-buttons">
              <button type="button" className="cta-btn-primary" onClick={onGetStarted}>
                Create Free Account
                <ArrowRight size={18} />
              </button>
              <button type="button" className="cta-btn-outline" onClick={onSignIn}>
                Sign In to Existing Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <div className="landing-brand">
              <div className="brand-logo-badge">
                <Leaf size={20} />
              </div>
              <span className="brand-title">CarbonTrack</span>
            </div>
            <p className="footer-tagline">
              Track less. Sustain more. Empowering planetary stewardship through data.
            </p>
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} CarbonTrack Inc. All rights reserved.
            </p>
          </div>

          <div className="footer-col">
            <h5>Navigation</h5>
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#stats">Impact Stats</a>
          </div>

          <div className="footer-col">
            <h5>Product</h5>
            <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }}>Sign In</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>Create Account</a>
            <a href="#why-it-matters">Climate Data</a>
            <a href="#">Privacy Policy</a>
          </div>

          <div className="footer-col">
            <h5>Sustainability Pledge</h5>
            <p className="footer-pledge">
              CarbonTrack servers run on 100% renewable electricity. Our software is designed
              with energy-efficient caching and minimal compute footprint.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
