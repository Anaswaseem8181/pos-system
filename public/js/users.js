document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('u-name').value,
            password: document.getElementById('u-pass').value,
            role: document.getElementById('u-role').value
        };

        try {
            await API.post('/api/users', userData);
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            e.target.reset();
            loadUsers();
        } catch (err) { alert(err.message); }
    });
});

async function loadUsers() {
    const users = await API.get('/api/users');
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td><span class="badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}">${u.role}</span></td>
        </tr>
    `).join('');
}
