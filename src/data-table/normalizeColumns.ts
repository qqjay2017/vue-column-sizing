import { getValueType } from './value-type/registry'
import type { ColumnAlign, DataTableColumn, NormalizedColumn } from './interface'

export const INDEX_COLUMN_ID = '__index__'

/** 通过 tableFeatures 的 columnMeta 类型槽注入，无需全局 declare module */
export interface DataTableColumnMeta {
  column: NormalizedColumn
}

function resolveId(source: DataTableColumn, fallbackIndex: number): string {
  if (source.key) {
    return source.key
  }
  if (Array.isArray(source.dataIndex)) {
    return source.dataIndex.join('.')
  }
  return source.dataIndex ?? `__col_${fallbackIndex}__`
}

function resolvePath(dataIndex?: string | Array<string>): Array<string> {
  if (dataIndex === undefined) {
    return []
  }
  // 字符串形态按单个 key 处理，与 antd 一致（'a.b' 不拆分）
  return Array.isArray(dataIndex) ? dataIndex : [dataIndex]
}

/**
 * 旧语义：溢出隐藏恒开启，ellipsis 只控制是否弹 tooltip。
 * 未写 → 不弹；true → 弹；{ showTitle } → 按 showTitle。
 */
function resolveEllipsisTooltip(ellipsis: DataTableColumn['ellipsis']): boolean {
  if (typeof ellipsis === 'boolean') {
    return ellipsis
  }
  return ellipsis?.showTitle ?? false
}

function resolveValueTypeProps(source: DataTableColumn): Record<string, any> {
  const options: Record<string, any> = { ...source.valueTypeProps }
  // legacy：列上直接写 dict / moneyCentsToYuan，归一化为 valueType 的选项
  if (source.dict !== undefined && options.dict === undefined) {
    options.dict = source.dict
  }
  if (source.moneyCentsToYuan !== undefined && options.centsToYuan === undefined) {
    options.centsToYuan = source.moneyCentsToYuan
  }
  return options
}

export function normalizeColumn(
  source: DataTableColumn,
  fallbackIndex: number,
): NormalizedColumn {
  // 存量 1273 处只写 dict 不写 valueType，这里补齐
  const valueType = source.valueType ?? (source.dict !== undefined ? 'dict' : 'text')
  const def = getValueType(valueType)

  return {
    id: resolveId(source, fallbackIndex),
    title: source.title ?? '',
    source,
    path: resolvePath(source.dataIndex),
    valueType,
    valueTypeProps: resolveValueTypeProps(source),
    align: source.align ?? def?.align ?? ('left' as ColumnAlign),
    width: source.width ?? def?.defaultWidth,
    fixed: source.fixed,
    ellipsisTooltip: resolveEllipsisTooltip(source.ellipsis),
    headerTooltip: source.tooltip,
    cellRender: source.cellRender,
    customRender: source.customRender,
  }
}

const indexColumnSource: DataTableColumn = {
  key: INDEX_COLUMN_ID,
  title: '序号',
  valueType: 'index',
  fixed: 'left',
}

export function normalizeColumns(
  columns: Array<DataTableColumn>,
  { showIndex = false }: { showIndex?: boolean } = {},
): Array<NormalizedColumn> {
  const normalized = columns.map((column, index) => normalizeColumn(column, index))
  return showIndex
    ? [normalizeColumn(indexColumnSource, -1), ...normalized]
    : normalized
}
