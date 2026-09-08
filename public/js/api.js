const API = {
	async request(url, method = 'GET', data = null) {
		const options = {
			method,
			headers: { 'Content-Type': 'application/json' }
		};
		if (data) options.body = JSON.stringify(data);

		try {
			const response = await fetch(url, options);
			const result = await response.json();

			if (!response.ok) {
				if (response.status === 401) {
					window.location.href = '/';
					return;
				}
				this.showToast(result.message || 'Error occurred', 'error');
				throw new Error(result.message || 'Something went wrong');
			}
			return result;
		} catch (err) {
			if (err.message !== 'Failed to fetch') {
				console.error("API Error:", err);
			}
			throw err;
		}
	},
	get(url) { return this.request(url, 'GET'); },
	post(url, data) { return this.request(url, 'POST', data); },
	put(url, data) { return this.request(url, 'PUT', data); },
	patch(url, data) { return this.request(url, 'PATCH', data); },
	delete(url) { return this.request(url, 'DELETE'); },
	showToast(message, type = 'success') {
		Toastify({
			text: message,
			duration: 3000,
			close: true,
			gravity: "top",
			position: "right",
			stopOnFocus: true,
			style: {
				background: type === 'success' ? "#28a745" : "#dc3545",
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
			}
		}).showToast();
	}
};

window.togglePassword = function (inputId, btn) {
	const input = document.getElementById(inputId);
	const icon = btn.querySelector('i');

	if (input.type === 'password') {
		input.type = 'text';
		icon.classList.replace('bi-eye', 'bi-eye-slash');
	} else {
		input.type = 'password';
		icon.classList.replace('bi-eye-slash', 'bi-eye');
	}
};
