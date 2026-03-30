require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const AfricasTalking = require('africastalking');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

//Initialize Africa's Talking
const AT = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME || 'sandbox'
});
const sms = AT.SMS;

const activeRequests = new Set();

//HOSPITALS DATABASE
const hospitals = [
  {
    id: 1,
    name: 'CHUK - University Teaching Hospital',
    address: 'KN 4 Ave, Kigali',
    phone: '+250788000001',
    location: { lat: -1.9441, lng: 30.0619 },
    specialties: ['Cardiology', 'Neurology', 'Pediatrics', 'Emergency', 'General Medicine', 'Orthopedics', 'Surgery'],
    doctors: [
      {
        name: 'Dr. Jean Mugisha',
        specialty: 'Cardiology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '13:00' },
        maxAppointments: 10,
        bookedAppointments: 4
      },
      {
        name: 'Dr. Yvonne Uwase',
        specialty: 'Cardiology',
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '14:00', end: '18:00' },
        maxAppointments: 8,
        bookedAppointments: 8
      },
      {
        name: 'Dr. Patrick Nkurunziza',
        specialty: 'Neurology',
        workingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '14:00' },
        maxAppointments: 8,
        bookedAppointments: 3
      },
      {
        name: 'Dr. Aline Mukamana',
        specialty: 'Pediatrics',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '12:00' },
        maxAppointments: 12,
        bookedAppointments: 5
      },
      {
        name: 'Dr. Eric Habimana',
        specialty: 'Emergency',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        workingHours: { start: '00:00', end: '23:59' },
        maxAppointments: 20,
        bookedAppointments: 6
      },
      {
        name: 'Dr. Claire Ineza',
        specialty: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '17:00' },
        maxAppointments: 15,
        bookedAppointments: 7
      }
    ]
  },
  {
    id: 2,
    name: 'King Faisal Hospital',
    address: 'KG 544 St, Kigali',
    phone: '+250788000002',
    location: { lat: -1.9355, lng: 30.0928 },
    specialties: ['Cardiology', 'Oncology', 'General Medicine', 'Surgery', 'Dermatology', 'Neurology'],
    doctors: [
      {
        name: 'Dr. Alice Niyomugabo',
        specialty: 'Cardiology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '14:00' },
        maxAppointments: 10,
        bookedAppointments: 5
      },
      {
        name: 'Dr. Robert Hakizimana',
        specialty: 'Oncology',
        workingDays: ['Tuesday', 'Thursday'],
        workingHours: { start: '09:00', end: '16:00' },
        maxAppointments: 6,
        bookedAppointments: 6
      },
      {
        name: 'Dr. Grace Mutesi',
        specialty: 'Surgery',
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '07:00', end: '15:00' },
        maxAppointments: 5,
        bookedAppointments: 2
      },
      {
        name: 'Dr. Paul Ndayisaba',
        specialty: 'Dermatology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '10:00', end: '17:00' },
        maxAppointments: 12,
        bookedAppointments: 4
      },
      {
        name: 'Dr. Diane Ingabire',
        specialty: 'Neurology',
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '08:00', end: '13:00' },
        maxAppointments: 8,
        bookedAppointments: 3
      }
    ]
  },
  {
    id: 3,
    name: 'Kibagabaga District Hospital',
    address: 'KG 32 Ave, Kigali',
    phone: '+250788000003',
    location: { lat: -1.9167, lng: 30.1000 },
    specialties: ['General Medicine', 'Emergency', 'Pediatrics', 'Surgery', 'Gynecology'],
    doctors: [
      {
        name: 'Dr. Emmanuel Nzabonimana',
        specialty: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '16:00' },
        maxAppointments: 15,
        bookedAppointments: 6
      },
      {
        name: 'Dr. Solange Mukandoli',
        specialty: 'Surgery',
        workingDays: ['Monday', 'Tuesday', 'Thursday'],
        workingHours: { start: '07:00', end: '14:00' },
        maxAppointments: 5,
        bookedAppointments: 3
      },
      {
        name: 'Dr. Felix Nshimiyimana',
        specialty: 'Pediatrics',
        workingDays: ['Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '15:00' },
        maxAppointments: 10,
        bookedAppointments: 10
      },
      {
        name: 'Dr. Vestine Uwera',
        specialty: 'Gynecology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '13:00' },
        maxAppointments: 8,
        bookedAppointments: 2
      }
    ]
  },
  {
    id: 4,
    name: 'Masaka District Hospital',
    address: 'Masaka, Kicukiro, Kigali',
    phone: '+250788000004',
    location: { lat: -1.9833, lng: 30.0833 },
    specialties: ['General Medicine', 'Emergency', 'Gynecology', 'Pediatrics'],
    doctors: [
      {
        name: 'Dr. Innocent Habimana',
        specialty: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '17:00' },
        maxAppointments: 15,
        bookedAppointments: 4
      },
      {
        name: 'Dr. Claudine Nyiraneza',
        specialty: 'Gynecology',
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '09:00', end: '14:00' },
        maxAppointments: 8,
        bookedAppointments: 3
      },
      {
        name: 'Dr. Thierry Niyonzima',
        specialty: 'Pediatrics',
        workingDays: ['Tuesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '13:00' },
        maxAppointments: 10,
        bookedAppointments: 5
      }
    ]
  },
  {
    id: 5,
    name: 'Rwanda Military Hospital',
    address: 'KK 15 Rd, Kigali',
    phone: '+250788000005',
    location: { lat: -1.9500, lng: 30.0588 },
    specialties: ['General Medicine', 'Surgery', 'Emergency', 'Orthopedics', 'Cardiology'],
    doctors: [
      {
        name: 'Dr. Marie Uwimana',
        specialty: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '08:00', end: '16:00' },
        maxAppointments: 15,
        bookedAppointments: 5
      },
      {
        name: 'Dr. Claude Bizimana',
        specialty: 'Surgery',
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingHours: { start: '07:00', end: '14:00' },
        maxAppointments: 5,
        bookedAppointments: 5
      },
      {
        name: 'Dr. Janvier Nsengimana',
        specialty: 'Orthopedics',
        workingDays: ['Tuesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '15:00' },
        maxAppointments: 8,
        bookedAppointments: 3
      }
    ]
  }
];

