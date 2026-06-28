'use strict';

/**
 * HTML escaping utility for code snippet generation
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML attributes
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate HTML meta tag snippet
 * @param {Object} meta - Metadata object
 * @param {string} url - Current URL
 * @returns {string} HTML code snippet
 */
function generateHtmlSnippet(meta, url = '') {
  return `<!-- Primary Meta Tags -->
<title>${escHtml(meta.title || '')}</title>
<meta name="title" content="${escHtml(meta.title || '')}" />
<meta name="description" content="${escHtml(meta.description || '')}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
<meta property="og:url" content="${escHtml(url)}" />
<meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
<meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
<meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

<!-- Twitter -->
<meta property="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
<meta property="twitter:url" content="${escHtml(url)}" />
<meta property="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
<meta property="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
<meta property="twitter:image" content="${escHtml(meta['og.image'] || '')}" />`;
}

/**
 * Generate Next.js meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Next.js code snippet
 */
function generateNextJsSnippet(meta) {
  return `import Head from 'next/head';

export default function MetaTags() {
  return (
    <Head>
      <title>${escHtml(meta.title || '')}</title>
      <meta name="description" content="${escHtml(meta.description || '')}" />

      {/* Open Graph */}
      <meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
      <meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

      {/* Twitter */}
      <meta name="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
      <meta name="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta name="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta name="twitter:image" content="${escHtml(meta['og.image'] || '')}" />
    </Head>
  );
}`;
}

/**
 * Generate Nuxt meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Nuxt code snippet
 */
function generateNuxtSnippet(meta) {
  return `<script setup>
useHead({
  title: '${escHtml(meta.title || '')}',
  meta: [
    { name: 'description', content: '${escHtml(meta.description || '')}' },
    { property: 'og:type', content: '${escHtml(meta['og.type'] || 'website')}' },
    { property: 'og:title', content: '${escHtml(meta['og.title'] || meta.title || '')}' },
    { property: 'og:description', content: '${escHtml(meta['og.description'] || meta.description || '')}' },
    { property: 'og:image', content: '${escHtml(meta['og.image'] || '')}' },
    { name: 'twitter:card', content: '${escHtml(meta['twitter.card'] || 'summary_large_image')}' },
    { name: 'twitter:title', content: '${escHtml(meta['og.title'] || meta.title || '')}' },
    { name: 'twitter:description', content: '${escHtml(meta['og.description'] || meta.description || '')}' },
    { name: 'twitter:image', content: '${escHtml(meta['og.image'] || '')}' }
  ]
})
</script>`;
}

/**
 * Generate Remix meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Remix code snippet
 */
function generateRemixSnippet(meta) {
  return `import { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: "${escHtml(meta.title || '')}" },
    { name: "description", content: "${escHtml(meta.description || '')}" },
    { property: "og:type", content: "${escHtml(meta['og.type'] || 'website')}" },
    { property: "og:title", content: "${escHtml(meta['og.title'] || meta.title || '')}" },
    { property: "og:description", content: "${escHtml(meta['og.description'] || meta.description || '')}" },
    { property: "og:image", content: "${escHtml(meta['og.image'] || '')}" },
    { name: "twitter:card", content: "${escHtml(meta['twitter.card'] || 'summary_large_image')}" },
    { name: "twitter:title", content: "${escHtml(meta['og.title'] || meta.title || '')}" },
    { name: "twitter:description", content: "${escHtml(meta['og.description'] || meta.description || '')}" },
    { name: "twitter:image", content: "${escHtml(meta['og.image'] || '')}" }
  ];
};`;
}

/**
 * Generate Astro meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Astro code snippet
 */
function generateAstroSnippet(meta) {
  return `---
import Layout from '../layouts/Layout.astro';

const meta = {
  title: '${escHtml(meta.title || '')}',
  description: '${escHtml(meta.description || '')}',
  ogType: '${escHtml(meta['og.type'] || 'website')}',
  ogTitle: '${escHtml(meta['og.title'] || meta.title || '')}',
  ogDescription: '${escHtml(meta['og.description'] || meta.description || '')}',
  ogImage: '${escHtml(meta['og.image'] || '')}',
  twitterCard: '${escHtml(meta['twitter.card'] || 'summary_large_image')}'
};
---

<Layout title={meta.title}>
  <meta name="description" content={meta.description} />
  <meta property="og:type" content={meta.ogType} />
  <meta property="og:title" content={meta.ogTitle} />
  <meta property="og:description" content={meta.ogDescription} />
  <meta property="og:image" content={meta.ogImage} />
  <meta name="twitter:card" content={meta.twitterCard} />
  <meta name="twitter:title" content={meta.ogTitle} />
  <meta name="twitter:description" content={meta.ogDescription} />
  <meta name="twitter:image" content={meta.ogImage} />

  <slot />
</Layout>`;
}

