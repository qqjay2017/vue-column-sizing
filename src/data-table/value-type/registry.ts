import type { VNodeChild } from 'vue'
import type { ColumnAlign, NormalizedColumn } from '../interface'
import type { DataTableConfig } from '../config'

export interface CellCtx<TRecord = any> {
  /** 表格内为当前行数据；脱离表格单独格式化时为 undefined */
  record?: TRecord
  /** 表格内为行下标；脱离表格单独格式化时为 undefined */
  index?: number
  /** 表格内为所属列模型；脱离表格单独格式化时为 undefined */
  column?: NormalizedColumn<TRecord>
  config: DataTableConfig
  /** format 的产物，仅在 render 阶段有值，供组件类复用文本 */
  text?: string
}

export interface ValueTypeDef<TOptions = any> {
  /**
   * 值 → 展示文本。文本类必须实现。
   * 返回 undefined 表示无可展示文本，由管线回落到 emptyText。
   */
  format?: (value: unknown, ctx: CellCtx, options: TOptions) => string | undefined
  /** 值 → VNode。组件类实现，与 format 可并存（format 供 tooltip/复制/导出复用） */
  render?: (value: unknown, ctx: CellCtx, options: TOptions) => VNodeChild
  /** 该类型的默认对齐，列上显式 align 优先 */
  align?: ColumnAlign
  /** 该类型单元格的附加 class，如 money 的等宽数字字体 */
  cellClass?: string
  /** 未显式给 width 时的兜底列宽 */
  defaultWidth?: number
  /** 值为空时仍然调用 format/render，序号列等依赖行上下文的类型需要开启 */
  allowEmpty?: boolean
}

const registry = new Map<string, ValueTypeDef>()

export function registerValueType<TOptions>(
  name: string,
  def: ValueTypeDef<TOptions>,
): void {
  registry.set(name, def as ValueTypeDef)
}

export function getValueType(name?: string): ValueTypeDef | undefined {
  return name ? registry.get(name) : undefined
}

export function hasValueType(name: string): boolean {
  return registry.has(name)
}

/** 仅用于类型推导，让自定义类型的 options 得到收窄 */
export function defineValueType<TOptions>(
  def: ValueTypeDef<TOptions>,
): ValueTypeDef<TOptions> {
  return def
}
