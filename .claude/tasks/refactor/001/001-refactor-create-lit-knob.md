# Refactor Task: Create Lit Knob Component

Port the existing Knob component from src/components/Knob/Knob.ts to a Lit-based web component at src/components/Lit/Knob/Knob.ts.

## Task Checklist

The following functionalities must be ported from the original Knob component:

- [x] 1. Property declarations with Lit decorators (@property) - 15-02-2026-18:13:09
  - label, id, value, min, max, size, fillColor, settingName, effectName
  - onChange callback
  - normalized property (if needed for display)
- [x] 2. Render method with lit-html template - 15-02-2026-18:13:09
  - Root container with knob-root class
  - Label container and label element
  - Knob container with dynamic sizing (width/height based on size prop)
  - Ring element for background circle
  - Ring fill element with dynamic conic-gradient background
  - Space element
  - Knob element with indicator container and indicator
  - Value container displaying current value
- [x] 3. Rotation calculation system - 15-02-2026-18:13:09
  - minRotation and maxRotation based on min/max values
  - Handle both negative and positive value ranges
  - Calculate initial rotation from value
  - lastRotation tracking for drag operations
- [x] 4. Pointer event handlers (drag interaction) - 15-02-2026-18:13:09
  - pointerdown on knob indicator to start drag
  - pointermove on document during drag
  - pointerup on document to end drag
  - Track startY and currentY for delta calculation
  - velocity-based rotation updates (velocity = 2)
  - Clamp rotation between minRotation and maxRotation
- [x] 5. RxJS observable for drag events - 15-02-2026-18:13:09
  - fromEvent observable on document pointermove
  - throttleTime(100) to limit update frequency
  - Subscribe/unsubscribe on drag start/end
  - Trigger onChange callback on throttled updates
- [x] 6. Position update method - 15-02-2026-18:13:09
  - Transform knob indicator rotation based on value
  - Calculate rotation angle from value ratio (value/max)
  - Apply CSS transform: rotate(${rotation}deg)
  - Update ring color after position changes
- [x] 7. Ring color update with conic-gradient - 15-02-2026-18:13:09
  - Different gradient logic for negative vs positive ranges
  - When min < 0: bidirectional gradient from center
  - When min >= 0: unidirectional gradient from start position
  - Use fillColor prop for active portion
  - Transparent/inactive color for unfilled portion
- [x] 8. Value formatting - 15-02-2026-18:13:09
  - Return current value as string with 2 decimal places (.toFixed(2))
  - Handle uninitialized state (return raw value)
  - Calculate value from currentY rotation angle
  - Handle negative and positive rotations separately
  - Clamp to min value when calculated value below minimum
- [x] 9. State subscription to track selected stepper - 15-02-2026-18:13:09
  - Subscribe to State.currentStepperIdSubject
  - Update selectedStepperId when current stepper changes
  - Fetch effect value for current stepper and setting
  - Update knob value and position when stepper changes
  - Update ring color based on stepper color
- [x] 10. Cleanup and lifecycle - 15-02-2026-18:13:09
  - Remove event listeners on disconnect
  - Unsubscribe from RxJS observables
  - Proper connectedCallback and disconnectedCallback
- [x] 11. Component registration and module export - 15-02-2026-18:13:09
  - Register custom element with @customElement('knob-element')
  - Export class for external use
  - Add script module tag to index.html for component loading

## Implementation Decisions

Based on project architecture analysis:

1. **State Management**: Component will manage its own State subscription
   - Direct import of State singleton (consistent with existing pattern)
   - Subscribe to State.currentStepperIdSubject in connectedCallback
   - Unsubscribe in disconnectedCallback

2. **Event Library**: Use RxJS internally
   - Keep fromEvent with throttleTime(100) for drag events
   - Maintain consistency with original implementation
   - RxJS already bundled in project

3. **CSS Integration**: Reimplement styles inside the Lit component
   - Use src/style/knob.css as a REFERENCE for styling (will be deleted after)
   - Lit component WILL use shadow DOM with static styles property
   - Reimplement all styles from knob.css into the component's static styles
   - Keep all CSS class names identical to maintain compatibility
   - CSS custom properties (--ring-width, --ring-space, etc.) should be defined in component

## File Structure Modifications

### BEFORE

```
src/components/
├── Knob/
│   └── Knob.ts (vanilla class-based component)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    └── Controls/
```

### AFTER

```
src/components/
├── Knob/
│   └── Knob.ts (vanilla class-based component - preserved)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    ├── Controls/
    └── Knob/
        └── Knob.ts (new Lit component)
```

## Implementation Notes

### Key Differences from Vanilla Implementation

1. **No manual DOM creation**: Use lit-html template syntax instead of document.createElement
2. **Reactive properties**: Use @property decorators for automatic re-rendering
3. **Shadow DOM**: Styles are encapsulated in static styles property (copied from knob.css)
4. **Event handling**: Use @-syntax in template or addEventListener in lifecycle methods
5. **No parent element injection**: Lit components are used as custom elements `<knob-element>`
6. **Self-contained styling**: All CSS from knob.css reimplemented inside component

### Component Tag Name

Suggest: `knob-element` (following pattern from `fader-element`)

### Style Encapsulation Considerations

The original component uses these CSS classes from src/style/knob.css:

- `.knob-root`
- `.knob-value-container`, `.knob-value`
- `.knob-label-container`, `.knob-label`
- `.knob-container`
- `.ring`, `.ring-fill`
- `.space`
- `.knob`
- `.knob-indicator-container`, `.knob-indicator`

**Implementation approach:**

1. Copy all styles from src/style/knob.css into the component's `static styles` property
2. Include CSS custom properties (--ring-width, --ring-space, --knob-color-1, --knob-color-2)
3. Keep all class names identical to maintain compatibility
4. Use shadow DOM for style encapsulation
5. After successful implementation, src/style/knob.css will be deleted

### RxJS vs Standard Events

Original uses RxJS for:

- `fromEvent(document, "pointermove")` with `throttleTime(100)`
- `State.currentStepperIdSubject.pipe(tap(...))`

Options for Lit version:

1. Keep RxJS (requires bundling RxJS with component)
2. Replace with standard events + requestAnimationFrame throttling
3. Use reactive controllers for complex state management

### State Management Integration

Original directly imports and uses State singleton. Consider:

1. Keep direct State import (tight coupling)
2. Pass state values as properties (loose coupling, more reusable)
3. Use context API for shared state

## Wordcount

Estimated character count: +5000 to +7000 characters (new file creation)

Actual count will be measured after implementation.
