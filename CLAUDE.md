# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

Coze Studio 是一个开源的 AI 智能体开发平台，提供构建、部署和管理 AI 智能体的全套工具。该项目采用基于领域驱动设计 (DDD) 原则的微服务架构。

**技术栈：**
- 后端：Go 1.24+，基于 Hertz 框架和 Eino 运行时引擎构建
- 前端：React + TypeScript 单体仓库，使用 Rush.js 管理
- 数据库：MySQL 8.4+、Redis、Elasticsearch
- 向量数据库：Milvus
- 存储：MinIO
- 消息队列：NSQ (RocketMQ 已注释)

## 开发命令

### 前端开发
```bash
# 安装依赖并构建前端
make fe

# 启动前端开发服务器
cd frontend && rush build && rush start
```

### 后端开发
```bash
# 构建 Go 后端
make build_server

# 运行开发服务器及其依赖
make debug

# 仅启动中间件服务（数据库等）
make middleware

# 构建并运行完整服务器
make server
```

### Docker 环境
```bash
# 启动所有服务，包括中间件和服务器
make web

# 仅启动中间件服务
make middleware

# 停止所有容器
make down

# 清理所有容器和卷
make clean
```

### 数据库操作
```bash
# 同步数据库架构
make sync_db

# 初始化 SQL 数据
make sql_init

# 导出数据库架构和迁移
make dump_db

# 应用 Atlas 迁移
make atlas-hash
```

### 测试
```bash
# 后端测试
cd backend && go test ./...

# 前端测试
cd frontend && rush test
```

## 架构概览

### 后端架构 (backend/)
后端遵循领域驱动设计，包含以下关键层次：

- **API 层** (`api/`)：HTTP 处理器、中间件和路由
- **应用层** (`application/`)：业务逻辑编排
- **领域层** (`domain/`)：核心业务实体和规则
- **基础设施层** (`infra/`)：外部服务集成
- **跨域层** (`crossdomain/`)：服务间通信

**核心领域：**
- 智能体管理和单智能体操作
- 工作流引擎和执行
- 知识库和文档处理
- 插件系统和工具管理
- 内存和变量管理
- 用户认证和权限

### 前端架构 (frontend/)
由 Rush.js 管理的单体仓库结构：

- **应用** (`apps/coze-studio/`)：主应用入口点
- **包**：按功能组织（agent-ide、workflow、data 等）
- **配置**：共享构建和代码检查配置
- **基础设施**：开发工具和实用程序

**包组织结构：**
- `@coze-arch/*`：核心架构包
- `@coze-agent-ide/*`：智能体开发界面
- `@coze-workflow/*`：工作流构建器组件
- `@coze-data/*`：数据管理（知识、内存）
- `@coze-common/*`：共享组件和实用程序
- `@coze-studio/*`：Studio 特定功能

### 配置管理

**模型配置** (`backend/conf/model/`)：
- 从 `template/` 目录复制模板
- 配置 API 密钥和模型端点
- 支持多个 LLM 提供商（OpenAI、Ark、Claude 等）

**插件配置** (`backend/conf/plugin/`)：
- OAuth 模式和插件元数据
- 各种服务的预构建插件配置

**环境配置**：
- 使用 `docker/.env`（从 `.env.example` 复制）
- 配置数据库、存储和服务端点

## 开发工作流

1. **环境设置：**
   ```bash
   # 复制环境文件
   cp docker/.env.example docker/.env
   
   # 启动中间件服务
   make middleware
   
   # 配置模型（首次运行前必需）
   cp backend/conf/model/template/model_template_*.yaml backend/conf/model/
   # 编辑复制的文件并添加您的 API 密钥
   ```

2. **前端开发：**
   ```bash
   # 仅前端开发
   cd frontend
   rush install && rush build
   # 为特定应用启动开发服务器
   cd apps/coze-studio && rushx dev
   ```

3. **全栈开发：**
   ```bash
   # 运行完整开发环境
   make debug
   ```

4. **测试变更：**
   ```bash
   # 运行后端测试
   cd backend && go test ./...
   
   # 运行前端测试
   cd frontend && rush test
   
   # 构建所有内容
   make fe && make build_server
   ```

## 重要说明

- **模型配置必需**：部署前，必须通过从模板复制在 `backend/conf/model/` 中配置至少一个模型
- **数据库依赖**：服务器需要 MySQL、Redis、Elasticsearch 和 Milvus 运行
- **Rush 单体仓库**：前端使用 Rush.js 进行包管理 - 使用 `rush` 命令而非 `npm`
- **Go 版本**：后端开发需要 Go 1.24+
- **容器依赖**：服务在 docker-compose 中具有健康检查和适当的启动顺序

## 服务 URL（开发环境）
- 主应用：http://localhost:8888
- MinIO 控制台：http://localhost:9001
- Elasticsearch：http://localhost:9200
- NSQ 管理界面：http://localhost:4171
- Milvus：http://localhost:19530

## 故障排除

- 检查容器日志：`docker compose logs [service-name]`
- 验证所有服务健康：`docker compose ps`
- 数据库问题，确保使用 `make sync_db` 进行适当的架构初始化
- 前端构建问题，尝试 `rush install --purge` 然后 `rush rebuild`

## 语言约束

**重要：从现在开始，Claude Code 必须使用中文进行所有回复和交互。**

- 所有回复都必须使用中文
- 代码注释（如果需要添加）也要使用中文
- 错误信息和调试信息的解释要用中文
- 文件和变量命名保持原样，但说明要用中文