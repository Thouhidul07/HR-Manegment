import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import {
  Users, Clock, DollarSign, Target, GraduationCap, Shield,
  Building2, UserPlus, Zap, Menu, X, Sun, Moon,
  Github, Twitter, Linkedin, CheckCircle2, Bell, TrendingUp, Calendar
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <Navbar isScrolled={isScrolled} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} theme={resolvedTheme} toggleTheme={toggleTheme} />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
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
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-[#EC4176]">HR</span>
          <span className="text-xl font-bold text-[#262254] dark:text-white">Space</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">Features</a>
          <a href="#modules" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">Modules</a>
          <a href="#how-it-works" className="text-sm text-foreground hover:text-[#9A77CF] transition-colors">How It Works</a>
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
            <a href="#features" className="text-sm hover:text-[#9A77CF]">Features</a>
            <a href="#modules" className="text-sm hover:text-[#9A77CF]">Modules</a>
            <a href="#how-it-works" className="text-sm hover:text-[#9A77CF]">How It Works</a>
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
  <section className="min-h-screen flex items-center pt-24 pb-16 px-6 relative overflow-hidden">
    <div className="max-w-7xl mx-auto w-full relative z-10">
      <div className="grid lg:grid-cols-[58%_42%] gap-12 items-center">
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
            HR Space centralizes employee management, payroll, attendance, performance reviews, and analytics — empowering your team to focus on what matters most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/register">
              <button
                className="px-6 py-3 text-white rounded-xl shadow-lg hover:brightness-110 hover:scale-[1.02] transition-all"
                style={{ background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }}
              >
                Get Started Free
              </button>
            </Link>
            <button className="px-6 py-3 border-2 border-[#543884] text-[#543884] dark:text-[#9A77CF] rounded-xl hover:bg-[#543884]/5 transition-all">
              Watch Demo
            </button>
          </motion.div>

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
            <p className="text-sm text-muted-foreground">500+ teams trust HR Space</p>
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
          className="relative hidden lg:flex justify-center items-center"
        >
          <div className="absolute w-48 h-48 rounded-full blur-3xl top-0 right-4 pointer-events-none" style={{ background: 'rgba(154, 119, 207, 0.2)' }}></div>
          <div className="absolute w-32 h-32 rounded-full blur-2xl bottom-4 right-20 pointer-events-none" style={{ background: 'rgba(236, 65, 118, 0.15)' }}></div>
          <div className="absolute w-20 h-20 rounded-full blur-xl top-16 right-0 pointer-events-none" style={{ background: 'rgba(255, 164, 94, 0.1)' }}></div>

          <div className="relative z-10 bg-white dark:bg-[#251942] rounded-2xl shadow-2xl p-5 w-[320px]" style={{ border: '1px solid rgba(84, 56, 132, 0.1)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#9A77CF]"></div>
              <span className="text-sm font-bold text-[#262254] dark:text-white">Workforce Overview</span>
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full" style={{ background: 'rgba(236, 65, 118, 0.1)', color: '#EC4176' }}>Live</span>
            </div>

            {[
              { icon: Users, label: 'Present Today', value: '1,156 / 1,234', percent: 93, color: '#543884' },
              { icon: Calendar, label: 'On Leave', value: '48 employees', percent: 4, color: '#EC4176' },
              { icon: TrendingUp, label: 'In Training', value: '87 enrolled', percent: 7, color: '#9A77CF' }
            ].map((stat, i) => (
              <div key={i} className="mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}1A` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xs font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${stat.color}26` }}>
                  <div className="h-full transition-all" style={{ width: `${stat.percent}%`, background: stat.color }}></div>
                </div>
              </div>
            ))}

            <div className="flex items-end gap-1 h-12 mt-4">
              {[
                { height: 40, color: '#543884' },
                { height: 65, color: '#9A77CF' },
                { height: 50, color: '#A13670' },
                { height: 80, color: '#EC4176' },
                { height: 60, color: '#9A77CF' }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t transition-all" style={{ height: `${bar.height}%`, background: bar.color }}></div>
                  <span className="text-[9px] text-muted-foreground">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: 0 }}
            className="absolute top-0 right-0 bg-white dark:bg-[#251942] shadow-xl rounded-xl p-3 translate-x-6 -translate-y-4"
            style={{ border: '1px solid rgba(236, 65, 118, 0.1)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#EC4176] flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#262254] dark:text-white">Payroll Processed</p>
                <p className="text-sm font-semibold text-[#262254] dark:text-white">$94,210</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFA45E] ml-1"></div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: 1.5 }}
            className="absolute bottom-0 left-0 bg-white dark:bg-[#251942] shadow-xl rounded-xl p-3 -translate-x-5 translate-y-5"
            style={{ border: '1px solid rgba(154, 119, 207, 0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#9A77CF]" />
              <div>
                <p className="text-xs font-semibold text-[#262254] dark:text-white">3 Leave Requests</p>
                <p className="text-xs text-muted-foreground">Pending approval</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFA45E] animate-pulse"></div>
            </div>
          </motion.div>
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
              className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: `${feature.color}1A` }}>
                <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="text-lg font-semibold text-[#262254] dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{feature.desc}</p>
              <a href="#" className="text-sm text-[#9A77CF] hover:text-[#EC4176] transition-colors">Learn more →</a>
            </motion.div>
          ))}
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
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative text-center z-10"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-bold text-xl relative"
                style={step.gradient
                  ? { background: 'linear-gradient(135deg, #A13670, #EC4176)' }
                  : { background: step.color }
                }
              >
                {step.num}
              </div>
              <div className="p-3 rounded-lg inline-block mb-4" style={{ background: `${step.iconColor || step.color}1A` }}>
                <step.icon className="w-8 h-8" style={{ color: step.iconColor || step.color }} />
              </div>
              <h3 className="text-xl font-semibold text-[#262254] dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
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
      <p className="text-white/90 text-lg mb-8">Join forward-thinking teams already on HR Space.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/register">
          <button className="px-6 py-3 bg-white text-[#543884] rounded-xl font-semibold hover:scale-105 transition-transform shadow-md">
            Start Free Trial
          </button>
        </Link>
        <button className="px-6 py-3 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/25 transition-all" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
          Schedule a Demo
        </button>
      </div>
    </div>
  </motion.section>
);

const Footer = () => (
  <footer className="bg-[#262254] text-white py-16 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center mb-3">
            <span className="text-xl font-bold text-[#EC4176]">HR</span>
            <span className="text-xl font-bold text-white">Space</span>
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
        <p className="text-sm text-white/70">© 2026 HR Space. All rights reserved.</p>
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
