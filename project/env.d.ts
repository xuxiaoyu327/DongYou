/// <reference types="vite/client" />
/// <reference types="element-plus/global" />

// 让 TypeScript 认识以 .vue 结尾的单文件组件，避免“找不到模块声明”的报错
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}
