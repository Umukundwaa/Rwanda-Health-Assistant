//STATE
let analysis    = null;
let selHospital = null;
let selDoctor   = null;
let userLoc     = null;
let map         = null;
let isAnalyzing = false;
let availTimer  = null;
let MAPBOX_TOKEN = null;

//HELPERS 
const $ = id => document.getElementById(id);

function loading(txt, sub) {
  $('loading').classList.remove('hidden');
  $('ltxt').textContent = txt || 'Processing...';
  $('lsub').textContent = sub || 'Please wait';
}

function doneLoading() {
  $('loading').classList.add('hidden');
}

function showCard(id) {
  $(id).classList.remove('hidden');
  $(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setStep(n) {
  for (let i = 1; i <= 4; i++) {
    const d = $(`dot${i}`);
    d.classList.remove('active', 'done');
    if (i < n) d.classList.add('done');
    if (i === n) d.classList.add('active');
  }
}

function showErr(id, msg) {
  $(id).innerHTML = `<div class="err">⚠️ ${msg}</div>`;
}

function clearErr(id) {
  $(id).innerHTML = '';
}

function setEx(txt) {
  $('symptoms').value = txt;
  $('symptoms').focus();
}

// LOAD MAPBOX TOKEN FROM SERVER
async function loadMapboxToken() {
  if (MAPBOX_TOKEN) return true; 
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    MAPBOX_TOKEN = config.mapboxToken;
    return !!MAPBOX_TOKEN;
  } catch (e) {
    console.error('Failed to load config:', e);
    return false;
  }
}

// ANALYZE SYMPTOMS
async function analyzeSymptoms() {
  if (isAnalyzing) return;

  const symptoms = $('symptoms').value.trim();
  clearErr('err1');

  if (!symptoms || symptoms.length < 3) {
    showErr('err1', 'Please describe your symptoms first.');
    return;
  }

  isAnalyzing = true;
  const btn = document.querySelector('#step1 .btn');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';

  loading('Analyzing your symptoms...', 'Our AI is reviewing what you described');

  try {
    const res = await fetch('/api/analyze-symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms })
    });

    const data = await res.json();
    doneLoading();

    if (!data.success) {
      showErr('err1', data.error || 'Failed to analyze. Please try again.');
      return;
    }

    if (data.warning) {
      showErr('err1', data.warning);
    }

    analysis = data.analysis;
    renderAnalysis(data.analysis);
    showCard('step2');
    setStep(2);

  } catch (e) {
    doneLoading();
    showErr('err1', 'Connection error. Make sure the server is running.');
  } finally {
    isAnalyzing = false;
    btn.disabled = false;
    btn.textContent = 'Analyze My Symptoms →';
  }
}

// RENDER ANALYSIS
function renderAnalysis(a) {
  const icon = a.urgency === 'Emergency' ? '🚨' : a.urgency === 'Urgent' ? '⚠️' : '✅';
  const action = a.urgency === 'Emergency'
    ? 'Go to emergency immediately'
    : a.urgency === 'Urgent'
    ? 'See a doctor today'
    : 'Schedule appointment this week';

  const conds = (a.conditions || ['General condition'])
    .map(c => `<span class="ctag">${c}</span>`).join('');

  $('analysisResult').innerHTML = `
    <div class="agrid">
      <div class="aitem">
        <div class="alabel">Possible Conditions</div>
        <div class="ctags">${conds}</div>
      </div>
      <div class="aitem">
        <div class="alabel">Specialist Needed</div>
        <div class="avalue">🩺 ${a.specialist || 'General Practitioner'}</div>
      </div>
      <div class="aitem">
        <div class="alabel">Urgency Level</div>
        <span class="ubadge u${a.urgency || 'Normal'}">${icon} ${a.urgency || 'Normal'}</span>
      </div>
      <div class="aitem">
        <div class="alabel">Recommended Action</div>
        <div style="font-size:.84rem;color:var(--gray);font-weight:300;margin-top:4px">${action}</div>
      </div>
    </div>
    <div class="advice">💡 ${a.advice || 'Please consult a healthcare professional for proper diagnosis.'}</div>
  `;
}

