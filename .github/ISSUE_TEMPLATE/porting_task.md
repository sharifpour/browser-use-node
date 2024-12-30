---
name: Porting task
about: Track the porting of functionality from Python browser-use
title: '[PORT] '
labels: port
assignees: ''
---

## Original Component
<!-- Link to the original Python component being ported -->
- File: <!-- e.g., browser/context.py -->
- Class/Function: <!-- e.g., BrowserContext -->

## Implementation Details

### Key Functionality
<!-- List the key functionality that needs to be preserved -->
- [ ] <!-- e.g., Browser session management -->
- [ ] <!-- e.g., DOM state tracking -->

### TypeScript Considerations
<!-- List any TypeScript-specific considerations -->
- [ ] Type definitions
- [ ] Interface implementations
- [ ] Generic type parameters

### Dependencies
<!-- List required dependencies and their TypeScript equivalents -->
- [ ] <!-- e.g., Playwright instead of Selenium -->
- [ ] <!-- e.g., LangChain.js instead of Python LangChain -->

## Testing Requirements
- [ ] Unit tests ported/created
- [ ] Integration tests added
- [ ] Type checking passes
- [ ] Existing tests unaffected

## Documentation
- [ ] JSDoc comments added
- [ ] README updated if needed
- [ ] API documentation generated

## Checklist
- [ ] Functionality matches original
- [ ] TypeScript best practices followed
- [ ] Tests implemented
- [ ] Documentation updated