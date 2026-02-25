# Task 007: Refactor Test Architecture

## Status
- [x] Implementation completed - 25-02-2026-13:58:47

## Objective
Refactor the test architecture to improve maintainability, reduce duplication, and establish patterns for future test development.

## Problem Statement
The existing test structure had several issues:
1. **Code duplication**: Repeated Stepper instantiation with verbose setup
2. **No test utilities**: Common assertions and operations were repeated across tests
3. **Broken architecture**: Tests relied on old class-based Stepper that was replaced by Lit component
4. **No mocking strategy**: No test doubles for components that underwent architectural changes

## Implementation Summary

### 1. Created Test Utilities (`src/tests/utils/`)

#### `stepper-factory.ts`
- Factory functions for creating test Stepper instances
- `createStepper()` - Create steppers with sensible defaults
- `createStepperWithSteps()` - Create steppers by total step count
- `createMultipleSteppers()` - Create multiple steppers at once
- Auto-incrementing IDs and default colors/samples

#### `pulse-helpers.ts`
- Helper functions for common Pulse assertions
- `expectPulseCount()` - Assert total pulse count
- `expectLeadPulseCount()` - Assert lead pulse count
- `expectLeadPulseSteps()` - Assert lead pulse step values
- `expectStepperSubscribed()` - Assert stepper has active subscription
- `expectStepperUnsubscribed()` - Assert stepper subscription closed
- `expectPulsesInSync()` - Assert pulse data structures are synchronized

#### `dom-helpers.ts`
- DOM setup utilities for tests
- `setupDOM()` - Create full DOM structure
- `setupMinimalDOM()` - Create minimal DOM for simple tests
- `cleanupDOM()` - Clean up DOM after tests

### 2. Created Mock Objects (`src/tests/mocks/`)

#### `Stepper.mock.ts`
- Mock implementation of Stepper for testing
- Based on the original class-based Stepper before Lit migration
- Implements minimum interface needed by Pulse tests
- Includes `listenToPulse()`, `updateSteps()`, and subscription management

### 3. Refactored Existing Tests
- Updated `Pulses.test.ts` to use new utilities
- Updated `Pulses.deregister.test.ts` to use new utilities
- Updated `setup.ts` to use DOM helpers
- Reduced test code by ~30% while maintaining full coverage
- All 19 tests passing

## Benefits

1. **DRY Principle**: Eliminated repeated code across test files
2. **Maintainability**: Changes to test patterns only need updates in utility files
3. **Readability**: Tests focus on behavior rather than setup boilerplate
4. **Consistency**: Standardized assertions and setup across all tests
5. **Decoupling**: Tests isolated from production implementation changes via mocks

## Architecture Decisions

### Why Mock Stepper Instead of Using Real Component?
- Real Stepper is now a Lit web component requiring DOM rendering
- Tests focus on Pulse logic, not Stepper rendering
- Mock provides stable interface independent of Stepper implementation
- Faster test execution without component lifecycle overhead

### Factory Pattern for Test Data
- Reduces cognitive load - defaults handle common cases
- Makes tests more declarative and intention-revealing
- Easy to customize when specific values matter
- Auto-incrementing IDs prevent accidental collisions

## Files Changed
- `/src/tests/utils/stepper-factory.ts` (new)
- `/src/tests/utils/pulse-helpers.ts` (new)
- `/src/tests/utils/dom-helpers.ts` (new)
- `/src/tests/utils/index.ts` (new)
- `/src/tests/mocks/Stepper.mock.ts` (new)
- `/src/tests/Pulses.test.ts` (refactored)
- `/src/tests/Pulses.deregister.test.ts` (refactored)
- `/src/tests/setup.ts` (updated)

## Testing
All 19 tests passing:
- 1 test in `Pulse.test.ts`
- 8 tests in `Pulses.test.ts`
- 10 tests in `Pulses.deregister.test.ts`

## Future Recommendations
1. Apply similar patterns to new test files as they're created
2. Consider extracting more helpers as patterns emerge
3. Keep mocks updated if production interfaces change
4. Document test utilities for team knowledge sharing
