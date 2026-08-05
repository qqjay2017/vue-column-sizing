import { createServer } from 'vite'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, h } from 'vue'

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  plugins: [
    (await import('@vitejs/plugin-vue')).default(),
    (await import('@vitejs/plugin-vue-jsx')).default(),
  ],
})

async function render(path, props = {}) {
  const mod = await server.ssrLoadModule(path)
  const app = createSSRApp({ render: () => h(mod.default, props) })
  return renderToString(app)
}

function check(name, condition, extra = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${condition ? '' : ` ${extra}`}`)
  if (!condition) process.exitCode = 1
}

try {
  const basic = await render('/src/demo/DemoBasic.vue')
  const compare = await render('/src/demo/DemoCompare.vue')

  const cells = [...basic.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1])
  const text = basic.replace(/<[^>]+>/g, '\u0001')

  check('序号列渲染', /<th[^>]*>.*?序号/.test(basic) && text.includes('\u00011\u0001'))
  check('字典命中 → label', text.includes('待支付'), basic.slice(0, 200))
  check('字典未命中 → 回落原始 code', text.includes('99'))
  check('多值字典(数组) → 新签,换电', text.includes('新签,换电'))
  check('多值字典(逗号串) → 新签,续租', text.includes('新签,续租'))
  check('date 格式化', /2026-01-10|2026-0\d-1\d/.test(basic))
  check('month 格式化', /2026-0\d(?!-)/.test(text))
  check('time 格式化', /2026-08-0\d 09:3\d:12/.test(basic))
  check('哨兵日期 → emptyText', cells.some((c) => c.replace(/<[^>]+>/g, '').trim() === '-'))
  check('非法日期 → 原始串', text.includes('not-a-date'))
  check('金额分转元千分位', text.includes('1,234.56'))
  check('金额 NaN → emptyText', !text.includes('NaN'))
  check('金额带符号', text.includes('¥'))
  check('percent', /3\.50%/.test(text))
  check('money 右对齐', /class="[^"]*dt-align-right/.test(basic))
  check('money 单元格带 dt-money 字体类', /<td class="dt-align-right dt-money"/.test(basic))
  check('percent 不带 dt-money', !/dt-align-right dt-money[^"]*"[^>]*>[^<]*%/.test(basic))
  check('valueType:tag 出组件', /class="dt-tag"/.test(basic))
  check('valueType:link 出组件', /class="dt-link"/.test(basic))
  check('dict + cellRender 拿到字典 label', /class="dt-tag"[^>]*>待支付</.test(basic))
  check('深层 dataIndex 取值', /1380000000\d/.test(text))
  check('legacy customRender 返回 VNode', /<b style="color:#1677ff;?"/.test(basic))
  check(
    'legacy customRender 返回字符串 + ellipsis → 走 EllipsisText',
    /<span class="dt-ellipsis"[^>]*>¥ 1234\.50（张三 的应收账款）<\/span>/.test(basic),
  )
  check('具名插槽接管', basic.includes('demo-slot') && text.includes('编辑'))
  check('隐藏列不渲染', !basic.includes('不该出现'))
  check('冻结列 sticky 左偏移', /dt-pinned-start[^"]*"[^>]*style="left:0px/.test(basic) || /left:0px/.test(basic))
  check('冻结列 sticky 右偏移', /dt-pinned-end/.test(basic) && /right:0px/.test(basic))
  check('table-layout fixed 由 colgroup 承载', /<colgroup/.test(basic) && /<col style="width:\d+px/.test(basic))
  check('外置分页渲染', text.includes('共 23 条') && text.includes('1 / 3'))
  check('对比页无未标注差异', compare.includes('差异全部在预期清单内'), compare.match(/存在 \d+ 处未标注差异/)?.[0] ?? '')

  // 脱离表格复用值管线
  const { createValueFormatter, formatValue } = await server.ssrLoadModule(
    '/src/data-table/value-type/format.ts',
  )
  check('formatValue money', formatValue('money', 123456, { centsToYuan: true }) === '1,234.56')
  check('formatValue dict', formatValue('dict', '1', { dict: 'billStatus' }) === '待支付')
  check('formatValue date', formatValue('date', '2026-08-05 12:00:00') === '2026-08-05')
  check('formatValue 空值 → emptyText', formatValue('money', '') === '-')
  check(
    'createValueFormatter 柯里化',
    createValueFormatter('money', { centsToYuan: true, symbol: true })(123456) === '¥1,234.56',
  )
  check('函数形态用在 label/value 配置里', /原账单总额（元）/.test(compare) || /原账单总额（元）/.test(basic))
  check('ValueCell 携带 dt-money 样式', /<span class="dt-money"[^>]*>¥1,234\.56<\/span>/.test(basic))
} finally {
  await server.close()
}
