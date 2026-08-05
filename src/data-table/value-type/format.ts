import type { VNodeChild } from 'vue'
import { getDataTableConfig } from '../config'
import type { ColumnAlign, ValueTypeName } from '../interface'
import { isEmptyValue } from './empty'
import type { CellCtx, ValueTypeDef } from './registry'
import { getValueType } from './registry'

/** 脱离表格使用时的可选上下文，只有依赖行信息的类型（如 index）才需要 */
export interface ValueContext<TRecord = any> {
  record?: TRecord
  index?: number
  /** 覆盖全局 emptyText */
  emptyText?: string
}

export interface ValueDisplay {
  /** 已格式化的展示文本，永远有值（空值为 emptyText） */
  text: string
  /** 组件类的渲染结果，有则优先渲染 */
  node?: VNodeChild
  align: ColumnAlign
  /** 该类型声明的样式类，如 money 的 dt-money */
  cellClass?: string
}

export function buildValueCtx<TRecord>(
  context: ValueContext<TRecord> = {},
): CellCtx<TRecord> {
  const config = getDataTableConfig()
  return {
    record: context.record,
    index: context.index,
    config:
      context.emptyText === undefined
        ? config
        : { ...config, emptyText: context.emptyText },
  }
}

/** 文本通道的唯一实现，表格单元格与脱离表格的 formatValue 都走它 */
export function formatWithDef(
  raw: unknown,
  def: ValueTypeDef | undefined,
  ctx: CellCtx,
  options: Record<string, any> = {},
): string {
  const { emptyText } = ctx.config
  if (isEmptyValue(raw) && !def?.allowEmpty) {
    return emptyText
  }
  const formatted = def?.format
    ? def.format(raw, ctx, options)
    : isEmptyValue(raw)
      ? undefined
      : String(raw)
  return formatted === undefined || formatted === '' ? emptyText : formatted
}

/** 组件通道的唯一实现 */
export function renderWithDef(
  raw: unknown,
  def: ValueTypeDef | undefined,
  ctx: CellCtx,
  text: string,
  options: Record<string, any> = {},
): VNodeChild | undefined {
  if (!def?.render || (isEmptyValue(raw) && !def.allowEmpty)) {
    return undefined
  }
  return def.render(raw, { ...ctx, text }, options)
}

/**
 * 值 → 文本。项目任何地方都能直接用，不需要表格上下文：
 * formatValue('money', 123456, { centsToYuan: true }) // '1,234.56'
 */
export function formatValue<TRecord = any>(
  type: ValueTypeName,
  value: unknown,
  options?: Record<string, any>,
  context?: ValueContext<TRecord>,
): string {
  return formatWithDef(value, getValueType(type), buildValueCtx(context), options)
}

/** 柯里化版本，契合 `value: (val) => ...` 这类配置式写法 */
export function createValueFormatter(
  type: ValueTypeName,
  options?: Record<string, any>,
): (value: unknown) => string {
  return (value) => formatValue(type, value, options)
}

/** 值 → VNode。仅组件类（tag/link 等）有返回，文本类返回 undefined */
export function renderValue<TRecord = any>(
  type: ValueTypeName,
  value: unknown,
  options?: Record<string, any>,
  context?: ValueContext<TRecord>,
): VNodeChild | undefined {
  const def = getValueType(type)
  const ctx = buildValueCtx(context)
  const text = formatWithDef(value, def, ctx, options)
  return renderWithDef(value, def, ctx, text, options)
}

/** 文本 + 组件 + 样式一次拿全，ValueCell 与表格单元格共用同一份判定 */
export function resolveValueDisplay<TRecord = any>(
  type: ValueTypeName,
  value: unknown,
  options?: Record<string, any>,
  context?: ValueContext<TRecord>,
): ValueDisplay {
  const def = getValueType(type)
  const ctx = buildValueCtx(context)
  const text = formatWithDef(value, def, ctx, options)
  return {
    text,
    node: renderWithDef(value, def, ctx, text, options),
    align: def?.align ?? 'left',
    cellClass: def?.cellClass,
  }
}
