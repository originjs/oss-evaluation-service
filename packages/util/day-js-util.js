import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
dayjs.extend(weekOfYear);

export function isFirstDayOfMonth(dayParam) {
  return dayParam.date() === 1;
}

export function isFirstDayOfWeek(dayParam) {
  // zero is Sun，1 is Mon
  return dayParam.day() === 1;
}

export function isFirstDayOfYear(dayParam) {
  return dayParam.month() === 0 && dayParam.date() === 1;
}

export function mondayOfPreviousWeek(dayParam) {
  return dayParam.subtract(1, 'week').startOf('week').add(1, 'day');
}

export function firstDayOfPreviousMonth(dayParam) {
  return dayParam.subtract(1, 'month').startOf('month');
}

export function firstDayOfPreviousYear(dayParam) {
  return dayParam.subtract(1, 'year').startOf('year');
}

export function mondayOfCurrentWeek() {
  // defulat first day of week is sunday,need to add one day
  return dayjs().startOf('week').add(1, 'day');
}

export function firstDayOfCurrentMonth() {
  return dayjs().startOf('month');
}

export function firstDayOfCurrentYear() {
  return dayjs().startOf('year');
}

export function simpleDateFormat(date) {
  return date.format('YYYY-MM-DD');
}

export function simpleDateTimeFormat(date) {
  return date.format('YYYY-MM-DD HH:mm:ss');
}

export function simpleWeekFormat(date) {
  return `${date.year()}-${String(date.week()).padStart(2, '0')}W`;
}
