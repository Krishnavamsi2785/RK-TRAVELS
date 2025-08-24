function getBookingData() {
    const params = new URLSearchParams(window.location.search);
    return {
        pickup: params.get('pickup'),
        drop: params.get('drop'),
        datetime: params.get('datetime'),
        passengers: params.get('passengers'),
        name: params.get('name'),
        phone: params.get('phone'),
        email: params.get('email'),
        id: params.get('id'),
        status: 'Pending'
    };
}

function displayBooking(booking) {
    const container = document.getElementById('bookingDetails');
    const formattedDateTime = new Date(booking.datetime).toLocaleString();

    container.innerHTML = `
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Pickup Location:</strong> ${booking.pickup}</p>
        <p><strong>Drop Location:</strong> ${booking.drop}</p>
        <p><strong>Date & Time:</strong> ${formattedDateTime}</p>
        <p><strong>Passengers:</strong> ${booking.passengers}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
    `;
}

const booking = getBookingData();
if (booking.name) {
    displayBooking(booking);
}