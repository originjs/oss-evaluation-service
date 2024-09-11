const isFirstDayOfMonth = dayParam => {
  return dayParam.date() === 1;
};

const isFirstDayOfWeek = dayParam => {
  // zero is Sun，1 is Mon
  return dayParam.day() === 1;
};

const isFirstDayOfYear = dayParam => {
  return dayParam.month() === 0 && dayParam.date() === 1;
};

const mondayOfPreviousWeek = dayParam => {
  return dayParam.subtract(1, 'week').startOf('week').add(1, 'day');
};

const firstDayOfPreviousMonth = dayParam => {
  return dayParam.subtract(1, 'month').startOf('month');
};

const firstDayOfPreviousYear = dayParam => {
  return dayParam.subtract(1, 'year').startOf('year');
};

export {
  isFirstDayOfWeek,
  isFirstDayOfMonth,
  isFirstDayOfYear,
  mondayOfPreviousWeek,
  firstDayOfPreviousMonth,
  firstDayOfPreviousYear,
};
