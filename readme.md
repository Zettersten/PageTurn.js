<p align="center">
  <img src="https://turnjs.com/pics/small-turnjs-letters.png" alt="turn.js logo" width="240" />
</p>

# turnjs-modern

Modern npm distribution for the classic [turn.js](https://www.turnjs.com/) page-flip engine. This package wraps the battle-tested legacy implementation, adds a typed TypeScript API, and ships dual ESM/CJS bundles ready for today’s toolchains.

> **License notice**
>
> turn.js remains under a non-commercial BSD license. Review `license.txt` before using the library in commercial software.

## Highlights

- 📦 Published as an ES module and CommonJS bundle with sourcemaps
- 🧱 Zero-config TypeScript typings and ergonomic wrapper API
- ⚙️ Compatible with modern build tools (Vite, Next.js, Astro, webpack, etc.)
- ♿ Touch and pointer aware with automatic feature detection
- 🚀 Zero dependencies - no jQuery required

## Installation

```bash
npm install pageturn.js
# or
yarn add pageturn.js
# or
pnpm add pageturn.js
```

## Quick start

```ts
import { createTurn } from 'pageturn.js';

const book = createTurn('#magazine', {
  width: 800,
  height: 400,
  display: 'double',
  gradients: true
});

book.on('turning', ({ page, view }) => {
  console.log('Turning to', page, 'view', view);
});

book.next();
```

```html
<div id="magazine">
  <div class="page">Page 1</div>
  <div class="page">Page 2</div>
  <div class="page">Page 3</div>
</div>
```

```css
#magazine {
  width: 800px;
  height: 400px;
}

.page {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 600 24px/1 sans-serif;
}
```

## API surface

### `createTurn(target, options?)`
Creates (or reuses) a PageTurn.js instance tied to the provided element or selector. Returns a typed `TurnInstance` wrapper.

### `useTurn(target)`
Wraps an existing instance without touching its configuration. Useful when the instance was created elsewhere.

### `TurnInstance` methods

- `addPage(element, page?)` — inject a page, optionally at an index
- `hasPage(page)` — boolean existence check
- `display(mode?)` — getter/setter for `'single' | 'double'`
- `animating()` — `true` while a transition runs
- `disable(state?)` — toggle pointer/keyboard interaction
- `size()` / `size(width, height)` — read or update page dimensions
- `resize()` — recompute layout when the container changes
- `removePage(page)` — drop a page
- `pages()` / `pages(total)` — read or clamp the page count
- `range(page?)` — get the DOM window that should stay mounted
- `view(page?)` — get the logical spread for a page number
- `page()` / `page(page)` — read or navigate to a page
- `next()` / `previous()` — convenience navigation helpers
- `stop(force?)` — cancel in-flight animations
- `on(event, handler)` / `off(event, handler)` — subscribe to `start`, `turning`, `turn`, `turned`, `first`, `last`

### Options (`TurnOptions`)

| Option         | Type                                                       | Default  | Description                                  |
| -------------- | ---------------------------------------------------------- | -------- | -------------------------------------------- |
| `width`        | `number`                                                   | DOM size | Render width of the book container           |
| `height`       | `number`                                                   | DOM size | Render height of the book container          |
| `page`         | `number`                                                   | `1`      | Initial page number                          |
| `gradients`    | `boolean`                                                  | `true`   | Toggle gradient shading                      |
| `duration`     | `number`                                                   | `600`    | Animation duration in milliseconds           |
| `acceleration` | `boolean`                                                  | `true`   | Enable GPU accelerated transforms            |
| `display`      | `'single' \| 'double'`                                     | `double` | Layout mode                                  |
| `pages`        | `number`                                                   | `0`      | Hard cap on total pages (auto-detected if 0) |
| `corners`      | `Partial<Record<'forward' \| 'backward' \| 'all', Corner[]>>` | preset  | Fine-tune active grab corners               |
| `cornerSize`   | `number`                                                   | `100`    | Corner activation hit area (px)              |
| `when`         | `TurnWhenHandlers`                                         | `{}`     | Declarative event subscriptions              |

## Events

| Event     | Payload               | Fired when                          |
| --------- | --------------------- | ----------------------------------- |
| `start`   | `{ page, corner }`    | A corner drag begins                |
| `turning` | `{ page, view }`      | A navigation request is accepted    |
| `turn`    | `page`                | The flip animation crosses midpoint |
| `turned`  | `{ page, view }`      | The animation completes             |
| `first`   | `void`                | The first page becomes visible      |
| `last`    | `void`                | The last page becomes visible       |

Handlers registered via `TurnOptions.when` or `TurnInstance.on` receive the payloads above.

## TypeScript

- Rich ambient typings for the wrapper API
- Full type safety for all methods and events
- Source maps for effortless debugging in devtools

## Browser support

Tested against the latest Chrome, Edge, Firefox, and Safari releases. The original engine gracefully falls back to 2D transforms when 3D acceleration is unavailable.

## Contributing

1. `pnpm install`
2. `pnpm run lint`
3. `pnpm run build`

Please honor the legacy license when distributing derivatives.

## License

This distribution packages the original non-commercial BSD license found in `license.txt`. Commercial usage still requires a commercial license from [turnjs.com](https://www.turnjs.com/).
