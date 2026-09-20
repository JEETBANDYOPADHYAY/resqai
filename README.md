<div align="center">
<img width="1200" height="475" alt="GHBanner"/>
# ResQAI: AI-Powered Disaster Management & Emergency Response 🚨
*Developed for Smart India Hackathon (SIH)** 
*[🔴 Live Demo: https://resqai-sigma.vercel.app/](https://resqai-sigma.vercel.app/)*
</div>

## 📖 Overview
**ResQAI** is a comprehensive, AI-driven disaster management and emergency response system. Designed to transform crisis management, it unifies real-time data streaming, multimodal AI verification, and advanced geographic routing. In critical moments, ResQAI provides Incident Commanders, National Disaster Response Units, and emergency operations centers with actionable intelligence, real-time telemetry, and safe evacuation paths.

## ✨ Core Features
- **🧠 Multimodal AI Evidence Verification:** Automatically parses and verifies citizen media reports. Powered by Google Gemini, the engine detects genuine disaster markers and assesses damage severity, instantly filtering out false positives or irrelevant media (e.g., domestic animals or intact indoor spaces) before notifying command centers.
- **📡 Real-Time Telemetry & ML Risk Engine:** Continuously ingests and simulates environmental metrics like rainfall, river level surges, wind speed, and lightning strikes. Analyzes these metrics using built-in ML risk classifiers to instantly flag hazard severity.
- **🗺️ Dynamic Safe-Routing (Dijkstra/A*):** Computes optimal evacuation maps and emergency rescue routes dynamically, intelligently avoiding actively blocked road segments and hazard zones flagged by commanders or field units.
- **👮 AI Incident Commander Analytics:** Features a Situational Intelligence Commander that digests active incidents and raw telemetry to generate on-the-fly tactical reports, safety directives, and intelligence briefs for emergency personnel.
- **🏃 Citizen SOS & Dispatch Management:** Empowers citizens to deploy precise SOS beacons while allowing emergency dispatch units to seamlessly manage authenticated incidents, block roads, and assign active rescue personnel via a secure, role-based access protocol.

## 🛠️ Technology Stack
- **Frontend Ecosystem:** React, Tailwind CSS, Framer Motion, Vite
- **Backend Central Engine:** Node.js, Express, TypeScript (TSX)
- **AI Ecosystem:** Google Generative AI (`@google/genai`), Gemini 1.5/Gemini Flash models
- **Routing & Maps:** Geolocation processing algorithms, Dijkstra logic, Google Maps/Leaflet integration.

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** (v18+ recommended)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

Installation Steps
1. **Clone & Install Dependencies**
Navigate into the project directory and run:
   ```bash
   npm install
   ```
2. **Environment Variables**
   Create a `.env.local` (or `.env`) file in the root of your project and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_secret_gemini_api_key_here
   ```
3. **Start the Subsystems**
   Execute the development script:
   ```bash
   npm run dev
   ```
   *This starts the `tsx server.ts` process powering the live backend APIs and frontend assets.*

## 🔒 Security & Access Control
Commander-level dashboards, AI verification limits, and API dispatch endpoints are safeguarded through secure role-based access mechanisms mirroring realistic Emergency Service and NDRF clearances.

---
*Built with ❤️ for Smart India Hackathon. Driving intelligent situational awareness and rapid crisis response when every second counts.*
```
