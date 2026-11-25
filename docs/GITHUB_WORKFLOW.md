# Git and GitHub Workflow

Repository: https://github.com/Vallywi/Rootine

## Status against the requirements

Checked on 2026-11-25 with `git log`, `git branch -a`, `git tag`, and the GitHub pages for Issues, Pull requests, and Releases.

| Requirement | Status |
|---|---|
| One GitHub repository | Done |
| README with setup and run steps | Done |
| `.gitignore` | Done (`.env` is ignored, `.env.example` is kept) |
| At least 15 meaningful commits | Done (41 commits on `main`) |
| At least three feature branches, merged after review | Done (5 branches, all merged by pull request) |
| At least three GitHub Issues | Done (4 Issues, #1 to #4, all closed by pull requests) |
| Pull requests for at least two merges | Done (pull requests #5 to #9 merged, plus #10 for this update) |
| Tagged final release (`v1.0.0`) | Done, see the Releases page |
| Contributions from each member | **Not shown yet.** The whole history uses one Git identity (`git shortlog -sn`). Each member still needs commits under their own name. |

## Issues

| # | Title | Closed by |
|---|---|---|
| 1 | Backend crashes on a fresh clone | PR #5 |
| 2 | Add executed test evidence and screenshots | PR #6 |
| 3 | Document the VS Code extensions used | PR #7 |
| 4 | Add the final presentation | PR #8 |

## Pull requests

| PR | Branch | Content |
|---|---|---|
| #5 | `fix/fresh-clone-database` | Fix the crash on a fresh clone, with a regression test |
| #6 | `docs/test-evidence` | Real screenshots, executed test report, manual screenshots |
| #7 | `docs/vscode-extensions-evidence` | Installed extension versions and configuration files |
| #8 | `docs/presentation` | PowerPoint deck and script with slide numbers |
| #9 | `docs/github-workflow` | First version of this guide |
| #10 | `docs/final-release-status` | This update with the final status |

Each pull request was reviewed by its author (self-review) and merged with a merge commit, so the branches show in the history (`git log --oneline --graph`).

## Commands used

```bash
# 1. Start from an up-to-date main
git switch main
git pull

# 2. Create a branch for one piece of work
git switch -c fix/fresh-clone-database

# 3. Stage and commit only the files for this work
git add backend/src/db.js backend/tests/db-fresh-folder.test.js
git commit -m "Fix crash on a fresh clone: create the local database folder"

# 4. Publish the branch, then open a pull request on GitHub ("Closes #1")
git push -u origin fix/fresh-clone-database

# 5. After the merge, update main and tag the release
git switch main
git pull
git tag -a v1.0.0 -m "Rootine 1.0.0: course submission"
git push origin v1.0.0
```

## Command purposes

| Command | Purpose |
|---|---|
| `git switch -c NAME` | Create and move to a new branch |
| `git add FILE` | Stage a file for the next commit |
| `git commit -m "..."` | Save the staged changes with a message |
| `git push -u origin NAME` | Upload the branch and link it to the remote |
| `git pull` | Download and merge remote changes |
| `git tag -a v1.0.0 -m "..."` | Mark a release point |
| `git shortlog -sn` | Count commits per author |
| `git log --oneline --graph --all` | Show history and branches for screenshots |

## Group contributions

Each member should make at least one real commit with their own Git identity (`git config user.name` and `user.email`), for example by taking one of the items in the "Known gaps" list of `docs/TEST_REPORT.md`, adding a test, or adding the VS Code screenshots. Check with `git shortlog -sn`. Do not create commits under another person's name.
