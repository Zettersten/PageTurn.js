/** Minimal jQuery-like DOM helper for PageTurn.js */

type DOMNode = Element | Document | Window;
type ElementDataMap = Map<string | symbol, unknown>;
const dataStore = new WeakMap<DOMNode, ElementDataMap>();

type EventHandler = (event: Event, ...args: unknown[]) => unknown;

interface EventStore {
  buckets: Map<string, Set<EventHandler>>;
  native: Map<string, EventListener>;
}

const EVENT_STORE_KEY = '__pageturn.events__';
const DATA_PROXY_KEY = Symbol('pageturn.dataProxy');

const isHTMLFragment = (value: string): boolean => value.trim().startsWith('<');

const createNodesFromHTML = (html: string): Element[] => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return Array.from(template.content.children);
};

const getNodeData = (node: DOMNode): ElementDataMap => {
  if (!dataStore.has(node)) dataStore.set(node, new Map());
  return dataStore.get(node)!;
};

const getExistingNodeData = (node: DOMNode): ElementDataMap | undefined => dataStore.get(node);

const ensureEventStore = (node: DOMNode): EventStore => {
  const data = getNodeData(node);
  let store = data.get(EVENT_STORE_KEY) as EventStore | undefined;
  if (!store) {
    store = { buckets: new Map(), native: new Map() };
    data.set(EVENT_STORE_KEY, store);
  }
  return store;
};

const getEventStore = (node: DOMNode): EventStore | undefined => {
  const data = getExistingNodeData(node);
  return (data?.get(EVENT_STORE_KEY) ?? undefined) as EventStore | undefined;
};

const isElementLike = (node: DOMNode): node is Element => node instanceof Element;

const toArgsArray = (data?: readonly unknown[] | unknown): unknown[] => {
  if (!data) return [];
  if (Array.isArray(data)) return [...data];
  return [data];
};

const toDetailValue = (args: unknown[]): unknown => {
  if (!args.length) return undefined;
  return args.length === 1 ? args[0] : args;
};

const extractNativeArgs = (event: Event): unknown[] => {
  if (event instanceof CustomEvent) {
    const { detail } = event;
    if (Array.isArray(detail)) return detail;
    if (detail !== undefined) return [detail];
  }
  const fallback = (event as { __pageturnDetail?: unknown }).__pageturnDetail;
  if (Array.isArray(fallback)) return fallback as unknown[];
  if (fallback !== undefined) return [fallback];
  return [];
};

interface SyntheticEvent {
  type: string;
  target: DOMNode | null;
  currentTarget: DOMNode | null;
  detail: unknown;
  preventDefault(): void;
  stopPropagation(): void;
  isDefaultPrevented(): boolean;
  isPropagationStopped(): boolean;
}

const createSyntheticEvent = (type: string, target: DOMNode | null, detail: unknown): SyntheticEvent => {
  let defaultPrevented = false;
  let propagationStopped = false;

  return {
    type,
    target,
    currentTarget: target,
    detail,
    preventDefault() {
      defaultPrevented = true;
    },
    stopPropagation() {
      propagationStopped = true;
    },
    isDefaultPrevented() {
      return defaultPrevented;
    },
    isPropagationStopped() {
      return propagationStopped;
    }
  };
};

type SelectorInput =
  | string
  | DOMNode
  | DOMNode[]
  | DOMElement
  | NodeList
  | HTMLCollection
  | null
  | undefined;

const normalizeNodes = (selector: SelectorInput): DOMNode[] => {
  if (!selector) return [];
  if (selector instanceof DOMElement) return [...selector.nodes];
  if (selector instanceof Window || selector instanceof Document) return [selector];
  if (selector instanceof Element) return [selector];
  if (selector instanceof NodeList) return Array.from(selector) as Element[];
  if (selector instanceof HTMLCollection) return Array.from(selector) as Element[];
  if (Array.isArray(selector)) return selector as DOMNode[];
  if (typeof selector === 'string') {
    if (isHTMLFragment(selector)) return createNodesFromHTML(selector);
    return Array.from(document.querySelectorAll(selector));
  }
  return [];
};

export class DOMElement {
  readonly nodes: DOMNode[];

  constructor(selector: SelectorInput, attributes?: Record<string, unknown>) {
    this.nodes = normalizeNodes(selector);
    if (attributes) this.applyAttributes(attributes);
    this.syncIndexes();
  }

  private syncIndexes(): void {
    const self = this as unknown as Record<number, DOMNode>;
    Object.keys(self)
      .filter(key => Number.isInteger(Number(key)))
      .forEach(key => delete self[key]);
    this.nodes.forEach((node, index) => {
      self[index] = node;
    });
  }

