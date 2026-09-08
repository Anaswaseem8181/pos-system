const Utils = {
	formatCurrency(amount) {
		return 'Rs. ' + parseFloat(amount).toLocaleString();
	},

	formatDate(dateStr) {
		return new Date(dateStr).toLocaleString();
	},

	isLowStock(quantity) {
		return quantity < 10;
	},

	async logout() {
		try {
			await API.post('/auth/logout');
			window.location.href = '/';
		} catch (err) {
			console.error("Logout failed", err);
			window.location.href = '/';
		}
	}
};

window.showToast = (msg, type = 'success') => API.showToast(msg, type);
