const loginDiv = document.getElementById('loginDiv');
const adminContent = document.getElementById('adminContent');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const bookingTable = document.querySelector('#bookingTable tbody');
const toast = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');

// Hardcoded admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Taxi12345';

// Initialize Socket.IO
const socket = io();

// ----------------------
// Toast function
// ----------------------
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ----------------------
// Login
// ----------------------
loginBtn.addEventListener('click', () => {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if(user === ADMIN_USER && pass === ADMIN_PASS){
        loginDiv.style.display = 'none';
        adminContent.style.display = 'block';
        loadBookings();
    } else {
        loginError.textContent = 'Invalid username or password!';
    }
});

// ----------------------
// Load bookings
// ----------------------
async function loadBookings(){
    try {
        const res = await fetch('https://rk-travels.onrender.com/api/bookings');
        const data = await res.json();

        if(!data.success) {
            showToast('Failed to load bookings', 'error');
            return;
        }

        // Update dashboard summary
        document.getElementById('totalBookings').textContent = data.bookings.length;
        document.getElementById('pendingBookings').textContent = data.bookings.filter(b => b.status === 'Pending').length;
        document.getElementById('acceptedBookings').textContent = data.bookings.filter(b => b.status === 'Accepted').length;
        document.getElementById('completedBookings').textContent = data.bookings.filter(b => b.status === 'Completed').length;
        document.getElementById('canceledBookings').textContent = data.bookings.filter(b => b.status === 'Canceled').length;

        // Fill table
        bookingTable.innerHTML = '';
        data.bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${b._id}</td>
                <td>${b.name}</td>
                <td>${b.pickup}</td>
                <td>${b.drop}</td>
                <td>${new Date(b.dateTime).toLocaleString()}</td>
                <td>${b.passengers}</td>
                <td>${b.phone}</td>
                <td>${b.email}</td>
                <td><span class="status-badge status-${b.status}">${b.status}</span></td>
                <td>
                    <select onchange="updateStatus('${b._id}', this.value)">
                        <option value="Pending" ${b.status==='Pending'?'selected':''}>Pending</option>
                        <option value="Accepted" ${b.status==='Accepted'?'selected':''}>Accepted</option>
                        <option value="Completed" ${b.status==='Completed'?'selected':''}>Completed</option>
                        <option value="Canceled" ${b.status==='Canceled'?'selected':''}>Canceled</option>
                    </select>
                </td>
            `;
            bookingTable.appendChild(tr);
        });
    } catch(err){
        console.error(err);
        showToast('Error loading bookings', 'error');
    }
}

// ----------------------
// Search filter
// ----------------------
searchInput.addEventListener('input', () => {
    const filter = searchInput.value.toLowerCase();
    const rows = bookingTable.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
});

// ----------------------
// Update booking status
// ----------------------
async function updateStatus(id, status){
    try {
        const res = await fetch(`https://rk-travels.onrender.com/api/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if(!data.success) {
            showToast('Error updating status: ' + data.error, 'error');
        } else {
            showToast(`Booking status updated to ${status}`);
            loadBookings();
        }
    } catch(err){
        showToast('Error: ' + err.message, 'error');
    }
}

// ----------------------
// Socket.IO: New booking notification
// ----------------------
socket.on('newBooking', booking => {
    showToast(`New booking from ${booking.name}`, 'success');
    loadBookings();

});

