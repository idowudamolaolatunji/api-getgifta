function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = (hours % 12 || 12);
    const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
    return `${formattedHours}:${formattedMinutes}${period}`;
}

module.exports = formatTime