/*
 * Copyright 2025 coze-dev Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package bge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	opt "github.com/cloudwego/eino/components/embedding"

	"github.com/coze-dev/coze-studio/backend/infra/contract/embedding"
	"github.com/coze-dev/coze-studio/backend/pkg/lang/slices"
)

type EmbeddingConfig struct {
	APIKey    string `json:"api_key"`
	BaseURL   string `json:"base_url"`
	Model     string `json:"model"`
	BatchSize int    `json:"batch_size,omitempty"` // 批处理大小，默认32
}

type bgeEmbedRequest struct {
	Input []string `json:"input"`
	Model string   `json:"model"`
}

type bgeEmbedResponse struct {
	Object string `json:"object"`
	Data   []struct {
		Object    string    `json:"object"`
		Embedding []float64 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	Model string `json:"model"`
	Usage struct {
		PromptTokens int `json:"prompt_tokens"`
		TotalTokens  int `json:"total_tokens"`
	} `json:"usage"`
}

// BGE 中文 small 模型的维度
const bgeSmallZhDimensions = 512

func NewBGEEmbedder(ctx context.Context, config *EmbeddingConfig) (embedding.Embedder, error) {
	if config.APIKey == "" {
		return nil, fmt.Errorf("BGE API key is required")
	}
	if config.BaseURL == "" {
		return nil, fmt.Errorf("BGE base URL is required")
	}
	if config.Model == "" {
		config.Model = "bge-small-zh-v1.5" // 默认使用 BGE 中文 small 模型
	}
	if config.BatchSize == 0 {
		config.BatchSize = 32 // 默认批处理大小
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	return &bgeEmbedder{
		config: config,
		client: client,
	}, nil
}

type bgeEmbedder struct {
	config *EmbeddingConfig
	client *http.Client
}

func (b *bgeEmbedder) EmbedStrings(ctx context.Context, texts []string, opts ...opt.Option) ([][]float64, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	var allResults [][]float64

	// 分批处理，避免请求过大
	for _, batch := range slices.Chunks(texts, b.config.BatchSize) {
		batchResults, err := b.embedBatch(ctx, batch)
		if err != nil {
			return nil, fmt.Errorf("failed to embed batch: %w", err)
		}
		allResults = append(allResults, batchResults...)
	}

	return allResults, nil
}

func (b *bgeEmbedder) embedBatch(ctx context.Context, texts []string) ([][]float64, error) {
	reqBody := bgeEmbedRequest{
		Input: texts,
		Model: b.config.Model,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", b.config.BaseURL+"/v1/embeddings", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+b.config.APIKey)

	resp, err := b.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("BGE API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var response bgeEmbedResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// 按索引排序并提取 embedding
	result := make([][]float64, len(texts))
	for _, data := range response.Data {
		if data.Index < len(result) {
			result[data.Index] = data.Embedding
		}
	}

	return result, nil
}

func (b *bgeEmbedder) EmbedStringsHybrid(ctx context.Context, texts []string, opts ...opt.Option) ([][]float64, []map[int]float64, error) {
	// BGE 模型只支持密集向量，不支持稀疏向量
	dense, err := b.EmbedStrings(ctx, texts, opts...)
	if err != nil {
		return nil, nil, err
	}
	
	// 返回空的稀疏向量
	sparse := make([]map[int]float64, len(dense))
	for i := range sparse {
		sparse[i] = make(map[int]float64)
	}
	
	return dense, sparse, nil
}

func (b *bgeEmbedder) Dimensions() int64 {
	// BGE 中文 small 模型的向量维度是 512
	return bgeSmallZhDimensions
}

func (b *bgeEmbedder) SupportStatus() embedding.SupportStatus {
	// BGE 模型只支持密集向量
	return embedding.SupportDense
}