import { utils, read, write } from 'xlsx';
export function appendSheet(sourceBlob, appendBlob) {
  const sourceWorkbook = read(sourceBlob, { type: 'buffer', cellStyles: true });
  const appendWorkbook = read(appendBlob, { type: 'buffer', cellStyles: true });
  utils.book_append_sheet(
    sourceWorkbook,
    appendWorkbook.Sheets[appendWorkbook.SheetNames[0]],
    'benchmark',
  );
  return write(sourceWorkbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
}
