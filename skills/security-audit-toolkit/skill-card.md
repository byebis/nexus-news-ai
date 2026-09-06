## Description: <br>
Audit codebases and infrastructure for security issues, including dependency vulnerabilities, hardcoded secrets, OWASP code patterns, SSL/TLS configuration, file permissions, and injection or authentication flaws. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[gitgoodordietrying](https://clawhub.ai/user/gitgoodordietrying) <br>

### License/Terms of Use: <br>


## Use Case: <br>
Developers, security engineers, and audit reviewers use this skill to scan projects for dependency vulnerabilities, exposed secrets, OWASP-style code issues, TLS weaknesses, and risky file permissions before release or review. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: Secret scans can reveal real credentials in output. <br>
Mitigation: Treat secret-scan results as sensitive and rotate any real credentials that are found. <br>
Risk: Automatic dependency fixes can introduce unintended changes. <br>
Mitigation: Review dependency auto-fix diffs before committing or deploying them. <br>
Risk: Pre-commit hooks can block local commits or be bypassed without review. <br>
Mitigation: Install the hook only when local commit blocking is desired, and use bypasses only for reviewed exceptions. <br>


## Reference(s): <br>
- [ClawHub Skill Page](https://clawhub.ai/gitgoodordietrying/skills/security-audit-toolkit) <br>
- [Trivy Documentation](https://aquasecurity.github.io/trivy) <br>


## Skill Output: <br>
**Output Type(s):** [Guidance, Shell commands, Code, Configuration instructions, Markdown] <br>
**Output Format:** [Markdown with bash code blocks, scripts, command examples, and checklists] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [May produce local audit findings, secret-pattern matches, dependency vulnerability reports, and suggested remediation commands.] <br>

## Skill Version(s): <br>
1.0.0 (source: server release metadata) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
