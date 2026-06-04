import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, Sun, Moon, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { useTheme } from "../contexts/ThemeContext";

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  role: 'employee' | 'hr_manager' | 'admin' | 'project_manager';
  agreeToTerms: boolean;
}

const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];

export function Register() {
  const { theme, toggleTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: { role: 'employee', department: '' }
  });

  const password = watch("password") || "";
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    console.log("Registration data:", data);
    setIsLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1a0f2e] p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mb-6 mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #9A77CF, #EC4176)' }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#262254] dark:text-white mb-3">Account Created!</h2>
          <p className="text-[#7c6b9e] dark:text-[#b5a3d1] mb-8">
            Awaiting admin approval. You'll receive an email shortly.
          </p>
          <Link to="/login">
            <button className="text-[#9A77CF] hover:text-[#EC4176] transition-colors font-medium inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #262254 0%, #543884 100%)' }}
      >
        <div className="absolute w-48 h-48 rounded-full blur-3xl bottom-16 left-0" style={{ background: 'rgba(154, 119, 207, 0.2)' }}></div>
        <div className="absolute w-24 h-24 rounded-full blur-2xl top-24 right-0" style={{ background: 'rgba(236, 65, 118, 0.15)' }}></div>
        <div className="absolute top-32 right-20 w-1.5 h-1.5 rounded-full bg-[#FFA45E] opacity-40"></div>
        <div className="absolute bottom-40 left-24 w-1.5 h-1.5 rounded-full bg-[#EC4176] opacity-40"></div>

        <div className="relative z-10 flex flex-col justify-center px-10 max-w-xs mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">
              <span className="text-[#EC4176]">HR</span>
              <span className="text-white"> Space</span>
            </h1>
            <p className="text-white/80 text-lg">Join your team on HRSpace.</p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#9A77CF] text-sm">✦</span>
              <span className="text-sm text-white/90">Instant Access</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#FFA45E] text-sm">✦</span>
              <span className="text-sm text-white/90">Role-Based Permissions</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-[#EC4176] text-sm">✦</span>
              <span className="text-sm text-white/90">Secure by Default</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <div className="flex-1 lg:w-[60%] flex items-center justify-center p-8 bg-white dark:bg-[#1a0f2e] relative">
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#9A77CF]/40"
          style={{ background: 'linear-gradient(135deg, #543884 0%, #9A77CF 52%, #EC4176 100%)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg hover:bg-[#9A77CF]/10 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <motion.div
          className="w-full max-w-sm"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
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
            <h2 className="text-2xl font-bold text-[#262254] dark:text-white mb-1">Create your account</h2>
            <p className="text-sm text-[#7c6b9e] dark:text-[#b5a3d1] mb-8">Set up your HRSpace profile</p>
          </motion.div>

          {/* Step Indicator */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-all ${
                  currentStep === 1 ? 'shadow-md' : ''
                }`}
                style={currentStep === 1
                  ? { background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }
                  : { background: 'rgba(84, 56, 132, 0.2)', color: '#543884' }
                }
              >
                1
              </div>
              <span className="text-xs text-[#7c6b9e]">Details</span>
            </div>
            <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(84, 56, 132, 0.15)' }}></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-all ${
                  currentStep === 2 ? 'shadow-md' : ''
                }`}
                style={currentStep === 2
                  ? { background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }
                  : { background: 'rgba(84, 56, 132, 0.2)', color: '#543884' }
                }
              >
                2
              </div>
              <span className="text-xs text-[#7c6b9e]">Role</span>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {currentStep === 1 ? (
              <>
                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                    <input
                      {...register("fullName", { required: "Full name is required", minLength: 2 })}
                      placeholder="Tanvir Hasan"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent"
                      style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                    />
                  </div>
                  {errors.fullName && <p className="mt-1 text-xs text-[#EC4176]">{errors.fullName.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Work Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                    <input
                      type="email"
                      {...register("email", { required: "Email is required", pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i })}
                      placeholder="john.doe@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent"
                      style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-[#EC4176]">{errors.email.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password", { required: "Password is required", minLength: 8 })}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent"
                      style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A77CF]/60 hover:text-[#9A77CF]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all"
                            style={{
                              background: i < passwordStrength.level
                                ? passwordStrength.color
                                : 'rgba(84, 56, 132, 0.1)'
                            }}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: passwordStrength.color }}>{passwordStrength.label}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-xs text-[#EC4176]">{errors.password.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A77CF]" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: value => value === password || "Passwords do not match"
                      })}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white placeholder:text-[#7c6b9e] focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent"
                      style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A77CF]/60 hover:text-[#9A77CF]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-[#EC4176]">{errors.confirmPassword.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-3 rounded-xl font-semibold text-white hover:brightness-110 transition-all mt-6 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)',
                      boxShadow: '0 4px 14px rgba(236, 65, 118, 0.2)'
                    }}
                  >
                    Next →
                  </button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Department</label>
                  <select
                    {...register("department", { required: "Please select a department" })}
                    className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-[#251942] text-[#262254] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9A77CF] focus:border-transparent"
                    style={{ borderColor: 'rgba(84, 56, 132, 0.2)' }}
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                  {errors.department && <p className="mt-1 text-xs text-[#EC4176]">{errors.department.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="block text-sm font-medium text-[#262254] dark:text-white mb-2">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'employee', label: 'Employee' },
                      { value: 'hr_manager', label: 'HR Manager' },
                      { value: 'project_manager', label: 'Project Manager' },
                      { value: 'admin', label: 'Admin' }
                    ].map((roleOption) => (
                      <label
                        key={roleOption.value}
                        className={`px-4 py-3 rounded-xl border-2 text-center cursor-pointer transition-all ${
                          watch('role') === roleOption.value
                            ? 'text-white shadow-md'
                            : 'text-[#543884] dark:text-[#9A77CF]'
                        }`}
                        style={watch('role') === roleOption.value
                          ? { background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)', borderColor: 'transparent' }
                          : { background: 'rgba(84, 56, 132, 0.05)', borderColor: 'rgba(84, 56, 132, 0.2)' }
                        }
                      >
                        <input type="radio" {...register("role")} value={roleOption.value} className="hidden" />
                        <span className="text-sm font-medium">{roleOption.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("agreeToTerms", { required: "You must agree to the terms" })}
                      className="w-4 h-4 mt-0.5 rounded border-white text-white focus:ring-2 focus:ring-white"
                      style={{ accentColor: '#ffffff' }}
                    />
                    <span className="text-sm text-[#262254] dark:text-white">
                      I agree to the{" "}
                      <a href="#" className="text-[#9A77CF] hover:text-[#EC4176] transition-colors">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-[#9A77CF] hover:text-[#EC4176] transition-colors">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreeToTerms && <p className="mt-1 text-xs text-[#EC4176]">{errors.agreeToTerms.message}</p>}
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[#9A77CF] hover:text-[#EC4176] transition-colors font-medium inline-flex items-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-semibold text-white hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)',
                      boxShadow: '0 4px 14px rgba(236, 65, 118, 0.2)'
                    }}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </motion.div>
              </>
            )}
          </form>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="mt-8 text-center text-sm"
          >
            <span className="text-[#7c6b9e] dark:text-[#b5a3d1]">Already have an account? </span>
            <Link to="/login" className="text-[#9A77CF] hover:text-[#EC4176] transition-colors font-medium">
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { level: 0, label: '', color: '' };
  if (password.length < 6) return { level: 1, label: 'Weak', color: '#EC4176' };
  if (password.length < 10) return { level: 2, label: 'Fair', color: '#FFA45E' };
  if (password.length < 14 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { level: 3, label: 'Good', color: '#9A77CF' };
  return { level: 4, label: 'Strong', color: '#543884' };
}
