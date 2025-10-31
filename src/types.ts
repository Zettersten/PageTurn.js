export type Corner = 'tl' | 'tr' | 'bl' | 'br';

export type CornerGroup = 'forward' | 'backward' | 'all';

export type DisplayMode = 'single' | 'double';

export type TurnEventName =
  | 'start'
  | 'turning'
  | 'turn'
  | 'turned'
  | 'first'
  | 'last';

export type TurnEventHandler<TPayload> = (payload: TPayload) => void;

export interface TurnWhenHandlers {
  readonly start?: TurnEventHandler<{ page: number; corner: Corner }>;
  readonly turning?: TurnEventHandler<{ page: number; view: readonly number[] }>;
  readonly turn?: TurnEventHandler<number>;
  readonly turned?: TurnEventHandler<{ page: number; view: readonly number[] }>;
  readonly first?: TurnEventHandler<void>;
  readonly last?: TurnEventHandler<void>;
}

export interface TurnOptions {
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

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Range {
  readonly from: number;
  readonly to: number;
}

export interface TurnInstance {
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
