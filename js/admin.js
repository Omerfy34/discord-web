// ========================================
// ADMIN.JS - Yönetici Paneli (FULL v3 - FIXED)
// ========================================

console.log('🎛️ Admin.js yükleniyor...');

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

// ===== LOAD HOMEPAGE DATA =====
function loadHomepageData() {
    homepageRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
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

// ===== SAVE HOMEPAGE DATA =====
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

// ===== LOAD BOT STATUS =====
function loadBotStatus() {
    db.ref('botStatus').on('value', (snapshot) => {
        const status = snapshot.val();
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
    });
}

// ===== LOAD STATS =====
function loadStats() {
    statsRef.on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        document.getElementById('adminTotalServers').textContent = data.totalServers || 0;
        document.getElementById('adminTotalUsers').textContent = data.totalUsers || 0;
        document.getElementById('adminActivePlayers').textContent = data.activePlayers || 0;
        document.getElementById('adminUptime').textContent = data.uptime || '0s';
        
        if (data.lastUpdate) {
            const date = new Date(data.lastUpdate);
            document.getElementById('lastUpdate').textContent = date.toLocaleString('tr-TR');
        }
    });
}

// ========================================
// KOMUT YÖNETİMİ
// ========================================

function loadCommands() {
    console.log('🎮 Komutlar yükleniyor...');
    
    commandsRef.on('value', (snapshot) => {
        const commands = snapshot.val();
        const container = document.getElementById('commandsList');
        
        if (!commands) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Henüz kategori eklenmemiş</p>
                    <p style="font-size: 13px;">Yukarıdaki "Yeni Kategori Ekle" butonuna tıklayarak başla!</p>
                </div>
            `;
            return;
        }
        
        allCommands = commands;
        container.innerHTML = '';
        
        // Kategorileri sırala
        const sortedCategories = Object.entries(commands).sort((a, b) => {
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
                        ${renderCommands(catKey, category.commands || {})}
                    </div>
                    <button class="add-command-btn" onclick="showCommandModal('${catKey}')">
                        <i class="fas fa-plus"></i> Yeni Komut Ekle
                    </button>
                </div>
            `;
            
            container.appendChild(catDiv);
        });
    });
}

function renderCommands(catKey, commands) {
    if (!commands || Object.keys(commands).length === 0) {
        return '<p class="no-commands">Bu kategoride henüz komut yok.</p>';
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

// ===== MOVE CATEGORY =====
window.moveCategoryUp = async function(catKey) {
    const categories = Object.entries(allCommands).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    const index = categories.findIndex(([key]) => key === catKey);
    
    if (index <= 0) return;
    
    try {
        const prevKey = categories[index - 1][0];
        const currentOrder = allCommands[catKey].order || index;
        const prevOrder = allCommands[prevKey].order || index - 1;
        
        await commandsRef.child(`${catKey}/order`).set(prevOrder);
        await commandsRef.child(`${prevKey}/order`).set(currentOrder);
        
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
        
        await commandsRef.child(`${catKey}/order`).set(nextOrder);
        await commandsRef.child(`${nextKey}/order`).set(currentOrder);
        
        showToast('✅ Kategori aşağı taşındı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ========================================
// ✅ KATEGORİ MODAL - DÜZELTİLDİ
// ========================================

// 🔥 BU FONKSİYON EKSİKTİ - HTML'den çağrılıyor
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
        // Düzenleme modu
        title.innerHTML = '<i class="fas fa-edit"></i> Kategori Düzenle';
        document.getElementById('newCategoryName').value = allCommands[editKey].name || '';
        document.getElementById('newCategoryIcon').value = allCommands[editKey].icon || 'fa-terminal';
        document.getElementById('newCategoryColor').value = allCommands[editKey].color || '#5865F2';
    } else {
        // Yeni ekleme modu
        title.innerHTML = '<i class="fas fa-folder-plus"></i> Yeni Kategori Ekle';
        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryIcon').value = 'fa-terminal';
        document.getElementById('newCategoryColor').value = '#5865F2';
    }
    
    // İlk inputa odaklan
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
            await commandsRef.child(editKey).update({
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
            
            // Aynı key var mı kontrol et
            if (allCommands[catKey]) {
                showToast('❌ Bu isimde kategori zaten var!', 'error');
                return;
            }
            
            const maxOrder = Object.values(allCommands || {}).reduce((max, cat) => Math.max(max, cat.order || 0), 0);
            
            await commandsRef.child(catKey).set({
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
        await commandsRef.child(catKey).remove();
        showToast('✅ Kategori silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ========================================
// ✅ KOMUT MODAL - DÜZELTİLDİ
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
    
    // İlk inputa odaklan
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
        // Eski komutu sil (isim değiştiyse)
        if (oldCmdKey && oldCmdKey !== cmdKey) {
            await commandsRef.child(`${catKey}/commands/${oldCmdKey}`).remove();
        }
        
        await commandsRef.child(`${catKey}/commands/${cmdKey}`).set(cmdData);
        
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
        await commandsRef.child(`${catKey}/commands/${cmdKey}`).remove();
        showToast('✅ Komut silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== MODAL DIŞINA TIKLANINCA KAPAT =====
document.addEventListener('click', (e) => {
    // Kategori modal
    const categoryModal = document.getElementById('categoryModal');
    if (e.target === categoryModal) {
        closeCategoryModal();
    }
    
    // Komut modal
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

console.log('✅ Admin.js hazır!');