// Known hospitals for doctor matching
const knownHospitals = {
  'CHUK': hospitals[0],
  'King Faisal': hospitals[1],
  'Kibagabaga': hospitals[2],
  'Masaka': hospitals[3],
  'Military': hospitals[4]
};

// HELPER FUNCTIONS
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isDoctorAvailable(doctor, requestedDate, requestedTime) {
  if (doctor.bookedAppointments >= doctor.maxAppointments) {
    return { available: false, reason: 'Fully booked' };
  }
  if (requestedDate) {
    const date = new Date(requestedDate);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctor.workingDays.includes(dayName)) {
      return { available: false, reason: `Not working on ${dayName}` };
    }
    if (requestedTime) {
      const [reqHour, reqMin] = requestedTime.split(':').map(Number);
      const [startHour, startMin] = doctor.workingHours.start.split(':').map(Number);
      const [endHour, endMin] = doctor.workingHours.end.split(':').map(Number);
      const reqMinutes = reqHour * 60 + reqMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      if (reqMinutes < startMinutes || reqMinutes > endMinutes) {
        return {
          available: false,
          reason: `Works ${doctor.workingHours.start}–${doctor.workingHours.end} only`
        };
      }
    }
  }
  return { available: true, reason: 'Available' };
}

function getFallbackHospitals(userLat, userLng, specialist) {
  let results = hospitals.map(h => ({
    ...h,
    distance: calculateDistance(userLat, userLng, h.location.lat, h.location.lng).toFixed(1)
  }));
  if (specialist) {
    const filtered = results.filter(h =>
      h.specialties.some(s =>
        s.toLowerCase().includes(specialist.toLowerCase()) ||
        specialist.toLowerCase().includes(s.toLowerCase())
      )
    );
    if (filtered.length > 0) results = filtered;
  }
  return results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
}