/**
 * Generate SvelteKit meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} SvelteKit code snippet
 */
function generateSvelteKitSnippet(meta) {
  return `<script>
  export let ssr = true;

  const meta = {
    title: '${escHtml(meta.title || '')}',
    description: '${escHtml(meta.description || '')}',
    ogType: '${escHtml(meta['og.type'] || 'website')}',
    ogTitle: '${escHtml(meta['og.title'] || meta.title || '')}',
    ogDescription: '${escHtml(meta['og.description'] || meta.description || '')}',
    ogImage: '${escHtml(meta['og.image'] || '')}',
    twitterCard: '${escHtml(meta['twitter.card'] || 'summary_large_image')}'
  };

  if (ssr) {
    import('svelte-head').then(({ setHead }) => {
      setHead({
        title: meta.title,
        meta: [
          { name: 'description', content: meta.description },
          { property: 'og:type', content: meta.ogType },
          { property: 'og:title', content: meta.ogTitle },
          { property: 'og:description', content: meta.ogDescription },
          { property: 'og:image', content: meta.ogImage },
          { name: 'twitter:card', content: meta.twitterCard },
          { name: 'twitter:title', content: meta.ogTitle },
          { name: 'twitter:description', content: meta.ogDescription },
          { name: 'twitter:image', content: meta.ogImage }
        ]
      });
    });
  }
</script>

<svelte:head>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
  <meta property="og:type" content={meta.ogType} />
  <meta property="og:title" content={meta.ogTitle} />
  <meta property="og:description" content={meta.ogDescription} />
  <meta property="og:image" content={meta.ogImage} />
  <meta name="twitter:card" content={meta.twitterCard} />
  <meta name="twitter:title" content={meta.ogTitle} />
  <meta name="twitter:description" content={meta.ogDescription} />
  <meta name="twitter:image" content={meta.ogImage} />
</svelte:head>`;
}

/**
 * Generate Gatsby meta tag snippet
 * @param {Object} meta - Metadata object
 * @param {string} url - Current URL
 * @returns {string} Gatsby code snippet
 */
function generateGatsbySnippet(meta, url = '') {
  return `import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ location }) => {
  const canonicalUrl = location?.href || '${escHtml(url)}';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>${escHtml(meta.title || '')}</title>
      <meta name="description" content="${escHtml(meta.description || '')}" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="${escHtml(meta['og.type'] || 'website')}" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta property="og:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta property="og:image" content="${escHtml(meta['og.image'] || '')}" />

      {/* Twitter */}
      <meta name="twitter:card" content="${escHtml(meta['twitter.card'] || 'summary_large_image')}" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content="${escHtml(meta['og.title'] || meta.title || '')}" />
      <meta name="twitter:description" content="${escHtml(meta['og.description'] || meta.description || '')}" />
      <meta name="twitter:image" content="${escHtml(meta['og.image'] || '')}" />
    </Helmet>
  );
};

export default SEO;`;
}

/**
 * Generate Hugo meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Hugo code snippet
 */
function generateHugoSnippet(meta) {
  return `{{/*
  VISTA SEO Meta Tags

  Add to your site's front matter or configure in config.toml:

  [params]
    title = "${escHtml(meta.title || '')}"
    description = "${escHtml(meta.description || '')}"
    images = ["${escHtml(meta['og.image'] || '')}"]

  [params.opengraph]
    title = "${escHtml(meta['og.title'] || meta.title || '')}"
    description = "${escHtml(meta['og.description'] || meta.description || '')}"
    type = "${escHtml(meta['og.type'] || 'website')}"
    image = "${escHtml(meta['og.image'] || '')}"

  [params.twitter]
    card = "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
    title = "${escHtml(meta['og.title'] || meta.title || '')}"
    description = "${escHtml(meta['og.description'] || meta.description || '')}"
    image = "${escHtml(meta['og.image'] || '')}"
*/}}

{{/* or use via partial: {{ partial "head" . }} */}}

{{/* Direct template example */}}
<title>{{ .Site.Params.title | default .Title }}</title>
<meta name="description" content="{{ .Site.Params.description }}" />

{{/* Open Graph */}}
<meta property="og:type" content="{{ .Site.Params.opengraph.type | default "website" }}" />
<meta property="og:url" content="{{ .Permalink }}" />
<meta property="og:title" content="{{ .Site.Params.opengraph.title | default .Title }}" />
<meta property="og:description" content="{{ .Site.Params.opengraph.description }}" />
<meta property="og:image" content="{{ .Site.Params.opengraph.image | absURL }}" />

{{/* Twitter */}}
<meta name="twitter:card" content="{{ .Site.Params.twitter.card | default "summary_large_image" }}" />
<meta name="twitter:url" content="{{ .Permalink }}" />
<meta name="twitter:title" content="{{ .Site.Params.twitter.title | default .Title }}" />
<meta name="twitter:description" content="{{ .Site.Params.twitter.description }}" />
<meta name="twitter:image" content="{{ .Site.Params.twitter.image | absURL }}" />`;
}

