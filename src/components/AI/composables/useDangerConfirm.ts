import { computed, ref } from "vue";
import { useRenderStore } from "@/store/render";
import type { CanvasNodeInfo, ConfirmationRequest } from "@/utils/ai";

// 待确认的危险操作
const confirmRequest = ref<ConfirmationRequest | null>(null);
let confirmResolver: ((approved: boolean) => void) | null = null;

/**
 * 危险操作确认：执行前挂起，等待用户在 UI 中确认或取消。
 */
export function useDangerConfirm() {
  const { render } = useRenderStore();

  const confirmSummary = computed(() => confirmRequest.value?.summary ?? "");

  // 确认框中列出将被操作的元素（按 id 从当前画布解析）
  const confirmTargets = computed<CanvasNodeInfo[]>(() => {
    const request = confirmRequest.value;
    if (!request || !render.value) return [];
    const args = request.args as { ids?: unknown } | undefined;
    const ids = Array.isArray(args?.ids) ? args.ids.map(String) : [];
    if (ids.length === 0) return [];
    const data = render.value.canvasTool.getCanvas().data as
      | { nodes?: CanvasNodeInfo[] }
      | undefined;
    return (data?.nodes ?? []).filter((node) => ids.includes(node.id));
  });

  function resolveConfirm(approved: boolean) {
    const resolver = confirmResolver;
    confirmResolver = null;
    confirmRequest.value = null;
    resolver?.(approved);
  }

  // 供 agent 调用：挂起并返回用户的决定
  function requestConfirm(request: ConfirmationRequest) {
    return new Promise<boolean>((resolve) => {
      confirmRequest.value = request;
      confirmResolver = resolve;
    });
  }

  return {
    confirmRequest,
    confirmSummary,
    confirmTargets,
    resolveConfirm,
    requestConfirm,
  };
}
