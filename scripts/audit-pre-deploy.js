const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// ANSI Color Helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logHeader(text) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${text} ===${colors.reset}`);
}

function findHtmlFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['useful-docs', '.git', 'node_modules', 'scratch', 'shared'].includes(entry.name)) {
        results.push(...findHtmlFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = findHtmlFiles(rootDir);
logHeader(`GoModo Pre-Deployment Zero-Defect Audit (${htmlFiles.length} HTML Pages)`);

let totalErrors = 0;
let totalWarnings = 0;

// -------------------------------------------------------------
// STEP 1: SSOT Consistency Check
// -------------------------------------------------------------
process.stdout.write('1. Checking SSOT synchronization (sync-common.js)... ');
try {
  const syncOutput = execSync('node scripts/sync-common.js', { cwd: rootDir, encoding: 'utf8' });
  if (syncOutput.includes('0 files updated') || !syncOutput.includes('files updated')) {
    console.log(`${colors.green}PASSED${colors.reset}`);
  } else {
    console.log(`${colors.yellow}UPDATED (files were synchronized)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}FAILED${colors.reset}`);
  console.error(e.message);
  totalErrors++;
}

// -------------------------------------------------------------
// STEP 2: HTML Page Audits
// -------------------------------------------------------------
console.log(`2. Auditing DOM integrity, tag balance, syntax, SEO & UX reactivity...`);

htmlFiles.forEach(file => {
  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const pageErrors = [];
  const pageWarnings = [];

  // A. Structural Tag Balance
  ['header', 'main', 'footer', 'body', 'html'].forEach(tag => {
    const openMatches = content.match(new RegExp('<' + tag + '[ >]', 'g')) || [];
    const closeMatches = content.match(new RegExp('</' + tag + '>', 'g')) || [];
    if (openMatches.length !== closeMatches.length) {
      pageErrors.push(`Tag balance mismatch <${tag}>: opened ${openMatches.length} times, closed ${closeMatches.length} times`);
    }
  });

  // B. Syntax & Comment Leakage
  // Stray >> (e.g., <meta ... >> or <link ... >>)
  const strayDoubleGt = (content.match(/<[^>]+>>/g) || []).length;
  if (strayDoubleGt > 0) {
    pageErrors.push(`Found ${strayDoubleGt} stray ">>" tag(s) (renders as visible text outside head)`);
  }

  // Comment balance & orphaned comment delimiters
  const commentOpens = (content.match(/<!--/g) || []).length;
  const commentCloses = (content.match(/-->/g) || []).length;
  if (commentOpens !== commentCloses) {
    pageErrors.push(`HTML comment mismatch: <!-- (${commentOpens}) vs --> (${commentCloses})`);
  }

  // Check for orphaned comment delimiters leaking outside valid <!-- ... -->
  const strippedOfComments = content.replace(/<!--[\s\S]*?-->/g, '');
  if (strippedOfComments.includes('-->')) {
    pageErrors.push('Found orphaned comment closing delimiter "-->" leaking raw text into the page');
  }
  if (strippedOfComments.includes('<!--')) {
    pageErrors.push('Found orphaned comment opening delimiter "<!--" without matching closing');
  }

  // C. JS-DOM Contract (Missing getElementById targets)
  const scriptBlocks = content.match(/<script[\s\S]*?<\/script>/gi) || [];
  const referencedIds = new Set();
  scriptBlocks.forEach(sb => {
    const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
    let m;
    while ((m = idRegex.exec(sb)) !== null) {
      referencedIds.add(m[1]);
    }
  });

  const missingIds = [];
  referencedIds.forEach(id => {
    if (!content.includes('id="' + id + '"') && !content.includes("id='" + id + "'")) {
      missingIds.push(id);
    }
  });
  if (missingIds.length > 0) {
    pageErrors.push(`Missing DOM ID(s) referenced in JS: ${missingIds.join(', ')}`);
  }

  // D. SEO & AdSense Requirements
  if (!content.includes('ca-pub-4528673716962845')) {
    pageErrors.push('Missing Google AdSense Client ID');
  }

  if (!/<title>[^<]+<\/title>/i.test(content)) {
    pageErrors.push('Missing or empty <title> tag');
  }

  if (!/<meta\s+name=["']description["']\s+content=["'][^"']+["']/i.test(content)) {
    pageErrors.push('Missing meta description');
  }

  if (!/<link\s+rel=["']canonical["']\s+href=["'][^"']+["']/i.test(content)) {
    pageErrors.push('Missing canonical link');
  }

  if (!content.includes('viewport')) {
    pageErrors.push('Missing viewport meta tag');
  }

  if (!content.includes('og:title') || !content.includes('og:description') || !content.includes('og:image')) {
    pageErrors.push('Incomplete Open Graph meta tags');
  }

  if (!content.includes('application/ld+json')) {
    pageErrors.push('Missing JSON-LD structured data');
  }

  if (!content.includes('© 2026 GoModo')) {
    pageErrors.push('Missing unified footer copyright');
  }

  // E. Horizontal Overflow Risk
  const fixedWidthMatch = content.match(/style="[^"]*width:\s*([4-9]\d{2,}|[1-9]\d{3,})px/i);
  if (fixedWidthMatch) {
    pageWarnings.push(`Fixed inline width found (overflow risk): ${fixedWidthMatch[0]}`);
  }

  // Print results if any error or warning on this page
  if (pageErrors.length > 0) {
    console.log(`\n  ${colors.red}✖ [FAIL] ${rel}:${colors.reset}`);
    pageErrors.forEach(err => console.log(`    ${colors.red}- ${err}${colors.reset}`));
    totalErrors += pageErrors.length;
  }

  if (pageWarnings.length > 0) {
    console.log(`\n  ${colors.yellow}▲ [WARN] ${rel}:${colors.reset}`);
    pageWarnings.forEach(warn => console.log(`    ${colors.yellow}- ${warn}${colors.reset}`));
    totalWarnings += pageWarnings.length;
  }
});

// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
logHeader('Audit Summary & Quality Gate');
console.log(`Audited: ${htmlFiles.length} HTML files`);
console.log(`Errors:  ${totalErrors === 0 ? colors.green + '0' : colors.red + totalErrors}${colors.reset}`);
console.log(`Warnings:${totalWarnings === 0 ? colors.green + '0' : colors.yellow + totalWarnings}${colors.reset}`);

if (totalErrors === 0) {
  console.log(`\n${colors.bold}${colors.green}✔ PRE-DEPLOYMENT QUALITY GATE PASSED (ZERO DEFECT)${colors.reset}`);
  console.log(`${colors.cyan}All pages satisfy tag balance, DOM contract, SEO, AdSense, and syntax requirements.${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`\n${colors.bold}${colors.red}✖ PRE-DEPLOYMENT QUALITY GATE FAILED (${totalErrors} blocking error(s))${colors.reset}`);
  console.error(`${colors.red}Deployment or commit is strictly forbidden until all errors are resolved.${colors.reset}\n`);
  process.exit(1);
}
