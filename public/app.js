const testBtn = document.getElementById('testApi');
const result = document.getElementById('apiResult');

if (testBtn) {
  testBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      result.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      result.textContent = 'Error: ' + err.message;
    }
  });
}
const form = document.getElementById('bookingForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    pickup: form.pickup.value,
    drop: form.drop.value,
    datetime: form.datetime.value,
    passengers: form.passengers.value,
    name: form.name.value,
    phone: form.phone.value,
    email: form.email.value
  };

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (data.success) {
      // Redirect to confirmation page with query params
      const query = new URLSearchParams(formData).toString();
      window.location.href = `/confirmation.html?${query}`;
    } else {
      alert('Booking failed: ' + data.error);
    }
  } catch (err) {
    alert('Booking error: ' + err.message);
  }
});