function matchDoctors(name, specialist) {
  const knownKey = Object.keys(knownHospitals).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(name.toLowerCase())
  );
  const knownData = knownKey ? knownHospitals[knownKey] : null;
  if (!knownData) return { doctors: [], phone: null };
  let doctors = knownData.doctors;
  if (specialist) {
    const filtered = doctors.filter(d =>
      d.specialty.toLowerCase().includes(specialist.toLowerCase()) ||
      specialist.toLowerCase().includes(d.specialty.toLowerCase())
    );
    if (filtered.length > 0) doctors = filtered;
  }
  return { doctors, phone: knownData.phone };
}

function defaultAnalysis() {
  return {
    conditions: ['General condition'],
    specialist: 'General Practitioner',
    urgency: 'Normal',
    advice: 'Nyamuneka baza muganga kugira ngo uhabwe isuzuma ryiza.',
    english_specialist: 'General Practitioner'
  };
}

// Retry helper for Gemini rate limits
async function callGeminiWithRetry(prompt, retries = 2, delayMs = 5000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const is429 = err.message && err.message.includes('429');
      if (is429 && attempt < retries) {
        console.warn(`⚠️  Rate limited. Retrying in ${delayMs / 1000}s... (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
}

//ROUTES

// Get configuration
app.get('/api/config', (req, res) => {
  res.json({
    mapboxToken: process.env.MAPBOX_TOKEN || '',
    hasMapboxToken: !!(process.env.MAPBOX_TOKEN && process.env.MAPBOX_TOKEN.length > 20)
  });
});

// Analyze Symptoms
app.post('/api/analyze-symptoms', async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || symptoms.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Symptoms are required.' });
  }


  const key = symptoms.trim().toLowerCase();
  if (activeRequests.has(key)) {
    console.log('⛔ Duplicate request blocked:', key.slice(0, 40));
    return res.status(429).json({ success: false, error: 'Request already in progress. Please wait.' });
  }

  activeRequests.add(key);
  console.log('✅ Analyze called at:', new Date().toISOString(), '| symptoms:', key.slice(0, 60));

  try {
    const prompt = `You are a helpful medical assistant for Rwanda.
The patient may write in Kinyarwanda, English, or French.
Detect the language they used and respond in that SAME language.
Analyze their symptoms carefully.

Respond with ONLY a raw JSON object — no markdown, no extra text, just JSON:
{
  "conditions": ["condition1", "condition2"],
  "specialist": "specialist name in patient's language",
  "urgency": "Emergency or Urgent or Normal",
  "advice": "helpful advice in the SAME language the patient used",
  "english_specialist": "specialist name in English"
}

Patient symptoms: ${symptoms}`;

    const raw = await callGeminiWithRetry(prompt);
    const match = raw.match(/\{[\s\S]*\}/);

    let analysis;
    if (match) {
      try { analysis = JSON.parse(match[0]); }
      catch (e) { analysis = defaultAnalysis(); }
    } else {
      analysis = defaultAnalysis();
    }

    res.json({ success: true, analysis });

  } catch (error) {
    console.error('Gemini Error:', error.message);

    
    if (error.message && error.message.includes('429')) {
      return res.json({ success: true, analysis: defaultAnalysis(), warning: 'AI quota reached. Showing default analysis.' });
    }

    res.status(500).json({ success: false, error: 'Failed to analyze symptoms. Check your GEMINI_API_KEY.' });
  } finally {
    activeRequests.delete(key);
  }
});

// Find Hospitals
app.post('/api/find-hospitals', async (req, res) => {
  const { specialist, userLat, userLng } = req.body;

  if (!userLat || !userLng) {
    return res.status(400).json({ success: false, error: 'Location is required.' });
  }

  try {
    const response = await axios.get(
      'https://api.mapbox.com/search/searchbox/v1/category/hospital',
      {
        params: {
          access_token: process.env.MAPBOX_TOKEN,
          proximity: `${userLng},${userLat}`,
          limit: 10,
          language: 'en',
          country: 'RW'
        }
      }
    );

    const features = response.data?.features || [];

    if (features.length === 0) {
      return res.json({ success: true, hospitals: getFallbackHospitals(userLat, userLng, specialist) });
    }

    const results = features.map(feature => {
      const name = feature.properties?.name || 'Hospital';
      const [lng, lat] = feature.geometry.coordinates;
      const distance = calculateDistance(userLat, userLng, lat, lng).toFixed(1);
      const address = feature.properties?.full_address || feature.properties?.place_formatted || 'Rwanda';
      const { doctors, phone } = matchDoctors(name, specialist);
      return {
        name, address,
        location: { lat, lng },
        phone: phone || 'Call hospital directly',
        distance, doctors,
        isKnown: doctors.length > 0
      };
    });

    results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    res.json({ success: true, hospitals: results });

  } catch (error) {
    console.error('Mapbox error:', error.message);
    res.json({ success: true, hospitals: getFallbackHospitals(userLat, userLng, specialist) });
  }
});

// Check Doctor Availability
app.post('/api/check-availability', (req, res) => {
  const { hospitalName, doctorName, date, time } = req.body;

  if (!hospitalName || !doctorName || !date) {
    return res.status(400).json({ success: false, error: 'Hospital, doctor and date required.' });
  }

  const hospital = hospitals.find(h =>
    h.name.toLowerCase().includes(hospitalName.toLowerCase()) ||
    hospitalName.toLowerCase().includes(h.name.toLowerCase())
  );

  if (!hospital) {
    return res.json({ success: true, available: true, reason: 'Call hospital to confirm.' });
  }

  const doctor = hospital.doctors.find(d =>
    d.name.toLowerCase() === doctorName.toLowerCase()
  );

  if (!doctor) {
    return res.json({ success: true, available: false, reason: 'Doctor not found.' });
  }

  const result = isDoctorAvailable(doctor, date, time);
  res.json({
    success: true,
    available: result.available,
    reason: result.reason,
    workingHours: doctor.workingHours,
    workingDays: doctor.workingDays,
    slotsRemaining: doctor.maxAppointments - doctor.bookedAppointments
  });
});

// Book Appointment
app.post('/api/book-appointment', async (req, res) => {
  const { patientName, phone, doctorName, hospitalName, specialty, date, time } = req.body;

  if (!patientName || !phone || !hospitalName) {
    return res.status(400).json({ success: false, error: 'Name, phone and hospital are required.' });
  }

  if (doctorName && date) {
    const hospital = hospitals.find(h =>
      h.name.toLowerCase().includes(hospitalName.toLowerCase()) ||
      hospitalName.toLowerCase().includes(h.name.toLowerCase())
    );
    if (hospital) {
      const doctor = hospital.doctors.find(d =>
        d.name.toLowerCase() === doctorName.toLowerCase()
      );
      if (doctor) {
        const result = isDoctorAvailable(doctor, date, time);
        if (!result.available) {
          return res.status(400).json({ success: false, error: `Cannot book: ${result.reason}` });
        }
        doctor.bookedAppointments += 1;
      }
    }
  }

  const timeStr = time ? ` at ${time}` : '';
  const message = `Hello ${patientName}! Your appointment is confirmed.\nHospital: ${hospitalName}\nDoctor: ${doctorName || 'To be assigned'}\nSpecialty: ${specialty || 'General Medicine'}\nDate: ${date}${timeStr}\nPlease arrive 15 mins early.\n- Rwanda Health Assistant`;

  try {
    await sms.send({ to: [phone], message });
    res.json({ success: true, message: 'Appointment booked! SMS sent to your phone.' });
  } catch (error) {
    console.error('SMS Error:', error.message);
    res.json({ success: true, booked: true, message: 'Appointment booked! SMS will be delivered shortly.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Rwanda Health Assistant running on http://localhost:${PORT}`);
  console.log(`🔑 Gemini API key: ${process.env.GEMINI_API_KEY ? 'Loaded ✓' : '❌ MISSING — check .env'}`);
  console.log(`📱 Africa's Talking: ${process.env.AT_API_KEY ? 'Loaded ✓' : '❌ MISSING — check .env'}`);
  console.log(`🗺️  Mapbox token: ${process.env.MAPBOX_TOKEN ? 'Loaded ✓' : '❌ MISSING — check .env'}`);
});
