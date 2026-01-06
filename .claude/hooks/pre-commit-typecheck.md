---
name: pre-commit-typecheck
description: Run TypeScript type checking before commits to catch errors early
trigger: PreToolUse
tools: [Bash]
---

# Hook: pre-commit-typecheck

## Trigger Conditions
- Event: Before any bash command containing `git commit`
- Filter: Only on commit operations

## Behavior
Run `npm run typecheck` before allowing the commit to proceed. If type errors exist, display them and block the commit.

## Implementation
```bash
#!/bin/bash
# Check if this is a git commit command
if [[ "$1" == *"git commit"* ]]; then
  echo "🔍 Running type check before commit..."
  npm run typecheck
  
  if [ $? -ne 0 ]; then
    echo "❌ Type errors found. Please fix before committing."
    exit 1
  fi
  
  echo "✅ Type check passed!"
fi
```

## Skip Condition
If the commit message contains `[skip-typecheck]`, bypass this hook.
