const SUPABASE_URL = 'https://aoiggfpadotororyjjal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KipXxEEDmDOnN_5lkLlP4w_yknnktkv';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let charactersData = [];
let gamesData = [];

// ==================== 1. ADMIN PANEL: PERSONAJ QO'SHISH FORMASI ====================
const form = document.getElementById('characterForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;
        const bio = document.getElementById('bio').value;
        const imageFileInput = document.getElementById('imageFile');

        let imageUrl = '';

        if (imageFileInput.files.length > 0) {
            const file = imageFileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await db.storage
                .from('character-images')
                .upload(filePath, file);

            if (error) {
                alert('Rasmni yuklashda xatolik: ' + error.message);
                return;
            }

            const { data: publicURLData } = db.storage
                .from('character-images')
                .getPublicUrl(filePath);

            imageUrl = publicURLData.publicUrl;
        }

        const { error: insertError } = await db
            .from('characters')
            .insert([{ name, role, bio, image_url: imageUrl }]);

        if (insertError) {
            alert('Xatolik: ' + insertError.message);
        } else {
            alert("Personaj muvaffaqiyatli qo'shildi!");
            form.reset();
            loadAdminCharacters();
        }
    });
}

// ==================== 2. ADMIN PANEL: PERSONAJ O'CHIRISH VA RO'YXAT ====================
async function deleteCharacter(id) {
    if (!confirm("Haqiqatan ham bu personajni o'chirmoqchimisiz?")) return;

    const { error } = await db
        .from('characters')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("O'chirishda xatolik:", error.message);
        alert('Xatolik yuz berdi: ' + error.message);
    } else {
        alert("Personaj muvaffaqiyatli o'chirildi!");
        loadAdminCharacters();
    }
}

async function loadAdminCharacters() {
    const listContainer = document.getElementById('adminCharacterList');
    if (!listContainer) return;

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Xatolik:', error);
        return;
    }

    listContainer.innerHTML = '<h2 style="color: #ff3333; text-align: center; margin-bottom: 20px;">Mavjud Personajlar</h2>';

    if (data.length === 0) {
        listContainer.innerHTML += '<p style="text-align: center; color: #b0b0b0;">Hozircha personajlar yo\'q.</p>';
        return;
    }

    data.forEach(char => {
        const item = document.createElement('div');
        item.className = "glass-panel";
        item.style.cssText = "padding: 12px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;";

        item.innerHTML = `
            <span style="color: #ff4d4d; font-weight: bold; font-size: 16px;">${char.name}</span>
            <button onclick="deleteCharacter('${char.id}')" style="background: #cc0000; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">O'chirish</button>
        `;
        listContainer.appendChild(item);
    });
}

