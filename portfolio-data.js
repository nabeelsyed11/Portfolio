/**
 * ==============================================================================
 * SYED NABEEL AHMED - PORTFOLIO DATA CONFIGURATION
 * ==============================================================================
 * 
 * Edit this file to easily update your portfolio's text, images, projects, 
 * skills, and links without writing HTML or CSS!
 * 
 * You can also use the live "✏️ Edit Mode" button directly on the website to 
 * edit everything visually on-screen and click "Export Config" to save your changes here.
 * ==============================================================================
 */

window.portfolioData = {
  // --- Brand & Navigation ---
  brand: {
    name: "Syed Nabeel Ahmed",
    subtitle: "— PORTFOLIO —",
    hireButtonText: "Hire Me",
    hireButtonLink: "#contact"
  },

  // --- Hero Section ---
  hero: {
    tag: "PROFESSIONAL PORTFOLIO",
    title: "Syed Nabeel Ahmed",
    description: "Explore selected case studies, achievements, and creative highlights. Discover an overview of my experience, areas of expertise, and professional journey.",
    buttonText: "View Selected Work",
    buttonLink: "#projects",
    image: "assets/images/syed-nabeel-ahmed.jpg",
    imageAlt: "Syed Nabeel Ahmed - Professional Portrait"
  },

  // --- About Me Section ---
  about: {
    tag: "ABOUT ME",
    title: "Experience & Expertise.",
    description: "I am a dedicated professional with a track record of driving success through strategic thinking and precise execution. My journey is defined by continuous learning, collaboration, and a passion for creating impactful solutions.",
    image: "assets/images/about-working.jpg",
    imageAlt: "Syed Nabeel Ahmed working focused at workstation",
    highlights: [
      {
        number: "01",
        text: "A proven track record of delivering high-quality case studies and successful end-to-end projects."
      },
      {
        number: "02",
        text: "Deep commitment to team collaboration, innovative problem solving, and continuous professional growth."
      }
    ],
    connectLabel: "CONNECT & PROFILES",
    socialLinks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/syednabeelahmed1",
        iconType: "linkedin"
      },
      {
        name: "GitHub",
        url: "https://github.com/nabeelsyed11",
        iconType: "github"
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/nabeelsyed_/",
        iconType: "instagram"
      },
      {
        name: "Email",
        url: "mailto:nabeelahmedna7860@gmail.com",
        iconType: "email"
      }
    ]
  },

  // --- Core Skills Section ---
  skills: {
    tag: "CORE SKILLS",
    title: "Areas of professional<br>expertise.",
    image: "assets/images/skills-desk.jpg",
    imageAlt: "Modern organized office workspace",
    list: [
      {
        name: "Strategic Planning",
        description: "Developing clear roadmaps and actionable strategies to achieve complex project goals."
      },
      {
        name: "Project Management",
        description: "Leading cross-functional teams to deliver exceptional results on time and within scope."
      },
      {
        name: "Technical Problem Solving",
        description: "Analyzing challenges and architecting robust, scalable, and innovative solutions."
      },
      {
        name: "Creative Direction",
        description: "Ensuring outputs not only function flawlessly but also deliver an engaging, polished experience."
      }
    ]
  },

  // --- Selected Work / Case Studies Section ---
  projects: {
    tag: "SELECTED WORK",
    title: "Case studies & achievements.",
    description: "A curated selection of recent projects highlighting technical execution, creative problem solving, and measurable impact.",
    list: [
      {
        id: "analytics",
        title: "Enterprise Analytics Dashboard",
        role: "LEAD DEVELOPER",
        iconType: "analytics",
        image: "assets/images/project-analytics.jpg",
        summary: "Redesigned a complex data visualization platform, improving user engagement and reporting efficiency.",
        duration: "6 Months",
        technologies: "React, TypeScript, D3.js, Node.js, GraphQL",
        details: "This project involved re-architecting legacy data pipelines and replacing slow tabular interfaces with responsive, interactive visual dashboards. By implementing custom D3.js rendering pipelines and optimistic UI updates, dashboard load time decreased by 65%, and daily active enterprise user retention rose by 42%."
      },
      {
        id: "mobile",
        title: "Mobile App Launch",
        role: "PRODUCT MANAGER",
        iconType: "mobile",
        image: "assets/images/project-mobile.jpg",
        summary: "Led the cross-functional development and successful launch of a consumer-facing mobile application.",
        duration: "9 Months",
        technologies: "Flutter, Firebase, UX Research, Figma, CI/CD",
        details: "Spearheaded the product strategy, roadmap, and sprint cycles from zero to store release across iOS and Android. Conducted 30+ user interviews to refine onboarding workflows, leading to an initial launch rating of 4.8/5.0 with over 100k downloads within the first quarter."
      },
      {
        id: "ecommerce",
        title: "E-Commerce Platform Rebuild",
        role: "TECHNICAL LEAD",
        iconType: "ecommerce",
        image: "assets/images/project-ecommerce.jpg",
        summary: "Architected and implemented a scalable, modern storefront solution that increased conversion rates.",
        duration: "8 Months",
        technologies: "Next.js, Tailwind CSS, Stripe, Redis, PostgreSQL",
        details: "Led the migration of a legacy monolithic store to a high-speed headless commerce architecture. Introduced edge caching, fluid cart interactions, and frictionless checkout, resulting in an immediate 28% increase in checkout conversion rates and sub-second page transitions."
      }
    ]
  },

  // --- Contact / Opportunities Section ---
  contact: {
    tag: "LET'S COLLABORATE",
    title: "Contact for opportunities.",
    description: "Whether you have a specific project in mind, want to discuss a potential role, or just want to connect—I'd love to hear from you.",
    badges: [
      {
        iconType: "email",
        text: "REPLIES WITHIN 24H"
      },
      {
        iconType: "briefcase",
        text: "OPEN TO OPPORTUNITIES"
      }
    ],
    socialLinks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/syednabeelahmed1",
        iconType: "linkedin"
      },
      {
        name: "GitHub",
        url: "https://github.com/nabeelsyed11",
        iconType: "github"
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/nabeelsyed_/",
        iconType: "instagram"
      }
    ],
    form: {
      namePlaceholder: "Syed Nabeel Ahmed",
      emailPlaceholder: "nabeelahmedna7860@gmail.com",
      messagePlaceholder: "How can I help you?",
      buttonText: "Send Message"
    }
  },

  // --- Footer Section ---
  footer: {
    tagline: "Showcasing professional work, skills, and selected projects. Open for collaboration and new opportunities.",
    copyright: "© 2026 Syed Nabeel Ahmed. All rights reserved.",
    exploreTitle: "EXPLORE",
    socialTitle: "CONTACT & SOCIAL",
    socialText: "Available for remote work and exciting new collaborations.",
    bottomNote: "Designed for clarity, focus, and impact."
  }
};
