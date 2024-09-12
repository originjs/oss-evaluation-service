import dayjs from 'dayjs';

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
  return dayjs().startOf('week');
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
