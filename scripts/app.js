// ================================================
// app.js — Main Application Entry Point & UI Logic
//
// Order of functions:
// 1. init (entry point)
// 2. renderToday → renderDay → updateMainUI
// 3. UI update helpers (theme, orb, content panels)
// 4. Rendering helpers (forecast buttons, temp lookup)
// ================================================
import { fetchForecasts, getUserLocation } from "./api.js";
import {
  formatWeekdayShort,
  formatDateShort,
  formatDateLong,
  formatTime,
  extractIconName,
  classifyTemperature,
  showContent,
  findLowForNight,
} from "./utils.js";

// ===== Constants =====
const ICON_PATH = "../assets/";
const ICON_EXT = ".svg";

// ===== State =====
let dailyForecast = [];
let hourlyForecast = [];
let currentDayIndex = 0;

// ===== DOM References =====
const locationDisplay = document.getElementById("location");
// Today Panel
const currentTempDisplay = document.getElementById("current-temp");
const weatherIconToday = document.getElementById("weather-icon-today");
const highLowTempDisplay = document.getElementById("high-low");
const todayDescription = document.getElementById("today-description");
const currentTimeDisplay = document.getElementById("current-time");
// Future Panel
const futureTempHigh = document.getElementById("future-temp-high");
const futureTempLow = document.getElementById("future-temp-low");
const weatherIconFuture = document.getElementById("weather-icon-future");
const futureDateDisplay = document.getElementById("future-date");
const futureDescription = document.getElementById("future-description");
// Orb & Arc
const orb = document.getElementById("orb");
// Forecast Button Container
const forecastButtons = document.getElementById("forecast-buttons");
// Panels
const todayPanel = document.getElementById("today-panel");
const futurePanel = document.getElementById("future-panel");

// ===== App Initialization =====
// Initializes the app. Handles location, fetches weather data, stores it in state, and kicks off the first render.
async function init() {
  const location = await getUserLocation();
  const forecastBundle = await fetchForecasts(location.lat, location.lon);
  if (!forecastBundle) return;

  locationDisplay.innerText = `${forecastBundle.city}, ${forecastBundle.state}`;
  dailyForecast = forecastBundle.daily.slice(0, 14);
  hourlyForecast = forecastBundle.hourly;

  renderDay(0);
  renderForecastButtons();
}

// ===== Forecast Logic =====
// Handles day-specific weather data. Pulls either hourly or daily data depending on index
function renderDay(index) {
  currentDayIndex = index;
  const now = new Date();
  let match;

  // If the day is today, pull hourly data, otherwise just get the daily data
  if (index === 0) {
    match = hourlyForecast.find((h) => {
      const start = new Date(h.startTime);
      const end = new Date(h.endTime);
      return now >= start && now < end;
    });
  } else {
    match = dailyForecast.find(
      (d) =>
        d.isDaytime &&
        new Date(d.startTime).getDay() === (now.getDay() + index) % 7
    );
  }

  if (!match) return;

  const isNight = !match.isDaytime;
  updateMainUI(match, index === 0, isNight);
}

// ===== UI Rendering =====
// Handles the nitty gritty of setting all the individual data once we know which data to show
function updateMainUI(data, isToday = false, isNight = false) {
  // Use destructuring to set variables based on properties from passed in data
  const { temperature, shortForecast, icon, isDaytime, name, startTime } = data;

  // Update background gradient based on time + temperature
  updateTheme(isNight, temperature);
  // Show the correct panel (today vs. future) + forecast buttons
  showContent(isToday, todayPanel, futurePanel, forecastButtons);
  // Move sun/moon orb to appropriate arc position
  updateOrb(isNight);

  // Set weather icon, text, and temperature
  const iconName = extractIconName(icon);
  const iconVariant = isDaytime ? "color" : "white";
  const iconPath = `${ICON_PATH}${iconName}-${iconVariant}${ICON_EXT}`;

  if (isToday) {
    currentTempDisplay.innerText = `${temperature}°`;
    weatherIconToday.src = iconPath;
    weatherIconToday.alt = shortForecast;
    highLowTempDisplay.innerText = `High ${temperature}° • Low ${findLowForNight(
      name,
      dailyForecast
    )}°`;
    currentTimeDisplay.innerText = formatTime(startTime);
    todayDescription.innerText = shortForecast;
  } else {
    futureTempHigh.innerText = `${temperature}°`;
    futureTempLow.innerText = `${findLowForNight(name, dailyForecast)}°`;
    weatherIconFuture.src = iconPath;
    weatherIconFuture.alt = shortForecast;
    futureDateDisplay.innerText = formatDateLong(startTime);
    futureDescription.innerText = shortForecast;
  }
}

// ===== Theme & Orb =====
function updateTheme(isNight, temp) {
  const tempClass = classifyTemperature(temp);
  document.body.className = `${isNight ? "night" : "day"} ${tempClass}`;
}

function updateOrb(isNight) {
  const now = new Date();

  const relevantPeriods = (
    isNight
      ? hourlyForecast.filter((p) => !p.isDaytime)
      : hourlyForecast.filter((p) => p.isDaytime)
  ).filter((p) => new Date(p.startTime).getDate() === now.getDate());

  const currentIndex = relevantPeriods.findIndex((p) => {
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);
    return now >= start && now < end;
  });

  if (currentIndex === -1 || relevantPeriods.length === 0) return;

  const percentX = currentIndex / (relevantPeriods.length - 1);
  const path = document.querySelector("#sun-moon-arc-svg path");
  const pathLength = path.getTotalLength();
  const point = path.getPointAtLength(percentX * pathLength);

  let minY = Infinity;
  let maxY = -Infinity;
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const p = path.getPointAtLength((i / steps) * pathLength);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const percentY = ((point.y - minY) / (maxY - minY)) * 100;

  orb.src = isNight ? "assets/moon.png" : "assets/sun.png";
  orb.className = isNight ? "moon" : "sun";
  orb.style.left = `${(point.x / path.getBBox().width) * 100}%`;
  orb.style.top = `${percentY}%`;
}

// ===== Forecast Buttons =====
function renderForecastButtons() {
  forecastButtons.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const dayIndex = (new Date().getDay() + i) % 7;
    const data = dailyForecast.find(
      (p) => p.isDaytime && new Date(p.startTime).getDay() === dayIndex
    );
    const nightData = dailyForecast.find(
      (p) => !p.isDaytime && new Date(p.startTime).getDay() === dayIndex
    );

    if (!data) continue;

    const btn = document.createElement("button");
    btn.classList.add("forecast-btn");
    if (i === currentDayIndex) btn.classList.add("active");

    const dayName = i === 0 ? "Today" : formatWeekdayShort(data.startTime);

    const dateStr = formatDateShort(data.startTime).toUpperCase();

    const iconName = extractIconName(data.icon);

    btn.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="date secondary">${dateStr}</span>
      <img class="forecast-icon" src="assets/${iconName}-color.svg" alt="Forecast Icon" />
      <span class="temp">${data.temperature}°</span>
      <span class="temp secondary">${
        nightData ? nightData.temperature : "--"
      }°</span>
    `;

    btn.type = "button";

    btn.addEventListener("click", () => {
      currentDayIndex = i;
      renderDay(i);
      document
        .querySelectorAll(".forecast-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });

    forecastButtons.appendChild(btn);
  }
}

document.addEventListener("DOMContentLoaded", init);
