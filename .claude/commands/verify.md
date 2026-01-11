---
name: verify
description: Run verification checks on the project
arguments:
  - name: type
    description: Verification type (types, build, all)
    required: false
---

# Verify Command

Run verification checks to ensure project health.

## Usage
```
/verify [type]
```

## Verification Types

| Type | Description | Command |
|------|-------------|---------|
| types | TypeScript type checking | `npm run typecheck` |
| build | Build verification | `npm run build` |
| deps | Dependency check | `npm ls --depth=0` |
| all | All checks | All of the above |

## Examples
```
/verify           # Run all checks
/verify types     # Type checking only
/verify build     # Build verification only
```

## Execution

### Type Check
```bash
npm run typecheck
```

### Build Check
```bash
npm run build
```

### Dependency Check
```bash
npm ls --depth=0
npm outdated
```

### All Checks
```bash
echo "🔍 Running verification..."
echo ""
echo "1️⃣ Type Check:"
npm run typecheck && echo "✅ Types OK" || echo "❌ Type errors"
echo ""
echo "2️⃣ Build Check:"
npm run build && echo "✅ Build OK" || echo "❌ Build failed"
echo ""
echo "3️⃣ Dependency Check:"
npm ls --depth=0 2>&1 | grep -E "^(├|└)" | head -20
echo ""
echo "✅ Verification complete"
```

## Integration with TypeScript Verifier Agent

For comprehensive verification, invoke the `typescript-verifier` agent:

```
Use the typescript-verifier agent to run a full project verification.
```

This will provide:
- Detailed type analysis
- Configuration validation
- Best practice recommendations
- Security checks
