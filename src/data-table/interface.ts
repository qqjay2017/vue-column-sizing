import type { MaybeRef, VNodeChild } from 'vue'

/** 字典项，形状与 @caes/battery-vue-ui 的 DictItem 保持一致 */
export interface DictItem {
  value: string | number
  label: string
}

/** 字典来源：字典 code / 静态字典项 / 响应式字典项 */
export type DictSpec = string | DictItem[] | MaybeRef<DictItem[]>

export type ColumnAlign = 'left' | 'center' | 'right'

/** 内置 valueType 名称，业务可通过 registerValueType 扩展 */
export type BuiltinValueType =
  | 'text'
  | 'dict'
  | 'date'
  | 'month'
  | 'time'
  | 'datetime'
  | 'money'
  | 'percent'
  | 'index'
  | 'tag'
  | 'link'

export type ValueTypeName = BuiltinValueType | (string & {})

/**
 * 单元格上下文。字段形状与旧 QueryTable 的 RowCellProps 一致，
 * 存量 347 处 `#[列key]="{ row }"` 插槽无需改动。
 */
export interface RowCellProps<TRecord = any> {
  record: TRecord
  column: DataTableColumn<TRecord>
  text: any
  value: any
  index: number
  renderIndex: number
}

/** cellRender 的入参：text 已经过 valueType 格式化 */
export interface CellRenderCtx<TRecord = any> {
  text: string
  value: any
  record: TRecord
  index: number
  column: DataTableColumn<TRecord>
}

export interface DataTableColumn<TRecord = any> {
  title?: string
  dataIndex?: string | Array<string>
  key?: string
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: ColumnAlign
  /** 沿用 antd 语义，内部映射为 tanstack pinning 的 start/end */
  fixed?: 'left' | 'right'
  ellipsis?: boolean | { showTitle?: boolean }
  /** 表头问号提示 */
  tooltip?: string
  valueType?: ValueTypeName
  /** 传给 valueType 的选项，如 money 的 decimals、tag 的 colorMap */
  valueTypeProps?: Record<string, any>
  dict?: DictSpec
  /** legacy：金额分转元，归一化为 money 的 centsToYuan 选项 */
  moneyCentsToYuan?: boolean
  isDefaultShow?: boolean
  /**
   * 在 valueType 格式化之后再包一层组件。
   * 这是「字典文案 + 状态标签」不必退化成插槽的关键通道。
   */
  cellRender?: (ctx: CellRenderCtx<TRecord>) => VNodeChild
  /** legacy 通道，兼容存量 592 处 customRender */
  customRender?: (row: RowCellProps<TRecord>) => VNodeChild
}

export interface DataTablePagination {
  current?: number
  pageSize?: number
}

export interface DataTableProps<TRecord = any> {
  columns: Array<DataTableColumn<TRecord>>
  dataSource?: Array<TRecord>
  loading?: boolean
  rowKey?: string | ((record: TRecord, index: number) => string | number)
  showIndex?: boolean
  /** 覆盖全局 emptyText */
  emptyText?: string
  total?: number
  pagination?: DataTablePagination
  paginationDisabled?: boolean
  /** 纵向滚动高度，给定后表头粘顶 */
  scrollY?: number | string
}

/**
 * 归一化后的内部列模型。legacy 字段在 normalizeColumns 里被一次性收敛到这里，
 * 之后的值渲染管线 / 表格核心 / 单元格分发只认这个形状。
 */
export interface NormalizedColumn<TRecord = any> {
  id: string
  title: string
  /** 原始列定义，插槽与 legacy customRender 需要按原样传回业务侧 */
  source: DataTableColumn<TRecord>
  /** dataIndex 归一化后的取值路径 */
  path: Array<string>
  valueType: ValueTypeName
  valueTypeProps: Record<string, any>
  align: ColumnAlign
  /** valueType 声明的单元格附加 class */
  cellClass?: string
  width?: number
  fixed?: 'left' | 'right'
  /** 溢出时是否弹 tooltip。溢出隐藏本身恒开启，与旧组件一致 */
  ellipsisTooltip: boolean
  headerTooltip?: string
  cellRender?: (ctx: CellRenderCtx<TRecord>) => VNodeChild
  customRender?: (row: RowCellProps<TRecord>) => VNodeChild
}

/** 类型安全的列定义写法，推荐新代码使用 */
export function defineColumns<TRecord = any>(
  columns: Array<DataTableColumn<TRecord>>,
): Array<DataTableColumn<TRecord>> {
  return columns
}
