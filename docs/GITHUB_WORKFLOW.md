# Git and GitHub Workflow

Repository: https://github.com/Vallywi/Rootine

## Status against the requirements

Checked from the local clone with `git log`, `git branch -a`, and `git tag`.

| Requirement | Status |
|---|---|
| One GitHub repository | Done (`origin` points to the repository above) |
| README with setup and run steps | Done (`README.md`) |
| `.gitignore` | Done (`.env`, `node_modules`, `.data` are ignored; `.env.example` is kept) |
| At least 15 meaningful commits | Done (27 commits on `main`) |
| At least 3 feature branches merged | **Not done.** Only `main` exists. |
| At least 3 GitHub Issues | **Not done.** Check on GitHub, then create them. |
| Pull requests for at least 2 merges | **Not done.** |
| Tagged final release (`v1.0.0`) | **Not done.** `git tag` is empty. |

All 27 commits so far went straight to `main`. Branch and pull request history cannot be created after the fact, so the remaining items must be produced by doing real, small pieces of work on branches from now on. Do not fake history.

## Suggested work for the missing items

Each branch carries a real change. The documentation and test work in this folder fits naturally.

| Issue | Branch | Content |
|---|---|---|
| #1 Add tests for the Gemini client failure paths | `feature/ai-client-tests` | `backend/tests/ai-client.test.js` |
| #2 Add course documentation (SRS, API, design, manual, test report) | `docs/course-documentation` | the files in `docs/` |
| #3 Add VS Code workspace configuration | `feature/vscode-config` | `.vscode/`, `.editorconfig`, `.prettierrc.json` |
| #4 (optional) Document the Strategy pattern in `db.js` with code comments | `feature/strategy-docs` | comments in `backend/src/db.js` |

## Commands

```bash
# 1. Start from an up-to-date main
git switch main
git pull

# 2. Create a branch for one piece of work
git switch -c feature/ai-client-tests

# 3. Stage and commit only the files for this work
git add backend/tests/ai-client.test.js
git commit -m "Add tests for Gemini client errors and the database strategy"

# 4. Publish the branch
git push -u origin feature/ai-client-tests
```

Then on GitHub: **Compare & pull request**, write `Closes #1` in the description, review the changes (a classmate or yourself), and **Merge pull request**. Back on your computer:

```bash
git switch main
git pull
git branch -d feature/ai-client-tests
```

Repeat for each branch. Open at least two pull requests.

### Create the issues

On GitHub: **Issues**, **New issue**, one for each row above.

### Tag the final release

After all merges and a passing `npm test`:

```bash
git switch main
git pull
git tag -a v1.0.0 -m "Rootine 1.0.0: course submission"
git push origin v1.0.0
```

Then on GitHub: **Releases**, **Draft a new release**, choose `v1.0.0`.

## Command purposes

| Command | Purpose |
|---|---|
| `git switch -c NAME` | Create and move to a new branch |
| `git add FILE` | Stage a file for the next commit |
| `git commit -m "..."` | Save the staged changes with a message |
| `git push -u origin NAME` | Upload the branch and link it to the remote |
| `git pull` | Download and merge remote changes |
| `git tag -a v1.0.0 -m "..."` | Mark a release point |
| `git log --oneline --graph` | Show history for screenshots |

## Group projects

If this is a group project, each member should commit under their own name. Check with `git shortlog -sn`. At the moment all commits are by one author.
