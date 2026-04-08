// ========================================
// ADMIN.JS - Yönetici Paneli (FIRESTORE)
// ========================================

console.log('🎛️ Admin.js (Firestore) yükleniyor...');

// ===== GLOBAL DEĞİŞKENLER =====
let allCommands = {};
let openCategories = [];

// ===== AUTH STATE =====
auth.onAuthStateChanged(user => {
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (user) {
        console.log('✅ Giriş yapıldı:', user.email);
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'flex';
        loadAllData();
    } else {
        console.log('❌ Giriş yok');
        loginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    errorEl.textContent = '';
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('✅ Giriş başarılı!', 'success');
    } catch (error) {
        console.error('Login hatası:', error);
        
        if (error.code === 'auth/user-not-found') {
            errorEl.textContent = 'Kullanıcı bulunamadı!';
        } else if (error.code === 'auth/wrong-password') {
            errorEl.textContent = 'Yanlış şifre!';
        } else if (error.code === 'auth/invalid-email') {
            errorEl.textContent = 'Geçersiz email!';
        } else {
            errorEl.textContent = 'Giriş başarısız!';
        }
    }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut();
    showToast('👋 Çıkış yapıldı', 'info');
});

// ===== SIDEBAR NAVIGATION =====
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const panelId = link.dataset.panel;
        
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById(panelId).classList.add('active');
        
        const titles = {
            'homepage': 'Ana Sayfa Ayarları',
            'commands': 'Komut Yönetimi',
            'stats': 'Bot İstatistikleri'
        };
        document.getElementById('panelTitle').textContent = titles[panelId] || '';
    });
});

// ===== LOAD ALL DATA =====
function loadAllData() {
    loadHomepageData();
    loadBotStatus();
    loadStats();
    loadCommands();
}

// ===== LOAD HOMEPAGE DATA (FIRESTORE) =====
function loadHomepageData() {
    homepageRef.onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        
        document.getElementById('botName').value = data.botName || '';
        document.getElementById('logoUrl').value = data.logoUrl || '';
        document.getElementById('bannerUrl').value = data.bannerUrl || '';
        document.getElementById('inviteLink').value = data.inviteLink || '';
        document.getElementById('heroTitle').value = data.heroTitle || '';
        document.getElementById('heroHighlight').value = data.heroHighlight || '';
        document.getElementById('heroDescription').value = data.heroDescription || '';
        document.getElementById('badgeText').value = data.badgeText || '';
        
        updatePreview('logoUrl', 'logoPreview', 'logoPreviewImg');
        updatePreview('bannerUrl', 'bannerPreview', 'bannerPreviewImg');
    }, (error) => {
        console.error('Homepage yükleme hatası:', error);
    });
}

function updatePreview(inputId, previewId, imgId) {
    const url = document.getElementById(inputId).value;
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    
    if (url) {
        preview.style.display = 'block';
        img.src = url;
    } else {
        preview.style.display = 'none';
    }
}

