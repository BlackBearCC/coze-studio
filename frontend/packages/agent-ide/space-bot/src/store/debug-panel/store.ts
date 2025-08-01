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
 
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

interface DebugPanelStore {
  /** debug panel 展示状态 */
  isDebugPanelShow: boolean;
  /** 当前选中的debug query id */
  currentDebugQueryId: string;
}

interface DebugPanelAction {
  setIsDebugPanelShow: (isDebugPanelShow: boolean) => void;
  setCurrentDebugQueryId: (currentDebugQueryId: string) => void;
}

const DEFAULT_DEBUG_PANEL_STORE = (): DebugPanelStore => ({
  isDebugPanelShow: false,
  currentDebugQueryId: '',
});

export const useDebugStore = create<DebugPanelStore & DebugPanelAction>()(
  devtools(
    set => ({
      ...DEFAULT_DEBUG_PANEL_STORE(),
      setIsDebugPanelShow: isDebugPanelShow => {
        set({ isDebugPanelShow });
      },
      setCurrentDebugQueryId: currentDebugQueryId => {
        set({ currentDebugQueryId });
      },
    }),
    {
      enabled: IS_DEV_MODE,
      name: 'botStudio.debugPanelStore',
    },
  ),
);