  private applyAttributes(attributes: Record<string, unknown>): void {
    const entries = Object.entries(attributes);
    entries.forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'css' && typeof value === 'object') {
        this.css(value as Record<string, string | number>);
        return;
      }
      if (key === 'class') {
        this.addClass(String(value));
        return;
      }
      this.attr(key, value as string | number);
    });
  }

  private elements(): Element[] {
    return this.nodes.filter(isElementLike);
  }

  /** Returns the number of nodes */
  get length(): number {
    return this.nodes.length;
  }

  /** jQuery compatibility flag */
  get jquery(): string {
    return 'pageturn';
  }

  /** Returns the first element */
  get(index = 0): Element | undefined {
    return this.elements()[index];
  }

  /** Iterates over elements */
  each(callback: (index: number, element: Element) => void | false): this {
    const elements = this.elements();
    for (let i = 0; i < elements.length; i++) {
      if (callback.call(elements[i], i, elements[i]) === false) break;
    }
    return this;
  }

  /** Gets/sets data attributes */
  data(): ElementDataMap;
  data(key: string): unknown;
  data(key: string, value: unknown): this;
  data(entries: Record<string, unknown>): this;
  data(key?: string | Record<string, unknown>, value?: unknown): ElementDataMap | unknown | this {
    const node = this.nodes[0];
    if (!node) return key === undefined ? new Map() : undefined;

    const dataMap = getNodeData(node);

    if (key === undefined) {
      const existing = dataMap.get(DATA_PROXY_KEY);
      if (existing) return existing as Record<string, unknown>;

      const proxy = new Proxy(Object.create(null), {
        get: (_target, prop) => {
          if (prop === 'get') return (name: string) => dataMap.get(name);
          if (prop === 'set') return (name: string, val: unknown) => {
            dataMap.set(name, val);
            return proxy;
          };
          if (prop === 'has') return (name: string) => dataMap.has(name);
          if (prop === Symbol.toStringTag) return 'Object';
          if (typeof prop === 'string') {
            if (prop === 'f' && !dataMap.has('f')) {
              const value = {} as Record<string, unknown>;
              dataMap.set('f', value);
              return value;
            }
            return dataMap.get(prop);
          }
          return undefined;
        },
        set: (_target, prop, propValue) => {
          if (typeof prop === 'string') {
            dataMap.set(prop, propValue);
            return true;
          }
          return false;
        },
        deleteProperty: (_target, prop) => {
          if (typeof prop === 'string') return dataMap.delete(prop);
          return false;
        },
        ownKeys: () => Array.from(dataMap.keys()).filter(key => key !== DATA_PROXY_KEY) as (string | symbol)[],
        getOwnPropertyDescriptor: (_target, prop) => {
          if (typeof prop === 'string' && dataMap.has(prop)) {
            return {
              enumerable: true,
              configurable: true,
              value: dataMap.get(prop)
            };
          }
          return undefined;
        }
      });

      dataMap.set(DATA_PROXY_KEY, proxy);
      return proxy as Record<string, unknown>;
    }

    if (typeof key === 'object') {
      Object.entries(key).forEach(([entryKey, entryValue]) => {
        dataMap.set(entryKey, entryValue);
      });
      return this;
    }

    if (value === undefined) return dataMap.get(key);

    dataMap.set(key, value);
    return this;
  }

  /** Gets/sets CSS properties */
  css(prop: string): string;
  css(props: Record<string, string | number>): this;
  css(prop: string, value: string | number): this;
  css(prop: string | Record<string, string | number>, value?: string | number): string | this {
    if (typeof prop === 'string' && value === undefined) {
      const el = this.elements()[0] as HTMLElement | undefined;
      return el ? window.getComputedStyle(el).getPropertyValue(prop) : '';
    }

    const props = typeof prop === 'string' ? { [prop]: value } : prop;
    this.elements().forEach(el => {
      Object.entries(props).forEach(([key, val]) => {
        (el as HTMLElement).style.setProperty(
          key.replace(/([A-Z])/g, '-$1').toLowerCase(),
          typeof val === 'number' && !key.match(/opacity|zIndex|fontWeight/) ? `${val}px` : String(val)
        );
      });
    });
    return this;
  }

  /** Gets/sets attributes */
  attr(name: string): string | undefined;
  attr(name: string, value: string | number): this;
  attr(attrs: Record<string, string | number>): this;
  attr(name: string | Record<string, string | number>, value?: string | number): string | undefined | this {
    if (typeof name === 'string' && value === undefined) {
      return this.elements()[0]?.getAttribute(name) ?? undefined;
    }

    const attrs = typeof name === 'string' ? { [name]: value } : name;
    this.elements().forEach(el => {
      Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, String(val)));
    });
    return this;
  }

  /** Adds event listener */
  on(event: string, handler: (event: Event, ...args: unknown[]) => unknown): this {
    this.nodes.forEach(node => {
      const store = ensureEventStore(node);
      let bucket = store.buckets.get(event);
      if (!bucket) {
        bucket = new Set();
        store.buckets.set(event, bucket);
        if ('addEventListener' in node) {
          const nativeListener: EventListener = nativeEvent => {
            const args = extractNativeArgs(nativeEvent);
            bucket!.forEach(cb => {
              const result = cb.call(node, nativeEvent, ...args);
              if (result === false && 'preventDefault' in nativeEvent) nativeEvent.preventDefault();
            });
          };
          node.addEventListener(event, nativeListener);
          store.native.set(event, nativeListener);
        }
      }
      bucket.add(handler);
    });
    return this;
  }

  /** Removes event listener */
  off(event: string, handler?: (event: Event, ...args: unknown[]) => unknown): this {
    this.nodes.forEach(node => {
      const store = getEventStore(node);
      if (!store) return;
      if (!handler) {
        const nativeListener = store.native.get(event);
        if (nativeListener && 'removeEventListener' in node) node.removeEventListener(event, nativeListener);
        store.native.delete(event);
        store.buckets.delete(event);
        return;
      }

      const bucket = store.buckets.get(event);
      if (!bucket) return;
      bucket.delete(handler);
      if (!bucket.size) {
        const nativeListener = store.native.get(event);
        if (nativeListener && 'removeEventListener' in node) node.removeEventListener(event, nativeListener);
        store.native.delete(event);
        store.buckets.delete(event);
      }
    });
    return this;
  }

  /** Binds event (alias for on) */
  bind(event: string, handler: (event: Event) => void): this {
    return this.on(event, handler);
  }

  /** Triggers custom event */
  trigger(event: string | (Event & Partial<SyntheticEvent>), data?: readonly unknown[] | unknown): this {
    const args = toArgsArray(data);
    const eventName = typeof event === 'string' ? event : event.type;
    const detail = toDetailValue(args);

    this.nodes.forEach(node => {
      const store = getEventStore(node);
      const bucket = store?.buckets.get(eventName);
      if (!bucket || !bucket.size) return;

      const synthetic: SyntheticEvent =
        typeof event === 'string'
          ? createSyntheticEvent(eventName, node, detail)
          : {
              type: event.type,
              target: (event.target as DOMNode | null) ?? node,
              currentTarget: node,
              detail: event.detail ?? detail,
              preventDefault: event.preventDefault?.bind(event) ?? (() => {}),
              stopPropagation: event.stopPropagation?.bind(event) ?? (() => {}),
              isDefaultPrevented:
                event.isDefaultPrevented?.bind(event) ?? (() => Boolean((event as Event).defaultPrevented)),
              isPropagationStopped:
                event.isPropagationStopped?.bind(event) ?? (() => false)
            };

      if (detail !== undefined && synthetic.detail === undefined) synthetic.detail = detail;

      bucket.forEach(handler => {
        const result = handler.call(node, synthetic as unknown as Event, ...args);
        if (result === false) {
          synthetic.preventDefault();
          synthetic.stopPropagation();
        }
      });
    });
    return this;
  }

  /** Adds CSS class */
  addClass(className: string): this {
    const tokens = className.split(/\s+/u).filter(Boolean);
    if (!tokens.length) return this;
    this.elements().forEach(el => el.classList.add(...tokens));
    return this;
  }

  /** Removes CSS class */
  removeClass(className: string): this {
    const tokens = className.split(/\s+/u).filter(Boolean);
    if (!tokens.length) return this;
    this.elements().forEach(el => el.classList.remove(...tokens));
    return this;
  }

  /** Appends element */
  append(child: Element | DOMElement | string): this {
    const elements = this.elements();
    elements.forEach(el => {
      if (typeof child === 'string') {
        el.innerHTML += child;
      } else if (child instanceof DOMElement) {
        child.elements().forEach(c => el.appendChild(c.cloneNode(true)));
      } else {
        el.appendChild(child);
      }
    });
    return this;
  }

  /** Appends to parent */
  appendTo(parent: Element | DOMElement | string): this {
    const target = typeof parent === 'string' ? new DOMElement(parent) : (parent instanceof DOMElement ? parent : new DOMElement(parent));
    target.append(this);
    return this;
  }

  /** Prepends element */
  prepend(child: Element | DOMElement): this {
    this.elements().forEach(el => {
      if (child instanceof DOMElement) {
        child.elements().forEach(c => el.insertBefore(c.cloneNode(true), el.firstChild));
      } else {
        el.insertBefore(child, el.firstChild);
      }
    });
    return this;
  }

  /** Removes element from DOM */
  remove(): this {
    this.elements().forEach(el => el.remove());
    this.nodes.length = 0;
    this.syncIndexes();
    return this;
  }

  /** Gets parent element */
  parent(): DOMElement {
    const parent = this.elements()[0]?.parentElement ?? null;
    return new DOMElement(parent || null);
  }

  /** Gets children */
  children(selector?: string): DOMElement {
    const children = Array.from(this.elements()[0]?.children || []);
    return new DOMElement(selector ? children.filter(c => c.matches(selector)) : children);
  }

  /** Finds descendants */
  find(selector: string): DOMElement {
    const found: Element[] = [];
    this.elements().forEach(el => found.push(...Array.from(el.querySelectorAll(selector))));
    return new DOMElement(found);
  }

  /** Gets element width */
  width(): number {
    const el = this.elements()[0] as HTMLElement | undefined;
    return el ? el.offsetWidth : 0;
  }

  /** Gets element height */
  height(): number {
    const el = this.elements()[0] as HTMLElement | undefined;
    return el ? el.offsetHeight : 0;
  }

  /** Gets element offset */
  offset(): { top: number; left: number } {
    const el = this.elements()[0] as HTMLElement | undefined;
    if (!el) return { top: 0, left: 0 };
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    };
  }

  /** Checks if element is visible */
  is(selector: string): boolean {
    if (selector === ':visible') {
      return this.elements().some(el => el.offsetWidth > 0 || el.offsetHeight > 0);
    }
    return this.elements().some(el => el.matches(selector));
  }

  /** Hides element */
  hide(): this {
    return this.css('display', 'none');
  }

  /** Shows element */
  show(): this {
    return this.css('display', '');
  }

  /** Extends object */
  static extend<T extends Record<string, unknown>>(
    target: T,
    ...sources: Partial<T>[]
  ): T;
  static extend<T extends Record<string, unknown>>(...sources: Partial<T>[]): T;
  static extend(...args: unknown[]): Record<string, unknown> {
    if (!args.length) return {};

    let index = 0;
    if (typeof args[0] === 'boolean') {
      index += 1; // deep copy flag not supported but ignored for compatibility
    }

    let target: Record<string, unknown>;
    if (typeof args[index] === 'object' && args[index] !== null) {
      target = args[index] as Record<string, unknown>;
      index += 1;
    } else {
      target = {};
    }

    for (let i = index; i < args.length; i += 1) {
      const source = args[i] as Record<string, unknown> | undefined;
      if (!source) continue;
      Object.keys(source).forEach(key => {
        target[key] = source[key];
      });
    }

    return target;
  }

  /** Checks if value is in array */
  static inArray<T>(value: T, array: T[]): number {
    return array.indexOf(value);
  }
}

