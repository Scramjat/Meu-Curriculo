/* =========================================================
   Currículo — Davi Pereira
   ========================================================= */
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

/* ---------- Tema claro / escuro ---------- */
const themeToggle = document.getElementById('themeToggle');

function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch (e) { /* sem storage */ }
}

function toggleTheme(originX, originY) {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

    // Transição circular a partir do botão, se o navegador suportar
    if (!document.startViewTransition || reduceMotion) {
        setTheme(next);
        return;
    }

    const x = originX ?? window.innerWidth - 40;
    const y = originY ?? 40;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => setTheme(next));
    transition.ready.then(() => {
        root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' }
        );
    });
}

themeToggle.addEventListener('click', () => {
    const r = themeToggle.getBoundingClientRect();
    toggleTheme(r.left + r.width / 2, r.top + r.height / 2);
});

// Atalho: tecla "T"
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 't' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    toggleTheme();
});

// Acompanha o tema do sistema se o usuário nunca escolheu manualmente
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) { /* sem storage */ }
    if (!saved) root.dataset.theme = e.matches ? 'dark' : 'light';
});

/* ---------- Menu mobile ---------- */
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
    })
);

/* ---------- Efeito de digitação ---------- */
const typedEl = document.getElementById('typed');
const phrases = [
    'Estudante de Ciência da Computação',
    'Assistente de Processos na RKM',
    'Relatórios & Banco de Dados',
    'Caçador de bugs 🐞',
    'Desenvolvedor em formação',
];

if (reduceMotion) {
    typedEl.textContent = phrases[0];
} else {
    let p = 0, c = 0, deleting = false;
    (function type() {
        const word = phrases[p];
        typedEl.textContent = word.slice(0, c);

        let delay = deleting ? 35 : 75;
        if (!deleting && c === word.length) { delay = 1800; deleting = true; }
        else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 400; }

        c += deleting ? -1 : 1;
        if (c > word.length) c = word.length;
        setTimeout(type, delay);
    })();
}

/* ---------- Scroll reveal + barras + contadores ---------- */
function animateCounter(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }

    const duration = 1600;
    const start = performance.now();
    (function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
    })(start);
}

// Preenche a escala de nível até o nível atual, um degrau por vez
function fillScale(scale) {
    const current = Number(scale.dataset.current);
    scale.querySelectorAll('li').forEach((li, i) => {
        li.style.setProperty('--i', i);
        li.classList.toggle('on', i < current);
        li.classList.toggle('current', i === current - 1);
    });
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('visible');
        el.querySelectorAll('.bar-fill').forEach((b) => (b.style.width = b.dataset.level + '%'));
        el.querySelectorAll('[data-count]').forEach(animateCounter);
        el.querySelectorAll('.level-scale').forEach(fillScale);
        observer.unobserve(el);
    });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

// Pequeno atraso em cascata para elementos irmãos
document.querySelectorAll('.reveal').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((s) => s.classList.contains('reveal'));
    el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 5) * 0.08}s`);
    observer.observe(el);
});

/* ---------- Navegação: link ativo, progresso, esconder ao rolar ---------- */
const nav = document.getElementById('nav');
const progressBar = document.getElementById('progressBar');
const toTop = document.getElementById('toTop');
const sections = document.querySelectorAll('main section[id]');
const links = navLinks.querySelectorAll('a');
let lastY = window.scrollY;

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;

    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 20);
    nav.classList.toggle('hidden', y > lastY && y > 400 && !navLinks.classList.contains('open'));
    toTop.classList.toggle('show', y > 600);
    lastY = y;

    let current = '';
    sections.forEach((s) => {
        if (y >= s.offsetTop - innerHeight * 0.4) current = s.id;
    });
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ---------- Spotlight nos cards + brilho que segue o mouse ---------- */
const glow = document.querySelector('.glow');

document.addEventListener('pointermove', (e) => {
    glow.style.setProperty('--gx', e.clientX + 'px');
    glow.style.setProperty('--gy', e.clientY + 'px');

    const card = e.target.closest('.card');
    if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
    }
});

/* ---------- Inclinação 3D (tilt) ---------- */
if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
        });
        el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });

    /* Botões "magnéticos" */
    document.querySelectorAll('.magnetic').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            el.style.transform = `translate(${x * 0.25}px, ${y * 0.3}px)`;
        });
        el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
}

/* ---------- Filtro de experiências ---------- */
document.querySelectorAll('.filters .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filters .chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const f = chip.dataset.filter;
        document.querySelectorAll('.tl-item').forEach((item) => {
            item.classList.toggle('filtered-out', f !== 'all' && item.dataset.cat !== f);
        });
    });
});

/* ---------- Tecnologias: mostra descrição ---------- */
const techInfo = document.getElementById('techInfo');
const techs = document.querySelectorAll('.tech');

function showTech(btn) {
    techs.forEach((t) => t.classList.toggle('active', t === btn));
    techInfo.textContent = btn.dataset.info;
    techInfo.classList.remove('flash');
    void techInfo.offsetWidth; // reinicia a animação
    techInfo.classList.add('flash');
}

techs.forEach((btn) => {
    btn.addEventListener('click', () => showTech(btn));
    if (!isTouch) btn.addEventListener('mouseenter', () => showTech(btn));
});

/* ---------- Copiar e-mail / telefone ---------- */
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            // Fallback para navegadores sem Clipboard API (ex.: arquivo local)
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        const icon = btn.querySelector('.copy-icon');
        icon.className = 'fa-solid fa-check copy-icon';
        setTimeout(() => (icon.className = 'fa-regular fa-copy copy-icon'), 1600);
        showToast('📋 Copiado: ' + text);
    });
});

/* ---------- Imprimir ---------- */
// Garante que tudo esteja visível e preenchido também ao usar Ctrl+P
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    document.querySelectorAll('.bar-fill').forEach((b) => (b.style.width = b.dataset.level + '%'));
    document.querySelectorAll('.level-scale').forEach(fillScale);
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

/* ---------- Fundo com partículas conectadas ---------- */
(function particles() {
    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    const mouse = { x: -9999, y: -9999 };
    let points = [];
    let w, h, dpr, rgb, running = true;

    function readColor() {
        rgb = getComputedStyle(root).getPropertyValue('--particle').trim();
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.width = innerWidth * dpr;
        h = canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';

        const count = Math.min(Math.floor((innerWidth * innerHeight) / 16000), 90);
        points = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.12 * dpr,
            vy: (Math.random() - 0.5) * 0.12 * dpr,
        }));
    }

    function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        const linkDist = 130 * dpr;
        const mouseDist = 180 * dpr;

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            // Partículas fogem levemente do mouse
            const dxm = p.x - mouse.x, dym = p.y - mouse.y;
            const dm = Math.hypot(dxm, dym);
            if (dm < mouseDist) {
                p.x += (dxm / dm) * 0.5;
                p.y += (dym / dm) * 0.5;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb}, 0.55)`;
            ctx.fill();

            for (let j = i + 1; j < points.length; j++) {
                const q = points[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < linkDist) {
                    ctx.strokeStyle = `rgba(${rgb}, ${0.18 * (1 - d / linkDist)})`;
                    ctx.lineWidth = dpr;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(draw);
    }

    readColor();
    resize();

    if (reduceMotion) {
        running = false;
        return;
    }

    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    // Atualiza a cor das partículas quando o tema muda
    new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // Pausa quando a aba não está visível
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) draw();
    });
})();
