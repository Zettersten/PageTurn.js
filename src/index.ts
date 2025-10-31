import { $, DOMElement } from './utils/dom.js';
import './legacy/turn.js';

import type {
  Corner,
  DisplayMode,
  Size,
  TurnEventName,
  TurnInstance,
  TurnOptions,
  TurnWhenHandlers
} from './types.js';

type AnyEventHandler = NonNullable<TurnWhenHandlers[TurnEventName]>;
type Listener = (event: Event, ...args: unknown[]) => void;

const eventAdapters: Record<TurnEventName, (args: unknown[]) => unknown> = {
  start: ([opts, corner]) => ({ page: (opts as { page: number }).page, corner: corner as Corner }),
  turning: ([page, view]) => ({ page: page as number, view: view as number[] }),
  turn: ([page]) => page as number,
  turned: ([page, view]) => ({ page: page as number, view: view as number[] }),
  first: () => undefined,
  last: () => undefined
};

const toDOM = (target: HTMLElement | DOMElement | string): DOMElement => {
  if (typeof target === 'string') return $(target);
  if ((target as DOMElement).jquery) return target as DOMElement;
  return $(target as HTMLElement);
};

const wrapInstance = (element: DOMElement): TurnInstance => {
  const listenerRegistry = new Map<TurnEventName, Map<AnyEventHandler, Listener>>();

  const ensureListenerBucket = (event: TurnEventName): Map<AnyEventHandler, Listener> => {
    if (!listenerRegistry.has(event)) listenerRegistry.set(event, new Map());
    return listenerRegistry.get(event)!;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const turn = (element as any).turn.bind(element);

  const instance: TurnInstance = {
    addPage(pageElement: HTMLElement, page?: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('addPage', pageElement, page);
      return instance;
    },
    hasPage(page: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return Boolean(turn('hasPage', page));
    },
    display(mode?: DisplayMode): DisplayMode | TurnInstance {
      if (mode === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return turn('display') as DisplayMode;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('display', mode);
      return instance;
    },
    animating() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return Boolean(turn('animating'));
    },
    disable(disabled?: boolean) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('disable', disabled);
      return instance;
    },
    size(width?: number, height?: number): Size | TurnInstance {
      if (width === undefined || height === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const { width: w, height: h } = turn('size') as Size;
        return { width: w, height: h };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('size', width, height);
      return instance;
    },
    resize() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('resize');
    },
    removePage(page: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('removePage', page);
      return instance;
    },
    pages(total?: number): number | TurnInstance {
      if (total === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return turn('pages') as number;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('pages', total);
      return instance;
    },
    range(page?: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return turn('range', page) as readonly [number, number];
    },
    view(page?: number) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return turn('view', page) as readonly number[];
    },
    page(page?: number): number | TurnInstance {
      if (page === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return turn('page') as number;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('page', page);
      return instance;
    },
    next() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('next');
      return instance;
    },
    previous() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('previous');
      return instance;
    },
    stop(force?: boolean) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      turn('stop', force);
      return instance;
    },
    on<TName extends TurnEventName>(event: TName, handler: NonNullable<TurnWhenHandlers[TName]>) {
      const bucket = ensureListenerBucket(event);
      const key = handler as AnyEventHandler;
      if (bucket.has(key)) return instance;

      const callback: Listener = (_event, ...args: unknown[]) => {
        const adapter = eventAdapters[event];
        if (!adapter) {
          (handler as (payload: unknown) => void)(args[0]);
          return;
        }

        const payload = adapter(args);
        if (payload === undefined) {
          (handler as () => void)();
        } else {
          (handler as (payload: unknown) => void)(payload);
        }
      };

      bucket.set(key, callback);
      element.on(event, callback);
      return instance;
    },
    off<TName extends TurnEventName>(event: TName, handler: NonNullable<TurnWhenHandlers[TName]>) {
      const bucket = listenerRegistry.get(event);
      const key = handler as AnyEventHandler;
      const callback = bucket?.get(key);
      if (callback) {
        element.off(event, callback);
        bucket?.delete(key);
      }
      return instance;
    }
  };

  return instance;
};

/**
 * Creates a PageTurn.js instance using a DOM element or selector.
 */
export const createTurn = (
  target: HTMLElement | DOMElement | string,
  options: Partial<TurnOptions> = {}
): TurnInstance => {
  const element = toDOM(target);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  (element as any).turn(options);
  return wrapInstance(element);
};

/**
 * Gets a typed wrapper around an existing PageTurn.js instance.
 */
export const useTurn = (target: HTMLElement | DOMElement | string): TurnInstance => {
  const element = toDOM(target);
  return wrapInstance(element);
};

/**
 * Indicates whether the environment supports touch interactions.
 */
export const isTouchDevice = 'ontouchstart' in window;

export type { TurnInstance, TurnOptions, TurnWhenHandlers, DisplayMode, Size } from './types.js';
