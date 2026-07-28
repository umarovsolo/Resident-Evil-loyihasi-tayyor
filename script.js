const SUPABASE_URL = 'https://aoiggfpadotororyjjal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KipXxEEDmDOnN_5lkLlP4w_yknnktkv';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin panelda formani yuborish kodi
const form = document.getElementById('characterForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;
        const bio = document.getElementById('bio').value;
        const imageFileInput = document.getElementById('imageFile');
        
        let imageUrl = '';

        // Agar rasm tanlangan bo'lsa, uni Supabase Storage'ga yuklaymiz
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
            loadAdminCharacters(); // Qo'shilgach ro'yxatni yangilash
        }
    });
}

// Bazadan ma'lumotlarni o'qib, ekranga chiqaruvchi funksiya (Asosiy sahifa uchun)
async function renderCharacters() {
    const container = document.getElementById('characterList');
    if (!container) return; 

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Oqib olishda xatolik:', error);
        return;
    }

    container.innerHTML = ''; 

    data.forEach(char => {
        const card = document.createElement('div');
        card.classList.add('character-card');
        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}">
            <h3>${char.name}</h3>
            <p><b>Rol:</b> ${char.role}</p>
            <p>${char.bio}</p>
        `;
        container.appendChild(card);
    });
}

// Sahifa ochilganda asosiy sahifa uchun ishga tushirish
renderCharacters();

// Personajni o'chirish funksiyasi (db ishlatildi)
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
        loadAdminCharacters(); // Ro'yxatni yangilash
    }
}

// Admin panelda mavjud personajlarni chiqarish funksiyasi
async function loadAdminCharacters() {
    const listContainer = document.getElementById('adminCharacterList');
    if (!listContainer) return;

    const { data, error } = await db
        .from('characters')
        .select('*');

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

// Sahifa yuklanganda admin ro'yxatini chaqirish
document.addEventListener('DOMContentLoaded', () => {
    loadAdminCharacters();
});

// Asosiy sahifada personajlarni chiqarish
async function renderCharacters() {
    const container = document.getElementById('characterList');
    if (!container) return; 

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Oqib olishda xatolik:', error);
        return;
    }

    container.innerHTML = ''; 

    data.forEach(char => {
        const card = document.createElement('div');
        card.classList.add('character-card');
        
        // Modal uchun ma'lumotlarni xavfsiz JSON shaklida saqlash
        const charData = encodeURIComponent(JSON.stringify(char));

        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 6px;">
            <h3 style="color: #ff3333; margin-top: 10px;">${char.name}</h3>
            <p><b>Rol:</b> ${char.role}</p>
            <p class="bio-preview">${char.bio}</p>
            <button onclick="openModal('${charData}')" style="background: #cc0000; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; font-weight: bold;">Batafsil o'qish</button>
        `;
        container.appendChild(card);
    });
}

// Modalni ochish funksiyasi
function openModal(charDataString) {
    const char = JSON.parse(decodeURIComponent(charDataString));
    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <img src="${char.image_url}" alt="${char.name}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #330000;">
        <h2 style="color: #ff3333; margin-top: 15px; text-align: center;">${char.name}</h2>
        <p style="color: #ff4d4d; text-align: center;"><b>Rol:</b> ${char.role}</p>
        <hr style="border-color: #330000; margin: 15px 0;">
        <p style="line-height: 1.6; color: #cccccc; white-space: pre-wrap;">${char.bio}</p>
    `;

    modal.style.display = 'flex';
}

// Modalni yopish funksiyasi
function closeModal() {
    const modal = document.getElementById('characterModal');
    modal.style.display = 'none';
}

// Modal tashqarisiga bosilganda ham yopilishi uchun
window.onclick = function(event) {
    const modal = document.getElementById('characterModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

let charactersData = []; // Barcha personajlarni saqlab turish uchun

// Asosiy sahifada personajlarni chiqarish
async function renderCharacters() {
    const container = document.getElementById('characterList');
    if (!container) return; 

    const { data, error } = await db.from('characters').select('*');

    if (error) {
        console.error('Oqib olishda xatolik:', error);
        return;
    }

    charactersData = data; // Ma'lumotlarni saqlab qo'yamiz
    container.innerHTML = ''; 

    data.forEach((char) => {
        const card = document.createElement('div');
        card.classList.add('character-card');

        card.innerHTML = `
            <img src="${char.image_url}" alt="${char.name}">
            <h3>${char.name}</h3>
            <p class="role-text"><b>Rol:</b> ${char.role}</p>
            <p class="bio-text">${char.bio}</p>
            <button onclick="openModal('${char.id}')">Batafsil o'qish</button>
        `;
        container.appendChild(card);
    });
}

// Modalni ochish funksiyasi (ID orqali xavfsiz qidirish)
function openModal(id) {
    const char = charactersData.find(c => String(c.id) === String(id));
    if (!char) return;

    const modal = document.getElementById('characterModal');
    const modalBody = document.getElementById('modalBody');

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


const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
    const searchText = e.target.value.toLowerCase().trim();
    // Kartochkalar class nomi sizda ".card" yoki shunga o'xshash bo'lsa:
    const cards = document.querySelectorAll('.card'); 

    cards.forEach(card => {
        // Personaj ismi turgan elementni topamiz (masalan, h3)
        const name = card.querySelector('h3').textContent.toLowerCase();

        if (name.includes(searchText)) {
            card.style.display = 'flex'; // Agar mos kelsa ko'rsatiladi
        } else {
            card.style.display = 'none'; // Mos kelmasa berkitiladi
        }
    });
});