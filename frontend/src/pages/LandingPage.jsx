import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
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
  TreePine,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import CarbonTrackLogo from "../components/CarbonTrackLogo";
import LiveDashboardPreview from "../components/LiveDashboardPreview";
import ScrollExpand from "../components/ScrollExpand";
import CountUp from "../components/CountUp";

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div
            className="landing-brand"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <CarbonTrackLogo size={32} showText={true} />
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
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
            <span>AI-Powered Sustainability SaaS</span>
          </div>

          <h1 className="hero-title">
            Track Your Carbon. <br />
            <span className="hero-gradient-text">Transform Your Future.</span>
          </h1>

          <p className="hero-subtitle">
            Understand your environmental impact, eliminate emissions waste, and
            build a sustainable lifestyle through precision real-time analytics.
          </p>

          <div className="hero-actions">
            <button type="button" className="hero-btn-primary" onClick={onGetStarted}>
              Get Started Free
              <ArrowRight size={18} />
            </button>

            <a href="#features" className="hero-btn-secondary">
              Explore Platform
              <ChevronRight size={18} />
            </a>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Real-time EPA & IPCC emission factors</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Anonymous community benchmarks</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>100% Free for personal use</span>
            </div>
          </div>
        </div>

        {/* Scroll Expand Animated Live Dashboard Showcase (ReactBits inspired) */}
        <section className="hero-live-dashboard-section" id="live-demo">
          <ScrollExpand
            initialWidthPercent={88}
            targetWidthPercent={100}
            initialRadius={24}
            targetRadius={12}
            initialScale={0.97}
            targetScale={1.0}
          >
            <LiveDashboardPreview onTryDashboard={onGetStarted} />
          </ScrollExpand>
        </section>
      </section>

      {/* Sustainability Statistics Ticker with CountUp animations */}
      <section className="stats-ticker-section" id="stats">
        <div className="stats-grid-inner">
          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={48500} separator="," suffix="+" />
            </span>
            <span className="ticker-label">Kilograms of CO₂e Prevented</span>
          </div>
          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={12400} separator="," suffix="+" />
            </span>
            <span className="ticker-label">Daily Activities Logged</span>
          </div>
          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={92} suffix="%" />
            </span>
            <span className="ticker-label">Habit Retention Rate</span>
          </div>
          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={1500} separator="," suffix="+" />
            </span>
            <span className="ticker-label">Active Eco-Pioneers</span>
          </div>
        </div>
      </section>

      {/* About CarbonTrack Section */}
      <section className="about-section" id="about">
        <div className="section-header">
          <span className="section-pill">About CarbonTrack</span>
          <h2>Empowering Everyday Environmental Accountability</h2>
          <p className="section-desc">
            You cannot manage what you do not measure. CarbonTrack transforms complex environmental
            data into intuitive, actionable lifestyle and team insights.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card panel">
            <div className="about-icon-box bg-green">
              <Compass size={24} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To democratize sustainability analytics by equipping individuals and organizations
              with scientific tools to eliminate carbon waste and protect the biosphere.
            </p>
          </div>

          <div className="about-card panel">
            <div className="about-icon-box bg-emerald">
              <Globe2 size={24} />
            </div>
            <h3>Validated Scientific Standards</h3>
            <p>
              Calculations are calibrated against peer-reviewed EPA, IPCC, and DEFRA emission
              standards so every gram of carbon tracked reflects authentic planetary impact.
            </p>
          </div>

          <div className="about-card panel">
            <div className="about-icon-box bg-lime">
              <Users size={24} />
            </div>
            <h3>Community-Driven Action</h3>
            <p>
              Individual efforts compound into collective shifts. Friendly benchmarking, social
              leaderboards, and team goals inspire sustained climate action.
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
          <div className="step-card panel">
            <div className="step-number">01</div>
            <div className="step-icon-wrap">
              <Zap size={28} />
            </div>
            <h3>Log Daily Activities</h3>
            <p>
              Enter commutes, electricity usage, meals, and lifestyle choices.
              Our dynamic engine computes exact CO₂ emissions in real time.
            </p>
          </div>

          <div className="step-card panel">
            <div className="step-number">02</div>
            <div className="step-icon-wrap">
              <BarChart3 size={28} />
            </div>
            <h3>Analyze Footprint Trends</h3>
            <p>
              Explore daily, weekly, and monthly trends across categories. Identify
              hidden emission drivers and benchmark against community averages.
            </p>
          </div>

          <div className="step-card panel">
            <div className="step-number">03</div>
            <div className="step-icon-wrap">
              <Target size={28} />
            </div>
            <h3>Target, Reduce & Earn</h3>
            <p>
              Set realistic reduction targets, follow tailored AI suggestions,
              and earn badges as you make tangible progress for the planet.
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
          <div className="feature-card panel">
            <div className="feature-icon bg-emerald">
              <Zap size={22} />
            </div>
            <h4>Real-Time Emission Calculation</h4>
            <p>
              Watch emissions calculate dynamically as you type. Instant feedback helps you understand
              the carbon intensity of your decisions before submitting.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-green">
              <BarChart3 size={22} />
            </div>
            <h4>Interactive Analytics & Charts</h4>
            <p>
              Visual bar, pie, and trend charts provide multi-dimensional clarity
              into your daily, weekly, and monthly footprint.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-lime">
              <Target size={22} />
            </div>
            <h4>Custom Reduction Goals</h4>
            <p>
              Set weekly or monthly carbon allowances. Monitor remaining budgets with automated
              visual progress indicators and streak tracking.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-emerald">
              <Lightbulb size={22} />
            </div>
            <h4>Smart Recommendations</h4>
            <p>
              Receive personalized insights highlighting top emission drivers with actionable
              alternatives and estimated kilograms of CO₂e saved.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-green">
              <Trophy size={22} />
            </div>
            <h4>Peer Benchmarks & Badges</h4>
            <p>
              Compare your emissions against community averages anonymously. Celebrate green milestones
              and climb the sustainability rankings.
            </p>
          </div>

          <div className="feature-card panel">
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
            <div className="impact-showcase-box panel">
              <h3>The 1-Year Impact of 1 CarbonTracker</h3>
              <div className="impact-stat-item">
                <span className="stat-label">Average Annual Reduction</span>
                <strong>
                  <CountUp end={820} prefix="-" suffix=" kg CO₂e" />
                </strong>
              </div>
              <div className="impact-stat-item">
                <span className="stat-label">Equivalent Trees Planted</span>
                <strong>
                  <CountUp end={38} suffix=" Mature Trees" /> 🌲
                </strong>
              </div>
              <div className="impact-stat-item">
                <span className="stat-label">Estimated Energy & Fuel Savings</span>
                <strong>
                  <CountUp end={420} prefix="$" suffix=" Saved / Year" /> ⚡
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="cta-section">
        <div className="cta-box panel">
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
              <CarbonTrackLogo size={28} showText={true} />
            </div>
            <p className="footer-tagline">
              Track less. Sustain more. Empowering planetary stewardship through precision data.
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
