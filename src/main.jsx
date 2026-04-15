import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

// 完全移除StrictMode以解决双重渲染问题
// 保留ErrorBoundary进行全局错误捕获
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
