/**
 * taskListLabel/labelWrapper.ts のユニットテスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * 各関数の判断条件（condition）をそれぞれ独立して true/false に設定し、
 * 全体の決定（decision）に影響することを検証する。
 *
 * 対象関数:
 *   - wrapWithLabel(listItem)
 *       Decision A: listItem.hasAttribute(PROCESSED_ATTR)   [true → skip / false → continue]
 *       Decision B: !checkbox                                [true → skip / false → continue]
 *   - processAllTaskListItems()
 *       セレクタの :not([...]) による処理済みスキップを検証
 *   - cleanup()
 *       Decision C: label が存在する                         [true → 復元 / false → スキップ]
 *       Decision D: checkbox が存在する                      [true → id除去 / false → スキップ]
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { PROCESSED_ATTR, TASK_LABEL_CLASS, CHECKBOX_ID_PREFIX } from "./constants";
import { wrapWithLabel, processAllTaskListItems, cleanup, resetIdCounter } from "./labelWrapper";

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

/**
 * 標準的なタスクリストアイテムを構築して body に追加する
 * @param text チェックボックス横のテキスト
 */
function buildTaskItem(text = "タスクテキスト"): HTMLElement {
  const li = document.createElement("li");
  li.className = "task-list-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-list-item-checkbox";

  const textNode = document.createTextNode(` ${text}`);

  li.appendChild(checkbox);
  li.appendChild(textNode);
  document.body.appendChild(li);
  return li;
}

/**
 * チェックボックスを持たないタスクリストアイテムを構築する
 */
