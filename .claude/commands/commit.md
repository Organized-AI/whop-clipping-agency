---
name: commit
description: Stage all changes and create a conventional commit with proper message
---

# Command: /commit

## Purpose
Create a properly formatted git commit following conventional commit standards.

## Usage
```
/commit [type] [message]
```

## Commit Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change that neither fixes nor adds
- `perf` - Performance improvement
- `test` - Adding tests
- `chore` - Build, tooling, etc.

## Behavior
1. Run `git add -A`
2. Run `git status` to show changes
3. Create commit with format: `type: message`
4. Optionally push to origin

## Examples
- `/commit feat add webhook signature verification`
- `/commit fix handle null membership metadata`
- `/commit docs update phase 2 instructions`
- `/commit refactor extract drive service methods`

## Implementation
```bash
git add -A
git commit -m "${TYPE}: ${MESSAGE}"
git push origin main
```
