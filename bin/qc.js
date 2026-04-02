#!/usr/bin/env node

const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function logInfo(message) {
  console.log(`${COLORS.cyan}${message}${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}${message}${COLORS.reset}`);
}

function logWarn(message) {
  console.log(`${COLORS.yellow}${message}${COLORS.reset}`);
}

function logError(message) {
  console.error(`${COLORS.red}${message}${COLORS.reset}`);
}

function run(command, options = {}) {
  return execSync(command, {
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8'
  });
}

function safeRun(command) {
  try {
    return run(command, { capture: true }).trim();
  } catch (_error) {
    return null;
  }
}

function main() {
  const message = process.argv.slice(2).join(' ').trim();

  if (!message) {
    logError('Error: please provide a commit message. Example: qc "my message"');
    process.exit(1);
  }

  const insideRepo = safeRun('git rev-parse --is-inside-work-tree');
  if (insideRepo !== 'true') {
    logError('Error: current directory is not a git repository.');
    process.exit(1);
  }

  try {
    const branch = safeRun('git rev-parse --abbrev-ref HEAD');
    if (!branch || branch === 'HEAD') {
      logError('Error: unable to determine current branch.');
      process.exit(1);
    }

    const upstream = safeRun('git rev-parse --abbrev-ref --symbolic-full-name @{u}');
    if (upstream) {
      logInfo('Checking remote updates: git fetch');
      run('git fetch');

      const counts = safeRun('git rev-list --left-right --count HEAD...@{u}');
      const parts = counts ? counts.split(/\s+/) : [];
      const behind = Number(parts[1] || 0);

      if (behind > 0) {
        logError('Error: local branch is behind remote. Сначала обновите ветку.');
        process.exit(1);
      }
    }

    logInfo('1/3 Running: git add .');
    run('git add .');

    logInfo(`2/3 Running: git commit -m "${message}"`);
    run(`git commit -m ${JSON.stringify(message)}`);

    if (upstream) {
      logInfo('3/3 Running: git push');
      run('git push');
    } else {
      logWarn(`No upstream for branch "${branch}". Setting upstream to origin/${branch}.`);
      logInfo(`3/3 Running: git push --set-upstream origin ${branch}`);
      run(`git push --set-upstream origin ${branch}`);
    }

    logSuccess('Done: changes added, committed, and pushed successfully.');
  } catch (error) {
    logError('Failed: command execution stopped due to an error.');
    if (error && error.message) {
      logError(error.message);
    }
    process.exit(1);
  }
}

main();
