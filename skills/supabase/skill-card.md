## Description: <br>
Connects an agent to Supabase for database operations, SQL queries, CRUD workflows, table inspection, RPC calls, and pgvector similarity search. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[lucassynnott](https://clawhub.ai/user/lucassynnott) <br>

### License/Terms of Use: <br>


## Use Case: <br>
Developers and operators use this skill to let an agent inspect and modify Supabase project data, run SQL and RPC calls, manage tables, and perform vector similarity search when pgvector and OpenAI embeddings are configured. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: The Supabase service role key grants broad database-admin access and can bypass Row Level Security. <br>
Mitigation: Use a test project or restricted credentials where possible, keep credentials out of prompts and logs, and review write, delete, raw-SQL, and RPC actions before execution. <br>
Risk: Vector-search queries are sent to OpenAI for embedding generation when OPENAI_API_KEY is configured. <br>
Mitigation: Avoid vector-search queries containing secrets, customer data, or proprietary text unless sending that text to OpenAI is acceptable. <br>


## Reference(s): <br>
- [ClawHub skill page](https://clawhub.ai/lucassynnott/skills/supabase) <br>


## Skill Output: <br>
**Output Type(s):** [text, markdown, code, shell commands, configuration, guidance] <br>
**Output Format:** [Markdown with inline bash, SQL, and JSON examples] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [Requires SUPABASE_URL and SUPABASE_SERVICE_KEY; vector search also requires OPENAI_API_KEY.] <br>

## Skill Version(s): <br>
1.0.0 (source: server release evidence) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
