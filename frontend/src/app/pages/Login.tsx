import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Sun, Moon, Globe } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #262254 0%, #543884 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute w-48 h-48 rounded-full blur-3xl bottom-16 left-0" style={{ background: 'rgba(154, 119, 207, 0.2)' }}></div>
        <div className="absolute w-24 h-24 rounded-full blur-2xl top-24 right-0" style={{ background: 'rgba(236, 65, 118, 0.15)' }}></div>

        {/* Decorative dots */}
        <div className="absolute top-32 right-20 w-1.5 h-1.5 rounded-full bg-[#FFA45E] opacity-40"></div>
        <div className="absolute top-48 right-32 w-1.5 h-1.5 rounded-full bg-[#9A77CF] opacity-40"></div>
        <div className="absolute bottom-40 left-24 w-1.5 h-1.5 rounded-full bg-[#EC4176] opacity-40"></div>
        <div className="absolute bottom-56 left-40 w-1 h-1 rounded-full bg-[#FFA45E] opacity-40"></div>

        <div className="relative z-10 flex flex-col justify-center px-10 max-w-xs mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">
              <span className="text-[#EC4176]">HR</span>
              <span className="text-white"> Space</span>
            </h1>
            <p className="text-white/80 text-lg">Streamline your workforce. Amplify your impact.</p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#9A77CF] text-sm">✦</span>
              <span className="text-sm text-white/90">Workforce Management</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#FFA45E] text-sm">✦</span>
              <span className="text-sm text-white/90">Smart Analytics</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#EC4176] text-sm">✦</span>
              <span className="text-sm text-white/90">Secure & Compliant</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-8 bg-white dark:bg-[#1a0f2e] relative">
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg hover:bg-[#9A77CF]/10 transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.div
          className="w-full max-w-sm"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {/* Mobile Logo */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="lg:hidden mb-8 text-center"
          >
            <h1 className="text-2xl font-bold">
              <span className="text-[#EC4176]">HR</span>
              <span className="text-[#262254] dark:text-white"> Space</span>
            </h1>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
            <h2 className="text-2xl font-bold text-[#262254] dark:text-white mb-1">Welcome back</h2>
            <p className="text-sm text-[#7c6b9e] dark:text-[#b5a3d1] mb-8">Sign in to HR Space</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: 'rgba(236, 65, 118, 0.1)', border: '1px solid rgba(236, 65, 118, 0.3)' }}
            >
              <AlertCircle className="w-5 h-5 text-[#EC4176] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#A13670]">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Email address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent transition-all"
                  style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                />
              </div>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
              <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent transition-all"
                  style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A77CF]/60 hover:text-[#9A77CF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center justify-between"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#543884]/30 text-[#543884] focus:ring-2 focus:ring-[#9A77CF]"
                  style={{ accentColor: '#543884' }}
                />
                <span className="text-sm text-[#262254] dark:text-white">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[#9A77CF] hover:text-[#EC4176] transition-colors">
                Forgot password?
              </a>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-white hover:brightness-110 transition-all mt-6 shadow-lg disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)',
                  boxShadow: '0 4px 14px rgba(236, 65, 118, 0.2)'
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'rgba(84, 56, 132, 0.15)' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#1a0f2e] text-[#7c6b9e]">or</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white text-sm flex items-center justify-center gap-2 hover:bg-[#543884]/5 transition-all"
                style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
              >
                <Globe className="w-5 h-5 text-[#9A77CF]" />
                Continue with SSO
              </button>
            </motion.div>
          </form>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="mt-8 text-center text-sm"
          >
            <span className="text-[#7c6b9e] dark:text-[#b5a3d1]">New to HR Space? </span>
            <Link to="/register" className="text-[#9A77CF] hover:text-[#EC4176] transition-colors font-medium">
              Contact your administrator
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
