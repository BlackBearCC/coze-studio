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
 
import { format } from 'date-fns';
import { FieldItemType } from '@coze-arch/bot-api/memory';

export const getDefaultValue = (type: FieldItemType) => {
  if (type === FieldItemType.Boolean) {
    return false;
  } else if ([FieldItemType.Number, FieldItemType.Float].includes(type)) {
    return 0;
  } else if (type === FieldItemType.Text) {
    return '';
  } else if (type === FieldItemType.Date) {
    // TODO: @liushuoyan 这里可能存在时区的问题，联调的时候请注意
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  } else {
    return undefined;
  }
};
