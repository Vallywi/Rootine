# VS Code Extensions Report

The workspace recommends these extensions in `.vscode/extensions.json`. VS Code offers to install them when the folder is opened. Settings are in `.vscode/settings.json`, `.prettierrc.json`, and `.editorconfig`. Debug setups are in `.vscode/launch.json`.

| # | Extension (ID) | Purpose | How it is used in Rootine |
|---|---|---|---|
| 1 | Prettier (`esbenp.prettier-vscode`) | Formats code on save | Rules in `.prettierrc.json`: single quotes, semicolons, width 140, matching the existing code style |
| 2 | GitLens (`eamodio.gitlens`) | Shows who changed each line and when, plus file and branch history | Inspect commit history and blame for the Git workflow evidence |
| 3 | Error Lens (`usernamehw.errorlens`) | Shows errors and warnings inline | Catch mistakes while editing `ai.js` and the routes |
| 4 | REST Client (`humao.rest-client`) | Sends HTTP requests from a file | `docs/rootine.http` calls `/api/health`, `/api/auth/register`, and `/api/chat` |
| 5 | EditorConfig (`editorconfig.editorconfig`) | Keeps indentation and line endings consistent | Rules in `.editorconfig` |
| 6 | Markdown Preview Mermaid Support (`bierner.markdown-mermaid`) | Renders Mermaid diagrams in the preview | Previews the diagrams in `docs/architecture.md` and `docs/DESIGN_PATTERNS.md` |

## Install and configure

1. Open the project folder in VS Code.
2. Accept the prompt "Do you want to install the recommended extensions?" or open the Extensions view, type `@recommended`, and install each.
3. Reload VS Code.
4. Prettier: confirm `.prettierrc.json` is picked up by running **Format Document** on a `.js` file.
5. REST Client: open `docs/rootine.http`, start the backend, click **Send Request** above a request.

## Evidence to capture (TODO, screenshots in `screenshots/extensions/`)

- [ ] Extensions view showing the six installed extensions
- [ ] Prettier formatting a file (before and after)
- [ ] GitLens blame annotation and file history
- [ ] Error Lens showing an inline error
- [ ] REST Client response from `/api/health` and `/api/chat`

## Reflection (write your own after using them)

- Which extension saved the most time, and why?
- Any conflict or limitation. Known to check: Prettier and the existing code style may reformat many lines on first run. Run it on one file and review the diff before formatting the whole project. REST Client cookies and the CSRF token must be passed manually, as in `rootine.http`.
