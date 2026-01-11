# Quality Checklist

Run before any PR or release.

## Skill Structure

- [ ] Has SKILL.md (required)
- [ ] SKILL.md has YAML frontmatter with `name` and `description`
- [ ] Size: 2-5KB (modular)
- [ ] Contains activation phrases
- [ ] Documents tool requirements
- [ ] No .DS_Store, node_modules, package.json

## Documentation

- [ ] All skills listed in README
- [ ] Skills organized by category
- [ ] Comparison matrix current
- [ ] Version number updated
- [ ] All links work

## Attribution

- [ ] External skills have attribution file
- [ ] Source URLs included
- [ ] License types documented
- [ ] Skills list accurate

## Repository Health

- [ ] No uncommitted changes
- [ ] No merge conflicts
- [ ] Skill directories: lowercase-with-hyphens
- [ ] Version semantic (X.X.X)

## License Compliance

- [ ] All external skills MIT-compatible
- [ ] Attribution present
- [ ] Credit to original authors

## Quick Validation

```bash
# Check for unnecessary files
find skills/ -name ".DS_Store" -o -name "node_modules"

# Count skills
ls -d skills/*/ | wc -l

# Check README version
grep "Version:" README.md

# Verify clean state
git status
```
