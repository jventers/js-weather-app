// ===== Date & Time Formatting =====

// Format a date string to: "Wed"
export function formatWeekdayShort(dateString) {
  const weekday = new Date(dateString);
  return weekday.toLocaleDateString("en-US", {
    weekday: "short",
  });
}

// Format a date string to: "Mar 26"
export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Format a date string to: "Tuesday, March 26"
export function formatDateLong(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Format a time string to: "7:30 PM"
export function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ===== Temperature & Theme Helpers =====
// At what point do you want the theme to switch from cold to warm
const TEMP_THRESHOLD = 50;

// Classify a temperature as "warm" or "cold"
export function classifyTemperature(temp, threshold = TEMP_THRESHOLD) {
  return temp >= threshold ? "warm" : "cold";
}

export function findLowForNight(dayName, dailyForecast) {
  const match = dailyForecast.find(
    (d) => !d.isDaytime && d.name.toLowerCase().includes(dayName.toLowerCase())
  );
  return match ? match.temperature : "--";
}

// ===== Icon Utilities =====

// Extracts a simplified icon name from an NWS icon URL
export function extractIconName(iconUrl) {
  if (iconUrl.includes("rain")) return "rainy";
  if (iconUrl.includes("snow")) return "snowy";
  if (iconUrl.includes("sct") || iconUrl.includes("bkn")) return "cloudy-day";
  if (iconUrl.includes("ovc")) return "overcast";
  if (iconUrl.includes("night")) return "clear-night";
  return "clear-day"; // fallback
}

// ===== Content Visibility =====

// Add/remove the hidden class from panels and the nav once content is done loading
export function showContent(isToday, todayPanel, futurePanel, forecastButtons) {
  if (isToday) {
    todayPanel.classList.remove("hidden");
    futurePanel.classList.add("hidden");
  } else {
    todayPanel.classList.add("hidden");
    futurePanel.classList.remove("hidden");
  }

  forecastButtons.classList.remove("hidden");
}
