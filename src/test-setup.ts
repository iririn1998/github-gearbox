/**
 * Vitest グローバルセットアップ
 *
 * テスト環境に chrome.i18n API のモックを提供する
 */
import { vi } from "vitest";

globalThis.chrome = {
  i18n: {
    getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
      const template = key || "";
      if (!template) {
        return "";
      }

      const subs =
        substitutions === undefined
          ? []
          : Array.isArray(substitutions)
            ? substitutions
            : [substitutions];

      return template.replace(/\$([1-9]\d*)/g, (_match, indexStr: string) => {
        const index = Number(indexStr) - 1;
        return index >= 0 && index < subs.length ? String(subs[index]) : "";
      });
    }),
    getUILanguage: vi.fn(() => "en"),
  },
} as unknown as typeof chrome;
