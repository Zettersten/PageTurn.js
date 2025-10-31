type Corner = 'tl' | 'tr' | 'bl' | 'br';
type CornerGroup = 'forward' | 'backward' | 'all';
type DisplayMode = 'single' | 'double';
type TurnEventName = 'start' | 'turning' | 'turn' | 'turned' | 'first' | 'last';
type TurnEventHandler<TPayload> = (payload: TPayload) => void;
interface TurnWhenHandlers {
    readonly start?: TurnEventHandler<{
        page: number;
        corner: Corner;
    }>;
    readonly turning?: TurnEventHandler<{
        page: number;
        view: readonly number[];
    }>;
    readonly turn?: TurnEventHandler<number>;
    readonly turned?: TurnEventHandler<{
        page: number;
        view: readonly number[];
    }>;
    readonly first?: TurnEventHandler<void>;
    readonly last?: TurnEventHandler<void>;
}
interface TurnOptions {
    readonly width?: number;
    readonly height?: number;
    readonly page?: number;
    readonly gradients?: boolean;
    readonly duration?: number;
    readonly acceleration?: boolean;
    readonly display?: DisplayMode;
    readonly pages?: number;
    readonly corners?: Partial<Record<CornerGroup, readonly Corner[]>>;
    readonly cornerSize?: number;
    readonly when?: TurnWhenHandlers;
}
interface Size {
    readonly width: number;
    readonly height: number;
}
interface TurnInstance {
    addPage(element: HTMLElement, page?: number): TurnInstance;
    hasPage(page: number): boolean;
    display(mode?: DisplayMode): DisplayMode | TurnInstance;
    animating(): boolean;
    disable(disabled?: boolean): TurnInstance;
    size(width?: number, height?: number): Size | TurnInstance;
    resize(): void;
    removePage(page: number): TurnInstance;
    pages(total?: number): number | TurnInstance;
    range(page?: number): readonly [number, number];
    view(page?: number): readonly number[];
    page(page?: number): number | TurnInstance;
    next(): TurnInstance;
    previous(): TurnInstance;
    stop(force?: boolean): TurnInstance;
    on<TName extends TurnEventName>(event: TName, handler: NonNullable<TurnWhenHandlers[TName]>): TurnInstance;
    off<TName extends TurnEventName>(event: TName, handler: NonNullable<TurnWhenHandlers[TName]>): TurnInstance;
}

type JQueryElement = JQuery<HTMLElement>;
/**
 * Creates a turn.js instance using a DOM element or selector.
 */
declare const createTurn: (target: HTMLElement | JQueryElement | string, options?: Partial<TurnOptions>) => TurnInstance;
/**
 * Gets a typed wrapper around an existing turn.js instance.
 */
declare const useTurn: (target: HTMLElement | JQueryElement | string) => TurnInstance;
/**
 * Indicates whether the environment supports touch interactions.
 */
declare const isTouchDevice: boolean;

export { type DisplayMode, type Size, type TurnInstance, type TurnOptions, type TurnWhenHandlers, createTurn, isTouchDevice, useTurn };
