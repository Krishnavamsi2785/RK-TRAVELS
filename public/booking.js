document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const statusForm = document.getElementById('statusForm');
    const confirmationDiv = document.getElementById('confirmation');
    const statusResultDiv = document.getElementById('statusResult');

    // --- Booking Form Submission ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('https://rk-travels.onrender.com/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (result.success) {
                    const booking = result.booking;
                    const params = new URLSearchParams({
                        pickup: booking.pickup,
                        drop: booking.drop,
                        datetime: booking.dateTime,
                        passengers: booking.passengers,
                        name: booking.name,
                        phone: booking.phone,
                        email: booking.email,
                        id: booking._id
                    }).toString();

                    window.location.href = `confirmation.html?${params}`;

                } else {
                    confirmationDiv.innerHTML = `<p style="color:red; text-align:center">❌ Error: ${result.error}</p>`;
                }
            } catch (err) {
                confirmationDiv.innerHTML = `<p style="color:red; text-align:center">❌ Error: ${err.message}</p>`;
            }
        });
    }

    // --- Status Check Form Submission ---
    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookingId = document.getElementById('bookingId').value;
            
            statusResultDiv.innerHTML = `<p>Checking status...</p>`;

            try {
                const res = await fetch(`https://rk-travels.onrender.com/api/bookings/${bookingId}`);
                const result = await res.json();
                
                if (result.success && result.booking) {
                    const booking = result.booking;
                    statusResultDiv.innerHTML = `
                        <div class="status-result-box">
                          <p><strong>Status:</strong> <span class="status-${booking.status.toLowerCase()}">${booking.status}</span></p>
                          <p><strong>Name:</strong> ${booking.name}</p>
                          <p><strong>Pickup:</strong> ${booking.pickup}</p>
                          <p><strong>Drop:</strong> ${booking.drop}</p>
                        </div>
                    `;
                } else {
                    statusResultDiv.innerHTML = `<p style="color:red;">❌ Booking not found.</p>`;
                }
            } catch (err) {
                statusResultDiv.innerHTML = `<p style="color:red;">❌ Error checking status. Please try again.</p>`;
            }
        });
    }

});


