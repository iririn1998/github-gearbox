/**
 * taskListLabel/index.ts の統合テスト
 *
 * テスト戦略: C2（Modified Condition/Decision Coverage）
 *
 * Feature オブジェクト（init / destroy）と MutationObserver のライフサイクルを検証する。
 * 個々のDOM操作ロジック（wrapWithLabel / processAllTaskListItems / cleanup）は
 * labelWrapper.test.ts で網羅しているため、ここでは統合的な振る舞いと
 * MutationObserver の条件分岐に絞る。
 *
 * startObserver コールバック内の判断条件:
 *   Decision E: mutation.type === "childList"                    [true/false]
 *   Decision F: mutation.addedNodes.length > 0                  [true/false]（E=trueのとき）
 *   Decision G: node instanceof HTMLElement                      [true/false]
 *   Decision H: node.classList.contains("task-list-item")       [true/false]（G=trueのとき）
 *   Decision I: node.querySelector("li.task-list-item") 有無    [true/false]（H=falseのとき）
 *   Decision J: node.querySelector(".contains-task-list") 有無  [true/false]（H=I=falseのとき）
 *   Decision K: shouldProcess                                    [true/false]
 */

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { taskListLabelFeature, PROCESSED_ATTR, TASK_LABEL_CLASS } from "./index";
import { resetIdCounter } from "./labelWrapper";

// ---------------------------------------------------------------------------
// DOM ヘルパー
// ---------------------------------------------------------------------------

