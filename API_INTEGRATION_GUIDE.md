# StockVueVision 前端后端API对接指南

## 项目概述
这是一个基于Vue 3 + Element Plus的股票投资决策系统前端项目，需要与后端API进行数据交互。

## 技术栈
- **前端框架**: Vue 3 + Composition API
- **UI组件库**: Element Plus
- **图表库**: ECharts 5
- **HTTP客户端**: Axios
- **构建工具**: Vite

## API基础配置

### 1. 基础URL配置
```javascript
// 当前配置在 src/api/accountApi.js
const api = axios.create({
  baseURL: 'http://localhost:8000',  // 后端服务器地址
  timeout: 30000,                    // 超时时间30秒
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

### 2. 环境变量配置建议
建议创建 `.env` 文件来管理不同环境的API地址：
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000

# .env.production  
VITE_API_BASE_URL=https://your-production-api.com
```

## 需要对接的API接口

### 1. 账户信息相关接口

#### 1.1 获取账户基本信息
- **接口路径**: `/api/account-info/`
- **请求方法**: GET
- **功能**: 获取账户资产、持仓等基本信息
- **当前实现**: `src/api/accountApi.js` - `fetchAccountInfo()`
- **数据结构**:
```javascript
{
  accounts: [
    {
      account_id: 'DEMO000001',
      account_type: 'STOCK',
      cash: 1250000,           // 现金余额
      frozen_cash: 75000,      // 冻结资金
      market_value: 2850000,   // 股票市值
      total_asset: 4100000,    // 总资产
      positions: [...]         // 持仓信息
    }
  ]
}
```

#### 1.2 获取资产类别分布
- **接口路径**: `/api/asset-category/`
- **请求方法**: GET
- **功能**: 获取按行业分类的资产分布
- **当前实现**: `src/api/accountApi.js` - `fetchAssetCategoryData()`
- **数据结构**:
```javascript
{
  categoryData: [
    {
      name: '银行股',      // 行业名称
      value: 216000,      // 市值
      percentage: 7.6     // 占比百分比
    }
  ]
}
```

#### 1.3 获取地区分布数据
- **接口路径**: `/api/region-data/`
- **请求方法**: GET
- **功能**: 获取按地区分类的资产分布
- **当前实现**: `src/api/accountApi.js` - `fetchRegionDataFromBackend()`

### 2. 对比分析相关接口

#### 2.1 地区对比分析
- **接口路径**: `/api/areacomparsion/area_comparison/`
- **请求方法**: GET
- **请求参数**: `account_id` (账户ID)
- **当前实现**: `src/api/regioncomparisonApi.js` - `fetchRegionComparisonData()`
- **数据结构**:
```javascript
{
  area_data: [
    {
      region: '上海',           // 地区名称
      totalAssets: 820000,     // 总资产
      returnRate: '8.5%',      // 收益率
      maxDrawdown: '28.8%'     // 最大回撤率
    }
  ]
}
```

#### 2.2 时间段对比分析
- **接口路径**: `/api/timecomparison/yearly_comparison/`
- **请求方法**: GET
- **请求参数**: `account_id` (账户ID)
- **当前实现**: `src/api/timecomparisonApi.js` - `fetchYearlyComparisonData()`

- **接口路径**: `/api/timecomparison/weekly_comparison/`
- **请求方法**: GET
- **请求参数**: `account_id` (账户ID)
- **当前实现**: `src/api/timecomparisonApi.js` - `fetchWeeklyComparisonData()`

### 3. 策略执行相关接口

#### 3.1 策略执行
- **功能**: 执行投资策略
- **当前实现**: 在 `src/components/layout/StrategyExecution.vue` 中
- **需要对接**: 策略执行API、参数配置API

#### 3.2 策略执行结果
- **功能**: 获取策略执行结果
- **当前实现**: 在 `src/components/layout/StrategyExecutionResult.vue` 中
- **需要对接**: 策略结果查询API

## 数据格式转换

### 1. 前端组件期望的数据格式

#### 资产类别对比表
```javascript
// 组件期望格式 (AssetComparisonAnalysis.vue)
categoryData: [
  {
    stock_code: '600000.SH',    // 股票代码
    asset_ratio: '7.6%',        // 资产占比
    market_value: 216000,       // 股票市值
    daily_return: '8.5%'        // 收益率
  }
]
```

#### 时间段对比表
```javascript
// 组件期望格式
timeData: [
  {
    timePeriod: '2024-01',      // 时间段
    totalAssets: 3800000,       // 总资产
    returnRate: '5.2%',         // 收益率
    growthRate: '8.5%'          // 增长率
  }
]
```

#### 地区对比表
```javascript
// 组件期望格式
regionData: [
  {
    region: '上海',              // 地区
    totalAssets: 820000,        // 资产总值
    returnRate: '8.5%',         // 收益率
    investmentRate: '28.8%'     // 最大回撤率
  }
]
```

### 2. 数据转换函数
建议在API层添加数据转换函数，确保后端数据格式与前端组件期望格式一致。

## 错误处理机制

### 1. 当前实现
- 使用 `try-catch` 包装API调用
- API失败时自动回退到模拟数据
- 控制台输出详细错误信息

### 2. 建议改进
- 统一错误处理中间件
- 用户友好的错误提示
- 重试机制
- 网络状态检测

## 模拟数据配置

### 1. 当前配置
- 通过 `USE_MOCK_DATA` 标志控制是否使用模拟数据
- 模拟数据存储在 `src/api/mockData.js` 中
- 包含完整的业务数据结构

### 2. 切换机制
```javascript
// 在 mockData.js 中设置
export const USE_MOCK_DATA = true;  // 开发时使用模拟数据
export const USE_MOCK_DATA = false; // 生产时使用真实API
```

## 开发建议

### 1. API接口规范
- 统一使用RESTful API设计
- 标准化的响应格式
- 完善的错误码体系

### 2. 数据验证
- 前端数据格式验证
- API响应数据校验
- 类型安全（建议使用TypeScript）

### 3. 性能优化
- 数据缓存策略
- 请求防抖/节流
- 分页加载

### 4. 安全性
- API密钥管理
- 请求签名验证
- CORS配置

## 部署配置

### 1. 开发环境
```bash
npm run dev
# 后端API地址: http://localhost:8000
```

### 2. 生产环境
```bash
npm run build
# 需要配置生产环境的API地址
```

## 测试建议

### 1. 单元测试
- API函数测试
- 数据转换函数测试
- 组件逻辑测试

### 2. 集成测试
- API接口连通性测试
- 端到端数据流测试
- 错误处理测试

### 3. 模拟数据测试
- 确保模拟数据完整性
- 验证数据格式一致性
- 测试回退机制

## 注意事项

1. **数据一致性**: 确保后端返回的数据格式与前端组件期望的格式一致
2. **错误处理**: 实现完善的错误处理和用户提示
3. **性能优化**: 合理使用缓存和分页加载
4. **安全性**: 注意API密钥和敏感信息的保护
5. **兼容性**: 考虑不同浏览器的兼容性
6. **监控**: 添加API调用监控和性能指标

## 下一步工作

1. 配置后端API服务器
2. 实现数据格式转换函数
3. 完善错误处理机制
4. 添加数据验证
5. 实现用户认证和授权
6. 添加API调用监控
7. 编写测试用例
8. 部署和配置生产环境
