# Contributing to SkyCrash Frontend

## Branch Naming

Always branch off `main`. Use this format:

```
<type>/<short-description>
```

| Type | When to use |
|------|-------------|
| `feature/` | New functionality (e.g. `feature/game-lobby-ui`) |
| `fix/` | Bug fixes (e.g. `fix/crash-counter-display`) |
| `docs/` | Documentation only (e.g. `docs/update-readme`) |
| `chore/` | Config, dependencies, CI changes |
| `test/` | Adding or fixing tests |

## Workflow

1. Pull the latest `main`
   ```bash
   git checkout main
   git pull origin main
   ```

2. Create your branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Commit regularly with clear messages
   ```bash
   git commit -m "feat: add lobby countdown timer"
   ```

4. Push your branch and open a Pull Request to `main`
   ```bash
   git push origin feature/your-feature-name
   ```

5. CI will run automatically — **all checks must pass before merging**

6. Get at least one teammate to review before merging

## Commit Message Format

```
<type>: <short description>
```

Examples:
- `feat: add multiplayer room creation`
- `fix: resolve score not updating on crash`
- `docs: add wireframe for game screen`
- `chore: update Node version in CI`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Add a short description of what changed and why
- Link to any relevant tasks or issues
- Don't merge your own PR without a review (except for docs/chore)
