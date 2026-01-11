---
name: repo-manager
description: Automates claude-skills-worth-using repository operations including adding skills, updating README, versioning, and releases. Use when managing skills repository, adding external skills, updating documentation, creating releases, or checking repository health.
---

# Repository Manager

Automates all claude-skills-worth-using repository operations.

## Quick Reference

| Operation | Command Example |
|-----------|-----------------|
| Status | "Check skills repo status" |
| Add skills | "Add [skill] from [source]" |
| Update docs | "Update skills README" |
| Release | "Release version X.X.X" |

## Core Workflows

### 1. Status Check (Start Here)

```
1. Scan skills directory for count
2. Check README version
3. List open PRs
4. Report health: Excellent/Good/Needs Attention
```

### 2. Adding External Skills

**Phase 1: Validate**
- Verify MIT-compatible license (MIT, Apache 2.0, BSD, CC0)
- Confirm skills to add
- Check for duplicates

**Phase 2: Prepare**
- Download: SKILL.md, README.md, /references, /examples
- Clean: Remove .DS_Store, node_modules, package.json
- Validate: YAML frontmatter, 2-5KB size, activation phrases

**Phase 3: Push**
- Branch: `feature/add-[skill-names]`
- Use `github:push_files` for atomic upload
- Update attribution file

**Phase 4: Create PR**
- Include quality checklist
- Link source repository
- Ready to merge

### 3. README Updates

Trigger: After adding/removing skills or releasing versions.

```
1. Scan all /skills directories
2. Categorize by description keywords
3. Generate skill sections with features
4. Update comparison matrix
5. Increment version (1-2 skills=patch, 3-5=minor, 6+=major)
6. Create PR
```

### 4. Version Releases

```
1. Determine version from changes
2. Update README version strings
3. Create release branch and tag
4. Create GitHub release with changelog
```

## Decision Logic

### Version Numbers
```
1-2 skills  → Patch (x.x.X)
3-5 skills  → Minor (x.X.0)
6+ skills   → Major (X.0.0)
Breaking    → Major (X.0.0)
```

### Branch Names
```
Add skills  → feature/add-[names]
Update docs → feature/update-readme-[version]
Release     → release/v[version]
Fix         → fix/[description]
```

### License Compatibility
```
✅ MIT, Apache 2.0, BSD, CC0
❌ GPL, AGPL, Proprietary, No license
```

## Required Tools

- `github:get_file_contents`
- `github:create_branch`
- `github:push_files`
- `github:create_pull_request`

## Reference Files

- [Decision Trees](reference/decision-trees.md) - Complete decision logic
- [Workflows](reference/workflows.md) - Step-by-step procedures
- [PR Templates](reference/pr-templates.md) - Commit and PR formats
- [Quality Checklist](reference/quality-checklist.md) - Validation requirements
