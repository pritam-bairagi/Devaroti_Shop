import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Send, Copyright } from "lucide-react";

// ─── Official SVG Brand Logos ─────────────────────────────────────────────────
const SocialIcon = ({ path, size = 16, title = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    width={size} 
    height={size}
    role="img"
    aria-label={title}
  >
    {title && <title>{title}</title>}
    <path d={path} />
  </svg>
);

const SOCIAL_ICONS = {
  facebook: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.73-8.835L1.254 2.25H8.08l4.259 5.632 5.905-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  tiktok: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  youtube: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  googleplay: "M3.609 1.814L13.792 12 3.61 22.186c-.379-.525-.61-1.18-.61-1.887V3.701c0-.707.231-1.362.609-1.887zm11.474 7.105l2.965 1.776c.652.391.652 1.033 0 1.424l-2.965 1.776-3.76-3.76 3.76-3.76zm-8.326-7.04L12.3 8.224 8.757 11.767 3.163 3.614c.864-.74 2.03-1.052 3.172-.735h.001zm0 16.242c-1.142.317-2.308.005-3.172-.735l5.594-8.153 3.543 3.543-5.965 5.345z",
  appstore: "M13.5 3.5c.8 0 1.5-.7 1.5-1.5s-.7-1.5-1.5-1.5S12 1.2 12 2s.7 1.5 1.5 1.5zm-5 0C9.3 3.5 10 2.8 10 2s-.7-1.5-1.5-1.5S7 1.2 7 2s.7 1.5 1.5 1.5zm8.5 8.5c0-1.5-1-2.8-2.5-3.2-.3-.1-.6-.2-1-.2h-7c-.4 0-.7.1-1 .2-1.5.4-2.5 1.7-2.5 3.2v7c0 1.4 1.1 2.5 2.5 2.5h10c1.4 0 2.5-1.1 2.5-2.5v-7zm-10 4.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm5 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z",
};

// ─── Navigation Data ──────────────────────────────────────────────────────
const NAVIGATION_SECTIONS = {
  aboutUs: {
    title: "About Us",
    links: [
      { name: "Mission & Vision", path: "/mission-vision" },
      { name: "Privacy Policy", path: "/privacy-policy" },
      { name: "Terms & Conditions", path: "/terms-conditions" },
      { name: "Delivery Information", path: "/delivery-info" },
      { name: "Return / Refund", path: "/return-refund" },
      { name: "FAQ", path: "/faq" },
      { name: "Payment Methods", path: "/payment-methods" },
      { name: "Legal Notice", path: "/legal-notice" },
    ]
  },
  support: {
    title: "Support",
    links: [
      { name: "My Account", path: "/login" },
      { name: "Wishlist", path: "/wishlist" },
      { name: "View Cart", path: "/cart" },
      { name: "Track Order", path: "/track-order" },
      { name: "Become a Seller", path: "/seller-signup" },
      { name: "Courier Service", path: "/courier-service" },
      { name: "Customer Care", path: "/customer-care" },
      { name: "Report", path: "/report" },
    ]
  },
  services: {
    title: "Services",
    links: [
      { name: "Our Company", path: "/company" },
      { name: "Our Team", path: "/team" },
      { name: "Careers / Recruitment", path: "/careers" },
      { name: "Course / Training", path: "/courses" },
      { name: "Marketing / Advertising", path: "/marketing" },
      { name: "Affiliate / Vendor Program", path: "/affiliate" },
      { name: "Blog / News / Media / Press", path: "/blog" },
      { name: "Business Partnership", path: "/partnership" },
    ]
  }
};

// ─── Social Links Config ──────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: "facebook", href: "https://facebook.com/devarotishop", label: "Facebook", rel: "me" },
  { icon: "instagram", href: "https://instagram.com/devarotishop", label: "Instagram", rel: "me" },
  { icon: "telegram", href: "https://t.me/devarotishop", label: "Telegram", isCustom: true, rel: "me" },
  { icon: "linkedin", href: "https://linkedin.com/company/devarotishop", label: "LinkedIn", rel: "me" },
  { icon: "twitter", href: "https://twitter.com/devarotishop", label: "X (Twitter)", rel: "me" },
  { icon: "tiktok", href: "https://tiktok.com/@devarotishop", label: "TikTok", rel: "me" },
  { icon: "youtube", href: "https://youtube.com/@devarotishop", label: "YouTube", rel: "me" },
  { icon: "github", href: "https://github.com/devarotishop", label: "GitHub", rel: "me" },
  { icon: "googleplay", href: "https://play.google.com/store/apps/details?id=com.devaroti.shop", label: "Google Play", rel: "external" },
  { icon: "appstore", href: "https://apps.apple.com/app/devaroti-shop/id123456789", label: "App Store", rel: "external" },
];

