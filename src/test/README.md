# 测试框架

## 快速开始

```bash
cd client
npm install
npm test        # 运行测试（watch模式）
npm run test:run # 运行一次测试
npm run test:coverage # 生成覆盖率报告
```

## 测试文件

- `src/test/api.test.js` - API回归测试
- `src/test/setup.js` - 测试环境配置

## 测试列表

1. `i18n API should return system title` - i18n接口正常
2. `login API should return token with valid credentials` - 登录功能正常
3. `inventory API should require auth` - 认证保护正常
4. `inventory API should return data with auth` - 库存API正常
5. `products API should return product list` - 产品API正常
6. `expense API should work with auth` - 费用API正常
7. `anomalies API should return anomaly detection data` - 异常检测API正常

## 添加新测试

在 `src/test/` 目录下创建 `*.test.js` 文件：

```javascript
import { describe, it, expect } from 'vitest'

describe('Feature Name', () => {
  it('should do something', async () => {
    // test code
  })
})
```

## 注意事项

- API测试依赖后端服务运行在 localhost:3849
- 前端组件测试需要 @testing-library/react
