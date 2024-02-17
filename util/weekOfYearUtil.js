import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import dayjs from 'dayjs';
import weekYear from 'dayjs/plugin/weekYear.js'

export function getWeekOfYearList(startDate, endDate) {
    dayjs.extend(weekOfYear)
    dayjs.extend(weekYear)
    let firstDate = dayjs(startDate)
    let secondDate = dayjs(endDate)

    let weekOfYearStart = getWeekOfYearStr(firstDate);
    let firstDateLeft = dayjs(startDate);
    let weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
    while (weekOfYearStart === weekOfYearStrLeft) {
        firstDate = dayjs(firstDateLeft);
        firstDateLeft = firstDateLeft.subtract(1, 'day');
        weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
    }

    let weekOfYearList = [];
    while (firstDate.isBefore(secondDate) || firstDate.isSame(secondDate)) {
        let weekOfYearStart = firstDate.format('YYYY-MM-DD');
        let weekOfYearEnd = firstDate.add(6, "day").format('YYYY-MM-DD');
        let weekOfYear = getWeekOfYearStr(firstDate);
        weekOfYearList.push({
            weekOfYearStart: weekOfYearStart,
            weekOfYearEnd: weekOfYearEnd,
            weekOfYear: weekOfYear
        })
        firstDate = firstDate.add(1, 'week');
    }
    return weekOfYearList;
}

export function getWeekOfYearStr(date) {
    return String(date.weekYear()) + '-' + String(date.week()).padStart(2, '0')
}