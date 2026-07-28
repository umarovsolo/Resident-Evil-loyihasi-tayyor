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
        item.style.cssText = "background: #161616; border: 1px solid #330000; padding: 12px 20px; margin-bottom: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 10px rgba(255, 0, 0, 0.1);";
        
        item.innerHTML = `
            <span style="color: #ff4d4d; font-weight: bold; font-size: 16px;">${char.name}</span>
            <button onclick="deleteCharacter('${char.id}')" style="background: #cc0000; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: bold;">O'chirish</button>
        `;
        listContainer.appendChild(item);
    });
}

// ==================== 3. ASOSIY SAHIFA: KARTOCHKALARNI CHIQARISH ====================
async function renderCharacters() {
    const container = document.getElementById('characterList');
    if (!container) return; 

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Oqib olishda xatolik:', error);
        return;
    }

    charactersData = data; // Qidiruv va Modal uchun global massivga saqlaymiz
    container.innerHTML = ''; 

    data.forEach((char) => {
        const card = document.createElement('div');
        card.classList.add('character-card');

        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px;">
            <h3 style="color: #ff3333; margin-top: 10px;">${char.name}</h3>
            <p class="role-text"><b>Rol:</b> ${char.role}</p>
            <p class="bio-preview" style="color: #aaa; font-size: 14px;">${char.bio}</p>
            <button onclick="openModal('${char.id}')" style="background: #cc0000; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; font-weight: bold;">Batafsil o'qish</button>
        `;
        container.appendChild(card);
    });
}

// ==================== 4. MODAL OYNASI MANTIQI ====================
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

window.onclick = function(event) {
    const modal = document.getElementById('characterModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// ==================== 5. REAL-TIME QIDIRUV MANTIQI ====================
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.character-card'); // To'g'ri klass tanlandi

        cards.forEach(card => {
            const nameElement = card.querySelector('h3');
            
            if (nameElement) {
                const name = nameElement.textContent.toLowerCase();

                if (name.includes(searchText)) {
                    card.style.display = ''; // Ko'rsatiladi
                } else {
                    card.style.display = 'none'; // Berkitiladi
                }
            }
        });
    });
}

// ==================== 6. SAHIFA YUKLANIShI ====================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminCharacters();
    renderCharacters();
});

// Asosiy sahifada personajlarni chiqarish (Tartiblangan variant)
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
        card.classList.add('character-card');

        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 6px 6px 0 0;">
            <div style="padding: 15px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                <div>
                    <h3 style="color: #ff3333; margin: 0 0 8px 0; font-size: 18px;">${char.name}</h3>
                    <p style="color: #cccccc; font-size: 14px; margin: 0 0 12px 0;"><b>Rol:</b> ${char.role || 'Noma\'lum'}</p>
                </div>
                <button onclick="openModal('${char.id}')" style="background: #cc0000; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; transition: 0.2s;">Batafsil o'qish</button>
            </div>
        `;
        container.appendChild(card);
    });
}