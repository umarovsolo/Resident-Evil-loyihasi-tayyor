const SUPABASE_URL = 'https://aoiggfpadotororyjjal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KipXxEEDmDOnN_5lkLlP4w_yknnktkv';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let charactersData = []; // Barcha personajlarni xotirada saqlash uchun

// ==================== 1. ADMIN PANEL: FORMA YUBORISH ====================
const form = document.getElementById('characterForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;
        const bio = document.getElementById('bio').value;
        const imageFileInput = document.getElementById('imageFile');

        let imageUrl = '';

        // Agar rasm tanlangan bo'lsa, Supabase Storage'ga yuklaymiz
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

        // Ma'lumotlarni characters jadvaliga saqlash
        const { error: insertError } = await db
            .from('characters')
            .insert([{ name, role, bio, image_url: imageUrl }]);

        if (insertError) {
            alert('Xatolik: ' + insertError.message);
        } else {
            alert('Personaj muvaffaqiyatli qo\'shildi!');
            form.reset();
            loadAdminCharacters();
        }
    });
}

// ==================== 2. ADMIN PANEL: O'CHIRISH VA RO'YXAT ====================
async function deleteCharacter(id) {
    if (!confirm("Haqiqatan ham bu personajni o'chirmoqchimisiz?")) return;

    const { error } = await db
        .from('characters')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('O\'chirishda xatolik:', error.message);
        alert('Xatolik yuz berdi: ' + error.message);
    } else {
        alert('Personaj muvaffaqiyatli o\'chirildi!');
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

// ==================== 4. O'YINLARNI CHIQARISH ====================
// O'yinlarni Supabase'dan yuklash
async function fetchGames() {
    const gameList = document.getElementById('gameList');
    if (!gameList) return;

    // Tarmoqqa bog'liq bo'lmagan, 100% kafolatlangan zaxira SVG rasmi
    const fallbackImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='100%' height='100%' fill='%231a0000'/><text x='50%' y='50%' fill='%23ff3333' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16'>Rasm Topilmadi</text></svg>";

    try {
        const { data: games, error } = await db
            .from('games')
            .select('*')
            // Yangi saralash (tartib raqami bo'yicha o'sish tartibida):
            .order('display_order', { ascending: true });
        if (error) throw error;

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
                            ${game.title} (${game.release_year})
                        </h3>
                        <p style="color: #cccccc; font-size: 13px; margin: 0 0 8px 0;">
                            <b>Janr:</b> ${game.genre || 'Noma\'lum'}
                        </p>
                        <p style="color: #aaaaaa; font-size: 12px; line-height: 1.4; margin-bottom: 15px;">
                            ${game.description || ''}
                        </p>
                    </div>
                    
                    <button style="background: #cc0000; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: auto;" 
                            onclick="alert('${game.title} haqida batafsil ma\\'lumot tez orada...')">
                        Batafsil
                    </button>
                </div>
            `;

            gameList.appendChild(card);
        });
    } catch (err) {
        console.error("O'yinlarni yuklashda xatolik:", err.message);
    }
}

// ==================== 5. MODAL OYNASI MANTIQI ====================
function openModal(id) {
    const char = charactersData.find(c => String(c.id) === String(id));
    if (!char) return;

    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <img src="${char.image_url}" alt="${char.name}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #330000;">
        <h2 style="color: #ff3333; margin-top: 15px; text-align: center;">${char.name}</h2>
        <p style="color: #ff4d4d; text-align: center;"><b>Rol:</b> ${char.role}</p>
        <hr style="border-color: #330000; margin: 15px 0;">
        <p style="line-height: 1.6; color: #cccccc; white-space: pre-wrap;">${char.bio}</p>
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
    const sections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;

            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll(`.nav-link[data-target="${targetId}"]`).forEach(l => {
                l.classList.add('active');
            });

            sections.forEach(sec => sec.classList.remove('active-section'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active-section');
            }
        });
    });
}

// ==================== 8. SAHIFA YUKLANGANDA ISHGA TUSHIRISH ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminCharacters();
    renderCharacters();
    fetchGames(); // O'yinlarni yuklash qo'shildi
    initNavigation();
});