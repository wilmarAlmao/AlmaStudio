/* =========================================================
   ALMASTUDIO · ANIMACIONES CON GSAP + SCROLLTRIGGER
   ---------------------------------------------------------
   GSAP = el "director de cine": mueve elementos en el tiempo.
   ScrollTrigger = el "control remoto": usa el scroll del
   usuario como si fuera la barra de reproducción del video.
   ========================================================= */

(function () {
    // si las librerías no cargaron (sin internet), la página sigue funcionando
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    // matchMedia: aplica animaciones según el tamaño de pantalla
    // y las desactiva solas si la condición deja de cumplirse
    const mm = gsap.matchMedia();

    /* -----------------------------------------
       1. BARRA DE PROGRESO DE LECTURA (arriba)
       ----------------------------------------- */
    const barra = document.createElement('div');
    barra.id = 'barra-progreso';
    document.body.prepend(barra);

    gsap.to(barra, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true // "scrub" = la animación sigue al scroll, avanza y retrocede
        }
    });

    // todo lo que sigue solo corre si la persona NO pidió reducir movimiento
    mm.add('(prefers-reduced-motion: no-preference)', () => {

        /* -----------------------------------------
           2. TÍTULO DEL HERO: palabras que suben
           ----------------------------------------- */
        const titulo = document.querySelector('.hero h1');
        if (titulo) {
            partirEnPalabras(titulo);

            const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
            intro
                .from('.hero .badge', { y: 20, opacity: 0, duration: .6 })
                .from('.hero .palabra > *', { yPercent: 110, duration: 1, stagger: .06 }, '-=.3')
                .from('.hero p, .hero .btn', { y: 30, opacity: 0, duration: .8, stagger: .1 }, '-=.6')
                .from('#micarousel', { scale: .85, rotateY: -15, opacity: 0, duration: 1.2 }, '<');

            // parallax: el carrusel baja más lento que el scroll
            gsap.to('#micarousel', {
                yPercent: 15,
                ease: 'none',
                scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
            });
        }

        /* -----------------------------------------
           3. CONTADORES de estadísticas (0 → 50)
           ----------------------------------------- */
        document.querySelectorAll('.estadisticas h2').forEach((h2) => {
            const final = parseInt(h2.textContent.replace(/\D/g, ''), 10);
            if (isNaN(final)) return;
            const contador = { valor: 0 };

            gsap.to(contador, {
                valor: final,
                duration: 2,
                ease: 'power2.out',
                scrollTrigger: { trigger: h2, start: 'top 85%', once: true },
                onUpdate: () => { h2.textContent = '+' + Math.round(contador.valor); }
            });
        });

        /* -----------------------------------------
           4. TARJETAS 3D que "caen" en perspectiva
           ----------------------------------------- */
        if (document.querySelector('.card-3d')) {
            gsap.from('.card-3d', {
                rotateX: 45,
                y: 150,
                opacity: 0,
                transformPerspective: 1200,
                transformOrigin: 'center top',
                stagger: .15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.card-3d',
                    start: 'top 95%',
                    end: 'top 45%',
                    scrub: 1
                }
            });
        }

        /* -----------------------------------------
           5. PARALLAX en imágenes de Nosotros
           ----------------------------------------- */
        gsap.utils.toArray('.nosotros-banner img, .historia img').forEach((img) => {
            gsap.fromTo(img, { y: 40 }, {
                y: -40,
                ease: 'none',
                scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
    });

    /* -----------------------------------------
       6. SCROLL HORIZONTAL (solo en pantallas grandes)
       La sección se "pega" y, mientras bajas,
       las tarjetas avanzan hacia la izquierda.
       ----------------------------------------- */
    mm.add('(min-width: 992px) and (prefers-reduced-motion: no-preference)', () => {
        const seccion = document.querySelector('.scroll-horizontal');
        if (!seccion) return;
        const pista = seccion.querySelector('.pista');

        seccion.classList.add('pista-animada');

        // distancia que hay que mover = ancho total de la pista - ancho visible
        const distancia = () => pista.scrollWidth - seccion.clientWidth;

        gsap.to(pista, {
            x: () => -distancia(),
            ease: 'none',
            scrollTrigger: {
                trigger: seccion,
                start: 'center center',
                end: () => '+=' + distancia(),
                pin: true,              // "pin" = congela la sección en pantalla
                scrub: 1,
                invalidateOnRefresh: true // recalcula si cambias el tamaño de ventana
            }
        });

        // función de limpieza: se ejecuta si la pantalla se achica
        return () => seccion.classList.remove('pista-animada');
    });

    /* -----------------------------------------
       7. INCLINACIÓN 3D que sigue al mouse (tilt)
       Solo en dispositivos con mouse.
       ----------------------------------------- */
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const tarjetas = gsap.utils.toArray('.ventaja-card, .servicio-select, .card-libro');

        tarjetas.forEach((tarjeta) => {
            tarjeta.classList.add('tilt');
            gsap.set(tarjeta, { transformPerspective: 900 });

            // quickTo crea una función súper rápida para actualizar una propiedad
            const rotX = gsap.quickTo(tarjeta, 'rotationX', { duration: .5, ease: 'power3' });
            const rotY = gsap.quickTo(tarjeta, 'rotationY', { duration: .5, ease: 'power3' });
            const subir = gsap.quickTo(tarjeta, 'y', { duration: .5, ease: 'power3' });

            tarjeta.addEventListener('pointermove', (e) => {
                const caja = tarjeta.getBoundingClientRect();
                // posición del mouse de 0 a 1 dentro de la tarjeta
                const px = (e.clientX - caja.left) / caja.width;
                const py = (e.clientY - caja.top) / caja.height;

                rotY((px - .5) * 16);  // izquierda/derecha
                rotX((.5 - py) * 16);  // arriba/abajo
                subir(-8);

                // mueve el brillo al lugar del mouse (lo usa el CSS)
                tarjeta.style.setProperty('--mx', px * 100 + '%');
                tarjeta.style.setProperty('--my', py * 100 + '%');
            });

            tarjeta.addEventListener('pointerleave', () => {
                rotX(0);
                rotY(0);
                subir(0);
            });
        });

        return () => tarjetas.forEach((t) => {
            t.classList.remove('tilt');
            gsap.set(t, { clearProps: 'transform' });
        });
    });

    // AOS calcula posiciones al iniciar; si ScrollTrigger agrega espacio
    // (por el "pin"), le pedimos que vuelva a medir
    ScrollTrigger.addEventListener('refresh', () => {
        if (window.AOS) AOS.refresh();
    });

    /* Envuelve cada palabra en <span class="palabra"><span>…</span></span>
       para poder animarlas una por una. */
    function partirEnPalabras(elemento) {
        const nodos = Array.from(elemento.childNodes);
        elemento.textContent = '';

        nodos.forEach((nodo) => {
            if (nodo.nodeType === Node.TEXT_NODE) {
                nodo.textContent.split(/(\s+)/).forEach((trozo) => {
                    if (!trozo) return;
                    if (/^\s+$/.test(trozo)) {
                        elemento.append(' ');
                        return;
                    }
                    const caja = document.createElement('span');
                    caja.className = 'palabra';
                    const interior = document.createElement('span');
                    interior.textContent = trozo;
                    caja.append(interior);
                    elemento.append(caja);
                });
            } else if (nodo.nodeName === 'BR') {
                elemento.append(nodo);
            } else {
                // un elemento completo (ej. la palabra con degradado) se anima como una sola pieza
                const caja = document.createElement('span');
                caja.className = 'palabra';
                caja.append(nodo);
                elemento.append(caja);
            }
        });
    }
})();
