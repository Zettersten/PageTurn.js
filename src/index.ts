import $ from 'jquery';
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

type JQueryElement = JQuery<HTMLElement>;
type AnyEventHandler = NonNullable<TurnWhenHandlers[TurnEventName]>;
type Listener = (event: JQuery.Event, ...args: unknown[]) => void;

const eventAdapters: Record<TurnEventName, (args: unknown[]) => unknown> = {
  start: ([opts, corner]) => ({ page: (opts as { page: number }).page, corner: corner as Corner }),
  turning: ([page, view]) => ({ page: page as number, view: view as number[] }),
  turn: ([page]) => page as number,
  turned: ([page, view]) => ({ page: page as number, view: view as number[] }),
  first: () => undefined,
  last: () => undefined
};

const toJQuery = (target: HTMLElement | JQueryElement | string): JQueryElement => {
  if (typeof target === 'string') return $(target);
  if ((target as JQueryElement).jquery) return target as JQueryElement;
  return $(target as HTMLElement);
};

const wrapInstance = (element: JQueryElement): TurnInstance => {
  const listenerRegistry = new Map<TurnEventName, Map<AnyEventHandler, Listener>>();

  const ensureListenerBucket = (event: TurnEventName): Map<AnyEventHandler, Listener> => {
    if (!listenerRegistry.has(event)) listenerRegistry.set(event, new Map());
    return listenerRegistry.get(event)!;
  };

  const instance: TurnInstance = {
    addPage(pageElement: HTMLElement, page?: number) {
      element.turn('addPage', pageElement, page);
      return instance;
    },
    hasPage(page: number) {
      return Boolean(element.turn('hasPage', page));
    },
    display(mode?: DisplayMode): DisplayMode | TurnInstance {
      if (mode === undefined) {
        return element.turn('display') as DisplayMode;
      }
      element.turn('display', mode);
      return instance;
    },
    animating() {
      return Boolean(element.turn('animating'));
    },
    disable(disabled?: boolean) {
      element.turn('disable', disabled);
      return instance;
    },
    size(width?: number, height?: number): Size | TurnInstance {
      if (width === undefined || height === undefined) {
        const { width: w, height: h } = element.turn('size') as Size;
        return { width: w, height: h };
      }
      element.turn('size', width, height);
      return instance;
    },
    resize() {
      element.turn('resize');
    },
    removePage(page: number) {
      element.turn('removePage', page);
      return instance;
    },
    pages(total?: number): number | TurnInstance {
      if (total === undefined) {
        return element.turn('pages') as number;
      }
      element.turn('pages', total);
      return instance;
    },
    range(page?: number) {
      return element.turn('range', page) as readonly [number, number];
    },
    view(page?: number) {
      return element.turn('view', page) as readonly number[];
    },
    page(page?: number): number | TurnInstance {
      if (page === undefined) {
        return element.turn('page') as number;
      }
      element.turn('page', page);
      return instance;
    },
    next() {
      element.turn('next');
      return instance;
    },
    previous() {
      element.turn('previous');
      return instance;
    },
    stop(force?: boolean) {
      element.turn('stop', force);
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
 * Creates a turn.js instance using a DOM element or selector.
 */
export const createTurn = (
  target: HTMLElement | JQueryElement | string,
  options: Partial<TurnOptions> = {}
): TurnInstance => {
  const element = toJQuery(target);
  element.turn(options);
  return wrapInstance(element);
};

/**
 * Gets a typed wrapper around an existing turn.js instance.
 */
export const useTurn = (target: HTMLElement | JQueryElement | string): TurnInstance => {
  const element = toJQuery(target);
  return wrapInstance(element);
};

/**
 * Indicates whether the environment supports touch interactions.
 */
export const isTouchDevice = Boolean(($ as unknown as { isTouch?: boolean }).isTouch);

export type { TurnInstance, TurnOptions, TurnWhenHandlers, DisplayMode, Size } from './types.js';
