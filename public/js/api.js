const API = {
    async request(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) options.body = JSON.stringify(data);

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) window.location.href = '/';
            throw new Error(result.message || 'Something went wrong');
        }
        return result;
    },
    get(url) { return this.request(url, 'GET'); },
    post(url, data) { return this.request(url, 'POST', data); },
    put(url, data) { return this.request(url, 'PUT', data); },
    delete(url) { return this.request(url, 'DELETE'); }
};
