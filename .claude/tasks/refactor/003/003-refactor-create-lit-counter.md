# Refactor Task: Create Lit Counter Component

Port the existing Counter component from src/components/Counter/Counter.ts to a Lit-based web component at src/components/Lit/Counter/Counter.ts.

## Task Checklist

The following functionalities must be ported from the original Counter component:

- [ ] 1. Property declarations with Lit decorators (@property)
  - value (number)
  - min (number)
  - max (number)
  - stepperId (StepperIdType - optional)
  - onChange callback (optional)
- [ ] 2. Render method with lit-html template
  - Root container with counter class
  - Minus button with counter-item, counter-btn, counter-minus classes
  - Value display with counter-item, counter-value classes
  - Plus button with counter-item, counter-btn, counter-plus classes
  - Minus button text: "-"
  - Plus button text: "+"
  - Value display shows current value
- [ ] 3. Event handlers for increment/decrement
  - Increment: check if value < max, then increment and trigger onChange
  - Decrement: check if value > min, then decrement and trigger onChange
  - Click handlers attached to plus and minus buttons
- [ ] 4. Value display update
  - Update value display when value changes
  - Display as string representation of number
  - Reactive updates when value property changes
- [ ] 5. Component registration and module export
  - Register custom element with @customElement('counter-element')
  - Export CounterElement class
  - Add TypeScript declaration for HTMLElementTagNameMap in src/components.types.ts

## Implementation Decisions

Based on project architecture analysis:

1. **State Management**: Component will be self-contained
   - No State subscription needed (unlike Knob component)
   - Value is controlled by parent through property binding
   - onChange callback notifies parent of value changes
   - stepperId is optional and only passed through if needed by parent

2. **Reactivity**: Use Lit's reactive properties
   - @property on value, min, max for automatic re-rendering
   - @property(attribute: false) for onChange callback
   - When value changes externally, display updates automatically

3. **CSS Integration**: Reimplement styles inside the Lit component
   - Use src/style/counter.css as a REFERENCE for styling (will be deleted after)
   - Lit component WILL use shadow DOM with static styles property
   - Reimplement all styles from counter.css into the component's static styles
   - Keep all CSS class names identical to maintain compatibility
   - Include bounce animation from counter.css if present

## File Structure Modifications

### BEFORE

```
src/components/
├── Counter/
│   └── Counter.ts (vanilla class-based component)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    ├── Controls/
    ├── Knob/
    └── PanelSection/
```

### AFTER

```
src/components/
├── Counter/
│   └── Counter.ts (vanilla class-based component - preserved)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    ├── Controls/
    ├── Knob/
    ├── PanelSection/
    └── Counter/
        └── Counter.ts (new Lit component)
```

## Implementation Notes

### Key Differences from Vanilla Implementation

1. **No manual DOM creation**: Use lit-html template syntax instead of document.createElement
2. **Reactive properties**: Use @property decorators for automatic re-rendering
3. **Shadow DOM**: Styles are encapsulated in static styles property (copied from counter.css)
4. **Event handling**: Use @click=${handler} syntax in template for click events
5. **No getElement() method**: Lit components are used as custom elements `<counter-element>`
6. **Self-contained styling**: All CSS from counter.css reimplemented inside component

### Component Tag Name

Suggested: `counter-element` (following pattern from `knob-element`, `fader-element`, `panel-section-element`)

### Style Encapsulation Considerations

The original component uses these CSS classes from src/style/counter.css:

- `.counter`
- `.counter-item`
- `.counter-btn`
- `.counter-value`
- `.counter-plus`
- `.counter-minus`

**Implementation approach:**

1. Copy all styles from src/style/counter.css into the component's `static styles` property
2. Include hover states for buttons (`:hover`, `:hover:active`)
3. Include bounce animation if defined in counter.css
4. Keep all class names identical to maintain compatibility
5. Use shadow DOM for style encapsulation
6. After successful implementation, src/style/counter.css will be deleted

### Reactive Value Updates

The Lit version benefits from automatic reactivity:

```typescript
@property({ type: Number })
value: number = 0;

private increment = () => {
  if (this.value < this.max) {
    this.value++; // Automatic re-render
    this.onChange?.(this.value);
  }
};

private decrement = () => {
  if (this.value > this.min) {
    this.value--; // Automatic re-render
    this.onChange?.(this.value);
  }
};
```

No need for manual `updateDisplay()` method - Lit handles re-rendering automatically when `value` changes.

### Template Structure

Simple template structure:

```typescript
render() {
  return html`
    <div class="counter">
      <div
        class="counter-item counter-btn counter-minus"
        @click=${this.decrement}
      >-</div>
      <div class="counter-item counter-value">
        ${this.value}
      </div>
      <div
        class="counter-item counter-btn counter-plus"
        @click=${this.increment}
      >+</div>
    </div>
  `;
}
```

### Usage Example

After implementation, the Counter will be used like this in StepperControls or other components:

```html
<counter-element
  .value=${this.beats}
  .min=${2}
  .max=${10}
  .onChange=${(value: number) => this.handleBeatsChange(value)}
></counter-element>
```

Or in the StepperControls refactor:

```typescript
private createBeatsCounterElt() {
  return html`
    <counter-element
      .value=${this.beats}
      .min=${2}
      .max=${10}
      .onChange=${(value: number) =>
        State.stepperResizeSubject.next({
          beats: value,
          stepperId: this.stepperId,
        })
      }
    ></counter-element>
  `;
}
```

### TypeScript Global Declaration

Component type declarations must be added to `src/components.types.ts`:

```typescript
import { CounterElement } from "./components/Lit/Counter/Counter";

declare global {
  interface HTMLElementTagNameMap {
    "counter-element": CounterElement;
  }
}
```

This ensures TypeScript recognizes the custom element throughout the application.

## Comparison with Original

### Original (Vanilla) Counter
- ~96 lines of TypeScript
- Manual DOM creation with createElement
- Manual event listener attachment
- Imperative updateDisplay() method
- getElement() method to return root element
- Separate CSS file (counter.css)

### New (Lit) Counter
- Estimated ~80-100 lines of TypeScript (including styles)
- Declarative template with html``
- Event handlers in template with @click
- Automatic re-rendering via reactive properties
- Used directly as custom element
- Encapsulated styles in static styles property

## Wordcount

Estimated character count: +2500 to +3500 characters (new file creation)

Actual count will be measured after implementation.

## CSS Reference

From src/style/counter.css - styles to be reimplemented in component:

```css
.counter {
  display: flex;
  /* border-radius: 2rem; (commented in original) */
}

.counter-item {
  min-width: 1rem;
  flex: 1;
  color: white;
  padding: 0.4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: content-box;
  font-size: 0.9rem;
  overflow: hidden;
  background-color: rgb(28, 28, 28);
}

.counter-btn {
  font-size: 1.2rem;
}

.counter-btn:hover:active {
  background-color: rgb(133, 133, 133);
  animation: bounce 0.3s ease-in-out;
}

.counter-btn:hover {
  color: rgb(38, 38, 38);
  background-color: rgb(255, 255, 255);
}

.counter-plus {
  border-radius: 0 2rem 2rem 0;
}

.counter-minus {
  border-radius: 2rem 0 0 2rem;
}

.counter-value {
  font-family: "technology";
  font-size: 1.2rem;
  border-left: 1px solid rgb(81, 81, 81);
  border-right: 1px solid rgb(81, 81, 81);
  font-weight: bolder;
}
```

**Note**: Check if bounce animation is defined elsewhere in the codebase. If not, it can be omitted or defined within the component.
