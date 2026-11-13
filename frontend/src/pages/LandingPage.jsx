import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Target,
  Lightbulb,
  Trophy,
  Building2,
  Zap,
  Globe2,
  Users,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  Compass,
  Sparkles,
  Bot,
  MessageSquare,
  PlusCircle,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import CarbonTrackLogo from "../components/CarbonTrackLogo";
import LiveDashboardPreview from "../components/LiveDashboardPreview";
import ScrollExpand from "../components/ScrollExpand";
import CountUp from "../components/CountUp";

const TESTIMONIALS = [
  {
    name: "Elena Rostova",
    role: "Sustainability Director, GreenSphere Tech",
    quote: "CarbonTrack's department-level visibility enabled our engineering organization to trim our commute and server footprint by 34% in just two quarters.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    reduction: "-34% emissions",
  },
  {
    name: "Marcus Vance",
    role: "Urban Commuter & EV Advocate",
    quote: "The instant calculation and weekly streaks turned climate consciousness into an engaging daily habit. The AI recommendations alone saved me over $500 in energy bills.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    reduction: "-820 kg CO₂e saved",
  },
  {
    name: "Priya Sundaram",
    role: "Operations Lead, Apex Logistics",
    quote: "From individual habit tracking to full enterprise CSV export and Scope 1-3 reporting, CarbonTrack is the cleanest sustainability SaaS we've ever deployed.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    reduction: "Scope 1-3 audit ready",
  },
];

