import type { PrayerRequest } from "../types";

export async function exportPrayerRequestsToExcel(items: PrayerRequest[], filenameHint: string) {
  const XLSX = await import("xlsx");

  const rows = items.map((item) => {
    const date = new Date(item.requestDate);
    return {
      작성자: item.author.name,
      날짜: date.toLocaleDateString("ko-KR"),
      요일: date.toLocaleDateString("ko-KR", { weekday: "short" }),
      기도제목: item.content,
      응답여부: item.isAnswered ? "응답됨" : "기도중",
      응답내용: item.answeredNote ?? "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 6 },
    { wch: 50 },
    { wch: 10 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "기도제목");
  XLSX.writeFile(workbook, `기도제목_${filenameHint}.xlsx`);
}
