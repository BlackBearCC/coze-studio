# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。
全程使用中文对话和撰写文档

## 项目概述

Coze Studio 是一个基于微服务架构构建的开源 AI 智能体开发平台。后端使用 Go 语言和 CloudWeGo Hertz 框架，前端是由 Rush.js 管理的 React + TypeScript 单体仓库，包含 300+ 个包。

## 开发命令

### 后端开发
```bash
# 设置环境并启动开发环境
make debug                    # 完整开发环境（包含中间件和服务器）
make env                      # 设置环境文件 (.env)
make middleware              # 启动基础设施服务（MySQL、Redis、ES 等）
make server                  # 构建并运行 Go 服务器
make sync_db                 # 应用数据库迁移
make build_server            # 仅构建服务器二进制文件
```

### 前端开发
前端使用 Rush.js 单体仓库，构建系统为 Rsbuild：
```bash
make fe                      # 构建前端静态资源
cd frontend/apps/coze-studio
npm run dev                  # 启动开发服务器
npm run build               # 生产构建
npm run test                # 使用 Vitest 运行测试
```

### Docker 环境
```bash
make web                     # 启动完整 Docker 环境
make down                    # 停止所有容器
make clean                   # 停止容器并删除数据卷
```

### 数据库管理
```bash
make sync_db                 # 应用 Atlas 迁移
make dump_db                 # 导出模式并生成迁移文件
make sql_init                # 初始化 SQL 数据
```

## 架构

### 后端结构 (`/backend/`)
- **领域驱动设计** 采用分层架构
- `api/`: HTTP 处理器、中间件、模型、路由
- `application/`: 应用服务层
- `domain/`: 核心业务逻辑
- `infra/`: 基础设施层（数据库、外部服务）
- `pkg/`: 共享包和工具

### 前端结构 (`/frontend/`)
- **Rush.js 单体仓库** 使用工作区依赖
- `apps/coze-studio/`: 主应用入口点
- `packages/`: 按领域组织的 300+ 个共享包：
  - `agent-ide/`: 智能体开发界面
  - `workflow/`: 工作流引擎组件
  - `arch/`: 架构和基础包
  - `common/`: 共享 UI 组件
  - `project-ide/`: 项目管理界面

## 核心技术

### 后端技术栈
- **Go 1.24.0** 配合 CloudWeGo Hertz HTTP 框架
- **Eino 框架** 用于 AI 智能体运行时和工作流引擎
- **GORM** 用于 MySQL 数据库 ORM
- **Atlas** 用于数据库模式管理
- **Redis** 用于缓存，**Elasticsearch** 用于搜索
- **Milvus** 用于向量数据库操作
- **多个 LLM 提供商**: OpenAI、Claude、Ark、Gemini、Ollama、Qwen、DeepSeek

### 前端技术栈
- **React 18.2.0** 配合 TypeScript
- **Rush.js** 用于单体仓库管理
- **Rsbuild**（基于 Rust）用于构建工具
- **Zustand** 用于状态管理
- **TailwindCSS** 用于样式
- **Vitest** 用于测试

## 配置

### 模型配置
模型通过 `/backend/conf/model/template/` 中的 YAML 模板配置。将模板复制到 `/backend/conf/model/` 并配置：
- `id`: 唯一模型标识符
- `meta.conn_config.api_key`: 模型服务的 API 密钥
- `meta.conn_config.model`: 模型端点/ID

### 环境设置
环境文件位于 `/docker/.env`。使用 `.env.example` 作为模板。

## 开发模式

### 后端模式
- **仓储模式** 用于数据访问
- **依赖注入** 贯穿应用层
- **IDL 优先开发** 使用 Apache Thrift
- **服务接口** 定义在 `/backend/idl/`

### 前端模式
- **组件架构** 使用可复用库
- **适配器模式** 广泛用于不同实现
- **工作区依赖** 由 Rush.js 管理
- **类型安全 API 调用** 从后端 IDL 生成

## 测试

### 后端测试
```bash
cd backend
go test ./...               # 运行所有测试
go test -v ./domain/...     # 运行领域测试并输出详细信息
```

### 前端测试
```bash
cd frontend/apps/coze-studio
npm run test               # 运行 Vitest 测试
npm run test:cov          # 运行并生成覆盖率报告
```

## 重要注意事项

- **Go 版本**: 需要 Go ≥1.24.0
- **Node.js 版本**: 需要 Node.js ≥21
- **数据库迁移**: 始终使用 Atlas 进行模式更改
- **前端构建**: 使用 `make fe` 进行生产构建
- **Docker 服务**: 使用 `make middleware` 管理开发依赖
- **模型服务**: 首次运行前必须配置至少一个模型
- **插件配置**: 使用官方插件商店中的插件需要配置

## 服务依赖

应用需要以下服务（通过 Docker Compose 管理）：
- MySQL（主数据库）
- Redis（缓存）
- Elasticsearch（搜索和索引）
- Milvus（向量数据库）
- MinIO（对象存储）
- Etcd（服务发现）
- NSQ（消息队列）

## 生产部署

生产部署步骤：
1. 在 `/backend/conf/model/` 中配置模型
2. 在 `/docker/.env` 中设置环境变量
3. 使用 `make web` 启动所有服务
4. 通过 `http://localhost:8888/` 访问应用

## API 开发

- **OpenAPI 规范** 可用于 REST API
- **Chat SDK** 用于与外部应用集成
- **个人访问令牌** 用于 API 身份验证
- **WebSocket/SSE** 支持实时功能