// FIND HOSPITALS
async function findHospitals() {
  loading('Getting your location...', 'Please allow location access when prompted');

  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    );

    userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    loading('Finding nearby hospitals...', 'Searching hospitals near your location');

    const res = await fetch('/api/find-hospitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialist: analysis?.english_specialist || analysis?.specialist || '',
        userLat: userLoc.lat,
        userLng: userLoc.lng
      })
    });

    const data = await res.json();
    doneLoading();

    if (!data.success) {
      alert('Failed to find hospitals. Please try again.');
      return;
    }

    showCard('step3');
    setStep(3);
    $('hsub').textContent = `Found ${data.hospitals.length} hospitals near you`;

    // Load Mapbox token from server before rendering map
    const tokenLoaded = await loadMapboxToken();
    if (!tokenLoaded) {
      $('map').innerHTML = `
        <div style="padding:24px;text-align:center;color:#ff6b6b;background:rgba(255,77,109,.07);border-radius:12px;">
          ⚠️ Map unavailable — Mapbox token missing in server .env file.
        </div>`;
    } else {
      renderMap(data.hospitals);
    }

    renderHospitals(data.hospitals);

  } catch (e) {
    doneLoading();
    if (e.code === 1) {
      alert('Location access denied. Please allow location and try again.');
    } else {
      alert('Could not get your location. Please try again.');
    }
  }
}

