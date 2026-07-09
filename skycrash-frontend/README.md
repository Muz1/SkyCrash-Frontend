# SkyCrash — Frontend

The user-facing interface for SkyCrash, a multiplayer crash-style educational game developed for Derivco.

## Tech Stack

> Update this section once your stack is finalised (e.g. React, Vite, Tailwind CSS).

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Repository Structure

```
skycrash-frontend/
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docs/
│   ├── diagrams/         # Architecture, UI wireframes, flow diagrams
│   └── ...               # Any other documentation (specs, meeting notes)
├── src/                  # Application source code
├── CONTRIBUTING.md       # Branching & PR conventions
└── README.md
```

## Documentation & Diagrams

All project documentation lives in the `docs/` folder:
- Drop `.drawio`, `.png`, `.pdf`, or `.md` files into `docs/diagrams/` for any system or UI diagrams
- General docs (specs, decisions, meeting notes) go directly in `docs/`

## CI/CD

- **Feature branches** — tests run automatically on every push
- **`main` branch** — tests must pass before any merge is accepted (branch protection rule)

See `.github/workflows/` for pipeline details.

## Team

| Role | Responsibility |
|------|---------------|
| PM | Project planning & delivery |
| Developer | Frontend implementation |
| BA | Requirements & acceptance criteria |
| Soft Skills | Stakeholder communication |

**Sponsor:** Derivco  
**Mentor:** Dirk Snyman
