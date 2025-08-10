// Утилиты для работы с датами

// Получить локальную дату в формате YYYY-MM-DD
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Получить локальное время в формате HH:MM
export function getLocalTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Получить текущие дату и время для задачи
export function getCurrentDateTimeForTask() {
  const now = new Date();
  return {
    date: getLocalDateString(now),
    time: getLocalTimeString(now)
  };
}