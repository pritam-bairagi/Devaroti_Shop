import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  ogUrl, 
  canonicalUrl,
  type = 'website',
  publishedTime,
  author,
  jsonLd,
  noIndex = false
}) => {
  const siteName = 'Devaroti Shop';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Premium Multi-Vendor E-commerce Platform offering a seamless shopping experience with verified sellers and real-time support.';
  const defaultKeywords = 'ecommerce, shopping, multi-vendor, bangladesh, online marketplace, best prices, fast delivery';
  const defaultOgImage = 'https://devarotishop.com/assets/banner.jpg'; // Ensure this exists or use a high-quality placeholder

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:url" content={ogUrl || window.location.href} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />

      {/* AEO / GEO / AIO Enhancements & AI Crawler Support */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#ff5500" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta name="author" content={author} />}
      
      {/* Geo-tagging for GEO (Generative Engine Optimization) */}
      <meta name="geo.region" content="BD" />
      <meta name="geo.placename" content="Dhaka" />
      
      {/* JSON-LD Structured Data for AIO (AI Optimization) */}
      {jsonLd && (
        <script type="application/ld+json">
          {Array.isArray(jsonLd) 
            ? JSON.stringify(jsonLd.map(item => ({ ...item, "@context": "https://schema.org" })))
            : JSON.stringify({ "@context": "https://schema.org", ...jsonLd })
          }
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
