FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/python:3.11.1-8.6

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV MODELSCOPE_CACHE=/app/models
ENV MODELSCOPE_MODULES_CACHE=/app/modules

# 复制依赖文件
COPY requirements.txt .

# 配置pip使用清华镜像源
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple && \
    pip config set global.trusted-host pypi.tuna.tsinghua.edu.cn

# 安装Python依赖
RUN pip install  -r requirements.txt

# 复制应用程序代码
COPY app.py .

# 创建模型缓存目录
RUN mkdir -p /app/models /app/modules

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动应用
CMD ["python", "app.py"] 