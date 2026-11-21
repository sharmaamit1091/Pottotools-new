import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../src/config/toolsRegistry.js';
import { BLOG_POSTS } from '../src/config/blogPosts.js';
import { HINDI_PAGES } from '../src/config/hindiPages.js';
import {
  buildToolPageHtml,
  buildCategoryPageHtml,
  buildInformationalPageHtml,
  buildBlogIndexHtml,
  buildBlogPostHtml,
  buildHindiPageHtml,
  CATEGORY_PAGES_DATA,
  INFORMATIONAL_PAGES_DATA,
} from '../src/services/seo/htmlGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

export async function generateAllStaticPages() {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn('[PottoTools Static Generator] dist/ directory not found. Please run "vite build" first.');
    return;
  }

  const baseHtmlPath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(baseHtmlPath)) {
    console.warn('[PottoTools Static Generator] dist/index.html not found.');
    return;
  }

  const templateHtml = fs.readFileSync(baseHtmlPath, 'utf-8');
  console.log(`[PottoTools Static Generator] Generating static pages for ${TOOLS.length} tools...`);

  let toolCount = 0;
  for (const tool of TOOLS) {
    const toolHtml = buildToolPageHtml(templateHtml, tool);

    // Save as dist/{slug}/index.html so Apache/Nginx/Firebase automatically serves it
    const toolDir = path.resolve(DIST_DIR, tool.slug);
    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(toolDir, 'index.html'), toolHtml, 'utf-8');

    toolCount++;
  }

  // Generate Category Pages
  let catCount = 0;
  for (const cat of CATEGORY_PAGES_DATA) {
    const catHtml = buildCategoryPageHtml(templateHtml, cat);
    const catDir = path.resolve(DIST_DIR, cat.slug);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(catDir, 'index.html'), catHtml, 'utf-8');
    catCount++;
  }

  // Generate Informational & Legal Pages (canonical slugs only; aliases 301 redirect cleanly)
  let infoCount = 0;
  for (const info of INFORMATIONAL_PAGES_DATA) {
    const infoHtml = buildInformationalPageHtml(templateHtml, info);
    const infoDir = path.resolve(DIST_DIR, info.slug);
    if (!fs.existsSync(infoDir)) {
      fs.mkdirSync(infoDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(infoDir, 'index.html'), infoHtml, 'utf-8');

    infoCount++;
  }

  // Generate Blog Index & Articles (/blog, /blog/{slug})
  const blogDir = path.resolve(DIST_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }
  fs.writeFileSync(path.resolve(blogDir, 'index.html'), buildBlogIndexHtml(templateHtml), 'utf-8');
  let blogCount = 1;
  for (const post of BLOG_POSTS) {
    const postDir = path.resolve(blogDir, post.slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(postDir, 'index.html'), buildBlogPostHtml(templateHtml, post), 'utf-8');
    blogCount++;
  }

  // Generate Hindi Language Landing Pages (/hi, /hi/{slug})
  let hiCount = 0;
  for (const hiPage of HINDI_PAGES) {
    const hiDir = path.resolve(DIST_DIR, hiPage.slug);
    if (!fs.existsSync(hiDir)) {
      fs.mkdirSync(hiDir, { recursive: true });
    }
    fs.writeFileSync(path.resolve(hiDir, 'index.html'), buildHindiPageHtml(templateHtml, hiPage), 'utf-8');
    hiCount++;
  }

  console.log(
    `[PottoTools Static Generator] Successfully generated ${toolCount} tool pages, ${catCount} category hubs, ${infoCount} informational pages, ${blogCount} blog pages, and ${hiCount} Hindi pages in dist/!`
  );
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllStaticPages().catch(console.error);
}
