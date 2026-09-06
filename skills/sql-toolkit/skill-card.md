## Description: <br>
Query, design, migrate, and optimize SQL databases for SQLite, PostgreSQL, and MySQL, including schema design, queries, migrations, indexing, backup and restore, and slow-query debugging without ORMs. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[gitgoodordietrying](https://clawhub.ai/user/gitgoodordietrying) <br>

### License/Terms of Use: <br>


## Use Case: <br>
Developers and engineers use this skill to work directly with relational databases from the command line, including schema design, query writing, migrations, indexing, backup and restore, and performance troubleshooting. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: Migration, import, and restore examples can change schemas, overwrite data, or restore into the wrong database. <br>
Mitigation: Verify the target host and database, create a fresh backup before destructive operations, and prefer restoring into a new database first. <br>
Risk: Database commands may expose credentials through shared shell history, logs, or overly broad database permissions. <br>
Mitigation: Use least-privilege credentials and avoid placing real passwords in command lines, shared logs, or reusable shell history. <br>


## Reference(s): <br>


## Skill Output: <br>
**Output Type(s):** [text, markdown, code, shell commands, configuration, guidance] <br>
**Output Format:** [Markdown with SQL and shell command examples] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [Requires at least one supported database CLI: sqlite3, psql, or mysql.] <br>

## Skill Version(s): <br>
1.0.0 (source: ClawHub release metadata) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
