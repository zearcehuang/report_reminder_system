/**
 * check_secrets.js
 * Pre-commit security check script to detect accidental secret, key, or PII leakage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SENSITIVE_PATTERNS = [
  {
    name: 'Google API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/g,
    ignoreSample: /AIzaSyDemo|AIzaSy_Dummy/
  },
  {
    name: 'OpenAI Secret Key',
    regex: /sk-[a-zA-Z0-9]{20,}/g,
    ignoreSample: /sk-test|sk-dummy/
  },
  {
    name: 'Generic Private Key',
    regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/g
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /ghp_[0-9a-zA-Z]{36}/g
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g
  },
  {
    name: 'Hardcoded JWT Secret',
    regex: /JWT_SECRET\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/g
  }
];

const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.exe', '.dll', '.lock'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'uploads', 'data'];

function getFilesToCheck() {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (staged.length > 0) {
      return staged;
    }
  } catch (err) {
    // If git command fails, fall back to checking all tracked files
  }

  try {
    return execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
  } catch (err) {
    return [];
  }
}

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const ext = path.extname(filePath).toLowerCase();
  if (IGNORE_EXTENSIONS.includes(ext)) return [];

  for (const ignoreDir of IGNORE_DIRS) {
    if (filePath.split(/[/\\]/).includes(ignoreDir)) return [];
  }

  const findings = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    for (const pattern of SENSITIVE_PATTERNS) {
      const matches = line.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          if (pattern.ignoreSample && pattern.ignoreSample.test(match)) {
            continue;
          }
          findings.push({
            file: filePath,
            line: idx + 1,
            rule: pattern.name,
            matchedSnippet: match.substring(0, 10) + '...'
          });
        }
      }
    }
  });

  return findings;
}

function main() {
  console.log('🔍 Running Pre-Commit Secret & Credential Scan...');
  const files = getFilesToCheck();
  let totalFindings = [];

  for (const file of files) {
    const findings = checkFile(file);
    if (findings.length > 0) {
      totalFindings = totalFindings.concat(findings);
    }
  }

  if (totalFindings.length > 0) {
    console.error('\n❌ [SECURITY VIOLATION] Detected potential secrets/credentials in files to commit:');
    totalFindings.forEach(f => {
      console.error(`  - ${f.file}:${f.line} [${f.rule}] -> ${f.matchedSnippet}`);
    });
    console.error('\nPlease remove sensitive credentials before committing.\n');
    process.exit(1);
  }

  console.log(`✅ Security Scan Passed (${files.length} files scanned, 0 secrets detected).\n`);
}

main();