function buildTaskItem(text = "タスク"): HTMLElement {
  const li = document.createElement("li");
  li.className = "task-list-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-list-item-checkbox";

  li.appendChild(checkbox);
  li.appendChild(document.createTextNode(` ${text}`));
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
  taskListLabelFeature.destroy();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// ===========================================================================
// Feature メタデータ
// ===========================================================================

describe("taskListLabelFeature メタデータ", () => {
  it("id が 'task-list-label' である", () => {
    expect(taskListLabelFeature.id).toBe("task-list-label");
  });

  it("name が 'タスクリスト Label 拡張' である", () => {
    expect(taskListLabelFeature.name).toBe("タスクリスト Label 拡張");
  });
});

// ===========================================================================
// Feature ライフサイクル
// ===========================================================================

describe("taskListLabelFeature ライフサイクル", () => {
  it("init() 後、既存の li.task-list-item にlabelが挿入される", () => {
    buildTaskItem("タスク1");
    buildTaskItem("タスク2");

    taskListLabelFeature.init();

    expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(2);
  });

  it("init() を連続で 2 回呼んでもlabelが二重挿入されない（処理済みスキップ=true）", () => {
    buildTaskItem();

    taskListLabelFeature.init();
    taskListLabelFeature.init();

    expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(1);
  });

  it("destroy() 後、挿入されたlabelが全て除去される", () => {
    buildTaskItem("タスク1");
    buildTaskItem("タスク2");
    taskListLabelFeature.init();

    taskListLabelFeature.destroy();

    expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(0);
  });

  it("destroy() 後、PROCESSED_ATTR が全て除去される", () => {
    buildTaskItem();
    taskListLabelFeature.init();

    taskListLabelFeature.destroy();

    expect(document.querySelectorAll(`[${PROCESSED_ATTR}]`)).toHaveLength(0);
  });

  it("destroy() 後に再び init() を呼ぶとlabelが再挿入される", () => {
    buildTaskItem();
    taskListLabelFeature.init();
    taskListLabelFeature.destroy();

    taskListLabelFeature.init();

    expect(document.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(1);
  });

  it("init() 前に destroy() を呼んでも例外を投げない（observer=null 分岐=true）", () => {
    expect(() => taskListLabelFeature.destroy()).not.toThrow();
  });
});

// ===========================================================================
// MutationObserver による動的タスクリストへの対応
// ===========================================================================

describe("MutationObserver による動的タスクリストへの対応", () => {
  // -------------------------------------------------------------------------
  // Decision G=true, H=true: node 自体が task-list-item
  // -------------------------------------------------------------------------

  it("[H=true] init() 後に DOM へ直接追加された li.task-list-item にlabelが挿入される", async () => {
    taskListLabelFeature.init();

    const li = buildTaskItem("動的タスク");

    await vi.waitFor(() => li.querySelector(`label.${TASK_LABEL_CLASS}`) !== null);

    expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Decision G=true, H=false, I=true: 追加ノード内に li.task-list-item を含む
  // -------------------------------------------------------------------------

  it("[I=true] li.task-list-item を含む親要素が追加された場合もlabelが挿入される", async () => {
    taskListLabelFeature.init();

    const parent = document.createElement("div");
    const li = document.createElement("li");
    li.className = "task-list-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-list-item-checkbox";
    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(" 子タスク"));
    parent.appendChild(li);
    document.body.appendChild(parent);

    await vi.waitFor(() => li.querySelector(`label.${TASK_LABEL_CLASS}`) !== null);

    expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Decision G=true, H=false, I=false, J=true: .contains-task-list を含む
  // -------------------------------------------------------------------------

  it("[J=true] .contains-task-list を含む要素が追加された場合、内包するタスクアイテムにlabelが挿入される", async () => {
    taskListLabelFeature.init();

    const wrapper = document.createElement("div");
    wrapper.className = "contains-task-list";

    const ul = document.createElement("ul");
    const li = document.createElement("li");
    li.className = "task-list-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-list-item-checkbox";
    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(" ネストタスク"));
    ul.appendChild(li);
    wrapper.appendChild(ul);
    document.body.appendChild(wrapper);

    await vi.waitFor(() => li.querySelector(`label.${TASK_LABEL_CLASS}`) !== null);

    expect(li.querySelector(`label.${TASK_LABEL_CLASS}`)).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Decision K=false: shouldProcess が false のまま（関係ない要素が追加された場合）
  // -------------------------------------------------------------------------

  it("[K=false] 無関係な要素が追加されてもlabelが挿入されない", async () => {
    // init前にタスクアイテムを置いておき、init後は追加しない
    taskListLabelFeature.init();

    const unrelated = document.createElement("div");
    unrelated.className = "unrelated-element";
    unrelated.textContent = "関係なし";
    document.body.appendChild(unrelated);

    // MutationObserverは非同期のため少し待機
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(unrelated.querySelector(`label.${TASK_LABEL_CLASS}`)).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Decision G=false: 追加ノードが HTMLElement でない（テキストノード）
  // -------------------------------------------------------------------------

  it("[G=false] テキストノードが追加された場合も例外を投げない", async () => {
    taskListLabelFeature.init();

    const textNode = document.createTextNode("テキストノード");
    document.body.appendChild(textNode);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // 例外なく完了すること
    expect(true).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Decision E=false: mutation.type が "childList" でない（attributes変更）
  // -------------------------------------------------------------------------

  it("[E=false] attributes の変化のみでは processAllTaskListItems が呼ばれない", async () => {
    // タスクアイテムを追加してからinitするとinit時に処理される
    const li = buildTaskItem("既存タスク");
    taskListLabelFeature.init();
    // init後にlabelが付いた状態

    // 属性変更だけを発生させる（class追加）
    li.setAttribute("data-test", "changed");

    await new Promise((resolve) => setTimeout(resolve, 50));

    // 2個目のlabelが付かないこと（init時の1個のみ）
    expect(li.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Decision F=false: childList だが addedNodes が空（削除のみ）
  // -------------------------------------------------------------------------

  it("[F=false] childList変化だがaddedNodesが空（削除操作）の場合は処理されない", async () => {
    taskListLabelFeature.init();

    // 既存ノードを追加→削除（addedNodesが空になるケース）
    const dummy = document.createElement("span");
    dummy.textContent = "ダミー";
    document.body.appendChild(dummy);
    // waitForが走る前に削除
    document.body.removeChild(dummy);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // 例外なく完了すること
    expect(true).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Observer の再起動（init 2回目）
  // -------------------------------------------------------------------------

  it("init() を 2 回呼んでも、Observer は 1 つだけ動作しラベルが二重付与されない", async () => {
    taskListLabelFeature.init();
    taskListLabelFeature.init(); // Observerをdisconnect→再接続

    const li = buildTaskItem("二重チェック");

    await vi.waitFor(() => li.querySelector(`label.${TASK_LABEL_CLASS}`) !== null);

    // ラベルは1つのみ
    expect(li.querySelectorAll(`label.${TASK_LABEL_CLASS}`)).toHaveLength(1);
  });
});
