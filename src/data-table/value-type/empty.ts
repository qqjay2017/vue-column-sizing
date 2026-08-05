export const DATE_SENTINEL = '1000-01-01 00:00:00'

/** 统一的空值判定，取代旧代码里三套语义不一致的实现 */
export function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    value === DATE_SENTINEL
  )
}
