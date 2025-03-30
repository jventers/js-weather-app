// Default fallback location (Missoula, MT)
export const DEFAULT_LOCATION = {
  city: "Missoula",
  state: "MT",
  lat: 46.8721,
  lon: -113.994,
};

// Get the user's geolocation if permitted, otherwise fallback to default.
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(DEFAULT_LOCATION);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          city: "Your City", // Fallback label, will be updated after fetch
          state: "Your State",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => resolve(DEFAULT_LOCATION)
    );
  });
}

/* Fetch both daily and hourly forecast data from the NWS API.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
export async function fetchForecasts(lat, lon) {
  try {
    const pointRes = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`
    );
    const pointData = await pointRes.json();

    const city = pointData.properties.relativeLocation.properties.city;
    const state = pointData.properties.relativeLocation.properties.state;

    const forecastUrl = pointData.properties.forecast;
    const hourlyUrl = pointData.properties.forecastHourly;

    const [forecastRes, hourlyRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(hourlyUrl),
    ]);

    const forecastData = await forecastRes.json();
    const hourlyData = await hourlyRes.json();

    return {
      city,
      state,
      daily: forecastData.properties.periods,
      hourly: hourlyData.properties.periods,
    };
  } catch (error) {
    console.error("Failed to fetch forecast data:", error);
    return null;
  }
}