// ===== SAVE HOMEPAGE DATA (FIRESTORE) =====
window.saveHomepageData = async function() {
    const data = {
        botName: document.getElementById('botName').value,
        logoUrl: document.getElementById('logoUrl').value,
        bannerUrl: document.getElementById('bannerUrl').value,
        inviteLink: document.getElementById('inviteLink').value,
        heroTitle: document.getElementById('heroTitle').value,
        heroHighlight: document.getElementById('heroHighlight').value,
        heroDescription: document.getElementById('heroDescription').value,
        badgeText: document.getElementById('badgeText').value
    };
    
    try {
        await homepageRef.set(data);
        showToast('✅ Kaydedildi! Ana sayfayı yenile.', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== LOAD BOT STATUS (FIRESTORE) =====
function loadBotStatus() {
    statsRef.onSnapshot((doc) => {
        const status = doc.exists ? doc.data() : null;
        const statusEl = document.getElementById('botStatus');
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('span:last-child');
        
        if (status && status.online) {
            dot.className = 'status-dot online';
            text.textContent = 'Bot Çevrimiçi';
            statusEl.style.background = 'rgba(87, 242, 135, 0.1)';
            statusEl.style.color = '#57F287';
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Bot Çevrimdışı';
            statusEl.style.background = 'rgba(237, 66, 69, 0.1)';
            statusEl.style.color = '#ED4245';
        }
    }, (error) => {
        console.error('Bot status hatası:', error);
    });
}

// ===== LOAD STATS (FIRESTORE) =====
function loadStats() {
    statsRef.onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        
        document.getElementById('adminTotalServers').textContent = data.server_count || 0;
        document.getElementById('adminTotalUsers').textContent = data.user_count || 0;
        document.getElementById('adminActivePlayers').textContent = data.active_players || 0;
        document.getElementById('adminUptime').textContent = data.uptime || '0s';
        
        if (data.last_updated) {
            const date = data.last_updated.toDate ? data.last_updated.toDate() : new Date(data.last_updated);
            document.getElementById('lastUpdate').textContent = date.toLocaleString('tr-TR');
        }
    }, (error) => {
        console.error('Stats hatası:', error);
    });
}

// ========================================
// KOMUT YÖNETİMİ (FIRESTORE)
// ========================================

function loadCommands() {
    console.log('🎮 Komutlar yükleniyor (Firestore)...');
    
    commandsRef.onSnapshot((snapshot) => {
        const container = document.getElementById('commandsList');
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Henüz kategori eklenmemiş</p>
                    <p style="font-size: 13px;">Yukarıdaki "Yeni Kategori Ekle" butonuna tıklayarak başla!</p>
                </div>
            `;
            return;
        }
        
        // Kategorileri al
        const categories = {};
        snapshot.forEach(doc => {
            categories[doc.id] = doc.data();
        });
        
        allCommands = categories;
        container.innerHTML = '';
        
        // Kategorileri sırala
        const sortedCategories = Object.entries(categories).sort((a, b) => {
            return (a[1].order || 0) - (b[1].order || 0);
        });
        
        sortedCategories.forEach(([catKey, category], index) => {
            const cmdCount = Object.keys(category.commands || {}).length;
            const bgColor = category.color ? hexToRgba(category.color, 0.2) : 'rgba(88, 101, 242, 0.2)';
            const iconColor = category.color || '#5865F2';
            const isOpen = openCategories.includes(catKey);
            
            const catDiv = document.createElement('div');
            catDiv.className = 'command-category';
            catDiv.id = `category-${catKey}`;
            catDiv.innerHTML = `
                <div class="category-header ${isOpen ? 'open' : ''}" data-cat="${catKey}">
                    <div class="category-header-left" onclick="toggleCategory('${catKey}')">
                        <div class="category-icon" style="background: ${bgColor}; color: ${iconColor};">
                            <i class="fas ${category.icon || 'fa-terminal'}"></i>
                        </div>
                        <div>
                            <div class="category-name">${escapeHtml(category.name || catKey)}</div>
                            <div class="category-count">${cmdCount} komut</div>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="btn-icon" onclick="moveCategoryUp('${catKey}')" title="Yukarı Taşı" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn-icon" onclick="moveCategoryDown('${catKey}')" title="Aşağı Taşı" ${index === sortedCategories.length - 1 ? 'disabled style="opacity:0.3"' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn-icon" onclick="editCategory('${catKey}')" title="Kategoriyi Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteCategory('${catKey}')" title="Kategoriyi Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                        <span class="category-toggle" onclick="toggleCategory('${catKey}')">
                            <i class="fas fa-chevron-down"></i>
                        </span>
                    </div>
                </div>
                <div class="category-commands ${isOpen ? 'open' : ''}" id="cat-${catKey}">
                    <div class="commands-list">
                        ${renderCommandsList(catKey, category.commands || {})}
                    </div>
                    <button class="add-command-btn" onclick="showCommandModal('${catKey}')">
                        <i class="fas fa-plus"></i> Yeni Komut Ekle
                    </button>
                </div>
            `;
            
            container.appendChild(catDiv);
        });
    }, (error) => {
        console.error('Komut yükleme hatası:', error);
    });
}

function renderCommandsList(catKey, commands) {
    if (!commands || Object.keys(commands).length === 0) {
        return '<p class="no-commands" style="text-align:center; color: var(--text-muted); padding: 20px;">Bu kategoride henüz komut yok.</p>';
    }
    
    let html = '';
    Object.entries(commands).forEach(([cmdKey, cmd]) => {
        html += `
            <div class="command-item">
                <div class="command-info">
                    <span class="command-name">/${escapeHtml(cmd.name || cmdKey)}</span>
                    <span class="command-short">${escapeHtml(cmd.shortDesc || 'Açıklama yok')}</span>
                </div>
                <div class="command-actions">
                    <button class="btn-icon" onclick="editCommand('${catKey}', '${cmdKey}')" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteCommand('${catKey}', '${cmdKey}')" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    return html;
}

// ===== TOGGLE CATEGORY =====
window.toggleCategory = function(catKey) {
    const content = document.getElementById(`cat-${catKey}`);
    const header = document.querySelector(`[data-cat="${catKey}"]`);
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        header.classList.remove('open');
        openCategories = openCategories.filter(k => k !== catKey);
    } else {
        content.classList.add('open');
        header.classList.add('open');
        if (!openCategories.includes(catKey)) {
            openCategories.push(catKey);
        }
    }
}

// ===== MOVE CATEGORY (FIRESTORE) =====
window.moveCategoryUp = async function(catKey) {
    const categories = Object.entries(allCommands).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const index = categories.findIndex(([key]) => key === catKey);
    
    if (index <= 0) return;
    
    try {
        const prevKey = categories[index - 1][0];
        const currentOrder = allCommands[catKey].order || index;
        const prevOrder = allCommands[prevKey].order || index - 1;
        
        await commandsRef.doc(catKey).update({ order: prevOrder });
        await commandsRef.doc(prevKey).update({ order: currentOrder });
        
        showToast('✅ Kategori yukarı taşındı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.moveCategoryDown = async function(catKey) {
    const categories = Object.entries(allCommands).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const index = categories.findIndex(([key]) => key === catKey);
    
    if (index >= categories.length - 1) return;
    
    try {
        const nextKey = categories[index + 1][0];
        const currentOrder = allCommands[catKey].order || index;
        const nextOrder = allCommands[nextKey].order || index + 1;
        
        await commandsRef.doc(catKey).update({ order: nextOrder });
        await commandsRef.doc(nextKey).update({ order: currentOrder });
        
        showToast('✅ Kategori aşağı taşındı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ========================================
// KATEGORİ MODAL (FIRESTORE)
// ========================================

window.showAddCategoryModal = function() {
    console.log('📂 Yeni kategori modal açılıyor...');
    showCategoryModal(null);
}

window.showCategoryModal = function(editKey = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const editingKeyInput = document.getElementById('editingCategoryKey');
    
    if (!modal) {
        console.error('❌ categoryModal bulunamadı!');
        return;
    }
    
    modal.classList.add('active');
    
    if (editingKeyInput) {
        editingKeyInput.value = editKey || '';
    }
    
    if (editKey && allCommands[editKey]) {
        title.innerHTML = '<i class="fas fa-edit"></i> Kategori Düzenle';
        document.getElementById('newCategoryName').value = allCommands[editKey].name || '';
        document.getElementById('newCategoryIcon').value = allCommands[editKey].icon || 'fa-terminal';
        document.getElementById('newCategoryColor').value = allCommands[editKey].color || '#5865F2';
    } else {
        title.innerHTML = '<i class="fas fa-folder-plus"></i> Yeni Kategori Ekle';
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryIcon').value = 'fa-terminal';
        document.getElementById('newCategoryColor').value = '#5865F2';
    }
    
    setTimeout(() => {
        document.getElementById('newCategoryName').focus();
    }, 100);
}

window.editCategory = function(catKey) {
    showCategoryModal(catKey);
}

window.closeCategoryModal = function() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.saveCategory = async function() {
    const editingKeyInput = document.getElementById('editingCategoryKey');
    const editKey = editingKeyInput ? editingKeyInput.value : '';
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || 'fa-terminal';
    const color = document.getElementById('newCategoryColor').value;
    
    if (!name) {
        showToast('❌ Kategori adı gerekli!', 'error');
        document.getElementById('newCategoryName').focus();
        return;
    }
    
    try {
        if (editKey) {
            // Düzenleme
            await commandsRef.doc(editKey).update({
                name: name,
                icon: icon,
                color: color
            });
            showToast('✅ Kategori güncellendi!', 'success');
        } else {
            // Yeni ekleme
            const catKey = name.toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            if (allCommands[catKey]) {
                showToast('❌ Bu isimde kategori zaten var!', 'error');
                return;
            }
            
            const maxOrder = Object.values(allCommands || {}).reduce((max, cat) => Math.max(max, cat.order || 0), 0);
            
            await commandsRef.doc(catKey).set({
                name: name,
                icon: icon,
                color: color,
                order: maxOrder + 1,
                commands: {}
            });
            showToast('✅ Kategori eklendi!', 'success');
        }
        
        closeCategoryModal();
    } catch (error) {
        console.error('Kategori kaydetme hatası:', error);
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.deleteCategory = async function(catKey) {
    const category = allCommands[catKey];
    const cmdCount = Object.keys(category?.commands || {}).length;
    
    const confirmMsg = cmdCount > 0 
        ? `"${category?.name}" kategorisinde ${cmdCount} komut var!\n\nSilmek istediğine emin misin?`
        : `"${category?.name}" kategorisini silmek istediğine emin misin?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        await commandsRef.doc(catKey).delete();
        showToast('✅ Kategori silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ========================================
// KOMUT MODAL (FIRESTORE)
// ========================================

window.showCommandModal = function(catKey, cmdKey = null) {
    const modal = document.getElementById('commandModal');
    const title = document.getElementById('commandModalTitle');
    
    if (!modal) {
        console.error('❌ commandModal bulunamadı!');
        return;
    }
    
    modal.classList.add('active');
    document.getElementById('editCategoryKey').value = catKey;
    document.getElementById('editCommandKey').value = cmdKey || '';
    
    if (cmdKey && allCommands[catKey]?.commands?.[cmdKey]) {
        const cmd = allCommands[catKey].commands[cmdKey];
        title.innerHTML = '<i class="fas fa-edit"></i> Komutu Düzenle';
        document.getElementById('cmdName').value = cmd.name || '';
        document.getElementById('cmdShortDesc').value = cmd.shortDesc || '';
        document.getElementById('cmdDescription').value = cmd.description || '';
        document.getElementById('cmdUsage').value = cmd.usage || '';
        document.getElementById('cmdExample').value = cmd.example || '';
        document.getElementById('cmdPermission').value = cmd.permission || 'Herkes';
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Yeni Komut Ekle';
        document.getElementById('cmdName').value = '';
        document.getElementById('cmdShortDesc').value = '';
        document.getElementById('cmdDescription').value = '';
        document.getElementById('cmdUsage').value = '';
        document.getElementById('cmdExample').value = '';
        document.getElementById('cmdPermission').value = 'Herkes';
    }
    
    setTimeout(() => {
        document.getElementById('cmdName').focus();
    }, 100);
}

window.editCommand = function(catKey, cmdKey) {
    showCommandModal(catKey, cmdKey);
}

window.closeCommandModal = function() {
    const modal = document.getElementById('commandModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

window.saveCommand = async function() {
    const catKey = document.getElementById('editCategoryKey').value;
    const oldCmdKey = document.getElementById('editCommandKey').value;
    
    const name = document.getElementById('cmdName').value.trim();
    const shortDesc = document.getElementById('cmdShortDesc').value.trim();
    const description = document.getElementById('cmdDescription').value.trim();
    const usage = document.getElementById('cmdUsage').value.trim();
    const example = document.getElementById('cmdExample').value.trim();
    const permission = document.getElementById('cmdPermission').value;
    
    if (!name) {
        showToast('❌ Komut adı gerekli!', 'error');
        document.getElementById('cmdName').focus();
        return;
    }
    
    if (!catKey) {
        showToast('❌ Kategori seçilmedi!', 'error');
        return;
    }
    
    const cmdKey = name.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const cmdData = {
        name: name,
        shortDesc: shortDesc || 'Açıklama yok',
        description: description || shortDesc || 'Açıklama yok',
        usage: usage || `/${name}`,
        example: example || `/${name}`,
        permission: permission || 'Herkes'
    };
    
    try {
        // Mevcut komutları al
        const currentCommands = allCommands[catKey]?.commands || {};
        
        // Eski komutu sil (isim değiştiyse)
        if (oldCmdKey && oldCmdKey !== cmdKey) {
            delete currentCommands[oldCmdKey];
        }
        
        // Yeni/güncellenmiş komutu ekle
        currentCommands[cmdKey] = cmdData;
        
        // Firestore'a kaydet
        await commandsRef.doc(catKey).update({
            commands: currentCommands
        });
        
        closeCommandModal();
        showToast(oldCmdKey ? '✅ Komut güncellendi!' : '✅ Komut eklendi!', 'success');
        
        // Kategoriyi açık tut
        if (!openCategories.includes(catKey)) {
            openCategories.push(catKey);
        }
    } catch (error) {
        console.error('Komut kaydetme hatası:', error);
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.deleteCommand = async function(catKey, cmdKey) {
    const cmd = allCommands[catKey]?.commands?.[cmdKey];
    
    if (!confirm(`"/${cmd?.name || cmdKey}" komutunu silmek istediğine emin misin?`)) {
        return;
    }
    
    try {
        // Mevcut komutları al
        const currentCommands = { ...allCommands[catKey]?.commands } || {};
        
        // Komutu sil
        delete currentCommands[cmdKey];
        
        // Firestore'a kaydet
        await commandsRef.doc(catKey).update({
            commands: currentCommands
        });
        
        showToast('✅ Komut silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== MODAL DIŞINA TIKLANINCA KAPAT =====
document.addEventListener('click', (e) => {
    const categoryModal = document.getElementById('categoryModal');
    if (e.target === categoryModal) {
        closeCategoryModal();
    }
    
    const commandModal = document.getElementById('commandModal');
    if (e.target === commandModal) {
        closeCommandModal();
    }
});

// ===== ESC TUŞU İLE MODAL KAPAT =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCategoryModal();
        closeCommandModal();
    }
});

// ===== LIVE PREVIEW =====
document.getElementById('logoUrl')?.addEventListener('input', () => {
    updatePreview('logoUrl', 'logoPreview', 'logoPreviewImg');
});

document.getElementById('bannerUrl')?.addEventListener('input', () => {
    updatePreview('bannerUrl', 'bannerPreview', 'bannerPreviewImg');
});

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(88, 101, 242, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('✅ Admin.js (Firestore) hazır!');
// ========================================
// YENİ ÖZELLIKLER - SUNUCU YÖNETİMİ
// ========================================

// Sunucu Yönetimi Paneli
function loadServerManagement() {
    console.log('🖥️ Sunucu yönetimi yükleniyor...');
    
    // Firestore'dan sunucu listesini dinle
    db.collection('servers').onSnapshot((snapshot) => {
        const serversGrid = document.getElementById('serversList');
        if (!serversGrid) return;
        
        if (snapshot.empty) {
            serversGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-server" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px;">Bot henüz hiçbir sunucuda değil</p>
                </div>
            `;
            return;
        }
        
        serversGrid.innerHTML = '';
        const servers = [];
        
        snapshot.forEach(doc => {
            servers.push({ id: doc.id, ...doc.data() });
        });
        
        // Sıralama
        const sortType = document.getElementById('serverSortSelect')?.value || 'members';
        servers.sort((a, b) => {
            if (sortType === 'members') return (b.memberCount || 0) - (a.memberCount || 0);
            if (sortType === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortType === 'joinDate') return (b.joinedAt || 0) - (a.joinedAt || 0);
            return 0;
        });
        
        servers.forEach(server => {
            const serverCard = createServerCard(server);
            serversGrid.appendChild(serverCard);
        });
    }, (error) => {
        console.error('Sunucu yükleme hatası:', error);
    });
}

function createServerCard(server) {
    const div = document.createElement('div');
    div.className = 'server-card';
    
    const iconLetter = (server.name || 'S')[0].toUpperCase();
    const iconUrl = server.iconURL || null;
    
    div.innerHTML = `
        <div class="server-header">
            <div class="server-icon">
                ${iconUrl ? `<img src="${iconUrl}" alt="${server.name}">` : iconLetter}
            </div>
            <div class="server-info">
                <h4 title="${escapeHtml(server.name || 'Bilinmeyen')}">${escapeHtml(server.name || 'Bilinmeyen')}</h4>
                <span class="server-id">${server.id}</span>
            </div>
        </div>
        <div class="server-stats">
            <div class="server-stat">
                <i class="fas fa-users"></i>
                <span>${server.memberCount || 0} üye</span>
            </div>
            <div class="server-stat">
                <i class="fas fa-hashtag"></i>
                <span>${server.channelCount || 0} kanal</span>
            </div>
        </div>
        <div class="server-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewServerDetails('${server.id}')">
                <i class="fas fa-eye"></i> Detaylar
            </button>
            <button class="btn btn-sm btn-ghost" onclick="leaveServer('${server.id}')">
                <i class="fas fa-sign-out-alt"></i> Ayrıl
            </button>
        </div>
    `;
    
    return div;
}

window.viewServerDetails = function(serverId) {
    showToast('🔍 Sunucu detayları gösteriliyor...', 'info');
    // Burada modal ile detay gösterebilirsin
}

window.leaveServer = async function(serverId) {
    if (!confirm('Bu sunucudan ayrılmak istediğine emin misin?')) return;
    
    try {
        // Discord botuna komut gönder (webhook/API ile)
        await db.collection('bot_commands').add({
            command: 'leave_server',
            serverId: serverId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Sunucudan ayrılma komutu gönderildi', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// Sunucu arama
document.getElementById('serverSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.server-card').forEach(card => {
        const serverName = card.querySelector('h4').textContent.toLowerCase();
        const serverId = card.querySelector('.server-id').textContent.toLowerCase();
        
        if (serverName.includes(search) || serverId.includes(search)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Sıralama değişince
document.getElementById('serverSortSelect')?.addEventListener('change', () => {
    loadServerManagement();
});


// ========================================
// EKONOMİ YÖNETİMİ
// ========================================

function loadEconomyPanel() {
    console.log('💰 Ekonomi paneli yükleniyor...');
    
    // Ekonomi istatistiklerini dinle
    db.collection('economy_stats').doc('global').onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        
        document.getElementById('totalMoney').textContent = formatMoney(data.totalMoney || 0);
        document.getElementById('activeEconomyUsers').textContent = data.activeUsers || 0;
        document.getElementById('currentInterest').textContent = (data.interestRate || 2.5) + '%';
    }, (error) => {
        console.error('Ekonomi stats hatası:', error);
    });
    
    // En zengin kullanıcıları yükle
    loadRichestUsers();
}

function loadRichestUsers() {
    db.collection('economy')
        .orderBy('balance', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            const container = document.getElementById('richestUsers');
            if (!container) return;
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">Henüz ekonomi kullanıcısı yok</p>';
                return;
            }
            
            container.innerHTML = '';
            let rank = 1;
            
            snapshot.forEach(doc => {
                const user = doc.data();
                const item = createLeaderboardItem(rank, doc.id, user);
                container.appendChild(item);
                rank++;
            });
        }, (error) => {
            console.error('Leaderboard hatası:', error);
        });
}

function createLeaderboardItem(rank, userId, userData) {
    const div = document.createElement('div');
    div.className = 'leaderboard-item';
    
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const username = userData.username || 'Bilinmeyen';
    const balance = userData.balance || 0;
    
    div.innerHTML = `
        <div class="rank-badge ${rankClass}">${rank}</div>
        <div class="user-avatar">
            ${userData.avatarURL ? `<img src="${userData.avatarURL}" alt="${username}">` : username[0]}
        </div>
        <div class="user-details">
            <div class="user-name">${escapeHtml(username)}</div>
            <div class="user-id">${userId}</div>
        </div>
        <div class="user-balance">💰 ${formatMoney(balance)}</div>
    `;
    
    return div;
}

// Ekonomi işlemleri
window.showEconomyModal = function(type) {
    let userId, amount;
    
    if (type === 'add') {
        userId = prompt('Kullanıcı ID:');
        if (!userId) return;
        amount = parseInt(prompt('Eklenecek miktar:'));
        if (!amount || amount <= 0) return;
        
        addMoney(userId, amount);
    } else if (type === 'remove') {
        userId = prompt('Kullanıcı ID:');
        if (!userId) return;
        amount = parseInt(prompt('Silinecek miktar:'));
        if (!amount || amount <= 0) return;
        
        removeMoney(userId, amount);
    } else if (type === 'reset') {
        userId = prompt('Sıfırlanacak kullanıcı ID:');
        if (!userId) return;
        
        if (confirm(`${userId} kullanıcısının bakiyesini sıfırlamak istediğine emin misin?`)) {
            resetUser(userId);
        }
    }
}

async function addMoney(userId, amount) {
    try {
        const userRef = db.collection('economy').doc(userId);
        const doc = await userRef.get();
        
        if (doc.exists) {
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });
        } else {
            await userRef.set({
                balance: amount,
                username: 'Bilinmeyen',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showToast(`✅ ${formatMoney(amount)} eklendi!`, 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

async function removeMoney(userId, amount) {
    try {
        await db.collection('economy').doc(userId).update({
            balance: firebase.firestore.FieldValue.increment(-amount)
        });
        
        showToast(`✅ ${formatMoney(amount)} silindi!`, 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

async function resetUser(userId) {
    try {
        await db.collection('economy').doc(userId).delete();
        showToast('✅ Kullanıcı sıfırlandı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.showInterestModal = function() {
    const currentRate = parseFloat(document.getElementById('currentInterest').textContent);
    const newRate = parseFloat(prompt(`Yeni faiz oranı (şu an ${currentRate}%):`));
    
    if (newRate && newRate >= 0) {
        setInterestRate(newRate);
    }
}

async function setInterestRate(rate) {
    try {
        await db.collection('economy_stats').doc('global').update({
            interestRate: rate
        });
        
        showToast(`✅ Faiz oranı ${rate}% olarak güncellendi!`, 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR').format(amount);
}


// ========================================
// MESAJLAŞMA PANELİ
// ========================================

let selectedMessageType = 'announcement';

window.selectMessageType = function(type) {
    selectedMessageType = type;
    
    document.querySelectorAll('.message-type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    const targetSelector = document.getElementById('targetSelector');
    const targetInput = document.getElementById('targetId');
    
    if (type === 'announcement') {
        targetSelector.style.display = 'none';
    } else {
        targetSelector.style.display = 'block';
        targetInput.placeholder = type === 'dm' ? 'Kullanıcı ID' : 'Sunucu ID';
    }
    
    updateEmbedPreview();
}

// Embed preview güncelle
document.querySelectorAll('#embedTitle, #embedDescription, #embedFooter').forEach(input => {
    input?.addEventListener('input', updateEmbedPreview);
});

document.getElementById('embedColor')?.addEventListener('input', updateEmbedPreview);

function updateEmbedPreview() {
    const preview = document.getElementById('embedPreview');
    if (!preview) return;
    
    const title = document.getElementById('embedTitle').value || 'Başlık';
    const desc = document.getElementById('embedDescription').value || 'Açıklama...';
    const color = document.getElementById('embedColor').value || '#5865F2';
    const footer = document.getElementById('embedFooter').value || '';
    const thumbnail = document.getElementById('embedThumbnail').value || '';
    
    preview.style.borderLeftColor = color;
    preview.innerHTML = `
        ${thumbnail ? `<img src="${thumbnail}" class="embed-preview-thumbnail" style="width:80px;height:80px;float:right;margin-left:15px;border-radius:8px;">` : ''}
        <div class="embed-preview-title" style="color: ${color};">${escapeHtml(title)}</div>
        <div class="embed-preview-desc">${escapeHtml(desc)}</div>
        ${footer ? `<div class="embed-preview-footer">${escapeHtml(footer)}</div>` : ''}
    `;
}

window.sendMessage = async function() {
    const title = document.getElementById('embedTitle').value.trim();
    const description = document.getElementById('embedDescription').value.trim();
    const color = document.getElementById('embedColor').value;
    const footer = document.getElementById('embedFooter').value.trim();
    const thumbnail = document.getElementById('embedThumbnail').value.trim();
    
    if (!title || !description) {
        showToast('❌ Başlık ve açıklama gerekli!', 'error');
        return;
    }
    
    const messageData = {
        type: selectedMessageType,
        embed: {
            title,
            description,
            color,
            footer,
            thumbnail
        },
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (selectedMessageType !== 'announcement') {
        const targetId = document.getElementById('targetId').value.trim();
        if (!targetId) {
            showToast('❌ Hedef ID gerekli!', 'error');
            return;
        }
        messageData.targetId = targetId;
    }
    
    if (!confirm(`${selectedMessageType === 'announcement' ? 'TÜM SUNUCULARA' : 'Hedefe'} mesaj göndermek istediğine emin misin?`)) {
        return;
    }
    
    try {
        await db.collection('pending_messages').add(messageData);
        
        showToast('✅ Mesaj kuyruğa eklendi! Bot yakında gönderecek.', 'success');
        
        // Formu temizle
        document.getElementById('embedTitle').value = '';
        document.getElementById('embedDescription').value = '';
        document.getElementById('embedFooter').value = '';
        document.getElementById('embedThumbnail').value = '';
        updateEmbedPreview();
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}


// ========================================
// ARAÇLAR PANELİ
// ========================================

window.updateBotStatus = async function() {
    const statusType = document.getElementById('botStatusType').value;
    const statusText = document.getElementById('botStatusText').value.trim();
    const activityType = document.getElementById('botActivityType').value;
    
    if (!statusText) {
        showToast('❌ Durum mesajı gerekli!', 'error');
        return;
    }
    
    try {
        await db.collection('bot_settings').doc('status').set({
            type: statusType,
            text: statusText,
            activityType: activityType,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Bot durumu güncellendi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.togglePatronMode = async function() {
    const btn = document.getElementById('patronModeBtn');
    const isActive = btn.classList.contains('toggle-active');
    
    try {
        await db.collection('bot_settings').doc('modes').update({
            patronMode: !isActive
        });
        
        if (isActive) {
            btn.classList.remove('toggle-active');
            btn.innerHTML = '<i class="fas fa-toggle-off"></i> Patron Modunu Aç';
            showToast('🔓 Patron modu kapatıldı', 'info');
        } else {
            btn.classList.add('toggle-active');
            btn.innerHTML = '<i class="fas fa-toggle-on"></i> Patron Modu Açık';
            showToast('🔒 Patron modu açıldı!', 'success');
        }
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.toggleStealthMode = async function() {
    const btn = document.getElementById('stealthModeBtn');
    const isActive = btn.classList.contains('toggle-active');
    
    try {
        await db.collection('bot_settings').doc('modes').update({
            stealthMode: !isActive
        });
        
        if (isActive) {
            btn.classList.remove('toggle-active');
            btn.innerHTML = '<i class="fas fa-toggle-off"></i> Gizli Modu Aç';
            showToast('👁️ Gizli mod kapatıldı', 'info');
        } else {
            btn.classList.add('toggle-active');
            btn.innerHTML = '<i class="fas fa-toggle-on"></i> Gizli Mod Açık';
            showToast('🥷 Gizli mod açıldı!', 'success');
        }
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.sendFakeMessage = async function() {
    const userId = document.getElementById('fakeUserId').value.trim();
    const message = document.getElementById('fakeMessage').value.trim();
    
    if (!userId || !message) {
        showToast('❌ Kullanıcı ID ve mesaj gerekli!', 'error');
        return;
    }
    
    try {
        await db.collection('fake_messages').add({
            userId,
            message,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Fake mesaj kuyruğa eklendi!', 'success');
        
        document.getElementById('fakeUserId').value = '';
        document.getElementById('fakeMessage').value = '';
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.generateDailyReport = async function() {
    showToast('📊 Günlük rapor oluşturuluyor...', 'info');
    
    try {
        await db.collection('reports').add({
            type: 'daily',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Rapor talebi gönderildi! Mail adresine gelecek.', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.showActiveUsers = function() {
    showToast('👥 Aktif kullanıcılar gösteriliyor...', 'info');
    // Burada modal ile gösterebilirsin
}


// ========================================
// PANEL YÜKLEME OLAYLARI
// ========================================

// Sidebar linklerine yeni panelleri ekle
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const panelId = link.dataset.panel;
        
        // Sidebar aktif
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Panel aktif
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
        }
        
        // Panel başlığı
        const titles = {
            'homepage': 'Ana Sayfa Ayarları',
            'commands': 'Komut Yönetimi',
            'stats': 'Bot İstatistikleri',
            'servers': 'Sunucu Yönetimi',
            'economy': 'Ekonomi Yönetimi',
            'messaging': 'Mesajlaşma & Duyurular',
            'tools': 'Bot Araçları'
        };
        
        const titleEl = document.getElementById('panelTitle');
        if (titleEl) {
            titleEl.textContent = titles[panelId] || 'Admin Panel';
        }
        
        // Panel açıldığında veri yükle
        if (panelId === 'servers') {
            loadServerManagement();
        } else if (panelId === 'economy') {
            loadEconomyPanel();
        } else if (panelId === 'messaging') {
            updateEmbedPreview();
        }
    });
});

// İlk yüklemede embed preview'ı başlat
setTimeout(() => {
    updateEmbedPreview();
}, 500);

console.log('✅ Yeni özellikler yüklendi!');
// ========================================
// FİREBASE COLLECTIONS OTOMATİK KURULUM
// ========================================

window.initializeFirebaseCollections = async function() {
    console.log('🔧 Firebase collections kuruluyor...');
    
    const initBtn = document.createElement('button');
    initBtn.textContent = '⚙️ Firebase Kurulumunu Başlat';
    initBtn.className = 'btn btn-warning';
    initBtn.style.cssText = 'position: fixed; top: 80px; right: 24px; z-index: 9999;';
    
    initBtn.onclick = async () => {
        if (!confirm('Firebase collections oluşturulsun mu?\n\n✅ servers\n✅ economy\n✅ economy_stats\n✅ pending_messages\n✅ bot_settings\n✅ fake_messages\n✅ reports')) {
            return;
        }
        
        initBtn.textContent = '⏳ Oluşturuluyor...';
        initBtn.disabled = true;
        
        try {
            // 1. SERVERS COLLECTION
            await db.collection('servers').doc('demo_server').set({
                name: 'Demo Sunucu',
                id: '123456789012345678',
                memberCount: 150,
                channelCount: 12,
                iconURL: null,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ servers oluşturuldu');
            
            // 2. ECONOMY COLLECTION
            await db.collection('economy').doc('demo_user').set({
                username: 'Demo Kullanıcı',
                balance: 10000,
                avatarURL: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ economy oluşturuldu');
            
            // 3. ECONOMY STATS
            await db.collection('economy_stats').doc('global').set({
                totalMoney: 10000,
                activeUsers: 1,
                interestRate: 2.5,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ economy_stats oluşturuldu');
            
            // 4. BOT SETTINGS - STATUS
            await db.collection('bot_settings').doc('status').set({
                type: 'online',
                text: '150+ Komut',
                activityType: 'PLAYING',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ bot_settings/status oluşturuldu');
            
            // 5. BOT SETTINGS - MODES
            await db.collection('bot_settings').doc('modes').set({
                patronMode: false,
                stealthMode: false,
                maintenanceMode: false,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ bot_settings/modes oluşturuldu');
            
            // 6. PENDING MESSAGES (boş)
            await db.collection('pending_messages').doc('_placeholder').set({
                info: 'Bu collection mesaj kuyruğu için kullanılır',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ pending_messages oluşturuldu');
            
            // 7. FAKE MESSAGES (boş)
            await db.collection('fake_messages').doc('_placeholder').set({
                info: 'Bu collection fake mesajlar için kullanılır',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ fake_messages oluşturuldu');
            
            // 8. REPORTS (boş)
            await db.collection('reports').doc('_placeholder').set({
                info: 'Bu collection raporlar için kullanılır',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ reports oluşturuldu');
            
            // 9. LOGS COLLECTION
            await db.collection('logs').doc('_placeholder').set({
                type: 'info',
                message: 'Log sistemi başlatıldı',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ logs oluşturuldu');
            
            showToast('🎉 Tüm collections başarıyla oluşturuldu!', 'success');
            
            initBtn.textContent = '✅ Kurulum Tamamlandı';
            initBtn.style.background = 'linear-gradient(135deg, #57F287, #43b581)';
            
            setTimeout(() => {
                initBtn.remove();
            }, 3000);
            
        } catch (error) {
            console.error('❌ Kurulum hatası:', error);
            showToast('❌ Hata: ' + error.message, 'error');
            
            initBtn.textContent = '❌ Hata! Tekrar Dene';
            initBtn.disabled = false;
        }
    };
    
    document.body.appendChild(initBtn);
}

// Auth durumu değişince kurulum butonunu göster
auth.onAuthStateChanged(user => {
    if (user) {
        // 2 saniye sonra kurulum butonu göster
        setTimeout(() => {
            // Sadece ilk girişte göster
            db.collection('bot_settings').doc('status').get().then(doc => {
                if (!doc.exists) {
                    initializeFirebaseCollections();
                }
            });
        }, 2000);
    }
});


// ========================================
// LOG SİSTEMİ
// ========================================

window.loadLogs = function() {
    console.log('📜 Loglar yükleniyor...');
    
    const logsPanel = document.getElementById('logs');
    if (!logsPanel) {
        console.warn('⚠️ Logs paneli bulunamadı, oluşturuluyor...');
        createLogsPanel();
    }
    
    db.collection('logs')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const logsList = document.getElementById('logsList');
            if (!logsList) return;
            
            if (snapshot.empty) {
                logsList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class="fas fa-history" style="font-size: 36px; opacity: 0.5; margin-bottom: 10px;"></i>
                        <p>Henüz log kaydı yok</p>
                    </div>
                `;
                return;
            }
            
            logsList.innerHTML = '';
            
            snapshot.forEach(doc => {
                if (doc.id === '_placeholder') return;
                
                const log = doc.data();
                const logItem = createLogItem(log);
                logsList.appendChild(logItem);
            });
        }, (error) => {
            console.error('Log yükleme hatası:', error);
        });
}

function createLogsPanel() {
    const contentArea = document.querySelector('.admin-content');
    if (!contentArea) return;
    
    const logsPanel = document.createElement('div');
    logsPanel.className = 'panel';
    logsPanel.id = 'logs';
    logsPanel.innerHTML = `
        <div class="section-card">
            <h2><i class="fas fa-history"></i> Log Kayıtları</h2>
            
            <div class="help-text">
                <i class="fas fa-info-circle"></i>
                Botun son 50 işlemi burada görünür. Otomatik güncellenir.
            </div>
            
            <div class="logs-container">
                <div class="logs-header">
                    <h3 style="margin: 0; font-size: 16px;">Son İşlemler</h3>
                    <div class="logs-filters">
                        <button class="log-filter active" data-type="all">Tümü</button>
                        <button class="log-filter" data-type="info">Bilgi</button>
                        <button class="log-filter" data-type="success">Başarılı</button>
                        <button class="log-filter" data-type="warning">Uyarı</button>
                        <button class="log-filter" data-type="error">Hata</button>
                    </div>
                </div>
                <div class="logs-list" id="logsList">
                    <p style="text-align: center; color: var(--text-muted); padding: 20px;">Yükleniyor...</p>
                </div>
            </div>
        </div>
    `;
    
    contentArea.appendChild(logsPanel);
    
    // Filter butonları
    logsPanel.querySelectorAll('.log-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            logsPanel.querySelectorAll('.log-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.dataset.type;
            logsPanel.querySelectorAll('.log-item').forEach(item => {
                if (type === 'all' || item.dataset.type === type) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function createLogItem(log) {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.dataset.type = log.type || 'info';
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    const timestamp = log.timestamp ? log.timestamp.toDate().toLocaleString('tr-TR') : 'Bilinmiyor';
    
    div.innerHTML = `
        <div class="log-icon ${log.type || 'info'}">
            <i class="fas ${icons[log.type] || icons.info}"></i>
        </div>
        <div class="log-content">
            <div class="log-message">${escapeHtml(log.message || 'Log mesajı')}</div>
            <div class="log-meta">
                <span>⏰ ${timestamp}</span>
                ${log.userId ? `<span>👤 ${log.userId}</span>` : ''}
                ${log.serverId ? `<span>🖥️ ${log.serverId}</span>` : ''}
            </div>
        </div>
    `;
    
    return div;
}

// Log kaydetme fonksiyonu (tüm işlemlerden çağrılabilir)
window.addLog = async function(type, message, extra = {}) {
    try {
        await db.collection('logs').add({
            type: type, // 'info', 'success', 'warning', 'error'
            message: message,
            ...extra,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Log kaydetme hatası:', error);
    }
}

// Sidebar'a logs linkini ekle
setTimeout(() => {
    const sidebar = document.querySelector('.sidebar-nav');
    if (!sidebar) return;
    
    // Log linki var mı kontrol et
    if (document.querySelector('[data-panel="logs"]')) return;
    
    // Logs section'ı bul veya oluştur
    let toolsSection = Array.from(sidebar.children).find(el => 
        el.classList.contains('sidebar-section') && 
        el.textContent.includes('Araçlar')
    );
    
    if (!toolsSection) {
        toolsSection = document.createElement('div');
        toolsSection.className = 'sidebar-section';
        toolsSection.innerHTML = '<span class="sidebar-section-title">🛠️ Araçlar</span>';
        sidebar.appendChild(toolsSection);
    }
    
    // Logs linkini oluştur
    const logsLink = document.createElement('a');
    logsLink.href = '#';
    logsLink.className = 'sidebar-link';
    logsLink.dataset.panel = 'logs';
    logsLink.innerHTML = `
        <i class="fas fa-history"></i>
        <span>Log Kayıtları</span>
    `;
    
    logsLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        logsLink.classList.add('active');
        
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const logsPanel = document.getElementById('logs');
        if (logsPanel) {
            logsPanel.classList.add('active');
        }
        
        document.getElementById('panelTitle').textContent = 'Log Kayıtları';
        loadLogs();
    });
    
    // Tools section'dan sonra ekle
    toolsSection.parentNode.insertBefore(logsLink, toolsSection.nextSibling);
    
}, 1000);


// ========================================
// DEMO VERİ OLUŞTURMA
// ========================================

window.createDemoData = async function() {
    if (!confirm('Demo veriler oluşturulsun mu?\n\n- 3 Sunucu\n- 5 Ekonomi Kullanıcısı\n- 10 Log Kaydı')) {
        return;
    }
    
    showToast('📦 Demo veriler oluşturuluyor...', 'info');
    
    try {
        // Demo Sunucular
        const servers = [
            { name: 'Oyun Sunucusu', memberCount: 1250, channelCount: 25 },
            { name: 'Müzik Topluluğu', memberCount: 850, channelCount: 15 },
            { name: 'Kodlama Kampı', memberCount: 450, channelCount: 12 }
        ];
        
        for (let i = 0; i < servers.length; i++) {
            await db.collection('servers').doc(`demo_server_${i}`).set({
                ...servers[i],
                id: `12345678901234567${i}`,
                iconURL: null,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Demo Ekonomi Kullanıcıları
        const users = [
            { username: 'ZenginAli', balance: 150000 },
            { username: 'ParaManyağı', balance: 95000 },
            { username: 'YatırımcıAyşe', balance: 75000 },
            { username: 'TuccarMehmet', balance: 50000 },
            { username: 'YeniBaslayan', balance: 5000 }
        ];
        
        for (let i = 0; i < users.length; i++) {
            await db.collection('economy').doc(`demo_user_${i}`).set({
                ...users[i],
                avatarURL: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Economy stats güncelle
        await db.collection('economy_stats').doc('global').set({
            totalMoney: 375000,
            activeUsers: 5,
            interestRate: 2.5,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Demo Loglar
        const logTypes = ['info', 'success', 'warning', 'error'];
        const logMessages = [
            'Kullanıcı giriş yaptı',
            'Komut başarıyla çalıştırıldı',
            'Yüksek CPU kullanımı tespit edildi',
            'Veritabanı bağlantı hatası',
            'Yeni sunucuya katıldı',
            'Ekonomi sistemi güncellendi',
            'Rate limit aşıldı',
            'Webhook gönderildi',
            'Cache temizlendi',
            'Backup oluşturuldu'
        ];
        
        for (let i = 0; i < 10; i++) {
            await db.collection('logs').add({
                type: logTypes[Math.floor(Math.random() * logTypes.length)],
                message: logMessages[i],
                userId: i % 2 === 0 ? `user_${i}` : null,
                serverId: i % 3 === 0 ? `server_${i}` : null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showToast('🎉 Demo veriler oluşturuldu!', 'success');
        addLog('success', 'Demo veriler oluşturuldu');
        
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
        console.error('Demo veri hatası:', error);
    }
}

// Demo data butonu ekle
setTimeout(() => {
    if (document.getElementById('demoDataBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'demoDataBtn';
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'position: fixed; top: 130px; right: 24px; z-index: 9999;';
    btn.innerHTML = '<i class="fas fa-database"></i> Demo Veri Oluştur';
    btn.onclick = createDemoData;
    
    document.body.appendChild(btn);
}, 2000);

console.log('✅ Firebase otomatik kurulum hazır!');