// ==================== 3. ASOSIY SAHIFA: PERSONAJLARNI CHIQARISH ====================
async function renderCharacters() {
    const container = document.getElementById('characterList');
    if (!container) return;

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Oqib olishda xatolik:', error);
        return;
    }

    charactersData = data;
    container.innerHTML = '';

    data.forEach((char) => {
        const card = document.createElement('div');
        card.className = "character-card glass-panel";

        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px 12px 0 0;">
            <div style="padding: 15px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                <div>
                    <h3 style="color: #ff3333; margin: 0 0 8px 0; font-size: 18px;">${char.name}</h3>
                    <p style="color: #cccccc; font-size: 14px; margin: 0 0 12px 0;"><b>Rol:</b> ${char.role || 'Noma\'lum'}</p>
                </div>
                <button onclick="openModal('${char.id}')" style="background: #cc0000; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; transition: 0.2s;">Batafsil o'qish</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== 4. O'YINLARNI SUPABASE'DAN YUKLASH ====================
async function fetchGames() {
    const gameList = document.getElementById('gameList');
    if (!gameList) return;

    const fallbackImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%231a0000'/><text x='50%' y='50%' fill='%23ff3333' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16'>Rasm Topilmadi</text></svg>";

    try {
        const { data: games, error } = await db
            .from('games')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        gamesData = games;
        gameList.innerHTML = '';

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'character-card glass-panel';
            card.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: 480px;';

            const imageUrl = (game.image_url && game.image_url.trim() !== '')
                ? game.image_url
                : fallbackImage;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${game.title}" 
                     style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px 12px 0 0;" 
                     onerror="this.onerror=null; this.src='${fallbackImage}'">
                
                <div style="padding: 15px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                    <div>
                        <h3 style="color: #ff3333; margin: 0 0 8px 0; font-size: 16px; white-space: normal; line-height: 1.3;">
                            ${game.title} ${game.release_year ? `(${game.release_year})` : ''}
                        </h3>
                        <p style="color: #cccccc; font-size: 13px; margin: 0 0 8px 0;">
                            <b>Janr:</b> ${game.genre || 'Noma\'lum'}
                        </p>
                        <p style="color: #aaaaaa; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">
                            ${game.description || ''}
                        </p>
                    </div>
                    
                    <button class="view-btn" style="background: #cc0000; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: auto;">
                        Batafsil
                    </button>
                </div>
            `;

            const viewBtn = card.querySelector('.view-btn');
            viewBtn.addEventListener('click', () => openGameModal(game));

            gameList.appendChild(card);
        });
    } catch (err) {
        console.error("O'yinlarni yuklashda xatolik:", err.message);
    }
}

// ==================== 5. MODAL OYNALAR MANTIQI ====================
function openModal(id) {
    const char = charactersData.find(c => String(c.id) === String(id));
    if (!char) return;

    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <img src="${char.image_url}" alt="${char.name}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #330000;">
        <h2 style="color: #ff3333; margin-top: 15px; text-align: center;">${char.name}</h2>
        <p style="color: #ff4d4d; text-align: center;"><b>Rol:</b> ${char.role || 'Noma\'lum'}</p>
        <hr style="border-color: #330000; margin: 15px 0;">
        <p style="line-height: 1.6; color: #cccccc; white-space: pre-wrap;">${char.bio || ''}</p>
    `;

    modal.style.display = 'flex';
}

function openGameModal(game) {
    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <div class="game-modal-detail">
            <img src="${game.image_url}" alt="${game.title}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255, 51, 51, 0.3);">
            <h2 style="color: #ff3333; font-size: 22px; margin-bottom: 8px;">${game.title} ${game.release_year ? `(${game.release_year})` : ''}</h2>
            <p style="color: #ff6666; font-size: 14px; margin-bottom: 12px; font-weight: 600;">Janr: ${game.genre || 'Noma\'lum'}</p>
            <p style="color: #d1d1d1; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">
                ${game.full_description || game.description || 'Tavsif mavjud emas.'}
            </p>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('characterModal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('characterModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== 6. REAL-TIME QIDIRUV MANTIQI ====================
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#characterList .character-card');

        cards.forEach(card => {
            const nameElement = card.querySelector('h3');

            if (nameElement) {
                const name = nameElement.textContent.toLowerCase();

                if (name.includes(searchText)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
}

// ==================== 7. NAVIGATSIYA MANTIQI ====================
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            pageSections.forEach(section => {
                section.classList.remove('active-section');
            });

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-section');
            }

            navLinks.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll(`[data-target="${targetId}"]`).forEach(nav => {
                nav.classList.add('active');
            });

            window.scrollTo({
                top: 0,
                behavior: 'instant'
            });
        });
    });
}

// ==================== 8. ADMIN: YANGILIK QO'SHISH ====================
const newsForm = document.getElementById('newsForm');

if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('newsTitle').value;
        const category = document.getElementById('newsCategory').value;
        const summary = document.getElementById('newsSummary').value;
        const content = document.getElementById('newsContent').value;
        const imageFileInput = document.getElementById('newsImageFile');

        let imageUrl = '';

        if (imageFileInput && imageFileInput.files.length > 0) {
            const file = imageFileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `news_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await db.storage
                .from('character-images')
                .upload(filePath, file);

            if (error) {
                alert('Rasmni yuklashda xatolik: ' + error.message);
                return;
            }

            const { data: publicURLData } = db.storage
                .from('character-images')
                .getPublicUrl(filePath);

            imageUrl = publicURLData.publicUrl;
        }

        const { error } = await db
            .from('news')
            .insert([{ title, category, image_url: imageUrl, summary, content }]);

        if (error) {
            alert('Xatolik: ' + error.message);
        } else {
            alert('Yangilik muvaffaqiyatli qo\'shildi!');
            newsForm.reset();
            loadAdminNews();
            fetchNews();
        }
    });
}

// ==================== 9. ADMIN: YANGILIKLARNI CHIQARISH VA O'CHIRISH ====================
async function loadAdminNews() {
    const listContainer = document.getElementById('adminNewsList');
    if (!listContainer) return;

    const { data, error } = await db.from('news').select('*').order('created_at', { ascending: false });

    if (error) return console.error('Xatolik:', error);

    listContainer.innerHTML = '<h2 style="color: #ff3333; text-align: center; margin-bottom: 20px;">Mavjud Yangiliklar</h2>';

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = "glass-panel";
        div.style.cssText = "padding: 12px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;";

        div.innerHTML = `
            <div>
                <b style="color: #ff4d4d;">[${item.category}]</b>
                <span style="color: white; margin-left: 8px;">${item.title}</span>
            </div>
            <button onclick="deleteNews('${item.id}')" style="background: #cc0000; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">O'chirish</button>
        `;
        listContainer.appendChild(div);
    });
}

async function deleteNews(id) {
    if (!confirm("Ushbu yangilikni o'chirmoqchimisiz?")) return;

    const { error } = await db.from('news').delete().eq('id', id);

    if (error) {
        alert('Xatolik: ' + error.message);
    } else {
        loadAdminNews();
        fetchNews();
    }
}

// ==================== 10. ASOSIY SAHIFA: YANGILIKLARNI CHIQARISH ====================
async function fetchNews() {
    const newsSection = document.getElementById('news-section');
    if (!newsSection) return;

    // Statik "tez orada ishga tushadi" matnini o'chirib tashlash:
    const staticText = newsSection.querySelector('p');
    if (staticText) staticText.remove();

    try {
        const { data: newsList, error } = await db
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let gridContainer = newsSection.querySelector('.news-grid');
        if (!gridContainer) {
            gridContainer = document.createElement('div');
            gridContainer.className = 'character-grid news-grid';
            gridContainer.style.marginTop = '20px';
            newsSection.appendChild(gridContainer);
        }

        gridContainer.innerHTML = '';

        if (newsList.length === 0) {
            gridContainer.innerHTML = '<p style="color: #aaaaaa;">Hozircha yangiliklar yo\'q.</p>';
            return;
        }

        newsList.forEach(news => {
            const card = document.createElement('div');
            card.className = 'character-card glass-panel';
            card.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; height: 100%;';

            const dateStr = new Date(news.created_at).toLocaleDateString('uz-UZ');

            card.innerHTML = `
                <img src="${news.image_url || 'https://via.placeholder.com/300x180/1a0000/ff3333?text=Resident+Evil+News'}" alt="${news.title}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px 12px 0 0;">
                
                <div style="padding: 15px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                            <span style="color: #ff3333; font-weight: bold;">${news.category || 'Yangilik'}</span>
                            <span style="color: #888888;">${dateStr}</span>
                        </div>
                        <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px; line-height: 1.3;">${news.title}</h3>
                        <p style="color: #aaaaaa; font-size: 13px; line-height: 1.4; margin-bottom: 15px;">${news.summary || ''}</p>
                    </div>
                    
                    <button class="read-news-btn" style="background: #cc0000; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: auto;">
                        To'liq o'qish
                    </button>
                </div>
            `;

            card.querySelector('.read-news-btn').addEventListener('click', () => openNewsModal(news));
            gridContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Yangiliklarni yuklashda xatolik:", err.message);
    }
}

// ==================== 11. YANGILIK MODAL OYNASI ====================
function openNewsModal(news) {
    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    const dateStr = new Date(news.created_at).toLocaleDateString('uz-UZ');

    modalBody.innerHTML = `
        <div class="news-modal-detail">
            <img src="${news.image_url || 'https://via.placeholder.com/300x180/1a0000/ff3333?text=Resident+Evil+News'}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; color: #ff6666; font-size: 13px; margin-bottom: 10px;">
                <span><b>Kategoriya:</b> ${news.category}</span>
                <span>${dateStr}</span>
            </div>
            <h2 style="color: #ff3333; font-size: 20px; margin-bottom: 12px; line-height: 1.3;">${news.title}</h2>
            <hr style="border-color: rgba(255, 51, 51, 0.2); margin-bottom: 15px;">
            <p style="color: #d1d1d1; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">${news.content || news.summary}</p>
        </div>
    `;

    modal.style.display = 'flex';
}

// ==================== 12. SAHIFA YUKLANGANDA ISHGA TUSHIRISH ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminCharacters();
    renderCharacters();
    fetchGames();
    initNavigation();
    loadAdminNews();
    fetchNews();
});