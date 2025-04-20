import React, { useRef, useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

  const startDrawing = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const draw = (e) => {
      if (!canvas || !ctx) return;

      let x, y;
      if (e.touches) {
        e.preventDefault();
        x = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        y = e.touches[0].clientY - canvas.getBoundingClientRect().top;
      } else {
        x = e.offsetX;
        y = e.offsetY;
      }

      ctx.lineTo(x, y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const stopDrawing = () => {
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("touchmove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      window.removeEventListener("touchend", stopDrawing);
    };

    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("touchmove", draw, { passive: false });
    window.addEventListener("mouseup", stopDrawing);
    window.addEventListener("touchend", stopDrawing);
  };

  const handleMouseDown = (e) => {
    startDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const x = touch.clientX - canvas.getBoundingClientRect().left;
    const y = touch.clientY - canvas.getBoundingClientRect().top;
    startDrawing(x, y);
  };

  const predictDigit = async () => {
    setIsLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL("image/png");
      console.log("Making request to:", API_URL);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify({ image: dataURL }),
      });

      if (!response.ok) {
        console.error("Server responded with error:", response.status);
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result.prediction);
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Failed to get prediction. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-container">
        <h1>Digit Recognition</h1>
        <p className="subtitle">
          Draw any digit from 0-9 in the box below and let AI recognize it
        </p>

        <div className="card">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="canvas"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: "none" }}
          />

          <div className="button-container">
            <button
              className="predict-button"
              onClick={predictDigit}
              disabled={isLoading}
            >
              <span className="icon">✨</span>
              {isLoading ? "Predicting..." : "Predict"}
            </button>

            <button className="clear-button" onClick={clearCanvas}>
              <span className="icon">↻</span>
              Clear
            </button>
          </div>
        </div>

        {prediction !== null && (
          <div className="prediction-result">
            <h2>Prediction Result</h2>
            <div className="prediction-digit">{prediction}</div>
          </div>
        )}
      </div>
    </div>
  );
}
