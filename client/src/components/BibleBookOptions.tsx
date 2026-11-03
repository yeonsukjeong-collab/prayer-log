import { NEW_TESTAMENT, OLD_TESTAMENT } from "../utils/bible";

/** 성경 66권을 구약/신약으로 묶은 <option> 목록입니다. <select> 안에 넣어 씁니다. */
export function BibleBookOptions() {
  return (
    <>
      <optgroup label="구약">
        {OLD_TESTAMENT.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </optgroup>
      <optgroup label="신약">
        {NEW_TESTAMENT.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </optgroup>
    </>
  );
}
