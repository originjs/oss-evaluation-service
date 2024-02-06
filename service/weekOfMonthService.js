import {WeekOfMonthMapper} from "../models/weekOfMonth.js";

export async function geneWeekOfMonth(firstDate, secondDate) {
    let startDate = new Date(firstDate);
    let endDate = new Date(secondDate);
    let start, end;
    let set = new Set();
    while (startDate <= endDate) {
        let week = getWeekOfMonth(startDate);
        if (set.has(week)) {
            end = new Date(startDate);
            await WeekOfMonthMapper.upsert({
                start: start,
                end: end,
                week: week,
            }).then(weekOfMonth => {
                console.log('Created weekOfMonth:', weekOfMonth);
            })
                .catch(err => {
                    console.error('Error creating weekOfMonth:', err);
                });
        } else {
            start = new Date(startDate);
        }
        set.add(week)
        startDate.setDate(startDate.getDate() + 1);
    }
}

export function getWeekOfMonth(str) {
    str = Date.parse(str);
    let date = new Date(str);
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dateN = new Date(str);
    //the first day of the month
    dateN = new Date(dateN.setDate(1));
    let w1 = dateN.getDay();
    // Convert strings to standard time format
    let w = date.getDay();
    // The first day of the month is not a Sunday, the current date is a Sunday
    if (w === 0 && w1 != 0) {
        w = 7;
    }
    let week = Math.ceil((date.getDate() + 6 - w) / 7);
    // The first day of the month is not Monday
    if (w1 != 1) {
        week = Math.ceil((date.getDate() + 6 - w) / 7) - 1;
    }
    // Week 0 belongs to the last week of the previous month
    if (week === 0) {
        month = date.getMonth();
        if (month === 0) {
            month = 12;
            year = year - 1;
        }
        let dayLast = new Date(year, month, 0).getDate();
        let timestamp = new Date(year, month - 1, dayLast);
        w = new Date(timestamp).getDay();//周几
        if (w === 0) {
            w = 7;
        }
        week = Math.ceil((timestamp.getDate() + 6 - w) / 7) - 1;
    }
    return year + "-" + String(month).padStart(2, '0') + "-" + String(week).padStart(2, '0');
}