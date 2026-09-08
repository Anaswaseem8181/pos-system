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
			API.showToast('User created successfully!');
		} catch (err) { API.showToast(err.message, 'error'); }
	});

	document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
		e.preventDefault();
		const id = document.getElementById('edit-u-id').value;
		const userData = {
			username: document.getElementById('edit-u-name').value,
			role: document.getElementById('edit-u-role').value,
			password: document.getElementById('edit-u-pass').value || undefined
		};

		try {
			await API.put(`/api/users/${id}`, userData);
			bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
			loadUsers();
			API.showToast('User updated successfully!');
		} catch (err) { API.showToast(err.message, 'error'); }
	});
});

async function loadUsers() {
	try {
		const users = await API.get('/api/users');
		const tbody = document.getElementById('users-table');
		tbody.innerHTML = users.map(u => `
            <tr class="${u.isActive === 0 ? 'opacity-50' : ''}">
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td><span class="badge ${u.role === 'ADMIN' ? 'bg-primary' : (u.role === 'MANAGER' ? 'bg-info' : 'bg-secondary')}">${u.role}</span></td>
                <td>
                    <span class="badge ${u.isActive === 1 ? 'bg-success' : 'bg-danger'}">
                        ${u.isActive === 1 ? 'Active' : 'Deactive'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning" onclick="editUser(${u.id}, '${u.username}', '${u.role}')">Edit</button>
                        <button class="btn ${u.isActive === 1 ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="toggleUserStatus(${u.id}, ${u.isActive})">
                            ${u.isActive === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
	} catch (err) { console.error("Failed to load users:", err); }
}

function editUser(id, username, role) {
	document.getElementById('edit-u-id').value = id;
	document.getElementById('edit-u-name').value = username;
	document.getElementById('edit-u-role').value = role;
	document.getElementById('edit-u-pass').value = '';
	new bootstrap.Modal(document.getElementById('editUserModal')).show();
}

async function toggleUserStatus(id, currentStatus) {
	const action = currentStatus === 1 ? 'deactivate' : 'activate';
	if (!confirm(`Are you sure you want to ${action} this user?`)) return;
	try {
		await API.delete(`/api/users/${id}`);
		loadUsers();
		API.showToast(`User ${action}d successfully!`);
	} catch (err) { API.showToast(err.message, 'error'); }
}
