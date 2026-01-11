# Workflows

## Adding External Skills

### Phase 1: Validate (2 min)
1. Identify source repository
2. Check license via `github:get_file_contents` on LICENSE
3. Verify MIT or compatible
4. Confirm skills to add with user

### Phase 2: Prepare (2-3 min)
1. Download complete structure:
   - SKILL.md, README.md
   - /references, /examples directories
2. Clean files (remove .DS_Store, node_modules, package.json)
3. Validate SKILL.md (YAML frontmatter, 2-5KB, activation phrases)
4. Create/update attribution file

### Phase 3: Push (1 min)
1. Create branch: `feature/add-[skill-names]`
2. Use `github:push_files` for atomic upload
3. Update attribution file

### Phase 4: Create PR (30 sec)
Use template with quality checklist, source link, ready to merge.

---

## README Update

1. Scan all `/skills` directories
2. Read SKILL.md frontmatter for each
3. Categorize by description keywords
4. Generate skill sections with features
5. Update comparison matrix
6. Increment version based on changes
7. Create branch and PR

---

## Version Release

1. Determine version from changes (see decision-trees.md)
2. Update version strings in README
3. Create release branch: `release/vX.X.X`
4. Tag commit
5. Create GitHub release with changelog

---

## Weekly Maintenance

- Check external skills for updates
- Verify all links work
- Clean unnecessary files
- Check repository health

## Monthly Maintenance

- Documentation review
- Quality audit
- Archive outdated skills
- Refresh examples
