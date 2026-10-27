import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: '/etc/colorDictionary/.env'});

const port = 3002;
const app = express();
const nikkiPath = '/var/www/html/nikki/';
const dataPath = path.join(nikkiPath, 'data/posts.json');
const imagesPath = path.join(nikkiPath, 'images/');
const password = process.env.NIKKI_PASSWORD;
const secret = process.env.NIKKI_SECRET || password;
const sessionDays = 30;
const imageTypes = {
    'image/jpeg' : '.jpg',
    'image/png' : '.png',
    'image/gif' : '.gif',
    'image/webp' : '.webp',
};

if(!password){
    console.error('NIKKI_PASSWORD is not set');
    process.exit(1);
}

fs.mkdirSync(path.dirname(dataPath), { recursive: true });
fs.mkdirSync(imagesPath, { recursive: true });

app.use(express.json({ limit: '2mb' }));

// ---- storage ----

const loadPosts = () => {
    if(!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
};

const savePosts = (posts) => {
    const tmp = `${dataPath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(posts, null, 2));
    fs.renameSync(tmp, dataPath);
};

const newId = () => {
    const d = new Date();
    const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
    return `${ymd}-${crypto.randomBytes(3).toString('hex')}`;
};

const summary = ({ body, ...post }) => ({
    ...post,
    excerpt: body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#>*_`~\-\[\]()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120),
    thumbnail: (body.match(/!\[[^\]]*\]\(([^)\s]+)/) || [])[1] || null,
});

// ---- auth ----

const sign = (value) => crypto.createHmac('sha256', secret).update(value).digest('hex');

const safeEqual = (a, b) => {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const readCookie = (req, name) => {
    const cookies = req.headers.cookie || '';
    const found = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
    return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
};

const isLoggedIn = (req) => {
    const token = readCookie(req, 'nikki_session');
    if(!token) return false;
    const [expires, signature] = token.split('.');
    return signature && Number(expires) > Date.now() && safeEqual(signature, sign(expires));
};

const requireLogin = (req, res, next) => {
    if(!isLoggedIn(req)) return res.status(401).json({ error: 'login required' });
    next();
};

app.post('/nikki/api/login', (req, res) => {
    if(typeof req.body.password !== 'string' || !safeEqual(sign(req.body.password), sign(password))){
        return res.status(401).json({ error: 'wrong password' });
    }
    const expires = String(Date.now() + sessionDays * 24 * 60 * 60 * 1000);
    res.cookie('nikki_session', `${expires}.${sign(expires)}`, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/nikki/',
        maxAge: sessionDays * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true });
});

app.post('/nikki/api/logout', (req, res) => {
    res.clearCookie('nikki_session', { path: '/nikki/' });
    res.json({ ok: true });
});

app.get('/nikki/api/me', (req, res) => {
    res.json({ loggedIn: isLoggedIn(req) });
});

// ---- posts ----

app.get('/nikki/api/posts', (req, res) => {
    const showDrafts = isLoggedIn(req);
    const posts = loadPosts()
        .filter(p => showDrafts || !p.draft)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(summary);
    res.json(posts);
});

app.get('/nikki/api/posts/:id', (req, res) => {
    const post = loadPosts().find(p => p.id === req.params.id);
    if(!post || (post.draft && !isLoggedIn(req))) return res.status(404).json({ error: 'not found' });
    res.json(post);
});

app.post('/nikki/api/posts', requireLogin, (req, res) => {
    const { title = '', body = '', draft = false } = req.body;
    const now = new Date().toISOString();
    const post = { id: newId(), title, body, draft: !!draft, createdAt: now, updatedAt: now };
    const posts = loadPosts();
    posts.push(post);
    savePosts(posts);
    res.json(post);
});

app.put('/nikki/api/posts/:id', requireLogin, (req, res) => {
    const posts = loadPosts();
    const post = posts.find(p => p.id === req.params.id);
    if(!post) return res.status(404).json({ error: 'not found' });
    const { title, body, draft } = req.body;
    if(typeof title === 'string') post.title = title;
    if(typeof body === 'string') post.body = body;
    if(typeof draft === 'boolean'){
        // 下書きから初めて公開したときは公開日を今にする
        if(post.draft && !draft) post.createdAt = new Date().toISOString();
        post.draft = draft;
    }
    post.updatedAt = new Date().toISOString();
    savePosts(posts);
    res.json(post);
});

app.delete('/nikki/api/posts/:id', requireLogin, (req, res) => {
    const posts = loadPosts();
    const rest = posts.filter(p => p.id !== req.params.id);
    if(rest.length === posts.length) return res.status(404).json({ error: 'not found' });
    savePosts(rest);
    res.json({ ok: true });
});

// ---- images ----

app.post('/nikki/api/images', requireLogin, express.raw({ type: 'image/*', limit: '20mb' }), (req, res) => {
    const ext = imageTypes[req.headers['content-type']];
    if(!ext || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'unsupported image' });
    const fileName = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(imagesPath, fileName), req.body);
    res.json({ url: `/nikki/images/${fileName}` });
});

app.listen(port, () => {
    console.log(`nikki work on port ${port}`);
});
