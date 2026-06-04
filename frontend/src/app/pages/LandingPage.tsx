import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import {
  Users, Clock, DollarSign, Target, GraduationCap, Shield,
  Building2, UserPlus, Zap, Menu, X, Sun, Moon,
  Github, Twitter, Linkedin, CheckCircle2
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { HRSpaceLogo } from "../components/brand/HRSpaceLogo";

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <Navbar isScrolled={isScrolled} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} theme={theme} toggleTheme={toggleTheme} />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CTABanner />
      <Footer />
    </div>
  );
}

const Navbar = ({ isScrolled, isMobileMenuOpen, setIsMobileMenuOpen, theme, toggleTheme }: any) => (
  <motion.nav
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 dark:bg-[#262254]/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}
  >
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <HRSpaceLogo className="w-9 h-9 rounded-xl shadow-sm" />
          <span className="text-xl font-bold">
            <span className="text-[#EC4176]">HR</span>
            <span className="text-[#262254] dark:text-white">Space</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">Modules & Features</a>
          <a href="#how-it-works" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">Pricing</a>
          <a href="#contact" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 hover:bg-accent rounded-lg transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login">
            <button className="px-4 py-2 text-sm border-2 border-[#9A77CF] text-[#543884] dark:text-[#9A77CF] rounded-lg hover:bg-[#9A77CF]/5 transition-all">
              Sign In
            </button>
          </Link>
          <Link to="/register">
            <button
              className="px-6 py-2 text-sm text-white rounded-xl shadow-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }}
            >
              Get Started
            </button>
          </Link>
        </div>

        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 hover:bg-accent rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden mt-4 py-4 border-t border-border">
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm hover:text-[#9A77CF]">Modules & Features</a>
            <a href="#how-it-works" className="text-sm hover:text-[#9A77CF]">How It Works</a>
            <a href="#pricing" className="text-sm hover:text-[#9A77CF]">Pricing</a>
            <a href="#contact" className="text-sm hover:text-[#9A77CF]">Contact</a>
            <div className="flex gap-3 pt-4 border-t border-border">
              <Link to="/login" className="flex-1">
                <button className="w-full px-4 py-2 text-sm border border-border rounded-lg">Sign In</button>
              </Link>
              <Link to="/register" className="flex-1">
                <button className="w-full px-4 py-2 text-sm bg-[#EC4176] text-white rounded-lg">Get Started</button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  </motion.nav>
);

const HeroSection = () => (
  <section className="min-h-[760px] lg:min-h-screen flex items-center pt-24 pb-16 px-6 relative overflow-visible">
    <div className="max-w-7xl mx-auto w-full relative z-10 overflow-visible">
      <div className="grid lg:grid-cols-[58%_42%] gap-12 items-center overflow-visible">
        <div className="space-y-6">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="inline-block px-4 py-1.5 rounded-full text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #543884 0%, #EC4176 100%)' }}
          >
            ✦ Trusted by 500+ Companies
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-5xl lg:text-6xl font-bold leading-tight text-[#262254] dark:text-white"
          >
            Streamline Your{" "}
            <span className="bg-gradient-to-r from-[#9A77CF] to-[#EC4176] bg-clip-text text-transparent">
              Workforce.
            </span>
            <br />
            Amplify Your Impact.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="text-lg text-[#7c6b9e] dark:text-[#b5a3d1] max-w-xl"
          >
            HRSpace centralizes employee management, payroll, attendance, performance reviews, and analytics — empowering your team to focus on what matters most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="flex items-center gap-4 pt-4 flex-wrap"
          >
            <div className="flex -space-x-2">
              {[
                { initial: 'SA', color: '#9A77CF' },
                { initial: 'JD', color: '#EC4176' },
                { initial: 'MK', color: '#543884' },
                { initial: 'RL', color: '#A13670' }
              ].map((avatar, i) => (
                <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm border-2 border-background" style={{ backgroundColor: avatar.color }}>
                  {avatar.initial}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">500+ teams trust HRSpace</p>
            <div className="flex items-center gap-1">
              <span className="text-[#FFA45E]">★★★★★</span>
              <span className="text-sm text-foreground ml-1">4.9/5</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="relative hidden lg:block min-h-[520px] overflow-visible"
        >
          <div className="absolute w-48 h-48 rounded-full blur-3xl top-0 right-4 pointer-events-none" style={{ background: 'rgba(154, 119, 207, 0.2)' }}></div>
          <div className="absolute w-32 h-32 rounded-full blur-2xl bottom-4 right-20 pointer-events-none" style={{ background: 'rgba(236, 65, 118, 0.15)' }}></div>
          <div className="absolute w-20 h-20 rounded-full blur-xl top-16 right-0 pointer-events-none" style={{ background: 'rgba(255, 164, 94, 0.1)' }}></div>

          <div className="absolute right-[2%] top-1/2 h-[370px] w-[512px] max-w-[calc(100vw-4rem)] -translate-y-1/2 overflow-visible">
          {/* Main Workforce Overview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card border border-border rounded-2xl shadow-2xl p-6 w-[300px]"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--info)] animate-pulse"></div>
              <span className="text-sm font-bold text-foreground">Platform Progress</span>
              <span className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--action)]/10 text-[var(--action)]">Live</span>
            </div>

            {[
              { label: 'Core Features', percent: 85, trackClass: 'bg-[var(--info)]/15', fillClass: 'bg-[var(--info)]' },
              { label: 'Mobile Responsiveness', percent: 72, trackClass: 'bg-[var(--action)]/15', fillClass: 'bg-[var(--action)]' },
              { label: 'Integrations', percent: 60, trackClass: 'bg-[var(--warning)]/20', fillClass: 'bg-[var(--warning)]' },
              { label: 'Security & Compliance', percent: 90, trackClass: 'bg-[var(--primary)]/15', fillClass: 'bg-[var(--primary)]' }
            ].map((milestone, i) => (
              <div key={i} className="mb-4 last:mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">{milestone.label}</p>
                  <p className="text-xs font-bold text-foreground">{milestone.percent}%</p>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${milestone.trackClass}`}>
                  <div className={`h-full transition-all rounded-full ${milestone.fillClass}`} style={{ width: `${milestone.percent}%` }}></div>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-border">
              {[
                { label: 'Plan', active: true },
                { label: 'Build', active: true },
                { label: 'Test', active: true },
                { label: 'Launch', active: false }
              ].map((step, i) => (
                <div key={step.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={step.active ? { background: 'linear-gradient(135deg, var(--primary), var(--action))' } : { background: 'var(--accent)' }}
                  >
                    <span className={step.active ? 'text-primary-foreground' : 'text-muted-foreground'}>{i + 1}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{step.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Leave Requests Notification - Slides in from right */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 20, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } }}
            transition={{
              delay: 0.8,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className="absolute left-[316px] top-[104px] z-20 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 w-[176px] min-h-[66px] transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                delay: 1.5,
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9A77CF]/20 to-[#543884]/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Users className="w-5 h-5 text-[#9A77CF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#262254] dark:text-white">12,400+</p>
                <p className="text-xs text-muted-foreground dark:text-white/60">Subscribers</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFA45E] animate-pulse flex-shrink-0"></div>
            </motion.div>
          </motion.div>

          {/* Payroll Notification - Slides in from right after Leave Requests */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 20, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } }}
            transition={{
              delay: 1.2,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className="absolute left-[316px] top-[182px] z-20 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 w-[176px] min-h-[66px] transition-transform duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                delay: 2.2,
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EC4176] to-[#A13670] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold bg-gradient-to-r from-[#9A77CF] to-[#EC4176] bg-clip-text text-transparent">500+</p>
                <p className="text-xs text-muted-foreground dark:text-white/60">Active Companies</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFA45E] flex-shrink-0"></div>
            </motion.div>
          </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const StatsBar = () => {
  const stats = [
    { value: 500, suffix: '+', label: 'Companies', color: '#FFA45E' },
    { value: 50000, suffix: '+', label: 'Employees', color: 'white' },
    { value: 99.9, suffix: '%', label: 'Uptime SLA', color: '#FFA45E' },
    { value: 4.9, suffix: '★', label: 'User Rating', color: 'white' }
  ];

  return (
    <section className="py-14 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #543884 0%, #9A77CF 100%)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/15">
          {stats.map((stat, i) => (
            <CountUpStat key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CountUpStat = ({ value, suffix, label, color }: any) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 1500;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center py-4 md:py-0">
      <p className="text-4xl font-bold mb-2" style={{ color }}>
        {value > 1000 ? Math.floor(count).toLocaleString() : count.toFixed(1)}{suffix}
      </p>
      <p className="text-sm text-white/70">{label}</p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon: Users, title: 'Employee Management', desc: 'Centralize records, org charts, and documents effortlessly.', color: '#543884' },
    { icon: Clock, title: 'Attendance Tracking', desc: 'Real-time clock-in/out, shift management, and monitoring.', color: '#9A77CF' },
    { icon: DollarSign, title: 'Payroll Processing', desc: 'Automated payroll runs, tax compliance, instant payslips.', color: '#EC4176' },
    { icon: Target, title: 'Performance Reviews', desc: '360° feedback, goal tracking, and appraisal workflows.', color: '#A13670' },
    { icon: GraduationCap, title: 'Training & Development', desc: 'Course enrollment, progress tracking, certification.', color: '#FFA45E' },
    { icon: Shield, title: 'Roles & Permissions', desc: 'Granular access control with audit logs and flows.', color: '#262254' }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-[#F4F0FA] dark:bg-[#1a0f2e]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.15em] text-[#9A77CF] mb-2">CAPABILITIES</p>
          <h2 className="text-4xl font-bold text-[#262254] dark:text-white mb-4">Everything your HR team needs</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Powerful features designed to streamline operations and empower your workforce</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-[#251942] border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shadow-sm" style={{ background: `${feature.color}1A` }}>
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold text-[#262254] dark:text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/features" className="inline-flex items-center gap-2 text-[#9A77CF] hover:text-[#EC4176] transition-colors font-semibold">
            See all features →
          </Link>
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    { num: '01', title: 'Set Up Your Organization', icon: Building2, desc: 'Add company details, departments, and structure in minutes.', color: '#543884' },
    { num: '02', title: 'Onboard Your Team', icon: UserPlus, desc: 'Import employees or invite via email with role assignments.', gradient: true },
    { num: '03', title: 'Go Live Instantly', icon: Zap, desc: 'Everything syncs. Payroll, attendance, analytics — live.', color: '#EC4176', iconColor: '#FFA45E' }
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-white dark:bg-[#251942]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.15em] text-[#9A77CF] mb-2">SIMPLICITY</p>
          <h2 className="text-4xl font-bold text-[#262254] dark:text-white">Three steps to go live</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 border-t-2 border-dashed border-[#9A77CF]/30 z-0"></div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center z-10 flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-full mb-6 flex items-center justify-center text-white font-bold text-xl relative shadow-lg"
                style={step.gradient
                  ? { background: 'linear-gradient(135deg, #A13670, #EC4176)' }
                  : { background: step.color }
                }
              >
                {step.num}
              </div>
              <div className="p-4 rounded-xl inline-flex items-center justify-center mb-5 shadow-sm" style={{ background: `${step.iconColor || step.color}1A` }}>
                <step.icon className="w-8 h-8" style={{ color: step.iconColor || step.color }} />
              </div>
              <h3 className="text-xl font-semibold text-[#262254] dark:text-white mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const plans = [
    {
      name: 'Starter',
      price: '4,900',
      period: 'month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 50 employees',
        'Core HR features',
        'Attendance tracking',
        'Leave management',
        'Basic payroll',
        'Email support',
        'Mobile app access'
      ],
      color: '#9A77CF',
      popular: false
    },
    {
      name: 'Professional',
      price: '9,900',
      period: 'month',
      description: 'For growing teams that need more',
      features: [
        'Up to 200 employees',
        'All Starter features',
        'Performance reviews',
        'Training & development',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom workflows'
      ],
      color: '#EC4176',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited employees',
        'All Professional features',
        'AI-powered CV filtering',
        'Anonymous forum',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'On-premise deployment'
      ],
      color: '#543884',
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 px-6 bg-white dark:bg-[#251942]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.15em] text-[#9A77CF] mb-2">PRICING</p>
          <h2 className="text-4xl font-bold text-[#262254] dark:text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Choose the plan that fits your team. All plans include a 14-day free trial.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white dark:bg-[#1a0f2e] border rounded-2xl p-8 hover:shadow-xl transition-all ${
                plan.popular ? 'border-[#EC4176] shadow-lg scale-105' : 'border-border hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #A13670, #EC4176)' }}>
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#262254] dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  {plan.price !== 'Custom' && <span className="text-lg text-muted-foreground">BDT</span>}
                  <span className="text-5xl font-bold bg-gradient-to-r from-[#543884] to-[#EC4176] bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/register" className="block">
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'text-white shadow-lg hover:brightness-110 hover:scale-[1.02]'
                      : 'border-2 hover:bg-accent'
                  }`}
                  style={plan.popular ? { background: `linear-gradient(135deg, ${plan.color} 0%, #A13670 50%, #EC4176 100%)` } : { borderColor: plan.color, color: plan.color }}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
};

const CTABanner = () => (
  <motion.section
    id="contact"
    initial={{ opacity: 0, scale: 0.96 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="py-24 px-6 relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #262254 0%, #543884 40%, #A13670 70%, #EC4176 100%)' }}
  >
    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>
    <div className="absolute top-20 right-32 w-2 h-2 rounded-full bg-[#FFA45E]/40"></div>
    <div className="absolute bottom-32 left-20 w-1.5 h-1.5 rounded-full bg-[#9A77CF]/40"></div>
    <div className="absolute top-1/2 right-1/4 w-1 h-1 rounded-full bg-[#FFA45E]/40"></div>

    <div className="max-w-4xl mx-auto text-center relative z-10">
      <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your HR?</h2>
      <p className="text-white/90 text-lg mb-8">Join forward-thinking teams already on HRSpace.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/register">
          <button className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 hover:scale-105 transition-all shadow-lg">
            Start Free Trial
          </button>
        </Link>
      </div>
    </div>
  </motion.section>
);

const Footer = () => (
  <footer className="bg-[#262254] text-white py-16 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HRSpaceLogo className="w-9 h-9 rounded-xl shadow-sm" />
            <span className="text-xl font-bold">
              <span className="text-[#EC4176]">HR</span>
              <span className="text-white">Space</span>
            </span>
          </div>
          <p className="text-white/60 text-sm mb-4">Streamlining HR for modern teams.</p>
          <div className="flex gap-3">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center hover:border-[#9A77CF] transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Product</h4>
          <div className="space-y-2 text-sm text-white/70">
            <a href="#features" className="block hover:text-[#9A77CF] transition-colors">Features</a>
            <a href="#" className="block hover:text-[#9A77CF] transition-colors">Pricing</a>
            <a href="#" className="block hover:text-[#9A77CF] transition-colors">Changelog</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <div className="space-y-2 text-sm text-white/70">
            <a href="#" className="block hover:text-[#9A77CF] transition-colors">About</a>
            <a href="#" className="block hover:text-[#9A77CF] transition-colors">Blog</a>
            <a href="#" className="block hover:text-[#9A77CF] transition-colors">Careers</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Subscribe</h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/10 border-none placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#9A77CF]"
            />
            <button
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-white/70">© 2026 HRSpace. All rights reserved.</p>
        <p className="text-sm text-white/70">Built for modern HR teams</p>
        <div className="flex gap-1.5">
          {['#262254', '#543884', '#9A77CF', '#A13670', '#EC4176', '#FFA45E'].map((color, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: color }}></div>
          ))}
        </div>
      </div>
    </div>
  </footer>
);