/** jQuery-like factory function with static methods */
interface DOMFactory {
  (selector: string | Element | Element[] | DOMElement | null): DOMElement;
  extend: typeof DOMElement.extend;
  inArray: typeof DOMElement.inArray;
  isTouch: boolean;
}

export const $: DOMFactory = Object.assign(
  (selector: SelectorInput, attributes?: Record<string, unknown>): DOMElement => {
    return new DOMElement(selector, attributes);
  },
  {
    extend: DOMElement.extend.bind(DOMElement),
    inArray: DOMElement.inArray.bind(DOMElement),
    isTouch: 'ontouchstart' in window
  }
);

/** Create element helper */
export function createElement(tag: string, attrs?: Record<string, unknown>): DOMElement {
  const el = document.createElement(tag);
  if (attrs) {
    const classAttr = attrs.class;
    if (classAttr !== undefined) el.className = String(classAttr);
    const cssAttr = attrs.css;
    if (cssAttr) new DOMElement(el).css(cssAttr as Record<string, string | number>);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key !== 'class' && key !== 'css' && value !== undefined) {
        el.setAttribute(key, String(value));
      }
    });
  }
  return new DOMElement(el);
}

// Bind document and window
export const $document = new DOMElement(document.documentElement);
export const $window = new DOMElement(window as unknown as Element);
