let yaAbrio = false;
let explosionActivada = false;
const circulosCompletados = [false, false, false];

function activarInvitacion() {
    if (yaAbrio) return;
    yaAbrio = true;

    const imgSobre = document.getElementById('imagenSobreEstetica');
    const videoSobre = document.getElementById('videoSobre');
    const intro = document.getElementById('contenedor-principal');
    const btnTexto = document.getElementById('btn-toca-abrir');
    const musica = document.getElementById('musicaInvitacion');
    const musicIcon = document.getElementById('music-toggle');

    if (btnTexto) {
        btnTexto.innerHTML = "ABRIENDO SOBRE...";
        btnTexto.style.opacity = "0.7";
    }

    // 1. DISPARAR MÚSICA DE FORMA INMEDIATA AL TOQUE
    if (musica) {
        musica.currentTime = 0;
        musica.play().then(() => {
            if (musicIcon) musicIcon.style.display = 'flex';
        }).catch(err => {
            console.log("Audio play err:", err);
            if (musicIcon) musicIcon.style.display = 'flex'; // Mostrar el botón igual por si el usuario lo activa manual
        });
    } else {
        if (musicIcon) musicIcon.style.display = 'flex';
    }

    // 2. MOSTRAR Y REPRODUCIR EL VIDEO DEL SOBRE
    if (imgSobre) imgSobre.style.display = 'none';
    if (videoSobre) {
        videoSobre.style.display = 'block';
        videoSobre.currentTime = 0;
        videoSobre.play().catch(e => console.log("Video play err:", e));

        const procederAInvitacion = () => {
            if (intro) {
                intro.style.transition = "opacity 0.8s ease";
                intro.style.opacity = '0';
            }
            setTimeout(() => {
                if (intro) intro.style.display = 'none';
                const seccionFinal = document.getElementById('seccion-final');
                if (seccionFinal) seccionFinal.style.display = 'block';

                window.scrollTo(0, 0);
                iniciarAnimacionesScroll();
                initScratchCircles();
                iniciarContador();
            }, 800);
        };

        videoSobre.onended = procederAInvitacion;
        setTimeout(procederAInvitacion, 4000); // Respaldo de seguridad
    }
}

// COPIAR ALIAS
function copiarAlias() {
    const alias = document.getElementById('aliasText').innerText;
    navigator.clipboard.writeText(alias).then(() => {
        mostrarToast();
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

function mostrarToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// RASPADITA 3 CÍRCULOS (CAPA ROJA PARA RASPAR, INTERIOR PLATEADO)
function initScratchCircles() {
    const canvases = document.querySelectorAll('.circle-canvas');
    if (!canvases.length) return;

    canvases.forEach((canvas, idx) => {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 90;

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        // Capa superior roja para raspar
        ctx.fillStyle = '#790b0e';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RASPÁ', size / 2, size / 2 - 2);

        let isDrawing = false;
        let lastPos = null;

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (size / rect.width),
                y: (e.clientY - rect.top) * (size / rect.height)
            };
        }

        function startScratch(e) {
            isDrawing = true;
            lastPos = getPos(e);
            try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
            scratch(e);
        }

        function scratch(e) {
            if (!isDrawing) return;
            if (e.cancelable) e.preventDefault();
            const currentPos = getPos(e);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 24;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            if (lastPos) {
                ctx.moveTo(lastPos.x, lastPos.y);
                ctx.lineTo(currentPos.x, currentPos.y);
            } else {
                ctx.arc(currentPos.x, currentPos.y, 12, 0, Math.PI * 2);
            }
            ctx.stroke();
            lastPos = currentPos;
        }

        function stopScratch(e) {
            if (!isDrawing) return;
            isDrawing = false;
            lastPos = null;
            try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
            verificarReveladoTotal();
        }

        function verificarReveladoTotal() {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let clearPixels = 0;
            const data = imgData.data;

            for (let i = 3; i < data.length; i += 16) {
                if (data[i] === 0) clearPixels++;
            }

            const totalSampled = data.length / 16;
            if ((clearPixels / totalSampled) * 100 > 35) {
                canvas.style.opacity = '0';
                setTimeout(() => { canvas.style.display = 'none'; }, 600);
                circulosCompletados[idx] = true;

                if (circulosCompletados.every(Boolean) && !explosionActivada) {
                    explosionActivada = true;
                    lanzarDestellosPlateados();
                    const countdown = document.getElementById('countdownCard');
                    if (countdown) {
                        setTimeout(() => { countdown.classList.add('revealed-done'); }, 300);
                    }
                }
            }
        }

        canvas.onpointerdown = startScratch;
        canvas.onpointermove = scratch;
        canvas.onpointerup = stopScratch;
        canvas.onpointercancel = stopScratch;
    });
}

// DESTELLOS PLATEADOS
function lanzarDestellosPlateados() {
    const c = document.getElementById('petalsCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    const destellos = [];
    for (let i = 0; i < 60; i++) {
        destellos.push({
            x: c.width / 2, y: c.height / 2,
            size: Math.random() * 6 + 2,
            speedX: (Math.random() - 0.5) * 12,
            speedY: (Math.random() - 0.5) * 12 - 2,
            color: '#e5e7eb',
            opacity: 1
        });
    }

    let d = 0;
    function animar() {
        ctx.clearRect(0, 0, c.width, c.height);
        destellos.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            p.x += p.speedX;
            p.y += p.speedY;
            p.opacity -= 0.02;
        });
        d++;
        if (d < 50) requestAnimationFrame(animar);
        else ctx.clearRect(0, 0, c.width, c.height);
    }
    animar();
}

// CONTADOR (5 DICIEMBRE 2026 21:00:00)
function iniciarContador() {
    const targetDate = new Date('2026-11-15T21:00:00').getTime();
    function actualizar() {
        const diff = targetDate - new Date().getTime();
        if (diff <= 0) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('cd-days').innerText = String(days).padStart(2, '0');
        document.getElementById('cd-hours').innerText = String(hours).padStart(2, '0');
        document.getElementById('cd-mins').innerText = String(mins).padStart(2, '0');
        document.getElementById('cd-secs').innerText = String(secs).padStart(2, '0');
    }
    actualizar();
    setInterval(actualizar, 1000);
}

function toggleMusic() {
    const musica = document.getElementById('musicaInvitacion');
    const icon = document.getElementById('music-toggle');
    if (musica.paused) {
        musica.play();
        icon.innerHTML = '<i class="fa-solid fa-music"></i>';
    } else {
        musica.pause();
        icon.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    }
}

function iniciarAnimacionesScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
