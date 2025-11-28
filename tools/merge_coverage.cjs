#!/usr/bin/env node
/* Merge Node (c8) and Browser (Istanbul) coverage into a unified report. */
const fs = require('fs');
const path = require('path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const report = require('istanbul-lib-report');
const reports = require('istanbul-reports');

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function loadBrowserCoverage(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const data = readJsonIfExists(path.join(dir, f));
    if (data) out.push(data);
  }
  return out;
}

function main() {
  const root = process.cwd();
  const nodeCovPath = path.join(root, 'coverage', 'coverage-final.json');
  const browserDir = path.join(root, 'coverage', 'browser');
  const mergedDir = path.join(root, 'coverage', 'merged');
  fs.mkdirSync(mergedDir, { recursive: true });

  const nodeCov = readJsonIfExists(nodeCovPath);
  const browserCovList = loadBrowserCoverage(browserDir);

  if (!nodeCov && browserCovList.length === 0) {
    console.log('No coverage data found (node or browser). Nothing to merge.');
    return;
  }

  const map = createCoverageMap({});
  if (nodeCov) map.merge(nodeCov);
  for (const b of browserCovList) map.merge(b);

  const mergedJsonPath = path.join(mergedDir, 'coverage-final.json');
  fs.writeFileSync(mergedJsonPath, JSON.stringify(map.toJSON()));

  const context = report.createContext({ dir: mergedDir, coverageMap: map });
  reports.create('lcovonly').execute(context);
  reports.create('html').execute(context);

  console.log('Merged coverage written to:', mergedJsonPath);
}

main();
