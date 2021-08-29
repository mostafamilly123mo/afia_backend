class ClinicObj {
    constructor(clinic, photo) {
        this.clinic = clinic;
        this.photo = photo;
    }
}

class PatientObj {
    constructor(patient, photo) {
        this.patient = patient;
        this.photo = photo;
    }
}

class DoctorObj {
    constructor(doctor, tag, photo) {
        this.doctor = doctor;
        this.tag = tag;
        this.photo = photo;
    }
}

class ConsultationObj {
    constructor(Consultation, photo) {
        this.consultation = Consultation;
        this.photo = photo;
    }

}
class FullAppointmentObj {
    constructor(Appointment, Session, Photo) {
        this.Appointment = Appointment;
        this.Session = Session;
        this.Photo = Photo;
    }
}

class MedicineInSessions {
    constructor(name) {
        this.name = name;
    }
}

class Month {
    constructor(name, start, end) {
        this.name = name
        this.start = start
        this.end = end
    }
}

class ClinicPatientsInMonth {
    constructor(name, count) {
        this.name = name
        this.count = count
    }
}

class CustomSession {
    constructor(doctorName, clinicName, date, type, description, medicine, doctorReport, photos) {
        this.doctorName = doctorName;
        this.clinicName = clinicName;
        this.date = date;
        this.type = type;
        this.description = description;
        this.medicine = medicine
        this.doctorReport = doctorReport;
        this.photos = photos;
    }
}


class AcceptedAppointmentWithPatientNameObj {
    constructor(id, day, date, startTime, endTime, type, description, status, firstName, lastName) {
        this.id = id;
        this.day = day;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.type = type;
        this.description = description;
        this.status = status;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
module.exports = {
    ClinicObj, PatientObj, DoctorObj, ConsultationObj,
    FullAppointmentObj, MedicineInSessions, Month,
    ClinicPatientsInMonth, CustomSession, AcceptedAppointmentWithPatientNameObj
}