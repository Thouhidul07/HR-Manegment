import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Users, Clock, DollarSign, Target, Shield,
  FileText, TrendingUp, MessageSquare, Calendar, BarChart3,
  CheckCircle2, ArrowLeft
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      color: '#543884',
      description: 'Centralize all employee records, org charts, and documents in one secure location.',
      features: [
        'Complete employee profiles with documents and history',
        'Interactive organizational charts',
        'Custom fields and data management',
        'Employee directory with advanced search',
        'Document management and version control',
        'Bulk import and export capabilities'
      ]
    },
    {
      icon: Calendar,
      title: 'Onboarding and Offboarding',
      color: '#9A77CF',
      description: 'Automated workflows for seamless employee onboarding and structured offboarding processes.',
      features: [
        'Customizable onboarding checklists and workflows',
        'Document collection and e-signatures',
        'Welcome portal for new hires',
        'Equipment and access provisioning',
        'Exit interview management',
        'Asset recovery and access revocation tracking'
      ]
    },
    {
      icon: Clock,
      title: 'Attendance and Time Tracking',
      color: '#EC4176',
      description: 'Real-time clock-in/out tracking, shift management, and comprehensive time monitoring.',
      features: [
        'Digital clock-in/out with geolocation',
        'Shift scheduling and management',
        'Overtime tracking and alerts',
        'Break time monitoring',
        'Attendance reports and analytics',
        'Mobile app support for remote teams'
      ]
    },
    {
      icon: FileText,
      title: 'Leave Management',
      color: '#A13670',
      description: 'Streamlined leave requests, approvals, and balance tracking system.',
      features: [
        'Leave request and approval workflows',
        'Multiple leave types configuration',
        'Leave balance tracking and accruals',
        'Team calendar view',
        'Automated accrual calculations',
        'Holiday calendar management'
      ]
    },
    {
      icon: DollarSign,
      title: 'Payroll Management',
      color: '#FFA45E',
      description: 'Automated payroll processing with tax compliance and instant digital payslips.',
      features: [
        'Automated payroll calculations',
        'Tax deduction and compliance',
        'Direct deposit integration',
        'Digital payslip generation',
        'Year-end tax forms (W-2, 1099)',
        'Multi-currency support'
      ]
    },
    {
      icon: BarChart3,
      title: 'Expense and Assessment Management',
      color: '#262254',
      description: 'Track expenses, manage reimbursements, and conduct comprehensive performance assessments.',
      features: [
        'Expense submission and tracking',
        'Receipt capture and storage',
        'Multi-level approval workflows',
        'Performance assessment tools',
        'Goal setting and OKR tracking',
        'Reimbursement processing and analytics'
      ]
    },
    {
      icon: Shield,
      title: 'Role and Permission Management',
      color: '#543884',
      description: 'Granular access control with comprehensive audit logs and approval workflows.',
      features: [
        'Role-based access control (RBAC)',
        'Custom permission sets',
        'Audit trail and activity logs',
        'Approval workflows',
        'Data access restrictions',
        'Compliance reporting'
      ]
    },
    {
      icon: MessageSquare,
      title: 'Anonymous Forum',
      color: '#9A77CF',
      description: 'Safe space for employees to share feedback, discuss topics, and engage anonymously.',
      features: [
        'Anonymous posting and discussions',
        'Topic categorization and tagging',
        'Sentiment analysis on posts',
        'Moderation tools and content filtering',
        'Trending topics and insights',
        'Employee engagement metrics'
      ]
    },
    {
      icon: Target,
      title: 'Anonymous Peer Review',
      color: '#EC4176',
      description: 'Confidential 360° feedback system enabling honest peer assessments and growth insights.',
      features: [
        'Anonymous 360-degree feedback collection',
        'Customizable review templates',
        'Competency-based assessments',
        'Strength and improvement area identification',
        'Aggregated feedback reports',
        'Privacy-protected peer insights'
      ]
    },
    {
      icon: TrendingUp,
      title: 'CV Filtration using AI',
      color: '#A13670',
      description: 'AI-powered resume screening to identify top candidates efficiently and reduce hiring bias.',
      features: [
        'Automated CV parsing and analysis',
        'Skills matching with job requirements',
        'Candidate ranking and scoring',
        'Bias reduction algorithms',
        'Keyword and qualification extraction',
        'Integration with applicant tracking system'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#543884] via-[#9A77CF] to-[#EC4176] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-4">All Features</h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Discover the complete suite of HR tools designed to streamline your operations and empower your workforce.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#251942] border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${feature.color}1A` }}
                  >
                    <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#262254] dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: feature.color }}
                      />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#F4F0FA] dark:bg-[#1a0f2e]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#262254] dark:text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join hundreds of companies already using HRSpace to transform their HR operations.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register">
              <button
                className="px-8 py-4 text-white rounded-xl shadow-lg hover:brightness-110 hover:scale-[1.02] transition-all font-semibold"
                style={{ background: 'linear-gradient(135deg, #543884 0%, #A13670 50%, #EC4176 100%)' }}
              >
                Start Free Trial
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-4 border-2 border-[#543884] text-[#543884] dark:text-[#9A77CF] rounded-xl hover:bg-[#543884]/5 transition-all font-semibold">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
