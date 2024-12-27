# Contributing to browser-use-node

Thank you for your interest in contributing to browser-use-node! This project is currently under heavy development, and we welcome contributions from the community. By participating in this project, you are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting Started

1. Clone the repository: `git clone https://github.com/browser-use/browser-use-node.git`
2. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
3. Install dependencies: `npm install`
4. Make your changes and commit them with clear messages
5. Push to the branch: `git push origin feature/your-feature-name`
6. Open a Pull Request from your branch

## Development Priorities

Please check [port-diff.md](./port-diff.md) for current development priorities. The main focus areas are:

### High Priority
- DOM interaction capabilities enhancement
- Anti-detection measures implementation

### Medium Priority
- Error handling improvements
- Type system enhancements

## Pull Request Process

1. Ensure your code follows the TypeScript best practices
2. Update documentation as needed
3. Add tests for new features
4. Make sure all tests pass: `npm test`
5. Update [port-diff.md](./port-diff.md) if your changes affect the porting status
6. Create a Pull Request with a clear description of changes

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (use provided ESLint and Prettier configurations)
- Write meaningful commit messages
- Add JSDoc comments for public APIs

## Testing

- Write unit tests for new features
- Ensure existing tests pass
- Include real-world scenario tests when applicable

## Questions?

If you have questions or need help, please:
1. Check existing issues
2. Create a new issue with a clear description
3. Tag it appropriately (question/bug/feature)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
