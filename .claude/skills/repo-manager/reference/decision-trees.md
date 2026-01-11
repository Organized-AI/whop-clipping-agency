# Decision Trees

## Version Number Selection

```
What changed?
├─ Breaking changes/major reorg → Major (X.0.0)
├─ 6+ skills added → Major (X.0.0)
├─ 3-5 skills added → Minor (x.X.0)
├─ 1-2 skills added → Patch (x.x.X)
├─ Docs only (major) → Minor (x.X.0)
└─ Docs only (minor) → Patch (x.x.X)
```

## When to Update README

```
Repository change?
├─ Skill added → Update (add to category, matrix)
├─ Skill removed → Update (remove references)
├─ Skill modified → Update affected sections
├─ Version released → Update version + What's New
└─ No change → No update needed
```

## License Compatibility

```
License type?
├─ MIT → ✅ Proceed
├─ Apache 2.0 → ✅ Proceed
├─ BSD → ✅ Proceed
├─ CC0/Public Domain → ✅ Proceed
├─ GPL/AGPL → ❌ Stop (copyleft)
├─ Proprietary → ❌ Stop
└─ No license → ❌ Stop
```

## Branch Naming

```
Operation?
├─ Add skills → feature/add-[names]
├─ Update docs → feature/update-readme-[version]
├─ Release → release/v[version]
├─ Fix bug → fix/[description]
└─ Maintenance → chore/[description]
```

## Quality Validation

```
Before commit:
├─ SKILL.md present? → If no, STOP
├─ Size 2-5KB? → If no, warn
├─ YAML frontmatter? → If no, STOP
├─ All skills in README? → If no, update
└─ .DS_Store files? → Remove
```
