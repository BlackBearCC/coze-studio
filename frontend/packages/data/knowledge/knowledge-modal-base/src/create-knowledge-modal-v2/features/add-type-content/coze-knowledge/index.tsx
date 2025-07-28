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
 
/* eslint-disable @coze-arch/max-line-per-function */
import { useEffect, useState } from 'react';

import { CozeFormTextArea, CozeInputWithCountField } from '@coze-data/utils';
import { UnitType } from '@coze-data/knowledge-resource-processor-core';
import { KnowledgeE2e } from '@coze-data/e2e';
import { PictureUpload } from '@coze-common/biz-components/picture-upload';
import { I18n } from '@coze-arch/i18n';
import { FormatType } from '@coze-arch/bot-api/memory';
import { type Icon } from '@coze-arch/bot-api/knowledge';
import { FileBizType, IconType, type Model } from '@coze-arch/bot-api/developer_api';
import { KnowledgeApi } from '@coze-arch/bot-api';
import { useFormApi, Select } from '@coze-arch/coze-design';

import { SelectFormatType } from '../../select-format-type/base';
import { ImportKnowledgeSourceSelect } from '../../import-knowledge-source-select/base';

import styles from './index.module.less';

export interface CozeKnowledgeAddTypeContentFormData {
  name: string;
  icon_uri?: Array<{
    url: string;
    uri: string;
    uid: string;
    isDefault?: boolean;
  }>;
  format_type: FormatType;
  description: string;
  embedding_model_id?: number; // 新增：embedding 模型ID
}

export interface AddTypeContentProps {
  onImportKnowledgeTypeChange?: (type: UnitType) => void;
  onSelectFormatTypeChange?: (type: FormatType) => void;
}

