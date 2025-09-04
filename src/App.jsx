import { useEffect, useRef, useState } from "react";

const API_KEY = (import.meta.env.VITE_WEATHERAPI_KEY || "").trim();

function buildUrl(city) {
  return `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(
    city
  )}&lang=fa`;
}

function WeatherCard({ data }) {
  if (!data) return null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="place">
            {data.city} <span className="country">({data.country})</span>
          </h2>
          <p className="desc">{data.desc}</p>
        </div>
        {data.icon && <img className="icon" src={data.icon} alt={data.desc} />}
      </div>

      <div className="grid">
        <div className="metric">
          <div className="label">دما</div>
          <div className="value">{data.temp}°</div>
        </div>
        <div className="metric">
          <div className="label">احساس‌شده</div>
          <div className="value">{data.feels}°</div>
        </div>
        <div className="metric">
          <div className="label">رطوبت</div>
          <div className="value">{data.humidity}%</div>
        </div>
        <div className="metric">
          <div className="label">سرعت باد</div>
          <div className="value">{data.wind} km/h</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("Tehran");
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  async function fetchWeather(cityName) {
    if (!API_KEY) {
      setStatus("error");
      setError("No API Key");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(buildUrl(cityName), { signal: controller.signal });
      if (!res.ok) {
        let serverMsg = "";
        try {
          const errJson = await res.json();
          serverMsg = errJson?.error?.message || "";
        } catch {}
        throw new Error(serverMsg || "Server Error !");
      }

      const data = await res.json();

      setWeather({
        city: data.location.name,
        country: data.location.country,
        temp: data.current.temp_c,
        feels: data.current.feelslike_c,
        humidity: data.current.humidity,
        wind: data.current.wind_kph,
        desc: data.current.condition.text,
        icon: "https:" + data.current.condition.icon,
      });

      setStatus("success");
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
      setError(err.message || "There is a problem");
    }
  }

  useEffect(() => {
    fetchWeather(city);
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (!city.trim()) return;
    fetchWeather(city.trim());
  }

  return (
    <div className="container">
      <h1 className="title">هواشناسی با WeatherAPI</h1>

      <form className="search" onSubmit={onSubmit}>
        <input
          className="input"
          type="text"
          placeholder="نام شهر (مثلاً Tehran یا Dezful)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button className="btn" type="submit" disabled={status === "loading"}>
          جستجو
        </button>
      </form>

      {status === "loading" && <div className="info">در حال دریافت...</div>}
      {status === "error" && <div className="error">{error}</div>}
      {status === "success" && <WeatherCard data={weather} />}

      <footer className="footer">
        <span>°C</span>
        <span>•</span>
        <a
          href="https://www.weatherapi.com/"
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          داده‌ها از WeatherAPI.com
        </a>
      </footer>
    </div>
  );
}
