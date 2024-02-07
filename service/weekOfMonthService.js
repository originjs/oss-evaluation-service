import { WeekOfMonthMapper } from '../models/weekOfMonth.js';

export function getWeekOfMonth(str) {
  const date = new Date(Date.parse(str));
  let dateN = new Date(Date.parse(str));
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  // the first day of the month
  dateN = new Date(dateN.setDate(1));
  const w1 = dateN.getDay();
  // Convert strings to standard time format
  let w = date.getDay();
  // The first day of the month is not a Sunday, the current date is a Sunday
  if (w === 0 && w1 !== 0) {
    w = 7;
  }
  let week = Math.ceil((date.getDate() + 6 - w) / 7);
  // The first day of the month is not Monday
  if (w1 !== 1) {
    week = Math.ceil((date.getDate() + 6 - w) / 7) - 1;
  }
  // Week 0 belongs to the last week of the previous month
  if (week === 0) {
    month = date.getMonth();
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    const dayLast = new Date(year, month, 0).getDate();
    const timestamp = new Date(year, month - 1, dayLast);
    w = new Date(timestamp).getDay();// 周几
    if (w === 0) {
      w = 7;
    }
    week = Math.ceil((timestamp.getDate() + 6 - w) / 7) - 1;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(week).padStart(2, '0')}`;
}

export async function geneWeekOfMonth(firstDate, secondDate) {
  const startDate = new Date(firstDate);
  const endDate = new Date(secondDate);
  let start; let
    end;
  const set = new Set();
  while (startDate <= endDate) {
    const week = getWeekOfMonth(startDate);
    if (set.has(week)) {
      end = new Date(startDate);
      await WeekOfMonthMapper.upsert({
        start,
        end,
        week,
      }).then((weekOfMonth) => {
        console.log('Created weekOfMonth:', weekOfMonth);
      })
        .catch((err) => {
          console.error('Error creating weekOfMonth:', err);
        });
    } else {
      start = new Date(startDate);
    }
    set.add(week);
    startDate.setDate(startDate.getDate() + 1);
  }
}
