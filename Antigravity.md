# Everything Claude Code (ECC) — Antigravity Configuration & Instructions

This project follows Google's [Antigravity](https://antigravity.dev) configuration conventions inspired by the [everything-claude-code (ECC)](https://github.com/pythonstrup/everything-claude-code/blob/main/docs/ANTIGRAVITY-GUIDE.md) guidelines.

---

## 🎯 Core Principles

1. **Agent-First**: Delegate domain-specific tasks to specialized agents.
2. **Test-Driven (TDD)**: Write tests before implementation, aim for high test coverage (>80%).
3. **Security-First**: Never compromise security; validate all inputs and ensure zero hardcoded secrets.
4. **Immutability**: Maintain state integrity; prefer immutable data transformations.
5. **Plan Before Execute**: Plan complex features thoroughly before writing code.

---

## 📂 Directory Layout & Mappings

Antigravity uses the `.agent/` directory structure for managing rules, workflows, and skills:

| ECC Source Component | Antigravity Target Path | Description |
|---|---|---|
| `rules/` | `.agent/rules/` | Flattened coding standards & language rules |
| `commands/` | `.agent/workflows/` | Workflows and slash command definitions |
| `agents/` | `.agent/skills/` | Skill definitions and specialized subagent capabilities |

---

## 🤖 Agent Orchestration Guidelines

Proactively trigger relevant subagents or workflows:
- **Complex Features / Refactoring** ➔ Trigger `planner`
- **Code Modified / Pull Request Review** ➔ Trigger `code-reviewer`
- **TDD Development & Fixes** ➔ Trigger `tdd-guide`
- **Architectural & Scalability Decisions** ➔ Trigger `architect`
- **Security Check Before Commit** ➔ Trigger `security-reviewer`
- **Build / Type Failure Resolution** ➔ Trigger `build-error-resolver`

---

## 🛡️ Security Checklists

Before completing any commit or PR:
- [ ] No hardcoded secrets, API keys, or private tokens.
- [ ] Input validation & sanitization enforced on API endpoints.
- [ ] Proper error handling & logger without leaking sensitive stack traces.

---

## 🏛️ Complex Project Architectural Standards

### 1. Advanced Frontend & Content Pipeline Standards (`gaearon/overreacted.io`)
- **Development & Workflow Explicit Rules**: Document precise scripts for development (`dev`), production build (`build`), linting (`lint`), and dependency post-install patching (`postinstall`).
- **Structured Content & Component Mapping**: Enforce standard directory conventions for static content, metadata frontmatter parsing (`gray-matter`), and modular inline component loading (`components.js`).
- **Static Export & Rendering Pipeline**: Maintain step-by-step documentation for content pipeline rendering, syntax highlighting, and static file generation.

### 2. Enterprise Distributed & Microservice Architecture Standards (`TimeWarpEngineering/timewarp-architecture`)
- **Distributed Application Template**: Clean separation of frontend UI, REST/gRPC backend microservices, and API gateway routing.
- **Cloud-Native & Container Orchestration**: Standardized containerization (Docker), local service orchestration (Tye/Docker Compose), and reverse proxy gateway configurations.
- **Clean Architecture & Inter-Service Messaging**: Decoupled domain layers, strict API contracts, robust error handling middleware, and comprehensive automated test coverage.
