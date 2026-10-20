import { useEffect, useRef, useState } from "react";
import { TEXT_COLORS, sanitizeRichText } from "../utils/richText";

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type Command = "bold" | "underline" | "foreColor" | "removeFormat";

/**
 * 글자를 선택한 뒤 툴바로 굵게·밑줄·글자색을 바꾸는 간단한 편집기입니다.
 * 입력할 때마다 innerHTML을 다시 그리면 커서가 튀므로, 처음 한 번만 내용을 넣고
 * 이후에는 바뀐 HTML을 onChange로만 알려줍니다.
 */
export function RichTextEditor({ initialHtml, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  // 풀다운 메뉴를 열면 편집기의 글자 선택이 풀리므로, 마지막 선택 영역을 기억해 둡니다.
  const savedRangeRef = useRef<Range | null>(null);
  const [color, setColor] = useState(TEXT_COLORS[0].value);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
    // 처음 마운트될 때만 내용을 넣습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 마우스·키보드·모바일 선택 손잡이 등 어떤 방식으로 선택해도 기억되도록 합니다.
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, []);

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current;
    const selection = window.getSelection();
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function emitChange() {
    if (editorRef.current) onChange(sanitizeRichText(editorRef.current.innerHTML));
  }

  function apply(command: Command, value?: string) {
    editorRef.current?.focus();
    restoreSelection();
    // <font> 대신 <span style="..."> 로 만들도록 합니다.
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    saveSelection();
    emitChange();
  }

  function handleColorChange(value: string) {
    setColor(value);
    apply("foreColor", value);
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
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => apply("underline")}
          className="h-7 w-7 rounded text-sm text-slate-700 underline hover:bg-white"
          title="밑줄"
        >
          U
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => apply("foreColor", color)}
          className="h-7 rounded px-1.5 text-sm font-bold hover:bg-white"
          style={{ color }}
          title="선택한 글자에 이 색 적용"
        >
          가
        </button>
        <select
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs focus:border-brand-400 focus:outline-none"
          style={{ color }}
          title="글자색"
        >
          {TEXT_COLORS.map((c) => (
            <option key={c.value} value={c.value} style={{ color: c.value }}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => apply("removeFormat")}
          className="rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-white"
          title="선택한 글자의 굵게·밑줄·색 지우기"
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
