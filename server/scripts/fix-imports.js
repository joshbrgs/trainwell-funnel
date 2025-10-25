#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { glob } from 'glob';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

// Find all .js files in dist
const files = glob.sync('**/*.js', { cwd: distDir });

files.forEach((file) => {
  const filePath = join(distDir, file);
  const fileDir = dirname(filePath);
  let content = readFileSync(filePath, 'utf-8');

  // Fix imports - add .js extension or /index.js for directories
  const fixImport = (match, importPath) => {
    if (importPath.endsWith('.js')) {
      return match; // Already has .js
    }

    // Resolve the import path relative to the current file
    const resolvedPath = resolve(fileDir, importPath);

    // Check if it's a directory with index.js
    if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
      const indexPath = join(resolvedPath, 'index.js');
      if (existsSync(indexPath)) {
        return match.replace(importPath, `${importPath}/index.js`);
      }
    }

    // Check if the .js file exists
    if (existsSync(`${resolvedPath}.js`)) {
      return match.replace(importPath, `${importPath}.js`);
    }

    // Default: add .js
    return match.replace(importPath, `${importPath}.js`);
  };

  // Fix 'from' imports
  content = content.replace(
    /from\s+['"](\.[^'"]+)['"]/g,
    fixImport
  );

  // Fix 'import' statements
  content = content.replace(
    /import\s+['"](\.[^'"]+)['"]/g,
    fixImport
  );

  writeFileSync(filePath, content, 'utf-8');
});

console.log(`Fixed imports in ${files.length} files`);
