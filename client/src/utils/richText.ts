import DOMPurify from "dompurify";

export const TEXT_COLORS = [
  { label: "빨강", value: "#dc2626" },
  { label: "파랑", value: "#2563eb" },
  { label: "노랑", value: "#ca8a04" },
  { label: "초록", value: "#16a34a" },
];

// 서식은 굵게·밑줄·글자색만 허용합니다. 그 밖의 태그·속성·스타일은 모두 걸러냅니다.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (!(node instanceof HTMLElement)) return;
  if (node.hasAttribute("style")) {
    const { color, fontWeight, textDecorationLine } = node.style;
    node.removeAttribute("style");
    if (color) node.style.color = color;
    if (fontWeight) node.style.fontWeight = fontWeight;
    if (textDecorationLine.includes("underline")) node.style.textDecorationLine = "underline";
  }
});

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "u", "span", "font", "br", "div", "p"],
    ALLOWED_ATTR: ["style", "color"],
  });
}

/** 서식 기능 이전에 저장된 일반 텍스트도 편집기·화면에서 줄바꿈이 유지되도록 HTML로 바꿉니다. */
export function toRichHtml(content: string): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return sanitizeRichText(content);
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br>");
}

/** 엑셀 내보내기 등에 쓰도록 서식을 빼고 줄바꿈만 남긴 글자로 바꿉니다. */
export function richTextToPlain(content: string): string {
  const div = document.createElement("div");
  div.innerHTML = toRichHtml(content)
    .replace(/<br\s*\/?>/gi, "\n")
    // 편집기는 둘째 줄부터 <div>로 감싸므로, 줄이 시작되는 곳에 줄바꿈을 넣습니다.
    .replace(/<(div|p)\b[^>]*>/gi, "\n");
  return (div.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export function isRichTextEmpty(html: string): boolean {
  const div = document.createElement("div");
  div.innerHTML = sanitizeRichText(html);
  return !div.textContent?.trim();
}
