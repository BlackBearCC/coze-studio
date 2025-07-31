#!/usr/bin/env python3
import os
import logging
from typing import List, Dict, Any
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化FastAPI应用
app = FastAPI(title="BGE Embedding Service", version="1.0.0")

# 环境变量配置
MODEL_NAME = os.getenv("MODEL_NAME", "BAAI/bge-small-zh-v1.5")
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "32"))
MAX_SEQUENCE_LENGTH = int(os.getenv("MAX_SEQUENCE_LENGTH", "512"))
DEVICE = os.getenv("DEVICE", "cpu")

# 全局模型变量
model = None

class EmbeddingRequest(BaseModel):
    input: List[str]
    model: str = MODEL_NAME

class EmbeddingResponse(BaseModel):
    object: str = "list"
    data: List[Dict[str, Any]]
    model: str
    usage: Dict[str, int]

def load_model():
    """加载BGE模型"""
    global model
    try:
        logger.info(f"Loading BGE model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME, device=DEVICE)
        logger.info("BGE model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load BGE model: {e}")
        raise e

@app.on_event("startup")
async def startup_event():
    """应用启动时加载模型"""
    load_model()

@app.get("/health")
async def health_check():
    """健康检查端点"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model": MODEL_NAME}

@app.get("/")
async def root():
    """根端点"""
    return {"message": "BGE Embedding Service", "model": MODEL_NAME}

@app.post("/v1/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest):
    """创建文本嵌入向量"""
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        if not request.input:
            raise HTTPException(status_code=400, detail="Input cannot be empty")
        
        if len(request.input) > MAX_BATCH_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"Batch size {len(request.input)} exceeds maximum {MAX_BATCH_SIZE}"
            )
        
        # 处理输入文本
        texts = request.input
        logger.info(f"Processing {len(texts)} texts for embedding")
        
        # 生成嵌入向量
        embeddings = model.encode(
            texts,
            batch_size=min(len(texts), MAX_BATCH_SIZE),
            show_progress_bar=False,
            convert_to_tensor=False,
            normalize_embeddings=True  # BGE模型通常需要归一化
        )
        
        # 确保embeddings是numpy数组
        if isinstance(embeddings, torch.Tensor):
            embeddings = embeddings.cpu().numpy()
        elif not isinstance(embeddings, np.ndarray):
            embeddings = np.array(embeddings)
        
        # 构建响应数据
        data = []
        for i, embedding in enumerate(embeddings):
            data.append({
                "object": "embedding",
                "index": i,
                "embedding": embedding.tolist()
            })
        
        # 计算token使用量（简单估算）
        total_tokens = sum(len(text.split()) for text in texts)
        
        response = EmbeddingResponse(
            data=data,
            model=request.model,
            usage={
                "prompt_tokens": total_tokens,
                "total_tokens": total_tokens
            }
        )
        
        logger.info(f"Successfully generated {len(data)} embeddings")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/v1/models")
async def list_models():
    """列出可用模型"""
    return {
        "object": "list",
        "data": [
            {
                "id": MODEL_NAME,
                "object": "model",
                "created": 1677610602,
                "owned_by": "BAAI",
                "permission": [],
                "root": MODEL_NAME,
                "parent": None
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)