// ─── JSON-LD Structured Data for SEO ─────────────────────────────────────────
const FooterStructuredData = () => {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DEVAROTI SHOP",
    "url": "https://devaroti.com",
    "logo": "https://devaroti.com/logo.png",
    "sameAs": SOCIAL_LINKS.map(link => link.href),
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+8801883558258",
      "contactType": "customer service",
      "email": "pritamperson@gmail.com",
      "availableLanguage": ["English", "Bengali"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Boikali",
      "addressLocality": "Khulna",
      "postalCode": "9000",
      "addressCountry": "BD"
    }
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(organizationData)}
    </script>
  );
};

// ─── Subcomponents ───────────────────────────────────────────────────────────
const SocialLink = ({ icon, href, label, rel = "" }) => {
  const isTelegram = icon === "telegram";
  
  return (
    <a
      href={href}
      target="_blank"
      rel={`noopener noreferrer ${rel}`}
      aria-label={`Follow us on ${label}`}
      title={`Follow us on ${label}`}
      className="bg-[#ff4800] p-2.5 rounded-full text-white hover:text-[#ff4800] hover:bg-white border border-[#ff4800] transition-all duration-300 transform hover:scale-110"
    >
      {isTelegram ? <Send size={16} aria-hidden="true" /> : <SocialIcon path={SOCIAL_ICONS[icon]} size={16} title={label} />}
    </a>
  );
};

const NavSection = ({ title, links }) => (
  <nav aria-labelledby={`${title.toLowerCase().replace(/\s/g, '-')}-heading`}>
    <h4 
      id={`${title.toLowerCase().replace(/\s/g, '-')}-heading`}
      className="font-bold text-gray-800 mb-6 border-b border-[#192e5f] uppercase pb-2"
    >
      {title}
    </h4>
    <ul className="space-y-3 text-sm text-gray-500">
      {links.map(({ name, path }) => (
        <li key={name}>
          <Link 
            to={path} 
            className="hover:text-[#192e5f] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#ff4800] focus:ring-offset-2 rounded"
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

const ContactInfo = () => (
  <div>
    <h4 className="font-bold text-gray-800 mb-4 border-b border-[#192e5f] uppercase pb-2">
      Contact Us
    </h4>
    <div className="space-y-3 text-sm text-gray-500">
      <address className="not-italic">
        <p className="flex gap-2 hover:text-[#192e5f] transition-colors duration-300">
          <MapPin size={26} className="flex-shrink-0" aria-hidden="true" />
          <a 
            href="https://maps.app.goo.gl/p1NHck7J9jgfBRp26" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
            aria-label="Store location on Google Maps"
          >
            Boikali, GPO-9000, Khulna, Bangladesh.
          </a>
        </p>
      </address>
      <p className="flex gap-2 hover:text-[#0f172a] transition-colors duration-300">
        <Phone size={20} className="flex-shrink-0" aria-hidden="true" />
        <a href="tel:+8801883558258" className="hover:underline" aria-label="Call us">
          +880 1883 558258
        </a>
      </p>
      <p className="flex gap-2 hover:text-[#192e5f] transition-colors duration-300">
        <Mail size={20} className="flex-shrink-0" aria-hidden="true" />
        <a href="mailto:pritamperson@gmail.com" className="hover:underline" aria-label="Email us">
          pritamperson@gmail.com
        </a>
      </p>

      <div className="flex flex-wrap gap-3 mt-4" aria-label="Social media links">
        {SOCIAL_LINKS.map((link) => (
          <SocialLink key={link.label} {...link} />
        ))}
      </div>
    </div>
  </div>
);

const PaymentMethods = () => (
  <div className="bg-gray-200/100 py-5 border-t border-gray-600">
    <div className="flex items-center justify-center">
      <img 
        className="h-12 w-auto" 
        src="/footer_payment.png" 
        alt="Accepted payment methods: Visa, Mastercard, Amex, PayPal, bKash, Nagad"
        title="We accept all major payment methods"
        loading="lazy"
        width="200"
        height="48"
      />
    </div>
  </div>
);

const FooterCopyright = () => (
  <div className="bg-white py-8 border-t border-gray-600 text-gray-400 text-[12px] tracking-widest uppercase">
    <div className="flex items-center justify-center gap-2 flex-wrap px-4">
      <Copyright size={18} className="flex-shrink-0" aria-hidden="true" />
      <p className="text-center">
        © {new Date().getFullYear()} <b>
          <a 
            href="/" 
            className="hover:text-[#f7644f] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#ff4800] rounded"
            aria-label="DEVAROTI SHOP - Home page"
          >
            DEVAROTI SHOP
          </a>
        </b>. All Rights Reserved.
      </p>
    </div>
  </div>
);

// ─── Main Footer Component ───────────────────────────────────────────────────
const Footer = () => {
  return (
    <>
      <FooterStructuredData />
      <footer 
        className="bg-gray-100 pt-10 border-t border-gray-600"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="max-w-7xl mx-auto p-6 pb-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <ContactInfo />
          <NavSection {...NAVIGATION_SECTIONS.aboutUs} />
          <NavSection {...NAVIGATION_SECTIONS.support} />
          <NavSection {...NAVIGATION_SECTIONS.services} />
        </div>
        
        <PaymentMethods />
        <FooterCopyright />
      </footer>
    </>
  );
};

export default Footer;