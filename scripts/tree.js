#!/usr/bin/env node
/*
 Prints a clean project tree that respects .gitignore by using `git ls-files`.
 - Shows top-level files and directories
 - For each top-level directory, lists only first-level subdirectories
 - Omits detailed file listings for readability
 */

const { execSync } = require('child_process')

function getGitFiles() {
  try {
    const out = execSync('git ls-files', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return out.split('\n').filter(Boolean)
  } catch (e) {
    return []
  }
}

function unique(arr) {
  return Array.from(new Set(arr))
}

function main() {
  const files = getGitFiles()
  const topLevelFiles = files.filter((p) => !p.includes('/'))
  const topLevelDirs = unique(
    files
      .filter((p) => p.includes('/'))
      .map((p) => p.split('/')[0])
  ).sort()

  // Helpful ordering: put common folders first
  const priority = new Map([
    ['ai_docs', 1],
    ['agents', 2],
    ['app', 3],
    ['components', 4],
    ['libs', 5],
    ['public', 6],
    ['types', 7],
  ])

  topLevelDirs.sort((a, b) => {
    const pa = priority.get(a) || 999
    const pb = priority.get(b) || 999
    if (pa !== pb) return pa - pb
    return a.localeCompare(b)
  })

  // Print title
  console.log('Project structure (clean view)\n')

  // Print top-level files
  if (topLevelFiles.length) {
    console.log('• Files:')
    topLevelFiles.sort().forEach((f) => console.log(`  - ${f}`))
    console.log('')
  }

  // Print top-level dirs and first-level children (dirs only)
  console.log('• Directories:')
  for (const dir of topLevelDirs) {
    console.log(`${dir}/`)
    const children = unique(
      files
        .filter((p) => p.startsWith(dir + '/'))
        .map((p) => p.split('/').slice(1)) // remove top-level dir
        .filter((parts) => parts.length > 0)
    )

    // First-level directories inside this top-level dir
    const firstLevelCandidates = unique(
      children
        .filter((parts) => parts.length >= 1)
        .map((parts) => parts[0])
        .filter((name) => name && !name.startsWith('.'))
    )
    const firstLevelDirs = firstLevelCandidates
      .filter((name) => files.some((p) => p.startsWith(`${dir}/${name}/`)))
      .sort()

    // Limit noisy listing by showing only directories, not files
    for (const sub of firstLevelDirs) {
      console.log(`  ${sub}/`)
    }

    // Collapse direct files or deeper content for readability
    const hasAnyContent = children.length > 0
    if (hasAnyContent) {
      console.log('  ...')
    }
  }
}

main()
