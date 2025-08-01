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
 
import { injectable } from 'inversify';
import { isObject, type SchemaDecoration, Emitter } from '@flowgram-adapter/common';

import { type PreferenceSchema } from './preference-contribution';

@injectable()
class PreferencesManager {
  private readonly preferences: Record<string, any> = {};

  readonly schema: PreferenceSchema = {
    properties: {},
  };

  private readonly preferencesChange = new Emitter<void>();

  onDidPreferencesChange = this.preferencesChange.event;

  public init(data: any) {
    /**
     * 从远程或者本地读取用户配置
     */
    Object.assign(this.preferences, data);
    this.preferencesChange.fire();
  }

  public setSchema(schema: PreferenceSchema) {
    const { properties } = schema;
    /** 这里先做简单校验，后面要做整个 validateSchema */
    if (!properties || !isObject(properties)) {
      return;
    }
    Object.entries<SchemaDecoration>(properties).forEach(([key, value]) => {
      if (this.schema.properties[key]) {
        // 重复定义的不覆盖，先报个警告
        console.error(
          'Preference name collision detected in the schema for property: ',
          key,
        );
        return;
      }
      this.schema.properties[key] = value;
    });
  }

  getPreferenceData(key: string) {
    return this.preferences[key];
  }
}

export { PreferencesManager };