const FAQS = [
  {
    question: "How does CarbonTrack calculate my carbon footprint?",
    answer: "CarbonTrack uses emission factor databases aligned with EPA, IPCC, and GHG Protocol standards. When you log transport, electricity, dietary choices, or waste, the application multiplies your activity units by scientifically verified emission factors in real-time.",
  },
  {
    question: "Is CarbonTrack free for individual sustainability tracking?",
    answer: "Yes, 100%! CarbonTrack is fully free for individuals to log activities, track streaks, analyze multi-dimensional charts, and access AI-powered reduction recommendations.",
  },
  {
    question: "How does CarbonTrack AI personalize my recommendations?",
    answer: "Our intelligent engine analyzes your highest emission categories each week. If personal vehicle transit or home electricity spikes, CarbonTrack AI suggests targeted high-impact adjustments—such as public transit alternatives, heat-pump optimization, or plant-based meal swaps—with estimated kg CO₂e savings.",
  },
  {
    question: "Can organizations and teams collaborate on CarbonTrack?",
    answer: "Yes. With Organization Workspaces, teams can invite members, track collective footprints across departments, benchmark against peers, and export comprehensive audit-ready sustainability reports.",
  },
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  const { isDark, toggleTheme } = useTheme();
  const [activePreviewTab, setActivePreviewTab] = useState("activity");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="landing-container">
      {/* 1. Navigation Header */}
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
            <a href="#interactive-previews">Previews</a>
            <a href="#why-it-matters">Why It Matters</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#faq">FAQ</a>
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

      {/* 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} className="badge-sparkle" />
            <span>AI-Powered Sustainability Platform</span>
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

        {/* Live Dashboard Preview with ScrollExpand */}
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

      {/* 3. Sustainability Statistics Ticker */}
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
              <CountUp end={12800} separator="," suffix="+" />
            </span>
            <span className="ticker-label">Activities Logged & Verified</span>
          </div>

          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={94} suffix="%" />
            </span>
            <span className="ticker-label">Users Hitting Monthly Goals</span>
          </div>

          <div className="ticker-card panel">
            <span className="ticker-number">
              <CountUp end={180} suffix="+" />
            </span>
            <span className="ticker-label">Active Green Teams & Orgs</span>
          </div>
        </div>
      </section>

      {/* 4. About CarbonTrack Mission & Vision */}
      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-text-col">
            <span className="section-pill">Our Mission</span>
            <h2>Democratizing Climate Action Through Transparent Data</h2>
            <p>
              Climate change often feels overwhelmingly abstract. Most people want to live
              more sustainably, but without tangible numbers, it's difficult to know which
              daily choices make a meaningful difference.
            </p>
            <p>
              CarbonTrack bridges that divide. By translating everyday activities—your commute,
              home electricity usage, meals, and purchases—into precise, standardized CO₂e measurements,
              we empower individuals and organizations to take informed, measurable climate action.
            </p>
            <div className="about-stats-mini">
              <div className="mini-stat">
                <Globe2 size={24} className="mini-stat-icon" />
                <div>
                  <strong>IPCC Verified</strong>
                  <span>Standardized calculation models</span>
                </div>
              </div>
              <div className="mini-stat">
                <Users size={24} className="mini-stat-icon" />
                <div>
                  <strong>Community Driven</strong>
                  <span>Friendly leaderboards & shared impact</span>
                </div>
              </div>
            </div>
          </div>

          <div className="about-visual-col">
            <div className="mission-card panel">
              <div className="mission-icon bg-emerald">
                <Compass size={28} />
              </div>
              <h3>Actionable Clarity Over Guilt</h3>
              <p>
                We believe guilt does not scale, but insight does. Our interactive platform
                gives you real-time visibility, smart AI coaching, and positive feedback loops
                to help you make consistent, sustainable choices every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (3-Step Process) */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <span className="section-pill">Simple Workflow</span>
          <h2>How CarbonTrack Works in Three Steps</h2>
          <p className="section-desc">
            Effortless environmental monitoring designed for your daily routine.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card panel">
            <div className="step-badge">1</div>
            <div className="step-icon bg-emerald">
              <PlusCircle size={26} />
            </div>
            <h4>Log Your Activities</h4>
            <p>
              Record your daily commute, energy consumption, meals, or purchases in seconds.
              Emissions calculate instantly as you type.
            </p>
          </div>

          <div className="how-step-card panel">
            <div className="step-badge">2</div>
            <div className="step-icon bg-green">
              <BarChart3 size={26} />
            </div>
            <h4>Analyze Your Footprint</h4>
            <p>
              Explore interactive trend charts, category breakdowns, and weekly comparisons
              to understand your primary emission drivers.
            </p>
          </div>

          <div className="how-step-card panel">
            <div className="step-badge">3</div>
            <div className="step-icon bg-lime">
              <Sparkles size={26} />
            </div>
            <h4>Optimize & Earn Badges</h4>
            <p>
              Follow AI-generated reduction tips, hit monthly target allowances, and earn
              community milestone badges as your footprint shrinks.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Core Platform Features */}
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
              <Zap size={24} />
            </div>
            <h4>Real-Time Emission Calculation</h4>
            <p>
              Watch emissions calculate dynamically as you type. Instant feedback helps you understand
              the carbon intensity of your decisions before submitting.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-green">
              <BarChart3 size={24} />
            </div>
            <h4>Interactive Analytics & Charts</h4>
            <p>
              Visual bar, area, and donut charts provide multi-dimensional clarity
              into your daily, weekly, and monthly footprint.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-lime">
              <Target size={24} />
            </div>
            <h4>Custom Reduction Goals</h4>
            <p>
              Set weekly or monthly carbon allowances. Monitor remaining budgets with automated
              visual progress indicators and streak tracking.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-emerald">
              <Lightbulb size={24} />
            </div>
            <h4>Smart Recommendations</h4>
            <p>
              Receive personalized insights highlighting top emission drivers with actionable
              alternatives and estimated kilograms of CO₂e saved.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-green">
              <Trophy size={24} />
            </div>
            <h4>Peer Benchmarks & Badges</h4>
            <p>
              Compare your emissions against community averages anonymously. Celebrate green milestones
              and climb the sustainability rankings.
            </p>
          </div>

          <div className="feature-card panel">
            <div className="feature-icon bg-lime">
              <Building2 size={24} />
            </div>
            <h4>Organization Workspaces</h4>
            <p>
              Support for team and company accounts. View collective emission totals, department
              breakdowns, and drive collaborative climate action.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Interactive Feature Previews (Tabbed Showcase) */}
      <section className="interactive-preview-section" id="interactive-previews">
        <div className="section-header">
          <span className="section-pill">Interactive Showcase</span>
          <h2>Explore Core CarbonTrack Workflows</h2>
          <p className="section-desc">
            Click through our modular feature previews to see how CarbonTrack streamlines daily sustainability.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="preview-tab-controls">
          {[
            { id: "activity", label: "Activity Logging", icon: PlusCircle },
            { id: "analytics", label: "Analytics & Trends", icon: BarChart3 },
            { id: "coach", label: "AI Sustainability Coach", icon: Bot },
            { id: "org", label: "Organization Hub", icon: Building2 },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activePreviewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`preview-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActivePreviewTab(tab.id)}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display Card */}
        <div className="preview-tab-card panel">
          {activePreviewTab === "activity" && (
            <div className="preview-tab-grid">
              <div className="preview-tab-info">
                <span className="badge-pill-green">
                  <Zap size={14} /> Instant Calculation
                </span>
                <h3>Precision Daily Emission Logging</h3>
                <p>
                  Select from Transport, Energy, Food, Waste, or Shopping. Our dynamic calculator
                  computes verified EPA/IPCC CO₂e kilograms immediately as you adjust kilometers,
                  kWh, or meal choices.
                </p>
                <button type="button" className="btn-primary-gradient" onClick={onGetStarted}>
                  Try Logging an Activity <ArrowRight size={14} />
                </button>
              </div>
              <div className="preview-tab-demo">
                <div className="demo-label">Sample Input: Public Subway Commute (15 km)</div>
                <div className="demo-value">0.38 kg CO₂e</div>
                <div className="demo-sub">
                  Saves ~1.82 kg CO₂e compared to a solo gasoline car trip.
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === "analytics" && (
            <div className="preview-tab-grid">
              <div className="preview-tab-info">
                <span className="badge-pill-green">
                  <BarChart3 size={14} /> Multi-Dimensional Insights
                </span>
                <h3>Visual Trends & Category Distributions</h3>
                <p>
                  Compare daily trends with interactive Area and Bar charts. Donut charts break
                  down footprint by category so you always know whether energy or transport is your
                  top opportunity for savings.
                </p>
                <button type="button" className="btn-primary-gradient" onClick={onGetStarted}>
                  Explore Analytics Dashboard <ArrowRight size={14} />
                </button>
              </div>
              <div className="preview-tab-demo">
                <div className="demo-metric-row">
                  <strong>Weekly Comparison</strong>
                  <span className="text-emerald font-bold">-18% vs Last Week</span>
                </div>
                <div className="demo-progress-track">
                  <div className="demo-progress-fill" style={{ width: "82%" }} />
                </div>
                <div className="demo-sub" style={{ marginTop: "12px" }}>
                  Consistency score: <strong>88/100</strong> across 14 logged entries.
                </div>
              </div>
            </div>
          )}

          {activePreviewTab === "coach" && (
            <div className="preview-tab-grid">
              <div className="preview-tab-info">
                <span className="badge-pill-green">
                  <Sparkles size={14} /> Gemini 2.5 Flash Engine
                </span>
                <h3>AI Sustainability Coach & Advice</h3>
                <p>
                  Ask questions, simulate future reduction strategies, and receive automatic
                  weekly high-impact action recommendations tailored to your logged habits.
                </p>
                <button type="button" className="btn-primary-gradient" onClick={onGetStarted}>
                  Chat with CarbonTrack AI <ArrowRight size={14} />
                </button>
              </div>
              <div className="preview-tab-demo">
                <div className="demo-header-row">
                  <Bot size={18} className="text-emerald" />
                  <strong>AI Personalized Recommendation</strong>
                </div>
                <p className="demo-quote">
                  "Replacing 2 solo drive days with bike or public transit will cut ~8.4 kg CO₂e
                  this week and keep you well within your monthly budget."
                </p>
              </div>
            </div>
          )}

          {activePreviewTab === "org" && (
            <div className="preview-tab-grid">
              <div className="preview-tab-info">
                <span className="badge-pill-green">
                  <Building2 size={14} /> Enterprise ESG
                </span>
                <h3>Organization Hub & Department Tracking</h3>
                <p>
                  Aggregate employee emissions across departments, benchmark team contributions,
                  and export verified CSV audit summaries for corporate sustainability compliance.
                </p>
                <button type="button" className="btn-primary-gradient" onClick={onGetStarted}>
                  View Organization Workspace <ArrowRight size={14} />
                </button>
              </div>
              <div className="preview-tab-demo">
                <div className="demo-row">
                  <span>Engineering Department</span>
                  <strong>142.5 kg CO₂e</strong>
                </div>
                <div className="demo-row">
                  <span>Product & Design</span>
                  <strong>98.2 kg CO₂e</strong>
                </div>
                <div className="demo-row">
                  <span>Marketing & Sales</span>
                  <strong>112.4 kg CO₂e</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. Why Carbon Tracking Matters Section */}
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

      {/* 9. Community Testimonials / Social Proof */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <span className="section-pill">Community Stories</span>
          <h2>Trusted by Climate Champions Worldwide</h2>
          <p className="section-desc">
            See how individuals and teams are cutting carbon emissions and saving on energy.
          </p>
        </div>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="testimonial-card panel">
              <div>
                <div className="testimonial-header">
                  <span className="badge-pill-green">{t.reduction}</span>
                  <MessageSquare size={16} className="testimonial-icon" />
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
              </div>

              <div className="testimonial-author">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div className="testimonial-meta">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FAQ / Transparency Accordion */}
      <section className="faq-section" id="faq">
        <div className="section-header">
          <span className="section-pill">Got Questions?</span>
          <h2>Frequently Asked Questions</h2>
          <p className="section-desc">
            Everything you need to know about CarbonTrack calculations, privacy, and team accounts.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="faq-card panel">
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`faq-chevron ${isOpen ? "rotate" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. Final Call to Action Banner */}
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
              Track less. Sustain more. Precision carbon accounting for a cleaner planet.
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
            <a href="#interactive-previews">Previews</a>
            <a href="#stats">Impact Stats</a>
          </div>

          <div className="footer-col">
            <h5>Product</h5>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSignIn();
              }}
            >
              Sign In
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onGetStarted();
              }}
            >
              Create Account
            </a>
            <a href="#why-it-matters">Climate Data</a>
            <a href="#faq">FAQ</a>
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
