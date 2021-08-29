Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf())
    date.setDate(date.getDate() + days);
    return date;
}

function clone(day) {
    let clone = {};
    for (let key in day) {
        if (day.hasOwnProperty(key))
            clone[key] = day[key];
    }
    return clone;
}

let WeekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDates(startDate, stopDate) {

    let Day = {
        day: '',
        date: ''
    }
    let dateArray = new Array();
    let currentDate = startDate;
    while (currentDate <= stopDate) {
        Day.day = WeekDays[currentDate.getDay()]
        Day.date = (currentDate).toLocaleDateString('pt-br').split('/').reverse().join('-')
        dateArray.push(clone(Day))
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}
//need some fix 
function getDayByDate() {
    let date = new Date();
    let day = WeekDays[date.getDay()]
    return day
}
module.exports = getDates