// RENDER MAP
function renderMap(hospitals) {
  if (map) { map.remove(); map = null; }
  $('map').innerHTML = '';

  try {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [userLoc.lng, userLoc.lat],
      zoom: 12
    });

    map.on('error', (e) => {
      console.error('Mapbox error:', e);
      $('map').innerHTML = `
        <div style="padding:24px;text-align:center;color:#ff6b6b;">
          ⚠️ Map failed to load. Check your Mapbox token in .env<br/>
          <small>${e.error?.message || ''}</small>
        </div>`;
    });

    map.on('load', () => {
      // User location marker
      new mapboxgl.Marker({ color: '#00C48C' })
        .setLngLat([userLoc.lng, userLoc.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 Your Location</strong>'))
        .addTo(map);

      // Hospital markers
      hospitals.forEach(h => {
        new mapboxgl.Marker({ color: '#FF4D6D' })
          .setLngLat([h.location.lng, h.location.lat])
          .setPopup(new mapboxgl.Popup().setHTML(
            `<strong>${h.name}</strong><br/><small>${h.distance} km away</small>`
          ))
          .addTo(map);
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Fit map to show all markers
      if (hospitals.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userLoc.lng, userLoc.lat]);
        hospitals.forEach(h => bounds.extend([h.location.lng, h.location.lat]));
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    });

  } catch (err) {
    console.error('Map init error:', err);
    $('map').innerHTML = `
      <div style="padding:24px;text-align:center;color:#ff6b6b;">
        ⚠️ Map initialization failed: ${err.message}
      </div>`;
  }
}

//RENDER HOSPITALS 
function renderHospitals(hospitals) {
  if (!hospitals.length) {
    $('hospitalList').innerHTML = '<div class="nodoc">No hospitals found near your location.</div>';
    return;
  }

  $('hospitalList').innerHTML = hospitals.map((h, i) => {
    const docs = h.doctors?.length
      ? h.doctors.map(d => {
          const fullyBooked = d.bookedAppointments >= d.maxAppointments;
          const slotsLeft   = d.maxAppointments - d.bookedAppointments;
          const statusClass = fullyBooked ? 'no' : 'yes';
          const statusText  = fullyBooked ? 'Fully Booked' : `Available (${slotsLeft} slots)`;

          return `
            <div class="ditem"
              data-hospital="${escQ(h.name)}"
              data-doctor="${escQ(d.name)}"
              data-specialty="${escQ(d.specialty)}"
              data-available="${!fullyBooked}"
              data-hours="${escQ(JSON.stringify(d.workingHours))}"
              data-days="${escQ(d.workingDays.join(','))}"
              onclick="pickDoctor(event)">
              <div class="dinfo">
                <div class="davatar">👨‍⚕️</div>
                <div>
                  <div class="dname">${d.name}</div>
                  <div class="dspec">${d.specialty}</div>
                  <div class="dhours">🕐 ${d.workingHours.start} – ${d.workingHours.end}</div>
                  <div class="ddays">📅 ${d.workingDays.join(', ')}</div>
                </div>
              </div>
              <div class="avail ${statusClass}">
                <div class="adot"></div>
                ${statusText}
              </div>
            </div>`;
        }).join('')
      : `<div class="nodoc">📞 Call ahead to confirm availability: ${h.phone}</div>`;

    return `
      <div class="hcard" id="hc-${i}"
        onclick="pickHospital(event,${i},'${escQ(h.name)}','${escQ(h.address)}','${escQ(h.phone)}')">
        <div class="hhdr">
          <div>
            <div class="hname">🏥 ${h.name}</div>
            <div class="haddr">${h.address}</div>
            <div class="haddr" style="margin-top:3px">📞 ${h.phone}</div>
          </div>
          ${h.distance ? `<div class="dbadge">${h.distance} km</div>` : ''}
        </div>
        ${h.doctors?.length ? `<div class="dtitle">Doctors</div>${docs}` : docs}
      </div>`;
  }).join('');
}

function escQ(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// PICK HOSPITAL
function pickHospital(e, i, name, address, phone) {
  if (e.target.closest('.ditem')) return;
  document.querySelectorAll('.hcard').forEach(c => c.classList.remove('selected'));
  $(`hc-${i}`).classList.add('selected');
  selHospital = { name, address, phone };
  updateSelInfo();
}

// PICK DOCTOR
function pickDoctor(e) {
  e.stopPropagation();

  const el       = e.currentTarget;
  const hname    = el.dataset.hospital;
  const dname    = el.dataset.doctor;
  const spec     = el.dataset.specialty;
  const available = el.dataset.available === 'true';
  const hoursJson = el.dataset.hours;
  const daysStr   = el.dataset.days;

  if (!available) {
    alert(`${dname} is fully booked. Please choose another doctor.`);
    return;
  }

  document.querySelectorAll('.ditem').forEach(d => d.classList.remove('sel'));
  el.classList.add('sel');

  let workingHours = { start: '08:00', end: '17:00' };
  try { workingHours = JSON.parse(hoursJson); } catch (err) {}
  const workingDays = daysStr.split(',');

  selDoctor = { name: dname, specialty: spec, workingHours, workingDays };
  if (!selHospital) selHospital = { name: hname };

  updateSelInfo();
  showDocHours(workingHours, workingDays);

  $('ptime').min          = workingHours.start;
  $('ptime').max          = workingHours.end;
  $('availResult').innerHTML = '';
  $('bookBtn').disabled   = false;

  setTimeout(() => {
    showCard('step4');
    setStep(4);
  }, 300);
}

// SHOW DOCTOR HOURS
function showDocHours(hours, days) {
  const el = $('docHours');
  el.style.display = 'block';
  el.innerHTML = `
    <div class="hours-box">
      <div class="hours-title">🕐 Doctor's Working Schedule</div>
      <div class="hours-detail">
        <span>⏰ Hours: <strong>${hours.start} – ${hours.end}</strong></span>
        <span>📅 Days: <strong>${days.join(', ')}</strong></span>
      </div>
      <div class="hours-note">Please select a date and time within this schedule</div>
    </div>
  `;
}

// UPDATE SELECTED INFO
function updateSelInfo() {
  const el = $('selinfo');
  if (!selHospital && !selDoctor) return;
  el.style.display = 'block';
  el.innerHTML = `
    ${selHospital ? `<div>🏥 <strong>Hospital:</strong> ${selHospital.name}</div>`   : ''}
    ${selDoctor   ? `<div>👨‍⚕️ <strong>Doctor:</strong> ${selDoctor.name}</div>`    : ''}
    ${selDoctor   ? `<div>🩺 <strong>Specialty:</strong> ${selDoctor.specialty}</div>` : ''}
  `;
}

// CHECK AVAILABILITY
function checkAvailability() {
  clearTimeout(availTimer);
  availTimer = setTimeout(_doCheckAvailability, 600);
}

async function _doCheckAvailability() {
  if (!selDoctor || !selHospital) return;
  const date = $('pdate').value;
  const time = $('ptime').value;
  if (!date) return;

  try {
    const res = await fetch('/api/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalName: selHospital.name,
        doctorName:   selDoctor.name,
        date,
        time
      })
    });

    const data = await res.json();
    const el   = $('availResult');

    if (data.available) {
      el.innerHTML = `
        <div class="avail-ok">
          ✅ ${selDoctor.name} is available on this date and time
          ${data.slotsRemaining ? `· ${data.slotsRemaining} slots remaining` : ''}
        </div>`;
      $('bookBtn').disabled = false;
    } else {
      el.innerHTML = `
        <div class="avail-no">
          ❌ Not available: ${data.reason}
          ${data.workingHours ? `<br/>Working hours: ${data.workingHours.start} – ${data.workingHours.end}` : ''}
          ${data.workingDays  ? `<br/>Working days: ${data.workingDays.join(', ')}` : ''}
        </div>`;
      $('bookBtn').disabled = true;
    }
  } catch (err) {
    console.error('Availability check error:', err);
  }
}

