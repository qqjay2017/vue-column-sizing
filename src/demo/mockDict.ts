import type { DictItem } from '../data-table'

/**
 * demo 用字典源。生产环境用 setDataTableConfig 注入 useDictStore().getLabel，
 * 扁平索引 key 与线上一致：`${code}.${itemCode}`。
 */
const dictMap: Record<string, Record<string, string>> = {
  billStatus: {
    '0': '待生成',
    '1': '待支付',
    '2': '已支付',
    '3': '已逾期',
    '4': '已关闭',
  },
  payChannel: {
    ALIPAY: '支付宝',
    WECHAT: '微信',
    BANK: '银行转账',
  },
  bizTag: {
    '1': '新签',
    '2': '续租',
    '3': '换电',
  },
}

export function getDictLabel(code: string, itemValue: string | number): string | undefined {
  return dictMap[code]?.[String(itemValue)]
}

export const payChannelOptions: Array<DictItem> = [
  { value: 'ALIPAY', label: '支付宝' },
  { value: 'WECHAT', label: '微信' },
  { value: 'BANK', label: '银行转账' },
]

export const billStatusColorMap: Record<string, string> = {
  '0': '#8c8c8c',
  '1': '#faad14',
  '2': '#52c41a',
  '3': '#ff4d4f',
  '4': '#bfbfbf',
}

export interface Bill {
  id: string
  billNo: string
  customerName: string
  billStatus: string
  payChannel: string
  bizTags: Array<string>
  bizTagsText: string
  amountCents: number
  amountYuan: number
  rate: number
  signDate: string
  settleMonth: string
  payTime: string
  closedTime: string
  remark: string
  customer: { contact: { phone: string } }
}

const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']

export function makeBills(count: number): Array<Bill> {
  return Array.from({ length: count }, (_, index) => {
    const status = String(index % 5)
    return {
      id: `B${index + 1}`,
      billNo: `BL2026080${String(index + 1).padStart(4, '0')}`,
      customerName: names[index % names.length] + (index > 7 ? String(index) : ''),
      // 第 4 行故意给一个字典里没有的 code，验证未命中回落
      billStatus: index === 3 ? '99' : status,
      payChannel: index % 3 === 0 ? '' : payChannelOptions[index % 3].value as string,
      bizTags: index % 4 === 0 ? ['1', '3'] : ['2'],
      bizTagsText: index % 4 === 0 ? '1,2' : '3',
      amountCents: index === 2 ? Number.NaN : 123456 + index * 7890,
      amountYuan: 1234.5 + index * 100,
      rate: 3.5 + index,
      signDate: index === 1 ? '' : `2026-0${(index % 9) + 1}-1${index % 9}`,
      settleMonth: `2026-0${(index % 9) + 1}-15`,
      payTime: index === 4 ? '1000-01-01 00:00:00' : `2026-08-0${(index % 9) + 1} 09:3${index % 6}:12`,
      closedTime: index === 5 ? 'not-a-date' : '',
      remark:
        index % 2 === 0
          ? '这是一段很长的备注文本，用于验证溢出省略与 hover 才触发的 tooltip 行为是否正确'
          : '短备注',
      customer: { contact: { phone: `1380000${String(index).padStart(4, '0')}` } },
    }
  })
}
