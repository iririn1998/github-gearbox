/**
 * Vitest グローバルセットアップ
 *
 * テスト環境に chrome.i18n API のモックを提供する
 */
import { vi } from "vitest";

globalThis.chrome = {
  i18n: {
    getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
      if (substitutions) {
        const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
        let result = key;
        for (const sub of subs) {
          result += `_${sub}`;
        }
        return result;
      }
      return key;
    }),
  },
} as unknown as typeof chrome;
