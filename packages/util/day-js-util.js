const isFirstDayOfMonth = dayParam => {
  return dayParam.date() === 1;
};

const isFirstDayOfWeek = dayParam => {
  return dayParam.day() === 1; // zero is Sun，1 is Mon
};

export { isFirstDayOfWeek, isFirstDayOfMonth };