function buildTaskItemWithoutCheckbox(): HTMLElement {
  const li = document.createElement("li");
  li.className = "task-list-item";
  li.textContent = "チェックボックスなし";
  document.body.appendChild(li);
  return li;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  document.body.innerHTML = "";
  resetIdCounter();
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ===========================================================================
// wrapWithLabel
// ===========================================================================

describe("wrapWithLabel", () => {
  // -------------------------------------------------------------------------
  // Decision A: listItem.hasAttribute(PROCESSED_ATTR)
  // -------------------------------------------------------------------------

  describe("Decision A: 処理済み属性の有無", () => {
    it("[A=false] 未処理アイテムはlabelが付与される", () => {
      const li = buildTaskItem();

      wrapWithLabel(li);

      expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).not.toBeNull();
    });

    it("[A=true] 処理済みアイテムはスキップされlabelが二重付与されない", () => {
      const li = buildTaskItem();
      li.setAttribute(PROCESSED_ATTR, "true");

      wrapWithLabel(li);

      expect(li.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Decision B: checkbox が存在しない
  // -------------------------------------------------------------------------

  describe("Decision B: checkboxの有無", () => {
    it("[B=false] checkboxがある場合はlabelが付与される", () => {
      const li = buildTaskItem();

      wrapWithLabel(li);

      expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).not.toBeNull();
    });

    it("[B=true] checkboxがない場合はスキップされlabelが付与されない", () => {
      const li = buildTaskItemWithoutCheckbox();

      wrapWithLabel(li);

      expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).toBeNull();
    });

    it("[B=true] checkboxがない場合はPROCESSED_ATTRが付与されない", () => {
      const li = buildTaskItemWithoutCheckbox();

      wrapWithLabel(li);

      expect(li.hasAttribute(PROCESSED_ATTR)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 正常系: DOM変換の検証
  // -------------------------------------------------------------------------

  describe("正常系: DOM変換", () => {
    it("checkboxにIDが付与される（形式: gh-gearbox-task-{n}）", () => {
      const li = buildTaskItem();

      wrapWithLabel(li);

      const checkbox = li.querySelector<HTMLInputElement>("input.task-list-item-checkbox");
      expect(checkbox?.id).toMatch(/^gh-gearbox-task-\d+$/);
    });

    it("idCounterが呼び出し毎にインクリメントされ、IDが一意になる", () => {
      const li1 = buildTaskItem("タスク1");
      const li2 = buildTaskItem("タスク2");

      wrapWithLabel(li1);
      wrapWithLabel(li2);

      const id1 = li1.querySelector<HTMLInputElement>("input")?.id;
      const id2 = li2.querySelector<HTMLInputElement>("input")?.id;
      expect(id1).toBe(`${CHECKBOX_ID_PREFIX}-0`);
      expect(id2).toBe(`${CHECKBOX_ID_PREFIX}-1`);
    });

    it("labelのfor属性がcheckboxのidと一致する", () => {
      const li = buildTaskItem();

      wrapWithLabel(li);

      const checkbox = li.querySelector<HTMLInputElement>("input");
      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`);
      expect(label?.getAttribute("for")).toBe(checkbox?.id);
    });

    it("checkboxの後ろのテキストノードがlabel内に移動される", () => {
      const li = buildTaskItem("移動テキスト");

      wrapWithLabel(li);

      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`);
      expect(label?.textContent).toContain("移動テキスト");
    });

    it("checkboxの後ろに複数の兄弟ノード（テキスト＋要素）がある場合、全てlabel内に移動される", () => {
      const li = document.createElement("li");
      li.className = "task-list-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-list-item-checkbox";

      const text = document.createTextNode(" テキスト");
      const span = document.createElement("span");
      span.textContent = "スパン";

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(span);
      document.body.appendChild(li);

      wrapWithLabel(li);

      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`);
      expect(label?.textContent).toContain("テキスト");
      expect(label?.querySelector("span")?.textContent).toBe("スパン");
      // checkboxはlabelの外にあること
      expect(li.querySelector("input")).not.toBeNull();
      expect(label?.querySelector("input")).toBeNull();
    });

    it("checkboxの後ろに兄弟ノードがない場合、空のlabelが挿入される", () => {
      const li = document.createElement("li");
      li.className = "task-list-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-list-item-checkbox";
      li.appendChild(checkbox);
      document.body.appendChild(li);

      wrapWithLabel(li);

      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`);
      expect(label).not.toBeNull();
      expect(label?.childNodes).toHaveLength(0);
    });

    it("処理後にPROCESSED_ATTRが付与される", () => {
      const li = buildTaskItem();

      wrapWithLabel(li);

      expect(li.hasAttribute(PROCESSED_ATTR)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // labelクリックイベントの検証
  // -------------------------------------------------------------------------

  describe("labelクリックイベント", () => {
    it("labelをクリックするとe.preventDefault()が呼ばれる", () => {
      const li = buildTaskItem();
      wrapWithLabel(li);
      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`)!;

      const mockEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(mockEvent, "preventDefault");
      label.dispatchEvent(mockEvent);

      expect(preventDefaultSpy).toHaveBeenCalledOnce();
    });

    it("labelをクリックするとcheckboxのclick()が呼ばれる", () => {
      const li = buildTaskItem();
      wrapWithLabel(li);
      const checkbox = li.querySelector<HTMLInputElement>("input")!;
      const label = li.querySelector<HTMLLabelElement>(`label.${TASK_LABEL_CLASS}`)!;

      const clickSpy = vi.spyOn(checkbox, "click");
      label.click();

      expect(clickSpy).toHaveBeenCalledOnce();
    });
  });
});

// ===========================================================================
// processAllTaskListItems
// ===========================================================================

describe("processAllTaskListItems", () => {
  it("body内の全 li.task-list-item にlabelを付与する", () => {
    buildTaskItem("タスク1");
    buildTaskItem("タスク2");
    buildTaskItem("タスク3");

    processAllTaskListItems();

    expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(3);
  });

  it("処理済みアイテムはスキップされlabelが二重付与されない", () => {
    const li = buildTaskItem();
    processAllTaskListItems();

    // 2回目の呼び出し
    processAllTaskListItems();

    expect(li.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(1);
  });

  it("task-list-item クラスのない li は処理されない", () => {
    const li = document.createElement("li");
    li.textContent = "通常リスト";
    document.body.appendChild(li);

    processAllTaskListItems();

    expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).toBeNull();
  });

  it("タスクリストアイテムが0件の場合も例外を投げない", () => {
    expect(() => processAllTaskListItems()).not.toThrow();
  });
});

// ===========================================================================
// cleanup
// ===========================================================================

describe("cleanup", () => {
  // -------------------------------------------------------------------------
  // Decision C: label が存在する
  // -------------------------------------------------------------------------

  describe("Decision C: labelの有無", () => {
    it("[C=true] labelがある場合、label内のノードがcheckboxの後ろに復元される", () => {
      const li = buildTaskItem("復元テキスト");
      wrapWithLabel(li);

      cleanup();

      // labelが除去されていること
      expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).toBeNull();
      // テキストがliの直接の子に戻っていること
      const textContent = Array.from(li.childNodes)
        .map((n) => n.textContent)
        .join("");
      expect(textContent).toContain("復元テキスト");
    });

    it("[C=true] labelがある場合、label要素が除去される", () => {
      const li = buildTaskItem();
      wrapWithLabel(li);

      cleanup();

      expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).toBeNull();
    });

    it("[C=false] PROCESSED_ATTRがあるがlabelが存在しない場合、例外を投げない", () => {
      const li = buildTaskItem();
      // 手動でPROCESSED_ATTRだけ付与（labelはなし）
      li.setAttribute(PROCESSED_ATTR, "true");

      expect(() => cleanup()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Decision D: checkbox が存在する
  // -------------------------------------------------------------------------

  describe("Decision D: checkboxのID除去", () => {
    it("[D=true] checkboxにIDが付与されている場合、IDが除去される", () => {
      const li = buildTaskItem();
      wrapWithLabel(li);

      cleanup();

      const checkbox = li.querySelector<HTMLInputElement>("input");
      expect(checkbox?.hasAttribute("id")).toBe(false);
    });

    it("[D=false] checkboxが存在しない場合、例外を投げない", () => {
      const li = buildTaskItemWithoutCheckbox();
      // 手動でPROCESSED_ATTRを付与してcleanup対象にする
      li.setAttribute(PROCESSED_ATTR, "true");

      expect(() => cleanup()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // PROCESSED_ATTR の除去
  // -------------------------------------------------------------------------

  describe("PROCESSED_ATTRの除去", () => {
    it("処理済みアイテムからPROCESSED_ATTRが除去される", () => {
      buildTaskItem();
      buildTaskItem();
      processAllTaskListItems();

      cleanup();

      expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // idCounter のリセット
  // -------------------------------------------------------------------------

  describe("idCounterのリセット", () => {
    it("cleanup後にwrapWithLabelを呼ぶとIDが0から再採番される", () => {
      const li1 = buildTaskItem("1回目");
      wrapWithLabel(li1);
      // この時点でidCounter = 1

      cleanup();
      // idCounter は 0 にリセットされるはず

      const li2 = buildTaskItem("2回目");
      wrapWithLabel(li2);

      const checkbox = li2.querySelector<HTMLInputElement>("input");
      expect(checkbox?.id).toBe(`${CHECKBOX_ID_PREFIX}-0`);
    });
  });

  // -------------------------------------------------------------------------
  // 複数アイテムの一括処理
  // -------------------------------------------------------------------------

  describe("複数アイテムのクリーンアップ", () => {
    it("複数のタスクリストアイテムを一括でクリーンアップする", () => {
      buildTaskItem("タスク1");
      buildTaskItem("タスク2");
      buildTaskItem("タスク3");
      processAllTaskListItems();

      cleanup();

      expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(0);
      expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(0);
    });
  });
});
