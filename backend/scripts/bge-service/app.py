#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import logging
from typing import List, Dict, Any, Optional
from flask import Flask, request, jsonify
import numpy as np

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class BGEEmbeddingService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = None
        self.init_model()
    
    def init_model(self):
        """初始化BGE模型"""
        try:
            import torch
            from transformers import AutoTokenizer, AutoModel
            
            # 从环境变量获取模型路径，默认使用BGE-small-zh
            model_name = os.getenv('BGE_MODEL_NAME', 'AI-ModelScope/bge-small-zh-v1.5')
            cache_dir = os.getenv('MODELSCOPE_CACHE', '/app/models')
            
            logger.info(f"正在从ModelScope下载BGE模型: {model_name}")
            logger.info(f"模型缓存目录: {cache_dir}")
            
            # 创建缓存目录
            os.makedirs(cache_dir, exist_ok=True)
            
            # 延迟导入modelscope，避免AST索引问题
            try:
                from modelscope import snapshot_download
                
                # 使用ModelScope下载模型
                model_dir = snapshot_download(
                    model_id=model_name,
                    cache_dir=cache_dir,
                    revision='master'
                )
                
                logger.info(f"模型下载完成，本地路径: {model_dir}")
                
            except Exception as e:
                # 如果ModelScope下载失败，尝试直接使用transformers从本地加载
                logger.warning(f"ModelScope下载失败: {e}")
                logger.info("尝试直接使用transformers加载模型...")
                model_dir = model_name
            
            # 直接使用transformers加载模型
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_dir, 
                trust_remote_code=True,
                cache_dir=cache_dir
            )
            self.model = AutoModel.from_pretrained(
                model_dir, 
                trust_remote_code=True,
                cache_dir=cache_dir
            )
            
            # 设置为评估模式
            self.model.eval()
            
            # 检查是否有GPU可用
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            self.model.to(self.device)
            
            logger.info(f"BGE模型加载成功，使用设备: {self.device}")
            
        except ImportError as e:
            logger.error(f"导入模块失败: {e}")
            raise
        except Exception as e:
            logger.error(f"加载BGE模型失败: {e}")
            raise
    
    def encode_texts(self, texts: List[str], need_sparse: bool = False) -> Dict[str, Any]:
        """编码文本为向量"""
        try:
            import torch
            import torch.nn.functional as F
            
            if not texts:
                return {"dense": [], "sparse": []}
            
            # 批量编码文本
            encoded_inputs = self.tokenizer(
                texts, 
                padding=True, 
                truncation=True, 
                return_tensors='pt',
                max_length=512
            )
            
            # 移动到设备
            encoded_inputs = {k: v.to(self.device) for k, v in encoded_inputs.items()}
            
            # 前向传播
            with torch.no_grad():
                model_output = self.model(**encoded_inputs)
                
            # 使用CLS token的输出或者mean pooling
            if hasattr(model_output, 'pooler_output') and model_output.pooler_output is not None:
                # 使用pooler_output
                embeddings = model_output.pooler_output
            else:
                # 使用mean pooling
                token_embeddings = model_output.last_hidden_state
                attention_mask = encoded_inputs['attention_mask']
                input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
                embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            
            # 归一化向量
            embeddings = F.normalize(embeddings, p=2, dim=1)
            
            # 转换为CPU并转为列表
            dense_list = embeddings.cpu().numpy().tolist()
            
            result = {"dense": dense_list}
            
            # 如果需要稀疏向量，目前返回空列表（BGE模型主要提供密集向量）
            if need_sparse:
                result["sparse"] = [{} for _ in texts]
            
            return result
            
        except Exception as e:
            logger.error(f"编码文本失败: {e}")
            raise

# 全局服务实例
bge_service = None

def get_service():
    """获取BGE服务实例"""
    global bge_service
    if bge_service is None:
        bge_service = BGEEmbeddingService()
    return bge_service

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    try:
        service = get_service()
        if service.model is not None:
            return jsonify({"status": "healthy", "message": "BGE service is running"})
        else:
            return jsonify({"status": "unhealthy", "message": "Model not loaded"}), 500
    except Exception as e:
        return jsonify({"status": "unhealthy", "message": str(e)}), 500

@app.route('/embedding', methods=['POST'])
def embedding():
    """嵌入向量生成接口"""
    try:
        # 获取请求数据
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        texts = data.get('texts', [])
        need_sparse = data.get('need_sparse', False)
        
        if not texts:
            return jsonify({"error": "No texts provided"}), 400
        
        if not isinstance(texts, list):
            return jsonify({"error": "texts must be a list"}), 400
        
        # 获取服务实例并编码
        service = get_service()
        result = service.encode_texts(texts, need_sparse)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"处理嵌入请求失败: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/docs', methods=['GET'])
def docs():
    """API文档接口"""
    docs_info = {
        "name": "BGE Embedding Service",
        "version": "1.0.0",
        "description": "BGE嵌入向量服务",
        "endpoints": {
            "/health": {
                "method": "GET",
                "description": "健康检查"
            },
            "/embedding": {
                "method": "POST",
                "description": "生成文本嵌入向量",
                "parameters": {
                    "texts": {
                        "type": "array",
                        "description": "要编码的文本列表",
                        "required": True
                    },
                    "need_sparse": {
                        "type": "boolean",
                        "description": "是否需要稀疏向量",
                        "required": False,
                        "default": False
                    }
                },
                "response": {
                    "dense": {
                        "type": "array",
                        "description": "密集向量列表"
                    },
                    "sparse": {
                        "type": "array",
                        "description": "稀疏向量列表（如果需要）"
                    }
                }
            }
        }
    }
    return jsonify(docs_info)

@app.route('/', methods=['GET'])
def root():
    """根路径重定向到文档"""
    return jsonify({
        "message": "BGE Embedding Service",
        "docs": "/docs",
        "health": "/health"
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"启动BGE嵌入服务，监听 {host}:{port}")
    
    # 预热模型
    try:
        get_service()
        logger.info("模型预热完成")
    except Exception as e:
        logger.error(f"模型预热失败: {e}")
        exit(1)
    
    app.run(host=host, port=port, debug=False) 