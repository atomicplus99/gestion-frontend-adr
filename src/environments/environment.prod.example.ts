export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com',
  // Claves de API para servicios externos (usar variables de entorno en producción)
  weatherApiKey: process.env['WEATHER_API_KEY'] || 'your-weather-api-key',
  openWeatherApiKey: process.env['OPENWEATHER_API_KEY'] || 'your-openweather-api-key',
  newsApiKey: process.env['NEWS_API_KEY'] || 'your-news-api-key',

  // APIs gratuitas que no requieren clave
  restCountriesApiUrl: 'https://restcountries.com/v3.1',
  holidaysApiUrl: 'https://date.nager.at/api/v3',
  worldTimeApiUrl: 'https://worldtimeapi.org/api'
};
