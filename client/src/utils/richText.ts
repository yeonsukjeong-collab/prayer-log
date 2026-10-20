import DOMPurify from "dompurify";

export const TEXT_COLORS = [
  { label: "빨", value: "#dc2626" },
  { label: "주", value: "#ea580c" },
  { label: "노", value: "#ca8a04" },
  { label: "초", value: "#16a34a" },
  { label: "파", value: "#2563eb" },
  { label: "남", value: "#1e3a8a" },
  { label: "보", value: "#9333ea" },
];

// 서식은 굵게와 글자색만 허용합니다. 그 밖의 태그·속성·스타일은 모두 걸러냅니다.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (!(node instanceof HTMLElement)) return;
  if (node.hasAttribute("style")) {
    const { color, fontWeight } = node.style;
    node.removeAttribute("style");
    if (color) node.style.color = color;
    if (fontWeight) node.style.fontWeight = fontWeight;
  }
});

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "span", "font", "br", "div", "p"],
    ALLOWED_ATTR: ["style", "color"],
  });
}

/** 서식 기능 이전에 저장된 일반 텍스트도 편집기·화면에서 줄바꿈이 유지되도록 HTML로 바꿉니다. */
export function toRichHtml(content: string): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return sanitizeRichText(content);
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br>");
}

export function isRichTextEmpty(html: string): boolean {
  const div = document.createElement("div");
  div.innerHTML = sanitizeRichText(html);
  return !div.textContent?.trim();
}
