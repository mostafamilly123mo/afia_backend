module.exports = function(appoinments) {
    class obj {
        constructor(start, end, ) {
            this.start = start;
            this.end = end;
        }
    }
    let reservedAppoinment = [];

    let i = 0, 
        j = 0;
    for (i = 0; i < appoinments.length; i++) {
        if (i >= 0 && i < appoinments.length - 1) {

            if (appoinments[i].endTime === appoinments[i + 1].startTime) {
                continue
            } else {
                let time = new obj(appoinments[j].startTime, appoinments[i].endTime)
                j = i + 1
                reservedAppoinment.push(time)
            }
        }
    }
    if (appoinments[appoinments.length - 1].startTime == appoinments[appoinments.length - 2].endTime) {
        let time = new obj(appoinments[j].startTime, appoinments[appoinments.length - 1].endTime)
        reservedAppoinment.push(time)
    } else {
        let time = new obj(appoinments[appoinments.length - 1].startTime, appoinments[appoinments.length - 1].endTime)
        reservedAppoinment.push(time)

    }

    return reservedAppoinment
}