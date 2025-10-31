/**
 * Minimal jQuery-like DOM manipulation library for PageTurn.js
 * Provides only the methods needed by the legacy turn.js code
 */

type ElementDataMap = Map<string, unknown>;
const dataStore = new WeakMap<Element, ElementDataMap>();

/** Gets or creates data storage for an element */
const getElementData = (el: Element): ElementDataMap => {
  if (!dataStore.has(el)) dataStore.set(el, new Map());
  return dataStore.get(el)!;
};

export class DOMElement {
  private elements: Element[];
  
  constructor(selector: string | Element | Element[] | DOMElement | null) {
    if (!selector) {
      this.elements = [];
    } else if (typeof selector === 'string') {
      this.elements = Array.from(document.querySelectorAll(selector));
    } else if (selector instanceof Element) {
      this.elements = [selector];
    } else if (selector instanceof DOMElement) {
      this.elements = selector.elements;
    } else if (Array.isArray(selector)) {
      this.elements = selector;
    } else {
      this.elements = [];
    }
  }

  /** Returns the number of elements */
  get length(): number {
    return this.elements.length;
  }

  /** jQuery compatibility flag */
  get jquery(): string {
    return 'pageturn';
  }

  /** Returns the first element */
  get(index = 0): Element | undefined {
    return this.elements[index];
  }

  /** Iterates over elements */
  each(callback: (index: number, element: Element) => void | false): this {
    for (let i = 0; i < this.elements.length; i++) {
      if (callback.call(this.elements[i], i, this.elements[i]) === false) break;
    }
    return this;
  }

  /** Gets/sets data attributes */
  data(): ElementDataMap;
  data(key: string): unknown;
  data(key: string, value: unknown): this;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  data(key?: string, value?: unknown): ElementDataMap | unknown | this {
    const el = this.elements[0];
    if (!el) return key === undefined ? new Map() : undefined;

    const dataMap = getElementData(el);

    if (key === undefined) return dataMap;
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
      const el = this.elements[0] as HTMLElement;
      return el ? window.getComputedStyle(el).getPropertyValue(prop) : '';
    }

    const props = typeof prop === 'string' ? { [prop]: value } : prop;
    this.elements.forEach(el => {
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
      return this.elements[0]?.getAttribute(name) ?? undefined;
    }

    const attrs = typeof name === 'string' ? { [name]: value } : name;
    this.elements.forEach(el => {
      Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, String(val)));
    });
    return this;
  }

  /** Adds event listener */
  on(event: string, handler: (event: Event, ...args: unknown[]) => void): this {
    this.elements.forEach(el => el.addEventListener(event, handler as EventListener));
    return this;
  }

  /** Removes event listener */
  off(event: string, handler?: (event: Event, ...args: unknown[]) => void): this {
    this.elements.forEach(el => {
      if (handler) {
        el.removeEventListener(event, handler as EventListener);
      } else {
        // Remove all listeners by cloning the element
        const clone = el.cloneNode(true);
        el.parentNode?.replaceChild(clone, el);
      }
    });
    return this;
  }

  /** Binds event (alias for on) */
  bind(event: string, handler: (event: Event) => void): this {
    return this.on(event, handler);
  }

  /** Triggers custom event */
  trigger(event: string | Event, data?: readonly unknown[]): this {
    const evt = typeof event === 'string' 
      ? new CustomEvent(event, { detail: data, bubbles: true }) 
      : event;
    
    this.elements.forEach(el => el.dispatchEvent(evt));
    return this;
  }

  /** Adds CSS class */
  addClass(className: string): this {
    this.elements.forEach(el => el.classList.add(className));
    return this;
  }

  /** Removes CSS class */
  removeClass(className: string): this {
    this.elements.forEach(el => el.classList.remove(className));
    return this;
  }

  /** Appends element */
  append(child: Element | DOMElement | string): this {
    this.elements.forEach(el => {
      if (typeof child === 'string') {
        el.innerHTML += child;
      } else if (child instanceof DOMElement) {
        child.elements.forEach(c => el.appendChild(c.cloneNode(true)));
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
    this.elements.forEach(el => {
      if (child instanceof DOMElement) {
        child.elements.forEach(c => el.insertBefore(c.cloneNode(true), el.firstChild));
      } else {
        el.insertBefore(child, el.firstChild);
      }
    });
    return this;
  }

  /** Removes element from DOM */
  remove(): this {
    this.elements.forEach(el => el.remove());
    this.elements = [];
    return this;
  }

  /** Gets parent element */
  parent(): DOMElement {
    const parent = this.elements[0]?.parentElement;
    return new DOMElement(parent || null);
  }

  /** Gets children */
  children(selector?: string): DOMElement {
    const children = Array.from(this.elements[0]?.children || []);
    return new DOMElement(selector ? children.filter(c => c.matches(selector)) : children);
  }

  /** Finds descendants */
  find(selector: string): DOMElement {
    const found: Element[] = [];
    this.elements.forEach(el => found.push(...Array.from(el.querySelectorAll(selector))));
    return new DOMElement(found);
  }

  /** Gets element width */
  width(): number {
    const el = this.elements[0] as HTMLElement;
    return el ? el.offsetWidth : 0;
  }

  /** Gets element height */
  height(): number {
    const el = this.elements[0] as HTMLElement;
    return el ? el.offsetHeight : 0;
  }

  /** Gets element offset */
  offset(): { top: number; left: number } {
    const el = this.elements[0] as HTMLElement;
    if (!el) return { top: 0, left: 0 };
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    };
  }

  /** Checks if element is visible */
  is(selector: string): boolean {
    return this.elements.some(el => el.matches(selector));
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
  static extend<T extends object>(...objects: Partial<T>[]): T {
    return Object.assign({}, ...objects) as T;
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
  (selector: string | Element | Element[] | DOMElement | null): DOMElement => {
    return new DOMElement(selector);
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
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (classAttr !== undefined) el.className = String(classAttr);
    const cssAttr = attrs.css;
    if (cssAttr) new DOMElement(el).css(cssAttr as Record<string, string | number>);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key !== 'class' && key !== 'css' && value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        el.setAttribute(key, String(value));
      }
    });
  }
  return new DOMElement(el);
}

// Bind document and window
export const $document = new DOMElement(document.documentElement);
export const $window = new DOMElement(window as unknown as Element);
