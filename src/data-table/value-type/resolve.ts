import type { VNodeChild } from 'vue'
import { getDataTableConfig } from '../config'
import type { ColumnAlign, NormalizedColumn } from '../interface'
import { isEmptyValue } from './empty'
import type { CellCtx, ValueTypeDef } from './registry'
import { getValueType } from './registry'

export interface CellDisplay {
  /** 已格式化的展示文本，永远有值 */
  text: string
  /** 组件类渲染结果，有则优先渲染 */
  node?: VNodeChild
  /** 原始值，供 cellRender / 插槽消费 */
  raw: unknown
  align: ColumnAlign
}

/** 按归一化后的路径深层取值，dataIndex 为数组时逐级下钻 */
export function getFieldValue(record: unknown, path: Array<string>): unknown {
  if (record == null || path.length === 0) {
    return undefined
  }
  return path.reduce<any>(
    (acc, key) => (acc == null ? undefined : acc[key]),
    record,
  )
}

function computeText(
  raw: unknown,
  def: ValueTypeDef | undefined,
  ctx: CellCtx,
  options: Record<string, any>,
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

function buildCtx<TRecord>(
  column: NormalizedColumn<TRecord>,
  record: TRecord,
  index: number,
  emptyText?: string,
): CellCtx<TRecord> {
  const config = getDataTableConfig()
  return {
    record,
    index,
    column,
    config: emptyText === undefined ? config : { ...config, emptyText },
  }
}

/**
 * 全组件唯一的值解析入口。展示、tooltip、列宽测量都走这里，
 * 取代旧实现中 #bodyCell 模板 / valueTypeRender / getCellDisplayContent 三份各自演化的逻辑。
 */
export function resolveCellDisplay<TRecord>(
  column: NormalizedColumn<TRecord>,
  record: TRecord,
  index: number,
  emptyText?: string,
): CellDisplay {
  const raw = getFieldValue(record, column.path)
  const def = getValueType(column.valueType)
  const ctx = buildCtx(column, record, index, emptyText)
  const options = column.valueTypeProps
  const text = computeText(raw, def, ctx, options)

  const node =
    def?.render && (!isEmptyValue(raw) || def.allowEmpty)
      ? def.render(raw, { ...ctx, text }, options)
      : undefined

  return { text, node, raw, align: column.align }
}

/** 只要文本的轻量版：tooltip、列宽测量、后续的复制/导出都复用它 */
export function resolveCellText<TRecord>(
  column: NormalizedColumn<TRecord>,
  record: TRecord,
  index: number,
  emptyText?: string,
): string {
  const raw = getFieldValue(record, column.path)
  const def = getValueType(column.valueType)
  return computeText(
    raw,
    def,
    buildCtx(column, record, index, emptyText),
    column.valueTypeProps,
  )
}
