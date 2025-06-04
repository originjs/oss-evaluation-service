import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(weekOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);

export function normalizeTime(timeStr: string) {
  const dt = dayjs(timeStr);
  if (dt.isValid()) {
    // 统一输出为 UTC 时间的 ISO 格式：YYYY-MM-DDTHH:mm:ssZ
    return dt.utc().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
  } else {
    return null;
  }
}

export function isFirstDayOfMonth(dayParam: Dayjs) {
  return dayParam.date() === 1;
}

export function isFirstDayOfWeek(dayParam: Dayjs) {
  // zero is Sun，1 is Mon
  return dayParam.day() === 1;
}

export function isFirstDayOfYear(dayParam: Dayjs) {
  return dayParam.month() === 0 && dayParam.date() === 1;
}

export function mondayOfPreviousWeek(dayParam: Dayjs) {
  return dayParam.subtract(1, 'week').startOf('week').add(1, 'day');
}

export function firstDayOfPreviousMonth(dayParam: Dayjs) {
  return dayParam.subtract(1, 'month').startOf('month');
}

export function firstDayOfPreviousYear(dayParam: Dayjs) {
  return dayParam.subtract(1, 'year').startOf('year');
}

export function mondayOfCurrentWeek(dayjsParam = dayjs()) {
  // defulat first day of week is sunday,need to add one day
  return dayjsParam.startOf('week').add(1, 'day');
}

export function firstDayOfCurrentMonth(dayjsParam = dayjs()) {
  return dayjsParam.startOf('month');
}

export function firstDayOfCurrentYear(dayjsParam = dayjs()) {
  return dayjsParam.startOf('year');
}

export function simpleDateFormat(date: Dayjs) {
  return date.format('YYYY-MM-DD');
}

export function simpleDateTimeFormat(date: Dayjs) {
  return date.format('YYYY-MM-DD HH:mm:ss');
}

export function simpleWeekFormat(date: Dayjs) {
  return `${date.year()}-W${String(date.week()).padStart(2, '0')}`;
}
