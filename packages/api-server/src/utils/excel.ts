import XLSX from 'xlsx';
export function appendSheet(sourceBlob, appendBlob) {
  const sourceWorkbook = XLSX.read(sourceBlob, { type: 'buffer', cellDates: true });
  const appendWorkbook = XLSX.read(appendBlob, { type: 'buffer', cellDates: true });
  XLSX.utils.book_append_sheet(
    sourceWorkbook,
    appendWorkbook.Sheets[appendWorkbook.SheetNames[0]],
    'benchmark',
  );
  return XLSX.write(sourceWorkbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
}
