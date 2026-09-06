## Description: <br>
Multi-step deployment agent for full-stack apps. Build -> Test -> GitHub -> Cloudflare Pages with human approval at each step. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[sherajdev](https://clawhub.ai/user/sherajdev) <br>

### License/Terms of Use: <br>


## Use Case: <br>
Developers and engineers use this skill to guide full-stack app deployments through local build and test, GitHub repository preparation, and Cloudflare Pages deployment checkpoints. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: The skill can mark GitHub and Cloudflare deployment steps complete even when it only prints the commands that would be run. <br>
Mitigation: Treat status values as workflow guidance until the user separately runs and verifies the GitHub and Cloudflare commands and confirms that the repository and deployment exist. <br>
Risk: Cloudflare credentials may be configured in local files with broad token scope. <br>
Mitigation: Use least-privilege Cloudflare API tokens, avoid committing local credential files, and verify token handling before using the skill in a real deployment. <br>
Risk: Deployment guidance can affect public repositories, domains, and Cloudflare Pages configuration. <br>
Mitigation: Keep the documented human approval checkpoints, review generated commands before execution, and test locally before publishing. <br>


## Reference(s): <br>
- [C.R.A.B Deploy Agent on ClawHub](https://clawhub.ai/sherajdev/skills/deploy-agent) <br>
- [Cloudflare Pages Next.js framework guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/) <br>


## Skill Output: <br>
**Output Type(s):** [text, markdown, shell commands, configuration, guidance] <br>
**Output Format:** [Markdown-style terminal guidance with shell commands and JSON, TOML, and TypeScript configuration snippets] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [Maintains local JSON deployment state and requires gh, wrangler, git, and jq for the documented workflow.] <br>

## Skill Version(s): <br>
1.1.0 (source: server release metadata) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
