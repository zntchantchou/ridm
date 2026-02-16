# Refactor Task: Create Lit PanelSection Component

Port the existing PanelSection component from src/components/PanelSection/PanelSection.ts to a Lit-based web component at src/components/Lit/PanelSection/PanelSection.ts.

## Task Checklist

The following functionalities must be ported from the original PanelSection component:

- [x] 1. Property declarations with Lit decorators (@property) - 15-02-2026-19:02:07
  - title (string)
- [x] 2. Render method with lit-html template - 15-02-2026-19:02:07
  - Root container with panel-section class
  - Title element with panel-section-title class
  - Title text (converted to uppercase)
  - Controls container with panel-section-controls class
  - Slot element to render children components (knobs)
- [x] 3. Component registration and module export - 15-02-2026-19:02:07
  - Register custom element with @customElement('panel-section-element')
  - Export PanelSectionElement class
  - Add TypeScript declaration for HTMLElementTagNameMap in src/components.types.ts

## Implementation Decisions

Based on project architecture analysis:

1. **Component Composition**: Use slot-based composition
   - No settings array needed - remove PanelSetting type entirely
   - Children components (knob-element) are passed directly in markup
   - Use `<slot></slot>` element in the controls container to render children
   - This is much simpler than the original imperative approach

2. **Styling**: Reimplement styles inside the Lit component
   - Use src/style/panel-section.css as a REFERENCE for styling (will be deleted after)
   - Lit component WILL use shadow DOM with static styles property
   - Reimplement all styles from panel-section.css into component's static styles
   - Keep all CSS class names identical to maintain compatibility
   - Note: --panel-section-border CSS variable reference in original styles

## File Structure Modifications

### BEFORE

```
src/components/
├── PanelSection/
│   └── PanelSection.ts (vanilla class-based component)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    ├── Controls/
    └── Knob/
```

### AFTER

```
src/components/
├── PanelSection/
│   └── PanelSection.ts (vanilla class-based component - preserved)
└── Lit/
    ├── TemplateButton/
    ├── ResetButton/
    ├── Footer/
    ├── PlayPauseButton/
    ├── Fader/
    ├── Controls/
    ├── Knob/
    └── PanelSection/
        └── PanelSection.ts (new Lit component)
```

## Implementation Notes

### Key Differences from Vanilla Implementation

1. **No manual DOM creation**: Use lit-html template syntax instead of document.createElement
2. **Reactive properties**: Use @property decorators for automatic re-rendering (only title property needed)
3. **Shadow DOM**: Styles are encapsulated in static styles property (copied from panel-section.css)
4. **Slot-based composition**: Use `<slot></slot>` to render children instead of managing settings array
5. **No parent element injection**: Lit components are used as custom elements `<panel-section-element>`
6. **Much simpler**: No settings management, no knob creation logic, no PanelSetting type

### Component Tag Name

Suggested: `panel-section-element` (following pattern from `knob-element`, `fader-element`)

### Style Encapsulation Considerations

The original component uses these CSS classes from src/style/panel-section.css:

- `.panel-section`
- `.panel-section-title`
- `.panel-section-controls`

**Implementation approach:**

1. Copy all styles from src/style/panel-section.css into the component's `static styles` property
2. Note the CSS variable reference: `border-right: var(--panel-section-border);`
3. This variable must be accessible from shadow DOM (defined in :host or passed through)
4. Keep all class names identical to maintain compatibility
5. Use shadow DOM for style encapsulation
6. After successful implementation, src/style/panel-section.css will be deleted

### Slot-Based Composition

The Lit version is much simpler - it just renders a slot for children:

```typescript
render() {
  return html`
    <div class="panel-section">
      <div class="panel-section-title">
        <span>${this.title.toUpperCase()}</span>
      </div>
      <div class="panel-section-controls">
        <slot></slot>
      </div>
    </div>
  `;
}
```

Usage example:
```html
<panel-section-element title="Filter">
  <knob-element
    label="FREQUENCY"
    id="filter-frequency"
    value="440"
    min="20"
    max="20000"
    fillColor="beige"
    .onChange="${this.handleChange}"
    size="3"
    settingName="frequency"
    effectName="filter"
  ></knob-element>
  <knob-element
    label="Q"
    id="filter-q"
    value="1"
    min="0.001"
    max="100"
    fillColor="beige"
    .onChange="${this.handleChange}"
    size="3"
    settingName="Q"
    effectName="filter"
  ></knob-element>
</panel-section-element>
```

This approach:
- Eliminates the need for settings array
- Removes all knob creation logic
- Makes the component a simple container
- Allows full control from the parent component markup

### TypeScript Global Declaration

Component type declarations must be added to `src/components.types.ts`:

```typescript
declare global {
  interface HTMLElementTagNameMap {
    "panel-section-element": PanelSectionElement;
  }
}
```

This ensures TypeScript recognizes the custom element throughout the application.

## Wordcount

Estimated character count: +3000 to +4000 characters (new file creation)

Actual count will be measured after implementation.