/**
 * Generate Jekyll meta tag snippet
 * @param {Object} meta - Metadata object
 * @returns {string} Jekyll code snippet
 */
function generateJekyllSnippet(meta) {
  return `---
# VISTA SEO Meta Tags
#
# Place this front matter in your page or post.
# For site-wide defaults, add to _config.yml:
#
# seo:
#   title: "${escHtml(meta.title || '')}"
#   description: "${escHtml(meta.description || '')}"
#   image: "${escHtml(meta['og.image'] || '')}"
#   twitter:
#     card: "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
#
# Then use the jekyll-seo-plugin tag: {% seo %}

title: "${escHtml(meta.title || '')}"
description: "${escHtml(meta.description || '')}"
# Serve for Open Graph, Twitter Cards, Facebook, Pinterest
image: "${escHtml(meta['og.image'] || '')}"
# Override site defaults or add platform-specific:
og:
  title: "${escHtml(meta['og.title'] || meta.title || '')}"
  type: "${escHtml(meta['og.type'] || 'website')}"
  description: "${escHtml(meta['og.description'] || meta.description || '')}"
twitter:
  card: "${escHtml(meta['twitter.card'] || 'summary_large_image')}"
  title: "${escHtml(meta['og.title'] || meta.title || '')}"
  description: "${escHtml(meta['og.description'] || meta.description || '')}"

---

{{/* If using jekyll-seo-plugin, just add: {% seo %} */}}
{{/* Otherwise, manual tags: */}}

<title>{{ page.title | default: site.title }}</title>
<meta name="description" content="{{ page.description | default: site.description }}" />

{{/* Open Graph */}}
<meta property="og:type" content="{{ page.og.type | default: 'website' }}" />
<meta property="og:url" content="{{ page.url | absolute_url }}" />
<meta property="og:title" content="{{ page.og.title | default: page.title | default: site.title }}" />
<meta property="og:description" content="{{ page.og.description | default: page.description | default: site.description }}" />
<meta property="og:image" content="{{ page.image | default: site.image | absolute_url }}" />

{{/* Twitter */}}
<meta name="twitter:card" content="{{ page.twitter.card | default: site.twitter.card | default: 'summary_large_image' }}" />
<meta name="twitter:url" content="{{ page.url | absolute_url }}" />
<meta name="twitter:title" content="{{ page.twitter.title | default: page.og.title | default: page.title | default: site.title }}" />
<meta name="twitter:description" content="{{ page.twitter.description | default: page.og.description | default: page.description | default: site.description }}" />
<meta name="twitter:image" content="{{ page.image | default: site.image | absolute_url }}" />`;
}

/**
 * Main entry point for snippet generation
 * @param {string} format - Framework format (html, nextjs, nuxt, remix, astro, sveltekit, gatsby, hugo, jekyll)
 * @param {Object} meta - Metadata object
 * @param {string} url - Current URL (optional)
 * @returns {string} Generated code snippet
 */
function generateSnippet(format, meta, url = '') {
  switch (format) {
    case 'html':
      return generateHtmlSnippet(meta, url);
    case 'nextjs':
      return generateNextJsSnippet(meta);
    case 'nuxt':
      return generateNuxtSnippet(meta);
    case 'remix':
      return generateRemixSnippet(meta);
    case 'astro':
      return generateAstroSnippet(meta);
    case 'sveltekit':
      return generateSvelteKitSnippet(meta);
    case 'gatsby':
      return generateGatsbySnippet(meta, url);
    case 'hugo':
      return generateHugoSnippet(meta);
    case 'jekyll':
      return generateJekyllSnippet(meta);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Get list of supported frameworks
 * @returns {string[]} Array of framework identifiers
 */
function getSupportedFormats() {
  return ['html', 'nextjs', 'nuxt', 'remix', 'astro', 'sveltekit', 'gatsby', 'hugo', 'jekyll'];
}

module.exports = {
  generateSnippet,
  getSupportedFormats,
  escHtml,
  generateHtmlSnippet,
  generateNextJsSnippet,
  generateNuxtSnippet,
  generateRemixSnippet,
  generateAstroSnippet,
  generateSvelteKitSnippet,
  generateGatsbySnippet,
  generateHugoSnippet,
  generateJekyllSnippet
};
