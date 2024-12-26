# Contributing to Browser Agent

Thank you for your interest in contributing to Browser Agent! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. Clone the repository
2. Install dependencies with `bun install`
3. Build the project with `bun build`

## Development Process

1. Create a new branch for your feature/fix
2. Make your changes
3. Write/update tests as needed
4. Commit your changes
5. Open a Pull Request

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Use meaningful variable and function names


## Pull Request Process

1. Update documentation as needed
2. Add your changes to the CHANGELOG


## Adding New Actions

When adding new browser automation actions:

1. Add the action to `src/controller/actions/`
2. Create parameter validation schema
3. Register in `src/controller/controller.ts`
4. Add tests
5. Update action documentation

## Questions?

Feel free to open an issue for:
- Feature discussions
- Bug reports
- Questions about contributing
- Architectural discussions

