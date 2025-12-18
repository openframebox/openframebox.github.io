#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPOS = [
  'gomigration',
  'goevent',
  'goqueue',
  'gomail',
  'gostorage',
  'goauth',
  'govalidator',
  'goinit',
];

const OWNER = 'openframebox';
const TOKEN = process.env.TOKEN;

async function fetchRepoData(owner, repo) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'openframebox-site-builder'
  };

  if (TOKEN) {
    headers['Authorization'] = `token ${TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${repo}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Extract only the fields we need
  return {
    name: data.name,
    description: data.description,
    html_url: data.html_url,
    stargazers_count: data.stargazers_count,
    language: data.language,
    license: data.license ? {
      spdx_id: data.license.spdx_id
    } : null
  };
}

async function main() {
  try {
    console.log('Fetching repository data from GitHub...');

    const repos = [];
    for (const repo of REPOS) {
      console.log(`  Fetching ${repo}...`);
      const data = await fetchRepoData(OWNER, repo);
      repos.push(data);
    }

    // Sort by stars (descending)
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Write to data directory
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'repositories.json');
    fs.writeFileSync(outputPath, JSON.stringify(repos, null, 2));

    console.log(`✓ Successfully wrote ${repos.length} repositories to ${outputPath}`);
    console.log(`  Total stars: ${repos.reduce((sum, r) => sum + r.stargazers_count, 0)}`);

  } catch (error) {
    console.error('Error fetching repository data:', error.message);
    process.exit(1);
  }
}

main();
