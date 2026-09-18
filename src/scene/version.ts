import { randomVersionNonce } from "./factory";
import { elementsEqual, indexById } from "./history";
import type { BoardElement } from "./types";

/**
 * 版本递增：内容变化时 version + 1 并生成新的 versionNonce；
 * 内容不变则复用上一份元素（保留其版本）。
 * 供后续协作做「高版本优先、同版本比 nonce」的协调。
 */
function bumpElement(
  previous: BoardElement | undefined,
  next: BoardElement
): BoardElement {
  if (previous && elementsEqual(previous, next)) return previous;

  const version = (previous?.version ?? 0) + 1;
  const versionNonce = randomVersionNonce();

  if (next.type === "group") {
    const prevChildren = previous?.type === "group" ? previous.children : [];
    const prevById = indexById(prevChildren);
    return {
      ...next,
      children: next.children.map((child) =>
        bumpElement(prevById.get(child.id), child)
      ),
      version,
      versionNonce,
    };
  }

  return { ...next, version, versionNonce };
}

export function bumpVersions(
  previous: BoardElement[],
  next: BoardElement[]
): BoardElement[] {
  const prevById = indexById(previous);
  return next.map((element) => bumpElement(prevById.get(element.id), element));
}
