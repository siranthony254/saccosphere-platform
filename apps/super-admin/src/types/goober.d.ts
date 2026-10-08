declare module 'goober' {
  export type CSSObject = Record<string, unknown>

  export function css(...args: unknown[]): string
  export function keyframes(...args: unknown[]): string
  export function setup(...args: unknown[]): unknown
  export function styled<T extends keyof JSX.IntrinsicElements>(
    tag: T,
  ): (...args: unknown[]) => unknown
}
