// ─────────────────────────────────────────────────────────────
//  All site content lives here. Edit this file to update the site.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Karthik Guduri',
  fullName: 'Phaniram Karthik Guduri',
  role: 'AEM Cloud Architect',
  tagline: 'I architect and run enterprise content platforms — 100+ sites, cloud-native, built to scale.',
  location: 'United States · Remote',
  email: 'guduriphaniram1988@gmail.com',
  linkedin: 'https://www.linkedin.com/in/karthik-g-a78406120',
  github: '', // add your GitHub profile URL once connected
  resumeUrl: '', // drop resume.pdf into /public and set '/resume.pdf'

  // Put your own avatar at public/models/avatar.glb and set this to '/models/avatar.glb'.
  // Leave null to show the abstract 3D platform core instead.
  avatarUrl: null as string | null,

  // Talking-avatar intro video. Put intro.mp4 (and optional intro-poster.jpg) in /public,
  // then set introVideo: '/intro.mp4'. Section stays hidden while this is null.
  introVideo: null as string | null,
  introPoster: null as string | null,

  about: [
    'I’m a senior engineer and AEM architect with 14+ years building enterprise web platforms across healthcare, financial services and telecom — from Adobe’s own support team to leading a platform team today.',
    'My work sits where content, cloud and engineering discipline meet: migrating large estates to AEM as a Cloud Service, designing multi-site architectures, automating delivery pipelines, and bringing AI-assisted development into everyday engineering.',
  ],

  stats: [
    { value: '14+', label: 'years in enterprise engineering' },
    { value: '100+', label: 'sites on the platform I lead' },
    { value: '4', label: 'industry leaders: Adobe, T-Mobile, T. Rowe Price, AbbVie' },
  ],

  whatIDo: [
    {
      title: 'Platform Architecture',
      body: 'AEM as a Cloud Service, multi-site (MSM) design, editable templates, Content & Experience Fragments, dispatcher and CDN strategy.',
      tags: ['AEMaaCS', 'OSGi', 'Sling', 'JCR', 'Dispatcher'],
    },
    {
      title: 'Cloud Migration & DevOps',
      body: 'Phased AEM 6.5 → Cloud Service migrations, Cloud Manager pipelines, GitHub Actions automation and code-quality gates.',
      tags: ['Cloud Manager', 'GitHub Actions', 'Maven', 'JaCoCo'],
    },
    {
      title: 'Observability & Security',
      body: 'Monitoring and alerting with New Relic, Splunk and ELK; production triage; coordinated vulnerability remediation across the estate.',
      tags: ['New Relic', 'Splunk', 'ELK', 'Security'],
    },
    {
      title: 'AI-Assisted Engineering',
      body: 'Introducing AI coding tools to platform teams for code review, vulnerability scanning and documentation, with a growing focus on AI-driven content platforms.',
      tags: ['Claude Code', 'Automation', 'AI/ML'],
    },
  ],

  career: [
    {
      company: 'AbbVie (Allergan Aesthetics)',
      role: 'AEM Cloud Architect / Sr. AEM Engineer',
      period: 'Oct 2022 — Present',
      points: [
        'Lead the AEM platform team for 100+ Allergan Aesthetics sites, including juvederm.com.',
        'Architected the AEM 6.5 AMS → AEM as a Cloud Service migration with an 18-month phased roadmap.',
        'Built a custom translation connector on AEM’s Translation Integration Framework (XLIFF).',
        'Automated CI/CD and quality gates with GitHub Actions; rolled out AI-assisted development.',
      ],
    },
    {
      company: 'T. Rowe Price',
      role: 'Sr. AEM Engineer',
      period: 'Jun 2021 — Sep 2022',
      points: [
        'Moved deployments onto the Adobe Cloud Manager CI/CD pipeline.',
        'Delivered content-as-a-service via the Assets HTTP API; designed Content Fragment models and editable templates.',
      ],
    },
    {
      company: 'T-Mobile',
      role: 'AEM Developer → Lead → Sr. Full Stack Developer',
      period: 'Oct 2015 — Jun 2021',
      points: [
        'Built the T-Mobile for Business marketing site with AWS-hosted DAM, Dynamic Media and Salesforce lead capture.',
        'Led the Customer Care frontline app: jQuery → Angular with server-side rendering (Angular Universal).',
        'Built the my.t-mobile.com eServices shopping-cart experience on AEM and AngularJS.',
      ],
    },
    {
      company: 'Adobe Systems',
      role: 'AEM Support Engineer',
      period: 'Oct 2014 — Oct 2015',
      points: ['First escalation point for enterprise AEM customers — debugging customer code, logs and deployments.'],
    },
    {
      company: 'Covansys',
      role: 'Java Developer',
      period: 'Jun 2010 — Jun 2014',
      points: ['Built J2EE modules for search, credit authentication and purchase flows (JSP, JMS/MQ, JDBC, PL/SQL).'],
    },
  ],

  work: [
    {
      title: 'Cloud Service Migration',
      org: 'AbbVie',
      body: 'Roadmap and execution for moving a 100+ site AEM 6.5 estate to AEM as a Cloud Service — OSGi config conversion, pipeline rework and risk-managed phased rollout.',
      stack: ['AEMaaCS', 'Cloud Manager', 'OSGi'],
    },
    {
      title: 'Multi-Market Content Platform',
      org: 'AbbVie',
      body: 'Restructured MSM blueprints and live copies so US and Canadian markets share one content backbone, with automated translation through a custom TIF connector.',
      stack: ['MSM', 'TIF', 'XLIFF'],
    },
    {
      title: 'Platform Observability',
      org: 'AbbVie',
      body: 'Daily error reporting and real-time traffic dashboards that turned intermittent 500s and cache anomalies into quickly traceable incidents.',
      stack: ['New Relic', 'Splunk', 'ELK'],
    },
    {
      title: 'T-Mobile for Business',
      org: 'T-Mobile',
      body: 'Marketing platform with AWS S3-backed assets, Dynamic Media delivery and lead capture straight into Salesforce.',
      stack: ['AEM 6.4', 'AWS S3', 'Salesforce'],
    },
    {
      title: 'Customer Care Frontline App',
      org: 'T-Mobile',
      body: 'Rebuilt a legacy jQuery tool used by care reps as an Angular app with server-side rendering and AEM-authored content.',
      stack: ['Angular', 'TypeScript', 'Node.js'],
    },
  ],

  stack: [
    'AEM Cloud Service', 'Java', 'OSGi', 'Apache Sling', 'JCR', 'HTL', 'TypeScript', 'Angular', 'React',
    'Node.js', 'GitHub Actions', 'Cloud Manager', 'Maven', 'Docker', 'AWS', 'Azure', 'New Relic',
    'Splunk', 'Dispatcher', 'CDN', 'Salesforce', 'REST', 'Claude Code',
  ],

  education: [
    { degree: 'M.S., Computer Science', place: 'USA' },
    { degree: 'B.Tech, Computer Science', place: 'India' },
  ],
}
