# Test Update Uncertainties

## Critical Issues Found

### 1. Import Path Changes

**Current state:** Tests import from `../components/`
**New structure:**

- `Pulse` moved: `../components/Pulse.ts` → `../modules/Pulse.ts`
- `Pulses` moved: `../components/Pulses.ts` → `../modules/Pulses.ts`
- `Stepper` stayed: `../components/Stepper.ts` ✓

**Files affected:**

- `src/tests/Pulses.test.ts` (lines 2-4)
- `src/tests/Pulses.deregister.test.ts` (lines 2-4)
- `src/tests/Pulse.test.ts` (line 2 - commented out)

---

### 2. Pulses API Breaking Changes

#### Changed: `register()` signature

- **Old:** `register(stepper: Stepper, steppers: Stepper[])`
- **New:** `register(stepper: Stepper)` (no steppers array param)
- **Impact:** All test files calling `pulses.register(stepper, steppers)` will fail
- **Occurrences:** ~40+ calls across both test files

#### Changed: Pulses is now a singleton

- **Old:** `pulses = new Pulses()` (test instantiation)
- **New:** `export default new Pulses()` (singleton pattern)
- **Question:** Should tests use the singleton or create isolated instances?
- **Consideration:** Using singleton means tests share state (potential cross-contamination)

#### Missing: `isEmpty` property

- **Used in tests:** `expect(pulses.isEmpty).toBe(true)` (lines 28, 62, 118)
- **Not found in:** `src/modules/Pulses.ts`
- **Replacement:** Could check `getLeadPulses().length === 0` or add getter

#### Missing: `size` property

- **Used in tests:** `expect(pulses.size).toBe(1)` (lines 27, 54, 82, etc.)
- **Not found in:** `src/modules/Pulses.ts`
- **Replacement:** Could use `getAllPulses().length` or add getter

#### Missing: `hasLeads()` method

- **Used in tests:** `expect(pulses.hasLeads()).toBe(true)` (line 29)
- **Not found in:** `src/modules/Pulses.ts`
- **Replacement:** Could use `getLeadPulses().length > 0` or add method

#### Missing: `getElements()` method

- **Used in tests:** `pulses.getElements()` (lines 309, 320, 325)
- **Not found in:** `src/modules/Pulses.ts`
- **Replacement:** Likely `getAllPulses()` (line 322)

---

### 3. Track Integration

**New architecture:**

- `Track` class now exists in `src/modules/Track.ts`
- Stepper now has a `track` property (line 66 in Stepper.ts calls `track?.playSample(time)`)
- Sequencer creates Track instances for each Stepper (Sequencer.ts:62-76)

**Questions:**

1. Should we test Track in isolation?
2. Should we create integration tests for Stepper + Track + Pulses?
3. Do existing Stepper tests need Track mocks?
4. What happens if a Stepper doesn't have a Track? (optional property)

---

### 4. Stepper Constructor Changes

**New required properties:**

- `controls: StepperControls` (line 16 in Stepper.ts)
- `track: Track` (line 17 in Stepper.ts)
- `color: StepperColorType` (line 15 in Stepper.ts)

**Current tests:** Only pass `beats, stepsPerBeat, id, sampleName`

**Question:** Are these properties actually required or optional?

- Looking at constructor (Stepper.ts:36-52), they seem required
- But tests might work if these are made optional with sensible defaults

---

### 5. Deregister Signature Change?

**Test usage:** `pulses.deregister(stepper16, [])` (Pulses.deregister.test.ts:368)
**Actual signature:** `deregister(stepper: Stepper): void` (Pulses.ts:89)

**Issue:** Test passes empty array as second param, but method takes no second param

---

## Recommendations

### Option A: Fix tests to match new architecture

1. Update all imports to use `../modules/` for Pulse and Pulses
2. Add missing properties to Pulses (isEmpty, size, hasLeads, getElements as aliases)
3. Remove `steppers` param from all `register()` calls
4. Mock Track and StepperControls in tests or make them optional
5. Fix singleton vs instance decision (reset state in beforeEach?)

### Option B: Make backward-compatible changes

1. Add convenience getters/methods to Pulses for test compatibility
2. Make Track and StepperControls optional in Stepper constructor
3. Export both singleton and class from Pulses for testing flexibility

### Option C: Full test rewrite

1. Rewrite tests from scratch based on new architecture
2. Add integration tests for Stepper + Track + Pulses workflow
3. Add unit tests for Track class
4. Keep Pulses tests focused on pulse hierarchy management

---

## Questions for Clarification

1. **Singleton vs Instances:** Should tests create new Pulses instances for isolation, or use the singleton and reset state?

2. **Missing APIs:** Should we add the missing properties (isEmpty, size, hasLeads, getElements) to Pulses, or update tests?

3. **Track Testing:** What's the testing strategy for Track? Unit tests? Integration tests? Mock in Stepper tests?

4. **Stepper Dependencies:** Should StepperControls and Track be optional in Stepper constructor for easier testing?

RESPONSE: I updated them both to be optional

5. **Test Coverage Priority:**

   - Fix existing Pulse/Pulses tests first?
   - Write Track tests first?
   - Write integration tests first?

RESPONSE: Rewrite the tests for Pulses and Pulses. Tests for Track will be implementated later. Use the PulseClass export from pulses if you need it

6. **DOM Requirements:** Tests currently mock DOM (`document.body.innerHTML`). Does Track need audio context mocking?

Not for now
