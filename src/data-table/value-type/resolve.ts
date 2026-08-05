import type { VNodeChild } from 'vue'
import { getDataTableConfig } from '../config'
import type { ColumnAlign, NormalizedColumn } from '../interface'
import type { CellCtx } from './registry'
import { getValueType } from './registry'
import { formatWithDef, renderWithDef } from './format'

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
 * 表格单元格的值解析入口。展示、tooltip、列宽测量都走这里，
 * 取代旧实现中 #bodyCell 模板 / valueTypeRender / getCellDisplayContent 三份各自演化的逻辑。
 * 文本与组件的具体判定复用 format.ts，与脱离表格的 formatValue / ValueCell 同源。
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
  const text = formatWithDef(raw, def, ctx, options)

  return {
    text,
    node: renderWithDef(raw, def, ctx, text, options),
    raw,
    align: column.align,
  }
}

/** 只要文本的轻量版：tooltip、列宽测量、后续的复制/导出都复用它 */
export function resolveCellText<TRecord>(
  column: NormalizedColumn<TRecord>,
  record: TRecord,
  index: number,
  emptyText?: string,
): string {
  const raw = getFieldValue(record, column.path)
  return formatWithDef(
    raw,
    getValueType(column.valueType),
    buildCtx(column, record, index, emptyText),
    column.valueTypeProps,
  )
}
