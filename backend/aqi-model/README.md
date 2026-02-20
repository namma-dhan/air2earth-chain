---
title: Air2Earth AQI Impact Predictor
emoji: 🌍
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: "4.44.1"
python_version: "3.10"
app_file: app.py
pinned: false
---

# Air2Earth — LSTM Backend (AQI Impact Prediction)

Predicts the environmental impact of **trees**, **vertical gardens**, and **air purifiers** using trained LSTM models, served via a Gradio interface (deployable on Hugging Face Spaces).

## Structure

```
backend/
├── app.py                        # Gradio app (3 tabs, JSON responses)
├── requirements.txt              # Python dependencies
├── tree_lstm_train.ipynb         # Training notebook — Tree LSTM
├── garden_lstm_train.ipynb       # Training notebook — Vertical Garden LSTM
├── purifier_lstm_train.ipynb     # Training notebook — Air Purifier LSTM
├── models/                       # Saved model weights + scalers
│   ├── tree_lstm.pth
│   ├── tree_scaler.json
│   ├── garden_lstm.pth
│   ├── garden_scaler.json
│   ├── purifier_lstm.pth
│   └── purifier_scaler.json
└── README.md
```

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Training (run each notebook)

1. Open `tree_lstm_train.ipynb` → Run All → saves `models/tree_lstm.pth` + `models/tree_scaler.json`
2. Open `garden_lstm_train.ipynb` → Run All → saves `models/garden_lstm.pth` + `models/garden_scaler.json`
3. Open `purifier_lstm_train.ipynb` → Run All → saves `models/purifier_lstm.pth` + `models/purifier_scaler.json`

## Run Gradio App

```bash
python app.py
```

Opens at `http://localhost:7860` with three tabs:

| Tab | Inputs | Outputs (JSON) |
|-----|--------|-----------------|
| 🌳 Tree | AQI, PM2.5, Temp, Humidity, Wind | pm25_reduction, pm10_reduction, aqi_improvement, co2_absorbed |
| 🌿 Garden | AQI, PM2.5, Area m², Temp, Humidity | pm25_reduction, pm10_reduction, aqi_improvement, temp_reduction, noise_reduction |
| 💨 Purifier | AQI, PM2.5, Room sqft, Ventilation | pm25_reduction_percent, cadr, coverage_sqft |

## Deploy to Hugging Face Spaces

1. Create a new Space (Gradio SDK)
2. Upload `app.py`, `requirements.txt`, and the `models/` folder
3. The Space will auto-launch the Gradio app
