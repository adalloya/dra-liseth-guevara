
document.addEventListener('DOMContentLoaded', () => {
    initMapInteractivity();
    initGallery();
    initSlideshow();
    initMobileDrawer();
});

/* --- Mobile Drawer Navigation (Mobile First) --- */
function initMobileDrawer() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const closeBtn = document.getElementById('closeDrawerBtn');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (!menuBtn || !drawer || !backdrop) return;

    function openDrawer() {
        drawer.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    mobileLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });
}

/* --- Map Interactivity --- */
function initMapInteractivity() {
    const locationItems = document.querySelectorAll('.location-item');
    const mapFrame = document.getElementById('map-frame');
    const mapDirectionsBtn = document.getElementById('btn-map-directions');

    // Set initial map and directions if not set
    const activeItem = document.querySelector('.location-item.active');
    if (activeItem) {
        if (mapFrame && !mapFrame.src) {
            mapFrame.src = activeItem.getAttribute('data-map-url');
        }
        if (mapDirectionsBtn) {
            const extUrl = activeItem.getAttribute('data-external-url');
            if (extUrl) mapDirectionsBtn.href = extUrl;
        }
    }

    locationItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            locationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update map source
            const mapUrl = item.getAttribute('data-map-url');
            if (mapUrl && mapFrame) {
                mapFrame.src = mapUrl;
            }

            // Update directions external URL
            const extUrl = item.getAttribute('data-external-url');
            if (extUrl && mapDirectionsBtn) {
                mapDirectionsBtn.href = extUrl;
            }
        });
    });
}

/* --- Gallery Logic (Master-Detail) --- */
const casesData = [
    { before: 'case1_before.jpg', after: 'case1_after.jpg', label: 'Apiñamiento' },
    { before: 'case2_before.jpg', after: 'case2_after.jpg', label: 'Mordida Abierta' },
    { before: 'case3_before.jpg', after: 'case3_after.jpg', label: 'Sobremordida' },
    { before: 'case4_before.jpg', after: 'case4_after.jpg', label: 'Espaciamiento' },
    { before: 'case5_before.jpg', after: 'case5_after.jpg', label: 'Alineación' }
];

let currentCaseIndex = 0;

