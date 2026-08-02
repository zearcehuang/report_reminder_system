function formatDateISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isWorkday(dateStr, holidays = []) {
  const holidayObj = holidays.find(h => h.date === dateStr);
  if (holidayObj) {
    return holidayObj.isWorkday === true || holidayObj.isHoliday === false;
  }
  const date = new Date(dateStr);
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getPreviousWorkday(dateStr, holidays = []) {
  let curr = new Date(dateStr);
  const MAX_ITERATIONS = 365;
  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    const iso = formatDateISO(curr);
    if (isWorkday(iso, holidays)) {
      return iso;
    }
    curr.setDate(curr.getDate() - 1);
    iterations++;
  }
  return dateStr;
}

module.exports = {
  formatDateISO,
  isWorkday,
  getPreviousWorkday
};
