const MONTHS = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
];

export const formatDateRangeReadable = (startDate?: string | Date, endDate?: string | Date) => {
    if (!startDate || !endDate) return "";

    let startMonth, startDay, endMonth, endDay;

    // Если дата в формате MM-DD (новый формат)
    if (typeof startDate === 'string' && startDate.match(/^\d{2}-\d{2}$/)) {
        const [sm, sd] = startDate.split('-');
        startMonth = parseInt(sm);
        startDay = parseInt(sd);
    } else {
        // Старый формат (Date объект или полная дата)
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        startMonth = start.getMonth() + 1;
        startDay = start.getDate();
    }

    // Если дата в формате MM-DD (новый формат)
    if (typeof endDate === 'string' && endDate.match(/^\d{2}-\d{2}$/)) {
        const [em, ed] = endDate.split('-');
        endMonth = parseInt(em);
        endDay = parseInt(ed);
    } else {
        // Старый формат (Date объект или полная дата)
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        endMonth = end.getMonth() + 1;
        endDay = end.getDate();
    }

    if (startMonth === endMonth) {
        const monthName = MONTHS[startMonth - 1] || "";
        return `${startDay}-${endDay} ${monthName}`;
    }

    const startMonthName = MONTHS[startMonth - 1] || "";
    const endMonthName = MONTHS[endMonth - 1] || "";

    return `${startDay} ${startMonthName} — ${endDay} ${endMonthName}`;
};

export const formatDateRangeReadableWithYear = (startDate?: string | Date, endDate?: string | Date) => {
    if (!startDate || !endDate) return "";

    let startMonth, startDay, endMonth, endDay;
    const currentYear = new Date().getFullYear();

    // Если дата в формате MM-DD (новый формат)
    if (typeof startDate === 'string' && startDate.match(/^\d{2}-\d{2}$/)) {
        const [sm, sd] = startDate.split('-');
        startMonth = parseInt(sm);
        startDay = parseInt(sd);
    } else {
        // Старый формат (Date объект или полная дата)
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        startMonth = start.getMonth() + 1;
        startDay = start.getDate();
    }

    // Если дата в формате MM-DD (новый формат)
    if (typeof endDate === 'string' && endDate.match(/^\d{2}-\d{2}$/)) {
        const [em, ed] = endDate.split('-');
        endMonth = parseInt(em);
        endDay = parseInt(ed);
    } else {
        // Старый формат (Date объект или полная дата)
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        endMonth = end.getMonth() + 1;
        endDay = end.getDate();
    }

    if (startMonth === endMonth) {
        const monthName = MONTHS[startMonth - 1] || "";
        return `${startDay}-${endDay} ${monthName} ${currentYear}`;
    }

    const startMonthName = MONTHS[startMonth - 1] || "";
    const endMonthName = MONTHS[endMonth - 1] || "";

    // Если даты переходят через конец года (например 12-22 до 01-19)
    const startYear = startMonth > endMonth ? currentYear - 1 : currentYear;
    const endYear = startMonth > endMonth ? currentYear : currentYear;

    return `${startDay} ${startMonthName} ${startYear} - ${endDay} ${endMonthName} ${endYear}`;
};

export const formatDateRangeDDMM = (startDate?: string | Date, endDate?: string | Date) => {
    if (!startDate || !endDate) return "";

    let startMonth, startDay, endMonth, endDay;

    // Если дата в формате MM-DD (новый формат)
    if (typeof startDate === 'string' && startDate.match(/^\d{2}-\d{2}$/)) {
        const [sm, sd] = startDate.split('-');
        startMonth = sm;
        startDay = sd;
    } else {
        // Старый формат (Date объект или полная дата)
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        startMonth = String(start.getMonth() + 1).padStart(2, '0');
        startDay = String(start.getDate()).padStart(2, '0');
    }

    // Если дата в формате MM-DD (новый формат)
    if (typeof endDate === 'string' && endDate.match(/^\d{2}-\d{2}$/)) {
        const [em, ed] = endDate.split('-');
        endMonth = em;
        endDay = ed;
    } else {
        // Старый формат (Date объект или полная дата)
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        endMonth = String(end.getMonth() + 1).padStart(2, '0');
        endDay = String(end.getDate()).padStart(2, '0');
    }

    return `${startDay}.${startMonth}-${endDay}.${endMonth}`;
};

