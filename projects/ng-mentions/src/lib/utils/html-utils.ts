//https://stackoverflow.com/questions/35939886/find-first-scrollable-parent
export function getScrollParent(element: HTMLElement, includeHidden: boolean = false): HTMLElement {
  const elStyle = getComputedStyle(element);
  const excludeStaticParent = elStyle.position === 'absolute';
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;

  if (elStyle.position === 'fixed') { return document.body; }
  for (let parent: HTMLElement | null = element; (parent = parent.parentElement);) {
    const parentStyle = getComputedStyle(parent);
    if (excludeStaticParent && parentStyle.position === 'static') {
      continue;
    }
    if (overflowRegex.test((parentStyle.overflow || '') + (parentStyle.overflowY || '') + (parentStyle.overflowX || ''))) {
      return parent;
    }
  }

  return document.body;
}

export function isElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function isTextNode(node: Node | null): node is Text {
  return !!(node && (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE));
}

