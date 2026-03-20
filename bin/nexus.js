#!/usr/bin/env node
import('../dist/index.js').catch(err => {
  console.error('Failed to start nexus:', err.message);
  process.exit(1);
});