export const CozeKnowledgeAddTypeContent = (params: AddTypeContentProps) => {
  const { onImportKnowledgeTypeChange, onSelectFormatTypeChange } = params;
  const formApi = useFormApi<CozeKnowledgeAddTypeContentFormData>();
  // 使用 useState 保证能重新渲染
  const [currentFormatType, setCurrentFormatType] = useState(FormatType.Text);
  const [iconInfoGenerate, setIconInfoGenerate] = useState<{
    name: string;
    desc: string;
  }>({
    name: '',
    desc: '',
  });
  const [coverIcon, setCoverIcon] = useState<Icon | undefined>({
    uri: '',
    url: '',
  });
  
  // 新增：embedding 模型相关状态
  const [embeddingModels, setEmbeddingModels] = useState<Model[]>([]);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<number | undefined>();

  const fetchIcon = async (formatType: FormatType) => {
    const { icon } = await KnowledgeApi.GetIcon({
      format_type: formatType,
    });
    setCoverIcon(icon);
    const currentCover = formApi.getValue('icon_uri');
    if (!currentCover || currentCover[0]?.isDefault) {
      formApi.setValue('icon_uri', [
        {
          url: icon?.url ?? '',
          uri: icon?.uri ?? '',
          uid: icon?.uri ?? '',
          isDefault: true,
        },
      ]);
    }
  };

  // 新增：获取 embedding 模型列表
  const fetchEmbeddingModels = async () => {
    try {
      // 模拟 embedding 模型列表，实际应该调用对应的 API
      const mockEmbeddingModels: Model[] = [
        {
          id: 200,
          name: 'BGE-Small-ZH',
          model_type: 200,
          icon_url: '',
          description: 'BGE 中文 Small 模型，512维向量输出',
        },
        {
          id: 201,
          name: 'OpenAI-Embedding',
          model_type: 201,
          icon_url: '',
          description: 'OpenAI text-embedding-ada-002',
        },
        {
          id: 202,
          name: 'Ark-Embedding',
          model_type: 202,
          icon_url: '',
          description: '火山方舟 Embedding 模型',
        },
      ];
      
      setEmbeddingModels(mockEmbeddingModels);
      
      // 设置默认选择 BGE 模型
      if (mockEmbeddingModels.length > 0 && !selectedEmbeddingModel) {
        const defaultModel = mockEmbeddingModels[0];
        setSelectedEmbeddingModel(defaultModel.model_type);
        formApi.setValue('embedding_model_id', defaultModel.model_type);
      }
    } catch (error) {
      console.error('获取 embedding 模型列表失败:', error);
    }
  };

  const [unitType, setUnitType] = useState<UnitType>(UnitType.TEXT_DOC);

  useEffect(() => {
    fetchIcon(currentFormatType);
    if (currentFormatType === FormatType.Text) {
      setUnitType(UnitType.TEXT_DOC);
    } else if (currentFormatType === FormatType.Table) {
      setUnitType(UnitType.TABLE_DOC);
    } else if (currentFormatType === FormatType.Image) {
      setUnitType(UnitType.IMAGE_FILE);
    }
  }, [currentFormatType]);

  // 新增：初始化 embedding 模型列表
  useEffect(() => {
    fetchEmbeddingModels();
  }, []);

  useEffect(() => {
    if (!unitType) {
      return;
    }
    onImportKnowledgeTypeChange?.(unitType);
  }, [unitType]);

  return (
    <div data-testid={KnowledgeE2e.CreateKnowledgeModal}>
      <SelectFormatType
        field="format_type"
        noLabel
        onChange={(type: FormatType) => {
          setCurrentFormatType(type);
          formApi.setValue('format_type', type);
          onSelectFormatTypeChange?.(type);
        }}
      />
      <CozeInputWithCountField
        data-testid={KnowledgeE2e.CreateKnowledgeModalNameInput}
        field="name"
        label={I18n.t('datasets_model_create_name')}
        maxLength={100}
        onChange={(value: string) => {
          setIconInfoGenerate(prev => ({
            ...prev,
            name: value?.trim() || '',
          }));
        }}
        rules={[
          {
            required: true,
            whitespace: true,
            message: I18n.t('dataset-name-empty-tooltip'),
          },
          {
            pattern: /^[^"'`\\]+$/,
            message: I18n.t('dataset-name-has-wrong-word-tooltip'),
          },
        ]}
        placeholder={I18n.t('datasets_model_create_name_placeholder')}
      />
      <CozeFormTextArea
        field="description"
        data-testid={KnowledgeE2e.CreateKnowledgeModalDescInput}
        // className={s['textarea-multi-line']}
        label={I18n.t('datasets_model_create_description')}
        autosize={{ minRows: 1, maxRows: 2 }}
        maxCount={2000}
        maxLength={2000}
        placeholder={I18n.t('datasets_model_create_description_placeholder')}
        onChange={(value: string) => {
          setIconInfoGenerate(prev => ({
            ...prev,
            desc: value?.trim() || '',
          }));
        }}
      />

      {/* 新增：Embedding 模型选择 */}
      <div
        className="semi-form-field"
        x-label-pos="top"
        x-field-id="embedding_model_id"
        x-extra-pos="bottom"
      >
        <label className="semi-form-field-label semi-form-field-label-left">
          <div className="semi-form-field-label-text" x-semi-prop="label">
            向量化模型选择
          </div>
        </label>
        
        <Select
          value={selectedEmbeddingModel}
          onChange={(value: number) => {
            setSelectedEmbeddingModel(value);
            formApi.setValue('embedding_model_id', value);
          }}
          placeholder="选择向量化模型"
          style={{ width: '100%' }}
        >
          {embeddingModels.map((model) => (
            <Select.Option key={model.model_type} value={model.model_type}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold' }}>{model.name}</span>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {model.description}
                </span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div
        className="semi-form-field"
        x-label-pos="top"
        x-field-id="name"
        x-extra-pos="bottom"
      >
        <label className="semi-form-field-label semi-form-field-label-left">
          <div className="semi-form-field-label-text" x-semi-prop="label">
            {I18n.t('create-dataset-import-type')}
          </div>
        </label>

        <ImportKnowledgeSourceSelect
          formatType={currentFormatType}
          initValue={unitType}
          onChange={setUnitType}
        />
      </div>

      <PictureUpload
        label={I18n.t('datasets_model_create_avatar')}
        field="icon_uri"
        testId={KnowledgeE2e.CreateKnowledgeModalAvatarUploader}
        fileBizType={FileBizType.BIZ_DATASET_ICON}
        uploadClassName={styles['upload-avatar-container']}
        iconType={IconType.Dataset}
        generateInfo={iconInfoGenerate}
        generateTooltip={{
          generateBtnText: I18n.t(
            'dataset_create_knowledge_generate_avatar_tips',
          ),
          contentNotLegalText: I18n.t(
            'dataset_create_knowledge_generate_content_tips',
          ),
        }}
        initValue={[
          {
            url: coverIcon?.url,
            uri: coverIcon?.uri,
            isDefault: true,
          },
        ]}
      />
    </div>
  );
};
