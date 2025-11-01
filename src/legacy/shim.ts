/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { $, DOMElement } from '../utils/dom.js';

type JQueryEvent = {
  type: string;
  target: any;
  currentTarget: any;
  detail: unknown;
  preventDefault(): void;
  stopPropagation(): void;
  isDefaultPrevented(): boolean;
  isPropagationStopped(): boolean;
};

const createJQueryEvent = (type: string): JQueryEvent => {
  let defaultPrevented = false;
  let propagationStopped = false;

  return {
    type,
    target: null,
    currentTarget: null,
    detail: undefined,
    preventDefault() {
      defaultPrevented = true;
    },
    stopPropagation() {
      propagationStopped = true;
    },
    isDefaultPrevented: () => defaultPrevented,
    isPropagationStopped: () => propagationStopped
  };
};

interface JQueryShim {
  (selector: Parameters<typeof $>[0], attributes?: Record<string, unknown>): DOMElement;
  fn: typeof DOMElement.prototype;
  extend: typeof $.extend;
  inArray: typeof $.inArray;
  isTouch: boolean;
  Event: (type: string) => JQueryEvent;
}

const jQueryShim = ((selector: Parameters<typeof $>[0], attributes?: Record<string, unknown>) => {
  if (selector instanceof DOMElement) return new DOMElement(selector.nodes, attributes);
  return new DOMElement(selector, attributes);
}) as JQueryShim;

Object.assign(jQueryShim, {
  extend: $.extend.bind($),
  inArray: $.inArray.bind($),
  isTouch: $.isTouch
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jQueryShim.fn = DOMElement.prototype as any;
jQueryShim.Event = (type: string) => createJQueryEvent(type);

const globalWin = window as unknown as {
  jQuery?: JQueryShim;
  $?: JQueryShim;
  __PAGE_TURN_SHIM__?: JQueryShim;
};

if (!globalWin.__PAGE_TURN_SHIM__) globalWin.__PAGE_TURN_SHIM__ = jQueryShim;
globalWin.jQuery = jQueryShim;
globalWin.$ = jQueryShim;

export default jQueryShim;
export { jQueryShim };
