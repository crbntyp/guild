# Status Component Usage

The status component provides reusable pill/badge styles for displaying status messages.

## Available Classes

### .status-success (Green)
Use for successful operations, completions, or positive states.
```html
<div class="status-success">Updated: 5 minutes ago</div>
<div class="status-success">Operation successful</div>
```

### .status-alert (Orange/Yellow)
Use for warnings, alerts, or cautionary messages.
```html
<div class="status-alert">Warning: Limited data</div>
<div class="status-alert">3 items need attention</div>
```

### .status-danger (Red)
Use for errors, failures, or critical states.
```html
<div class="status-danger">Error: Failed to load</div>
<div class="status-danger">Connection lost</div>
```

### .status-info (Blue)
Use for informational messages or neutral states.
```html
<div class="status-info">Info: Processing</div>
<div class="status-info">Loading...</div>
```

## Using the Mixin

You can also create custom status styles using the `@mixin status-pill`:

```scss
.my-custom-status {
  @include status-pill(
    rgba(255, 0, 255, 0.2),   // bg-color-start
    rgba(200, 0, 200, 0.2),   // bg-color-end
    rgba(255, 0, 255, 0.3),   // border-color
    rgb(255, 150, 255)        // text-color
  );
}
```

## Current Usage

- **leaderboard-status**: Uses the status-pill mixin with green colors (same as .status-success)
