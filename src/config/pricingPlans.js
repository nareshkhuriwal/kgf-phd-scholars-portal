// src/config/pricingPlans.js

// Role-specific plan definitions
// Note: monthlyAmountPaise / yearlyAmountPaise are numeric amounts in paise
// monthlyPlanKey / yearlyPlanKey map to backend Razorpay plan keys

export const ROLE_PLANS = {
  researcher: {
    current: {
      key: 'researcher-free',
      title: 'Researcher',
      price: 'Free',
      subtitle: 'Start free with limited usage.',
      bullets: [
        'Up to 50 papers',
        '5 reports',
        '2 collections',
        'Basic search and filtering',
        'Email support',
      ],
      chip: 'Current plan',
    },
    upgrade: {
      // plan family
      key: 'researcher-pro',
      title: 'Researcher Pro',
      price: '₹249/month or ₹2,899/year',
      subtitle: 'Unlock higher limits for serious work.',
      monthlyAmountPaise: 24900,   // ₹249.00
      yearlyAmountPaise: 289900,   // ₹2,899.00
      monthlyPlanKey: 'researcher-pro',
      yearlyPlanKey: 'researcher-pro-yearly',
      bullets: [
        'Up to 200 papers',
        '20 reports',
        '10 collections',
        'Advanced search and filtering',
        'Priority email support',
        'Export to multiple formats (PDF, CSV, BibTeX)',
        'AI-assisted literature summarization (limited credits)',
        'Project folders & version history',
      ],
      chip: 'Upgrade plan',
      isAnnualOnly: false,
    },
  },

  supervisor: {
    current: {
      key: 'supervisor-free',
      title: 'Supervisor',
      price: 'Free',
      subtitle: 'Perfect when you are starting with a small team.',
      bullets: [
        'Up to 1 researcher for review',
        'Includes 30 papers',
        '2 reports',
        '1 collection',
        'Basic review and approval workflow',
        'Email notifications',
      ],
      chip: 'Current plan',
    },
    upgrade: {
      key: 'supervisor-pro',
      title: 'Supervisor Pro',
      price: '₹999/month or ₹9,999/year',
      subtitle: 'Scale supervision across more researchers.',
      monthlyAmountPaise: 49900,    // ₹499.00
      yearlyAmountPaise: 499900,    // ₹4,999.00
      monthlyPlanKey: 'supervisor-pro',
      yearlyPlanKey: 'supervisor-pro-yearly',
      bullets: [
        'Manage up to 20 researchers',
        'Includes everything in Researcher Pro (200 papers, 20 reports, 10 collections)',
        'Advanced review & approval workflows',
        'Supervisor dashboard with per-student activity',
        'Team collaboration tools (shared notes, comments)',
        'Bulk actions and student management',
        'Priority support & faster AI job queue',
        'Usage & exportable audit logs',
      ],
      chip: 'Upgrade plan',
      isAnnualOnly: false,
    },
  },

  admin: {
    current: {
      key: 'admin-trial',
      title: 'Admin',
      price: 'Admin (Trial)',
      subtitle: 'Central admin access for your university.',
      bullets: [
        '30 Days free trial for Admin access',
        'Central admin access for your university',
        'Manage researchers, supervisors & reports in one place',
        'Unlimited users and researchers (trial limits may apply)',
        'Advanced analytics and reporting',
        'Custom branding options',
        'Dedicated account manager',
        'Priority support with SLA',
      ],
      chip: 'Current plan',
    },
    upgrade: {
      key: 'admin-pro',
      title: 'Admin Pro',
      // Admin sold as annual institutional license
      price: '₹14,999/year',
      subtitle: 'Institutional license for departments or entire universities.',
      yearlyAmountPaise: 1499900,   // ₹14999.00
      monthlyAmountPaise: null,     // no monthly option by default
      monthlyPlanKey: null,
      yearlyPlanKey: 'admin-pro',
      bullets: [
        '30 Days free trial for Admin access',
        'Centralized admin and billing',
        'SSO / SAML integration',
        'Custom onboarding & training',
        'Private cloud / on-prem deployment (optional, paid)',
        'API access and integrations (LMS, institutional repos)',
        'Advanced usage analytics & exportable reports',
        'SLA-backed priority support and dedicated account manager',
        'Custom contract and volume discounts available',
      ],
      chip: 'Upgrade plan',
      isAnnualOnly: true,
    },
  },
};