// BOOK APPOINTMENT
async function bookAppointment() {
  clearErr('err4');
  const name  = $('pname').value.trim();
  const phone = $('pphone').value.trim();
  const date  = $('pdate').value;
  const time  = $('ptime').value;

  if (!name)        { showErr('err4', 'Please enter your full name.');    return; }
  if (!phone)       { showErr('err4', 'Please enter your phone number.'); return; }
  if (!date)        { showErr('err4', 'Please select a date.');           return; }
  if (!time)        { showErr('err4', 'Please select a time.');           return; }
  if (!selHospital) { showErr('err4', 'Please select a hospital first.'); return; }

  $('bookBtn').disabled = true;
  loading('Booking your appointment...', 'Sending SMS confirmation to your phone');

  try {
    const res = await fetch('/api/book-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName:  name,
        phone,
        doctorName:   selDoctor?.name   || 'To be assigned',
        hospitalName: selHospital.name,
        specialty:    selDoctor?.specialty || analysis?.specialist || 'General Medicine',
        date,
        time
      })
    });

    const data = await res.json();
    doneLoading();

    if (data.success || data.booked) {
      $('smsg').textContent =
        `Your appointment at ${selHospital.name} on ${date} at ${time} is confirmed. SMS sent to ${phone}.`;
      showCard('step5');
    } else {
      showErr('err4', data.error || 'Booking failed. Please try again.');
      $('bookBtn').disabled = false;
    }

  } catch (err) {
    doneLoading();
    showErr('err4', 'Connection error. Please try again.');
    $('bookBtn').disabled = false;
  }
}

//RESET
function resetApp() {
  analysis    = null;
  selHospital = null;
  selDoctor   = null;
  userLoc     = null;
  isAnalyzing = false;
  clearTimeout(availTimer);

  $('symptoms').value            = '';
  $('pname').value               = '';
  $('pphone').value              = '';
  $('pdate').value               = '';
  $('ptime').value               = '';
  $('analysisResult').innerHTML  = '';
  $('hospitalList').innerHTML    = '';
  $('selinfo').style.display     = 'none';
  $('selinfo').innerHTML         = '';
  $('docHours').style.display    = 'none';
  $('docHours').innerHTML        = '';
  $('availResult').innerHTML     = '';
  $('bookBtn').disabled          = false;

  const btn = document.querySelector('#step1 .btn');
  btn.disabled    = false;
  btn.textContent = 'Analyze My Symptoms →';

  clearErr('err1');
  clearErr('err4');
  ['step2', 'step3', 'step4', 'step5'].forEach(id => $(id).classList.add('hidden'));
  setStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

//SET MIN DATE
document.addEventListener('DOMContentLoaded', () => {
  $('pdate').min = new Date().toISOString().split('T')[0];
});
