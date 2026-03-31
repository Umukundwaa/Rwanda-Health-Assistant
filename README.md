# 🏥 Rwanda Health Assistant

## 📌 Project Overview

Rwanda Health Assistant is a web-based application designed to help users analyze their symptoms and find appropriate healthcare services nearby.

The system uses Artificial Intelligence and external APIs to:

* Interpret user symptoms in multiple languages
* Suggest possible medical conditions
* Recommend the appropriate specialist
* Locate nearby hospitals
* Enable appointment booking with SMS confirmation

---

## 🌐 Live Application

The application has been successfully deployed and is accessible online:

👉 **Main URL:** https://umukundwa.tech
👉 **Alternative URL:** https://www.umukundwa.tech

### 🔗 Infrastructure Access (For Evaluation)

* **Web01:** 44.211.147.102
* **Web02:** 35.174.154.227
* **Load Balancer (Lb01):** 54.145.134.205

---

## 🎯 Purpose and Value

Accessing the right healthcare service can be challenging, especially when patients are unsure about:

* What condition they might have
* Which specialist they should consult
* Where to find the right hospital

This application solves that problem by providing:

* Intelligent symptom analysis
* Clear medical guidance
* Easy access to nearby hospitals and doctors

👉 This makes the application practical, meaningful, and valuable in real-life situations.

---

## 🚀 Features

* 🧠 AI-powered symptom analysis
* 🌍 Multi-language support (English, Kinyarwanda, French, Kiswahili)
* 🏥 Nearby hospital search using location
* 👨‍⚕️ Doctor filtering by specialty
* 📱 SMS confirmation for appointments
* ⚠️ Strong error handling system
* 🔍 User-friendly interface

---

## 🔄 API Selection Decision 

Initially, the project used the **Groq API** for symptom analysis. However:

* It did not handle **Kinyarwanda language accurately**
* Responses were unclear or inconsistent

### ✅ Solution: Switched to Gemini API

The project was improved by switching to the **Gemini API**, because:

* It provides **better multilingual understanding**
* It supports **Kinyarwanda effectively**
* It produces **clear and structured outputs**
* It improves overall **user experience and reliability**

---

## 🛠️ Technologies Used

### Backend

* Node.js
* Express.js

### Frontend

* HTML
* CSS
* JavaScript

### APIs

* **Gemini API** → Symptom analysis
* **Mapbox API** → Hospital location services
* **Africa's Talking API** → SMS notifications

---

## ⚙️ Installation & Local Setup

### 1. Clone the repository

```bash id="yplzv3"
git clone https://github.com/Umukundwaa/Rwanda-Health-Assistant.git
cd Rwanda-Health-Assistant
```

### 2. Install dependencies

```bash id="l5j2qb"
npm install
```

### 3. Create `.env` file

```env id="1lq4o1"
GEMINI_API_KEY=your_gemini_api_key
MAPBOX_TOKEN=your_mapbox_token
AT_API_KEY=your_africas_talking_api_key
AT_USERNAME=your_username
PORT=3000
```

### 4. Run locally

```bash id="uzs3c1"
node server.js
```

### 5. Access locally

```
http://localhost:3000
```

---

## 🌐 Deployment (Production Setup)

### 🖥️ Step 1: Server Preparation (Web01 & Web02)

SSH into each server:

```bash id="k1o5l9"
ssh ubuntu@44.211.147.102   # Web01
ssh ubuntu@35.174.154.227   # Web02
```

Update system:

```bash id="l9r4zn"
sudo apt update && sudo apt upgrade -y
```

Install Node.js:

```bash id="ny9g2k"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

### 📦 Step 2: Upload Project

```bash id="4kq2mf"
git clone https://github.com/Umukundwaa/Rwanda-Health-Assistant.git
cd Rwanda-Health-Assistant.git
npm install
```

Create `.env` file:

```bash id="q0m3xy"
nano .env
```

Add:

```
GEMINI_API_KEY=your_key
MAPBOX_TOKEN=your_key
AT_API_KEY=your_key
AT_USERNAME=your_username
PORT=3000
```

---

### ▶️ Step 3: Run Application

```bash id="0l3q2e"
node server.js
```

(Optional: Use PM2 for production)

```bash id="lbnw8x"
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

---

### ⚖️ Step 4: Load Balancer Setup (Lb01)

SSH into load balancer:

```bash id="o7yt3c"
ssh ubuntu@54.145.134.205
```

Install Nginx:

```bash id="k9h1rq"
sudo apt install nginx -y
```

Configure:

```bash id="h1gq0t"
sudo nano /etc/nginx/sites-available/default
```

Add:

```nginx id="rm6q2a"
upstream health_app {
    server 44.211.147.102:3000;
    server 35.174.154.227:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://health_app;
    }
}
```

Restart Nginx:

```bash id="h9t2x1"
sudo systemctl restart nginx
```

---

### 🌍 Step 5: Domain Configuration

* Domain: **umukundwa.tech**
* DNS configured to point to:
  👉 **54.145.134.205 (Load Balancer)**

---

### ✅ Step 6: Testing

* Open: http://umukundwa.tech
* Refresh multiple times
* Confirm requests are handled by both servers

---

## ⚠️ Error Handling

The system handles:

* Missing inputs
* API failures
* Invalid AI responses
* JSON parsing issues

👉 Ensures stable and user-friendly experience.

---

## 🔐 Security

* API keys stored in `.env`
* `.env` ignored via `.gitignore`
* No sensitive data exposed

---

## 📊 User Interaction

Users can:

* Enter symptoms in any language
* Receive AI analysis
* View hospitals sorted by distance
* Filter doctors by specialty
* Book appointments

---

## 🎥 Demo Video

https://your-video-link.com

---

## ⚡ Challenges and Solutions

### Challenges

* Poor Kinyarwanda support (Groq API)
* AI response inconsistencies
* API debugging
* Deployment complexity

### Solutions

* Switched to Gemini API
* Added JSON validation
* Improved logging
* Implemented load balancing

---

## 📚 Credits

* Gemini API (Google AI)
* Mapbox API
* Africa's Talking API

---

## 👩‍💻 Author

**Ange Umukundwa**
ALU Student
Aspiring Cybersecurity Professional

---

## 📄 License

This project is developed for academic purposes.
