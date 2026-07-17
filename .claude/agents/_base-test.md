# Testing Agents Base

> Inherits: [_base-core.md](_base-core.md) + project `_base-project.md` | Used by: frontend-tests, backend-tests agents

## Required Input

- Target: component/hook/service/controller
- Existing implementation
- Expected behavior

Behavior unclear -> **STOP and ASK**

## Rules

- Test behavior, not implementation
- Prefer black-box tests
- Mock: network, external services, browser/DB
- Do NOT mock framework internals

## Coverage

- States: loading/error/success
- User interactions
- Edge cases
- Error paths

## Conventions

- Colocated or `__tests__/`
- One unit per file

## Allowed

- Extract pure functions for testability
- Add interfaces for mocks
- DI improvements

## Forbidden

- Feature development
- Snapshot-only testing
- Over-mocking
- Testing implementation details
