export const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
};

export const timeOptions: Intl.DateTimeFormatOptions = {
    timeStyle: 'short',
    hourCycle: 'h24'
};

export function getDuration(eveDatePast: string, eveDateFuture: string): string {
    // get total seconds between the times
    var delta = Math.abs(new Date(Date.parse(eveDatePast)).getTime() - new Date(Date.parse(eveDateFuture)).getTime()) / 1000;

    // calculate (and subtract) whole weels
    const weeks = Math.floor(delta / 604800)
    delta -= weeks * 604800;

    // calculate (and subtract) whole days
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;
    var dayOutput = "";
    var weekOutput = "";
    if (weeks > 0) {
        weekOutput = weeks > 1 ? `${weeks.toString()} weeks` : `${weeks.toString()} week`;
    }
    if (days > 0) {
        dayOutput = days > 1 ? `${days.toString()} days` : `${days.toString()} day`;
    }
    if (weekOutput !== "" && dayOutput !== "") {
        return `${weekOutput} and ${dayOutput}`
    } else {
        return `${weekOutput}${dayOutput}`;
    }
}