function initGallery() {
    const mainWrapper = document.getElementById('mainSliderWrapper');
    const thumbsRow = document.getElementById('thumbnailsRow');

    if (!mainWrapper || !thumbsRow) return;

    // Render Thumbnails
    thumbsRow.innerHTML = '';
    casesData.forEach((c, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${index === 0 ? 'active' : ''} `;
        thumb.onclick = () => loadCase(index);
        thumb.innerHTML = `<img src="${c.after}" alt="${c.label}">`; // Use 'after' as thumb
        thumbsRow.appendChild(thumb);
    });

    // Load Initial Case
    loadCase(0);
}

function loadCase(index) {
    currentCaseIndex = index;
    const c = casesData[index];
    const mainWrapper = document.getElementById('mainSliderWrapper');

    // Update Thumbnails Active State
    document.querySelectorAll('.thumb-item').forEach((t, i) => {
        if (i === index) t.classList.add('active');
        else t.classList.remove('active');
    });

    // Render Main Slider HTML
    mainWrapper.innerHTML = `
        <div class="img-comp-container">
            <div class="img-comp-img">
                <img src="${c.after}" alt="Después">
            </div>
            <div class="img-comp-img img-comp-overlay">
                <img src="${c.before}" alt="Antes">
            </div>
        </div>
    `;

    // Initialize Slider Logic
    // Wait a tick for DOM to update
    setTimeout(() => {
        const overlay = mainWrapper.querySelector('.img-comp-overlay');
        if (overlay) initSingleComparison(overlay);
    }, 50);
}

function initSingleComparison(img) {
    // Check if already initialized
    if (img.parentElement.querySelector('.img-comp-slider')) return;

    // Poll for dimensions
    const checkDimensions = setInterval(() => {
        if (img.offsetWidth > 0 && img.offsetHeight > 0) {
            clearInterval(checkDimensions);
            buildSlider(img);
        }
    }, 100);

    // Fallback: Force load check
    const imgEl = img.querySelector('img');
    if (imgEl && !imgEl.complete) {
        imgEl.onload = () => {
            clearInterval(checkDimensions);
            buildSlider(img);
        };
    }
}

function buildSlider(img) {
    // Double check initialization
    if (img.parentElement.querySelector('.img-comp-slider')) return;

    let clicked = 0;
    let w = img.offsetWidth;
    let h = img.offsetHeight;

    img.style.width = (w / 2) + "px";

    /* Create slider: */
    const slider = document.createElement("DIV");
    slider.setAttribute("class", "img-comp-slider");
    // Icon is handled by CSS ::after content now

    img.parentElement.insertBefore(slider, img);

    /* Position the slider near bottom: */
    // Top is handled by CSS (85%)
    slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";

    /* Events */
    slider.addEventListener("mousedown", slideReady);
    window.addEventListener("mouseup", slideFinish);
    slider.addEventListener("touchstart", slideReady);
    window.addEventListener("touchend", slideFinish);

    function slideReady(e) {
        e.preventDefault();
        clicked = 1;
        window.addEventListener("mousemove", slideMove);
        window.addEventListener("touchmove", slideMove);
    }

    function slideFinish() {
        clicked = 0;
    }

    function slideMove(e) {
        if (clicked == 0) return;
        let pos = getCursorPos(e);
        if (pos < 0) pos = 0;
        if (pos > w) pos = w;
        slide(pos);
    }

    function getCursorPos(e) {
        let a, x = 0;
        e = (e.changedTouches) ? e.changedTouches[0] : e;
        a = img.getBoundingClientRect();
        x = e.clientX - a.left;
        return x;
    }

    function slide(x) {
        img.style.width = x + "px";
        slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";
    }
}

/* --- Modal Logic --- */
const modalOrder = ['modal-instalaciones', 'modal-atencion', 'modal-expertise', 'modal-tecnologia'];
let currentModalIndex = -1;

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";

        // Update current index
        currentModalIndex = modalOrder.indexOf(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

function changeModal(direction) {
    if (currentModalIndex === -1) return;

    // Close current
    closeModal(modalOrder[currentModalIndex]);

    // Calculate next index
    currentModalIndex += direction;
    if (currentModalIndex >= modalOrder.length) currentModalIndex = 0;
    if (currentModalIndex < 0) currentModalIndex = modalOrder.length - 1;

    // Open next
    openModal(modalOrder[currentModalIndex]);
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/* --- Ticker Logic --- */
function initTicker() {
    const ticker = document.getElementById('testimonialTicker');
    if (!ticker) return;

    let isHovered = false;
    let isDragging = false;
    let startX, scrollLeft;

    // Auto Scroll
    function autoScroll() {
        if (!isHovered && !isDragging) {
            ticker.scrollLeft += 1;
            // Reset if reached end (simple loop)
            if (ticker.scrollLeft >= (ticker.scrollWidth - ticker.clientWidth)) {
                ticker.scrollLeft = 0;
            }
        }
        requestAnimationFrame(autoScroll);
    }

    requestAnimationFrame(autoScroll);

    // Pause on hover
    ticker.addEventListener('mouseenter', () => isHovered = true);
    ticker.addEventListener('mouseleave', () => {
        isHovered = false;
        isDragging = false;
    });

    // Drag to scroll
    ticker.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - ticker.offsetLeft;
        scrollLeft = ticker.scrollLeft;
        ticker.style.cursor = 'grabbing';
    });

    ticker.addEventListener('mouseup', () => {
        isDragging = false;
        ticker.style.cursor = 'grab';
    });

    ticker.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - ticker.offsetLeft;
        const walk = (x - startX) * 2;
        ticker.scrollLeft = scrollLeft - walk;
    });
}


/* --- Contact Slideshow --- */
function initSlideshow() {
    const slides = document.querySelectorAll('.slide-img');
    if (slides.length === 0) return;

    let currentSlide = 0;

    setInterval(() => {
        // Remove active from current
        slides[currentSlide].classList.remove('active');

        // Move to next
        currentSlide = (currentSlide + 1) % slides.length;

        // Add active to next
        slides[currentSlide].classList.add('active');
    }, 3000); // Change every 3 seconds
}
