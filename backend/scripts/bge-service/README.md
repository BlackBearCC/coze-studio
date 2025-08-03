# BGE 嵌入服务

## 简介

这是一个基于 BGE (BAAI General Embedding) 模型的嵌入向量服务，为 Coze Studio 项目提供文本嵌入功能。

## 功能特性

- 支持中文和英文文本的嵌入向量生成
- 基于 Flask 框架的 HTTP API 服务
- 支持批量文本处理
- 兼容项目的 HTTP 嵌入接口规范
- 提供健康检查和 API 文档接口
- **纯ModelScope实现**：完全避免HuggingFace依赖，使用国内ModelScope模型库

## API 接口

### 1. 健康检查
```
GET /health
```

### 2. 生成嵌入向量
```
POST /embedding
Content-Type: application/json

{
    "texts": ["要编码的文本1", "要编码的文本2"],
    "need_sparse": false
}
```

响应：
```json
{
    "dense": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
    "sparse": [{}, {}]
}
```

### 3. API 文档
```
GET /docs
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `BGE_MODEL_NAME` | `AI-ModelScope/bge-small-zh-v1.5` | BGE模型名称 |
| `MODELSCOPE_CACHE` | `/app/models` | 模型缓存目录 |
| `MODELSCOPE_MODULES_CACHE` | `/app/modules` | 模块缓存目录 |
| `HOST` | `0.0.0.0` | 服务监听地址 |
| `PORT` | `8000` | 服务端口 |

## 支持的 BGE 模型

### ModelScope 模型库
- `AI-ModelScope/bge-small-zh-v1.5` (默认) - 中文小模型，512维
- `AI-ModelScope/bge-base-zh-v1.5` - 中文基础模型，768维
- `AI-ModelScope/bge-large-zh-v1.5` - 中文大模型，1024维

### HuggingFace 模型库 (备选)
- `BAAI/bge-small-zh-v1.5` - 中文小模型
- `BAAI/bge-base-zh-v1.5` - 中文基础模型
- `BAAI/bge-large-zh-v1.5` - 中文大模型

## 构建和运行

### 本地运行
```bash
cd backend/scripts/bge-service
pip install -r requirements.txt
python app.py
```

### Docker 构建
```bash
cd backend/scripts/bge-service
docker build -t bge-embedding-service .
docker run -p 8000:8000 bge-embedding-service
```

### 在 Coze Studio 中运行
```bash
cd docker
cp env.example .env
# 编辑 .env 文件，配置相关参数
docker-compose up bge-embedding
```

## 性能说明

- **向量维度**: 512维 (bge-small-zh-v1.5)
- **批处理大小**: 默认支持批量处理，可通过环境变量调整
- **模型大小**: 约 400MB (bge-small-zh-v1.5)
- **首次启动**: 通过ModelScope下载模型，国内速度较快
- **推理速度**: 小模型推理速度更快，适合高并发场景

## 故障排除

### 1. 模型下载失败
```bash
# 检查网络连接和磁盘空间
# 可以手动下载模型到指定目录
```

### 2. 内存不足
```bash
# 当前已使用小模型，如需更小模型可以尝试：
# export BGE_MODEL_NAME=AI-ModelScope/bge-small-zh-v1.5
```

### 3. 服务无法启动
```bash
# 检查端口是否被占用
# 检查日志输出
docker logs coze-bge-embedding
```

## 注意事项

1. **纯ModelScope实现**：不依赖HuggingFace，仅使用ModelScope下载和加载模型
2. 首次启动时会自动从ModelScope下载模型文件，国内访问速度较快
3. 建议为模型文件准备足够的磁盘空间（至少 1GB）
4. 服务启动后会进行模型预热，请等待健康检查通过后再使用
5. 生产环境建议使用外部负载均衡器
6. 支持GPU加速（如果容器环境有GPU可用） 