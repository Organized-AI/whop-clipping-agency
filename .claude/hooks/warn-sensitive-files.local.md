---
name: warn-sensitive-files
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$|\.env\.|credentials|secrets|service-account
---

🔐 **Sensitive file detected**

You're editing a file that may contain sensitive data:
- Ensure credentials are not hardcoded
- Use environment variables for secrets
- Verify this file is in .gitignore
- Consider using a secrets manager

**Project-specific:** Service account JSON files contain private keys - never commit them!
