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
            let weekOfMonth = new WeekOfMonthDO(start, end, week);
            await WeekOfMonthMapper.upsert(weekOfMonth).then(weekOfMonth => {
                console.log('Created weekOfMonth:', weekOfMonth);
            })
                .catch(err => {
                    console.error('Error creating weekOfMonth:', err);
                });
            console.log(weekOfMonth);
        } else {
            start = new Date(startDate);
        }
        set.add(week)
        startDate.setDate(startDate.getDate() + 1);
    }
}

/**
 * WeekOfMonthDO
 */
class WeekOfMonthDO {
    constructor(start, end, weekOfMonth) {
        this.start = start;
        this.end = end;
        this.weekOfMonth = weekOfMonth;
    }
}

export function getWeekOfMonth(str) {
    str = Date.parse(str);
    let date = new Date(str);
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let dateN = new Date(str);
    //月份第一天
    dateN = new Date(dateN.setDate(1));
    let w1 = dateN.getDay();
    // 将字符串转为标准时间格式
    let w = date.getDay();//周几
    //当月第一天不是周天，当前日期是周天
    if (w === 0 && w1 != 0) {
        w = 7;
    }
    let week = Math.ceil((date.getDate() + 6 - w) / 7);
    //当月第一天不是周一
    if (w1 != 1) {
        week = Math.ceil((date.getDate() + 6 - w) / 7) - 1;
    }
    //第0周归于上月的最后一周
    if (week === 0) {
        month = date.getMonth();
        //跨年
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