import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type EventHandler = (event: Event, ...args: unknown[]) => void;

interface TurnState {
  pages: HTMLElement[];
  currentPage: number;
  display: 'single' | 'double';
  disabled: boolean;
  width: number;
  height: number;
  options: Record<string, unknown>;
}

vi.mock('../legacy/turn.js', async () => {
  const { DOMElement } = await import('../utils/dom.js');

  let instances = new WeakMap<Element, TurnState>();

  const getKey = (element: DOMElement): Element => {
    const node = element.nodes[0];
    if (!(node instanceof Element)) {
      throw new Error('PageTurn stub requires an element node');
    }
    return node;
  };

  const emit = (element: DOMElement, _state: TurnState, event: string, payload: unknown[]): void => {
    element.trigger(event, payload);
  };

  const ensureState = (element: DOMElement, options: Record<string, unknown>): TurnState => {
    const root = getKey(element) as HTMLElement;
    const pages = root ? (Array.from(root.children) as HTMLElement[]) : [];
    const width = typeof options.width === 'number' ? (options.width as number) : root?.offsetWidth ?? 0;
    const height = typeof options.height === 'number' ? (options.height as number) : root?.offsetHeight ?? 0;
    const display = (options.display as 'single' | 'double') ?? 'double';

    return {
      pages,
      currentPage: (options.page as number) ?? 1,
      display,
      disabled: false,
      width,
      height,
      options: { ...options }
    };
  };

  const buildView = (state: TurnState, page: number): number[] => {
    if (state.display === 'double') {
      const next = page + 1 <= state.pages.length ? page + 1 : page;
      return [page, next];
    }
    return [page];
  };

  const command = (element: DOMElement, state: TurnState, action: string, args: unknown[]): unknown => {
    switch (action) {
      case 'addPage': {
        const [pageElement, pageNumber] = args as [HTMLElement, number | undefined];
        const index = pageNumber ? Math.max(1, Math.min(pageNumber, state.pages.length + 1)) : state.pages.length + 1;
        state.pages.splice(index - 1, 0, pageElement);
        return element;
      }
      case 'removePage': {
        const [pageNumber] = args as [number];
        state.pages.splice(pageNumber - 1, 1);
        if (state.currentPage > state.pages.length) state.currentPage = state.pages.length || 1;
        return element;
      }
      case 'pages':
        if (!args.length) return state.pages.length;
        state.pages.length = Number(args[0]);
        return element;
      case 'page': {
        if (!args.length) return state.currentPage;
        const target = Math.max(1, Math.min(Number(args[0]), state.pages.length || 1));
        if (state.currentPage === target || state.disabled) return element;
        const viewBefore = buildView(state, target);
        emit(element, state, 'turning', [target, viewBefore]);
        state.currentPage = target;
        const viewAfter = buildView(state, state.currentPage);
        emit(element, state, 'turned', [target, viewAfter]);
        return element;
      }
      case 'display':
        if (!args.length) return state.display;
        state.display = args[0] as 'single' | 'double';
        return element;
      case 'hasPage':
        return Number(args[0]) >= 1 && Number(args[0]) <= state.pages.length;
      case 'animating':
        return false;
      case 'disable':
        state.disabled = (args[0] ?? true) as boolean;
        return element;
      case 'size':
        if (!args.length) return { width: state.width, height: state.height };
        [state.width, state.height] = args as [number, number];
        return element;
      case 'resize':
        return element;
      case 'view':
        return buildView(state, state.currentPage);
      case 'range':
        return [1, state.pages.length] as const;
      case 'next':
        return command(element, state, 'page', [Math.min(state.currentPage + 1, state.pages.length || 1)]);
      case 'previous':
        return command(element, state, 'page', [Math.max(state.currentPage - 1, 1)]);
      case 'stop':
        return element;
      case 'on': {
        const [event, handler] = args as [string, EventHandler];
        element.on(event, handler);
        return element;
      }
      case 'off': {
        const [event, handler] = args as [string, EventHandler];
        element.off(event, handler);
        return element;
      }
      default:
        throw new Error(`Unsupported command: ${action}`);
    }
  };

  const turnMock = vi.fn(function turn(this: DOMElement, arg: unknown, ...args: unknown[]) {
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      const options = arg as Record<string, unknown>;
      const state = ensureState(this, options);
      instances.set(getKey(this), state);
      return this;
    }

    const state = instances.get(getKey(this));
    if (!state) throw new Error('PageTurn stub not initialised');

    return command(this, state, String(arg), args);
  });

  (DOMElement.prototype as any).turn = turnMock;

  return {
    __esModule: true,
    turnMock,
    __reset(): void {
      instances = new WeakMap<Element, TurnState>();
      turnMock.mockClear();
    }
  };
});

const { turnMock, __reset } = (await import('../legacy/turn.js')) as unknown as {
  turnMock: ReturnType<typeof vi.fn>;
  __reset(): void;
};
const { DOMElement } = await import('../utils/dom.js');
const jQueryShim = (await import('../legacy/shim.js')).default;
const { createTurn, useTurn, isTouchDevice } = await import('../index.js');

const createPage = (label: string): HTMLElement => {
  const page = document.createElement('div');
  page.className = 'page';
  page.textContent = label;
  page.style.width = '400px';
  page.style.height = '300px';
  return page;
};

describe('PageTurn.js integration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    __reset();
    container = document.createElement('div');
    container.id = 'book';
    container.style.width = '800px';
    container.style.height = '600px';

    for (let page = 1; page <= 4; page += 1) {
      container.appendChild(createPage(`Page ${page}`));
    }

    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates an instance with the expected API surface', () => {
    expect(typeof (DOMElement.prototype as any).turn).toBe('function');
    expect(typeof (jQueryShim.fn as any).turn).toBe('function');

    const instance = createTurn(container, { display: 'double', width: 800, height: 600 });

    expect(turnMock).toHaveBeenCalled();
    expect(instance.pages()).toBe(4);
    expect(instance.page()).toBe(1);
    expect(instance.display()).toBe('double');
    expect(instance.hasPage(2)).toBe(true);
    expect(typeof instance.addPage).toBe('function');
  });

  it('navigates between pages and emits lifecycle events', () => {
    const instance = createTurn('#book', { gradients: false });
    const turning = vi.fn();
    const turned = vi.fn();

    instance.on('turning', turning);
    instance.on('turned', turned);

    instance.page(2);

    expect(instance.page()).toBe(2);
    expect(turning).toHaveBeenCalledTimes(1);
    expect(turned).toHaveBeenCalledTimes(1);
    const payload = turned.mock.calls[0][0];
    expect(payload.page).toBe(2);
    expect(Array.isArray(payload.view)).toBe(true);
  });

  it('supports adding and removing pages dynamically', () => {
    const instance = createTurn('#book');
    const newPage = createPage('Dynamic Page');

    instance.addPage(newPage, 5);
    expect(instance.pages()).toBe(5);
    expect(instance.hasPage(5)).toBe(true);

    instance.removePage(5);
    expect(instance.pages()).toBe(4);
    expect(instance.hasPage(5)).toBe(false);
  });

  it('allows retrieving an instance from the DOM once created', () => {
    const instance = createTurn('#book');
    const existing = useTurn('#book');

    expect(existing.page()).toBe(instance.page());
    expect(existing.pages()).toBe(instance.pages());
    existing.disable(true);
    expect(existing.disable(false)).toBe(existing);
  });

  it('exposes a touch capability flag', () => {
    expect(typeof isTouchDevice).toBe('boolean');
  });
});
