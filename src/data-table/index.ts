// 引入即注册全部内置 valueType
import './value-type/builtin'

export { default as DataTable } from './DataTable.vue'
export { default as EllipsisText } from './cell/EllipsisText.vue'

export { defineColumns } from './interface'
export type {
  BuiltinValueType,
  CellRenderCtx,
  ColumnAlign,
  DataTableColumn,
  DataTablePagination,
  DataTableProps,
  DictItem,
  DictSpec,
  NormalizedColumn,
  RowCellProps,
  ValueTypeName,
} from './interface'

export { getDataTableConfig, setDataTableConfig } from './config'
export type {
  DataTableConfig,
  DictSource,
  MoneyFormatOptions,
  ValueFormatters,
} from './config'

export { defineValueType, getValueType, hasValueType, registerValueType } from './value-type/registry'
export type { CellCtx, ValueTypeDef } from './value-type/registry'

export { getFieldValue, resolveCellDisplay, resolveCellText } from './value-type/resolve'
export type { CellDisplay } from './value-type/resolve'

export { DATE_SENTINEL, isEmptyValue } from './value-type/empty'

export { normalizeColumn, normalizeColumns, INDEX_COLUMN_ID } from './normalizeColumns'
export type { DataTableColumnMeta } from './normalizeColumns'

export { dataTableFeatures, useDataTable } from './useDataTable'

export type {
  DictOptions,
  LinkOptions,
  PercentOptions,
  TagOptions,
} from './value-type/builtin'
