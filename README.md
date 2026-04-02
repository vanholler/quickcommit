# quickcommit

A global CLI utility that executes your full Git cycle with one command: `git add .`, `git commit -m`, and `git push`.

## Install

```bash
npm install -g git-quickcommit
```

## Usage

```bash
qc "your commit message"
```

## What it does

When you run:

```bash
qc "update login flow"
```

it executes this flow:

1. `git add .`
2. `git commit -m "update login flow"`
3. `git push` (or `git push --set-upstream origin <branch>` if upstream is missing)

## `bin/qc.js` Logic

```text
qc "commit message"
  |
  +--> commit message provided?
  |      +--> no  -> error and exit
  |      +--> yes
  |
  +--> inside a git repository?
  |      +--> no  -> error and exit
  |      +--> yes
  |
  +--> detect current branch
  +--> upstream exists?
         +--> yes:
         |      +--> git fetch
         |      +--> local branch behind remote?
         |             +--> yes -> "update branch first" and exit
         |             +--> no  -> continue
         |
         +--> no:
                +--> continue
  |
  +--> git add .
  +--> git commit -m "message"
  +--> upstream exists?
         +--> yes -> git push
         +--> no  -> git push --set-upstream origin <branch>
  |
  +--> done
```

Command sequence used internally:

1. `git rev-parse --is-inside-work-tree`
2. `git rev-parse --abbrev-ref HEAD`
3. `git rev-parse --abbrev-ref --symbolic-full-name @{u}`
4. If upstream exists: `git fetch`
5. If upstream exists: `git rev-list --left-right --count HEAD...@{u}` (block when behind remote)
6. `git add .`
7. `git commit -m "your message"`
8. `git push` or `git push --set-upstream origin <branch>`

## Requirements

- Node.js 14+
- Git installed and available in PATH

## Notes

- Run `qc` only inside a git repository.
- If your local branch is behind remote, `qc` stops and asks you to update the branch first.
- If `git commit` fails (for example, no changes staged), the process stops and prints the git error.

## License

MIT
