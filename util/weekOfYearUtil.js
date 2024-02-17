import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import dayjs from 'dayjs';
import weekYear from 'dayjs/plugin/weekYear.js';

export function getWeekOfYearList(startDate, endDate) {
  dayjs.extend(weekOfYear);
  dayjs.extend(weekYear);
  let firstDate = dayjs(startDate);
  const secondDate = dayjs(endDate);

  const weekOfYearStart = getWeekOfYearStr(firstDate);
  let firstDateLeft = dayjs(startDate);
  let weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
  while (weekOfYearStart === weekOfYearStrLeft) {
    firstDate = dayjs(firstDateLeft);
    firstDateLeft = firstDateLeft.subtract(1, 'day');
    weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
  }

  const weekOfYearList = [];
  while (firstDate.isBefore(secondDate) || firstDate.isSame(secondDate)) {
    const start = firstDate.format('YYYY-MM-DD');
    const end = firstDate.add(6, 'day').format('YYYY-MM-DD');
    const week = getWeekOfYearStr(firstDate);
    weekOfYearList.push({
      start,
      end,
      weekOfYear: week,
    });
    firstDate = firstDate.add(1, 'week');
  }
  return weekOfYearList;
}

export function getWeekOfYearStr(date) {
  return `${String(date.weekYear())}-${String(date.week()).padStart(2, '0')}`;
}
