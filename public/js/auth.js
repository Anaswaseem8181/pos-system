document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await API.post('/auth/login', { username, password });
        if (res.role === 'ADMIN') window.location.href = '/admin';
        else window.location.href = '/pos';
    } catch (err) {
        alert(err.message);
    }
});
