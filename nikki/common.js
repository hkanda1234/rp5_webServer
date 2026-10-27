const api = async (path, options = {}) => {
    const res = await fetch(`/nikki/api${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: options.body && !(options.body instanceof Blob)
            ? { 'Content-Type': 'application/json', ...options.headers }
            : options.headers,
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok){
        const error = new Error(data.error || res.statusText);
        error.status = res.status;
        throw error;
    }
    return data;
};

const formatDate = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const renderMarkdown = (text) => {
    return DOMPurify.sanitize(marked.parse(text, { breaks: true, gfm: true }));
};

const isLoggedIn = async () => {
    try{
        return (await api('/me')).loggedIn;
    } catch {
        return false;
    }
};

// ログインダイアログを出し、成功したら true
const askLogin = () => new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
        <form method="dialog">
            <h2>ログイン</h2>
            <input type="password" name="password" placeholder="パスワード" autocomplete="current-password" required>
            <p class="error"></p>
            <div class="dialog-actions">
                <button type="button" class="button" value="cancel">やめる</button>
                <button type="submit" class="button primary">ログイン</button>
            </div>
        </form>`;
    document.body.append(dialog);
    const form = dialog.querySelector('form');
    const error = dialog.querySelector('.error');
    const close = (result) => {
        dialog.close();
        dialog.remove();
        resolve(result);
    };
    dialog.querySelector('[value=cancel]').addEventListener('click', () => close(false));
    dialog.addEventListener('cancel', () => close(false));
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try{
            await api('/login', { method: 'POST', body: JSON.stringify({ password: form.password.value }) });
            close(true);
        } catch {
            error.textContent = 'パスワードが違います';
        }
    });
    dialog.showModal();
});
