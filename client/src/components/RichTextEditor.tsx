import { useEffect, useRef } from "react";
import { TEXT_COLORS, sanitizeRichText } from "../utils/richText";

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * 글자를 선택한 뒤 툴바로 굵게·글자색을 바꾸는 간단한 편집기입니다.
 * 입력할 때마다 innerHTML을 다시 그리면 커서가 튀므로, 처음 한 번만 내용을 넣고
 * 이후에는 바뀐 HTML을 onChange로만 알려줍니다.
 */
export function RichTextEditor({ initialHtml, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
    // 처음 마운트될 때만 내용을 넣습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange() {
    if (editorRef.current) onChange(sanitizeRichText(editorRef.current.innerHTML));
  }

  function apply(command: "bold" | "foreColor" | "removeFormat", value?: string) {
    editorRef.current?.focus();
    // <font> 대신 <span style="color:..."> 로 만들도록 합니다.
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    emitChange();
  }

  // 툴바 버튼을 눌러도 편집기의 글자 선택이 풀리지 않게 합니다.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 focus-within:border-brand-400">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => apply("bold")}
          className="h-7 w-7 rounded text-sm font-bold text-slate-700 hover:bg-white"
          title="굵게"
        >
          B
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onMouseDown={keepSelection}
            onClick={() => apply("foreColor", c.value)}
            className="h-7 w-7 rounded text-sm font-bold hover:bg-white"
            style={{ color: c.value }}
            title={`${c.label} 글자색`}
          >
            {c.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => apply("removeFormat")}
          className="rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-white"
          title="선택한 글자의 굵게·색 지우기"
        >
          서식 지우기
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder={placeholder}
        className="min-h-[7.5rem] whitespace-pre-wrap px-3 py-2 text-sm text-slate-700 focus:outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
