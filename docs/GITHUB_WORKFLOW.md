# Git and GitHub Workflow

Repository: https://github.com/Vallywi/Rootine

## Status against the requirements

Checked from the local clone on 2026-11-25 with `git log`, `git branch -a`, and `git tag`.

| Requirement | Status |
|---|---|
| One GitHub repository | Done |
| README with setup and run steps | Done |
| `.gitignore` | Done (`.env` is ignored, `.env.example` is kept) |
| At least 15 meaningful commits | Done (28 commits on `main`, plus the commits on the branches below) |
| At least 3 feature branches merged | **Branches are prepared locally but not pushed or merged yet.** See below. |
| At least 3 GitHub Issues | **Not created yet.** Text is ready below. |
| Pull requests for at least 2 merges | **Not opened yet.** |
| Tagged final release (`v1.0.0`) | **Not created yet.** |
| Contributions from each member | **Only one author in the history** (`git shortlog -sn`). Each member needs commits under their own name. |

## Branches that already exist locally (not pushed)

Each branch holds real work that is not on `main` yet.

| Branch | Commits | Content |
|---|---|---|
| `fix/fresh-clone-database` | 1 | Fixes the crash on a fresh clone (defect D-1) and adds a regression test |
| `docs/test-evidence` | 3 (on top of the fix branch) | Real screenshots, executed test report, screenshots in the user manual |
| `docs/vscode-extensions-evidence` | 1 | Installed extension versions and configuration table |
| `docs/presentation` | 2 | The PowerPoint and the script with slide numbers |
| `docs/github-workflow` | 1 | This file |

`docs/test-evidence` is stacked on `fix/fresh-clone-database`, because its report says 129 tests pass. Merge the fix first.

## Steps to finish (needs your GitHub login)

### 1. Create the Issues (GitHub, Issues, New issue)

If the repository already has issues, the numbers below will differ. Use the numbers GitHub gives you in "Closes #n".

| # | Title | Body |
|---|---|---|
| 1 | Backend crashes on a fresh clone | `npm run dev:backend` fails with `ENOENT: mkdir backend/.data/pglite` because the folder does not exist. Found while testing the install guide (TC-07). |
| 2 | Add executed test evidence and screenshots | The test report and user manual need real results and screenshots of the running app. |
| 3 | Document the VS Code extensions used | Record installed versions and configuration files for the five or more extensions. |
| 4 | Add the final presentation | PowerPoint deck and speaker script for the demonstration. |

### 2. Push the branches

```bash
git push -u origin fix/fresh-clone-database
git push -u origin docs/test-evidence
git push -u origin docs/vscode-extensions-evidence
git push -u origin docs/presentation
git push -u origin docs/github-workflow
```

### 3. Open and merge the pull requests, in this order

1. `fix/fresh-clone-database`: write `Closes #1`, review the diff (a classmate or yourself), then **Merge pull request**.
2. `docs/test-evidence`: `Closes #2`. After step 1 GitHub shows only its own 3 commits.
3. `docs/vscode-extensions-evidence`: `Closes #3`.
4. `docs/presentation`: `Closes #4`.

Open at least two pull requests. Four is better.

### 4. Update your local copy and tag the release

```bash
git switch main
git pull
npm test                       # expect 129 passing
git tag -a v1.0.0 -m "Rootine 1.0.0: course submission"
git push origin v1.0.0
```

On GitHub: **Releases**, **Draft a new release**, choose `v1.0.0`.

### 5. Group contributions

Each member should make at least one real commit with their own Git identity (`git config user.name` and `user.email`), for example by taking one of the open items (a task from the "Known gaps" list in `TEST_REPORT.md`, a missing test, or the screenshots of VS Code). Check with `git shortlog -sn`. Do not create commits under another person's name.

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
