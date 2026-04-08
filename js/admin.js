// ========================================
// ADMIN.JS - WOWSY BOT YÖNETİCİ PANELİ
// ========================================

console.log('🎛️ Admin.js yükleniyor...');

// ===== GLOBAL DEĞİŞKENLER =====
let allCommands = {};
let openCategories = [];
let selectedMessageType = 'announcement';

// ========================================
// AUTH & GİRİŞ SİSTEMİ
// ========================================

auth.onAuthStateChanged(user => {
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (user) {
        console.log('✅ Giriş yapıldı:', user.email);
        loginScreen.style.display = 'none';
        adminDashboard.style.display = 'flex';
        
        // Admin ismini güncelle
        const adminName = document.querySelector('.admin-name');
        if (adminName) {
            adminName.textContent = user.email.split('@')[0];
        }
        
        loadAllData();
        checkFirebaseSetup();
    } else {
        console.log('❌ Giriş yok');
        loginScreen.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
});

// Login Form
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
        
        const errorMessages = {
            'auth/user-not-found': 'Kullanıcı bulunamadı!',
            'auth/wrong-password': 'Yanlış şifre!',
            'auth/invalid-email': 'Geçersiz email!',
            'auth/too-many-requests': 'Çok fazla deneme! Biraz bekle.'
        };
        
        errorEl.textContent = errorMessages[error.code] || 'Giriş başarısız!';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut();
    showToast('👋 Çıkış yapıldı', 'info');
});


// ========================================
// SIDEBAR NAVİGASYON
// ========================================

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
        
        // Panel başlığı güncelle
        const titles = {
            'homepage': 'Ana Sayfa Ayarları',
            'commands': 'Komut Yönetimi',
            'stats': 'Bot İstatistikleri',
            'servers': 'Sunucu Yönetimi',
            'economy': 'Ekonomi Yönetimi',
            'messaging': 'Mesajlaşma & Duyurular',
            'tools': 'Bot Araçları',
            'logs': 'Log Kayıtları'
        };
        
        document.getElementById('panelTitle').textContent = titles[panelId] || 'Admin Panel';
        
        // Panel açıldığında veri yükle
        if (panelId === 'servers') loadServerManagement();
        if (panelId === 'economy') loadEconomyPanel();
        if (panelId === 'messaging') updateEmbedPreview();
        if (panelId === 'logs') loadLogs();
    });
});


// ========================================
// VERİ YÜKLEME
// ========================================

function loadAllData() {
    loadHomepageData();
    loadBotStatus();
    loadStats();
    loadCommands();
}

// Ana Sayfa Verilerini Yükle
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
    const url = document.getElementById(inputId)?.value;
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);
    
    if (url && preview && img) {
        preview.style.display = 'block';
        img.src = url;
    } else if (preview) {
        preview.style.display = 'none';
    }
}

// Ana Sayfa Kaydet
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
        addLog('success', 'Ana sayfa ayarları güncellendi');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// Bot Durumu Yükle
function loadBotStatus() {
    statsRef.onSnapshot((doc) => {
        const status = doc.exists ? doc.data() : null;
        const statusEl = document.getElementById('botStatus');
        const dot = statusEl?.querySelector('.status-dot');
        const text = statusEl?.querySelector('span:last-child');
        
        if (!statusEl || !dot || !text) return;
        
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

// İstatistikleri Yükle
function loadStats() {
    statsRef.onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        
        document.getElementById('adminTotalServers').textContent = formatNumber(data.server_count || 0);
        document.getElementById('adminTotalUsers').textContent = formatNumber(data.user_count || 0);
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
// KOMUT YÖNETİMİ
// ========================================

function loadCommands() {
    console.log('🎮 Komutlar yükleniyor...');
    
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
        
        const categories = {};
        snapshot.forEach(doc => {
            categories[doc.id] = doc.data();
        });
        
        allCommands = categories;
        container.innerHTML = '';
        
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
                        <button class="btn-icon" onclick="moveCategoryUp('${catKey}')" title="Yukarı Taşı" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn-icon" onclick="moveCategoryDown('${catKey}')" title="Aşağı Taşı" ${index === sortedCategories.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn-icon" onclick="editCategory('${catKey}')" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteCategory('${catKey}')" title="Sil">
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
// KATEGORİ MODAL
// ========================================

window.showAddCategoryModal = function() {
    showCategoryModal(null);
}

window.showCategoryModal = function(editKey = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const editingKeyInput = document.getElementById('editingCategoryKey');
    
    if (!modal) return;
    
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
    
    setTimeout(() => document.getElementById('newCategoryName').focus(), 100);
}

window.editCategory = function(catKey) {
    showCategoryModal(catKey);
}

window.closeCategoryModal = function() {
    document.getElementById('categoryModal')?.classList.remove('active');
}

window.saveCategory = async function() {
    const editKey = document.getElementById('editingCategoryKey')?.value || '';
    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || 'fa-terminal';
    const color = document.getElementById('newCategoryColor').value;
    
    if (!name) {
        showToast('❌ Kategori adı gerekli!', 'error');
        return;
    }
    
    try {
        if (editKey) {
            await commandsRef.doc(editKey).update({ name, icon, color });
            showToast('✅ Kategori güncellendi!', 'success');
            addLog('success', `Kategori güncellendi: ${name}`);
        } else {
            const catKey = turkishToSlug(name);
            
            if (allCommands[catKey]) {
                showToast('❌ Bu isimde kategori zaten var!', 'error');
                return;
            }
            
            const maxOrder = Object.values(allCommands || {}).reduce((max, cat) => Math.max(max, cat.order || 0), 0);
            
            await commandsRef.doc(catKey).set({
                name, icon, color,
                order: maxOrder + 1,
                commands: {}
            });
            showToast('✅ Kategori eklendi!', 'success');
            addLog('success', `Yeni kategori eklendi: ${name}`);
        }
        
        closeCategoryModal();
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.deleteCategory = async function(catKey) {
    const category = allCommands[catKey];
    const cmdCount = Object.keys(category?.commands || {}).length;
    
    const confirmMsg = cmdCount > 0 
        ? `"${category?.name}" kategorisinde ${cmdCount} komut var!\nSilmek istediğine emin misin?`
        : `"${category?.name}" kategorisini silmek istediğine emin misin?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        await commandsRef.doc(catKey).delete();
        showToast('✅ Kategori silindi!', 'success');
        addLog('warning', `Kategori silindi: ${category?.name}`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}


// ========================================
// KOMUT MODAL
// ========================================

window.showCommandModal = function(catKey, cmdKey = null) {
    const modal = document.getElementById('commandModal');
    const title = document.getElementById('commandModalTitle');
    
    if (!modal) return;
    
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
    
    setTimeout(() => document.getElementById('cmdName').focus(), 100);
}

window.editCommand = function(catKey, cmdKey) {
    showCommandModal(catKey, cmdKey);
}

window.closeCommandModal = function() {
    document.getElementById('commandModal')?.classList.remove('active');
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
        return;
    }
    
    const cmdKey = turkishToSlug(name);
    
    const cmdData = {
        name,
        shortDesc: shortDesc || 'Açıklama yok',
        description: description || shortDesc || 'Açıklama yok',
        usage: usage || `/${name}`,
        example: example || `/${name}`,
        permission: permission || 'Herkes'
    };
    
    try {
        const currentCommands = { ...(allCommands[catKey]?.commands || {}) };
        
        if (oldCmdKey && oldCmdKey !== cmdKey) {
            delete currentCommands[oldCmdKey];
        }
        
        currentCommands[cmdKey] = cmdData;
        
        await commandsRef.doc(catKey).update({ commands: currentCommands });
        
        closeCommandModal();
        showToast(oldCmdKey ? '✅ Komut güncellendi!' : '✅ Komut eklendi!', 'success');
        addLog('success', `Komut ${oldCmdKey ? 'güncellendi' : 'eklendi'}: /${name}`);
        
        if (!openCategories.includes(catKey)) {
            openCategories.push(catKey);
        }
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.deleteCommand = async function(catKey, cmdKey) {
    const cmd = allCommands[catKey]?.commands?.[cmdKey];
    
    if (!confirm(`"/${cmd?.name || cmdKey}" komutunu silmek istediğine emin misin?`)) return;
    
    try {
        const currentCommands = { ...allCommands[catKey]?.commands };
        delete currentCommands[cmdKey];
        
        await commandsRef.doc(catKey).update({ commands: currentCommands });
        
        showToast('✅ Komut silindi!', 'success');
        addLog('warning', `Komut silindi: /${cmd?.name}`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}


// ========================================
// SUNUCU YÖNETİMİ
// ========================================

function loadServerManagement() {
    console.log('🖥️ Sunucu yönetimi yükleniyor...');
    
    db.collection('servers').onSnapshot((snapshot) => {
        const serversGrid = document.getElementById('serversList');
        if (!serversGrid) return;
        
        if (snapshot.empty) {
            serversGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-server" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Bot henüz hiçbir sunucuda değil</p>
                    <p style="font-size: 13px;">Bot bir sunucuya eklendiğinde burada görünecek.</p>
                </div>
            `;
            return;
        }
        
        const servers = [];
        snapshot.forEach(doc => {
            if (doc.id !== '_placeholder') {
                servers.push({ id: doc.id, ...doc.data() });
            }
        });
        
        // Sıralama
        const sortType = document.getElementById('serverSortSelect')?.value || 'members';
        servers.sort((a, b) => {
            if (sortType === 'members') return (b.memberCount || 0) - (a.memberCount || 0);
            if (sortType === 'name') return (a.name || '').localeCompare(b.name || '');
            return 0;
        });
        
        serversGrid.innerHTML = '';
        
        servers.forEach(server => {
            const card = document.createElement('div');
            card.className = 'server-card';
            
            const iconLetter = (server.name || 'S')[0].toUpperCase();
            
            card.innerHTML = `
                <div class="server-header">
                    <div class="server-icon">
                        ${server.iconURL ? `<img src="${server.iconURL}" alt="${server.name}">` : iconLetter}
                    </div>
                    <div class="server-info">
                        <h4>${escapeHtml(server.name || 'Bilinmeyen')}</h4>
                        <span class="server-id">${server.id}</span>
                    </div>
                </div>
                <div class="server-stats">
                    <div class="server-stat">
                        <i class="fas fa-users"></i>
                        <span>${formatNumber(server.memberCount || 0)} üye</span>
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
                    <button class="btn btn-sm btn-ghost" onclick="sendMessageToServer('${server.id}')">
                        <i class="fas fa-paper-plane"></i> Mesaj
                    </button>
                </div>
            `;
            
            serversGrid.appendChild(card);
        });
    });
}

window.viewServerDetails = function(serverId) {
    showToast('🔍 Sunucu ID: ' + serverId, 'info');
}

window.sendMessageToServer = function(serverId) {
    document.querySelector('[data-panel="messaging"]')?.click();
    setTimeout(() => {
        selectMessageType('server');
        document.getElementById('targetId').value = serverId;
    }, 100);
}

// Sunucu arama
document.getElementById('serverSearchInput')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.server-card').forEach(card => {
        const name = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const id = card.querySelector('.server-id')?.textContent.toLowerCase() || '';
        card.style.display = (name.includes(search) || id.includes(search)) ? 'block' : 'none';
    });
});

document.getElementById('serverSortSelect')?.addEventListener('change', loadServerManagement);


// ========================================
// EKONOMİ YÖNETİMİ
// ========================================

function loadEconomyPanel() {
    console.log('💰 Ekonomi paneli yükleniyor...');
    
    // Ekonomi istatistikleri
    db.collection('economy_stats').doc('global').onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : {};
        document.getElementById('totalMoney').textContent = formatMoney(data.totalMoney || 0);
        document.getElementById('activeEconomyUsers').textContent = formatNumber(data.activeUsers || 0);
        document.getElementById('currentInterest').textContent = (data.interestRate || 2.5) + '%';
    });
    
    // En zengin kullanıcılar
    db.collection('economy')
        .orderBy('balance', 'desc')
        .limit(10)
        .onSnapshot((snapshot) => {
            const container = document.getElementById('richestUsers');
            if (!container) return;
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 30px;">Henüz ekonomi kullanıcısı yok</p>';
                return;
            }
            
            container.innerHTML = '';
            let rank = 1;
            
            snapshot.forEach(doc => {
                if (doc.id === '_placeholder') return;
                
                const user = doc.data();
                const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
                
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                item.innerHTML = `
                    <div class="rank-badge ${rankClass}">${rank}</div>
                    <div class="user-avatar">${(user.username || 'U')[0]}</div>
                    <div class="user-details">
                        <div class="user-name">${escapeHtml(user.username || 'Bilinmeyen')}</div>
                        <div class="user-id">${doc.id}</div>
                    </div>
                    <div class="user-balance">💰 ${formatMoney(user.balance || 0)}</div>
                `;
                
                container.appendChild(item);
                rank++;
            });
        });
}

window.showEconomyModal = function(type) {
    const userId = prompt('Kullanıcı ID:');
    if (!userId) return;
    
    if (type === 'add') {
        const amount = parseInt(prompt('Eklenecek miktar:'));
        if (amount > 0) modifyBalance(userId, amount);
    } else if (type === 'remove') {
        const amount = parseInt(prompt('Silinecek miktar:'));
        if (amount > 0) modifyBalance(userId, -amount);
    } else if (type === 'reset') {
        if (confirm(`${userId} kullanıcısının bakiyesi sıfırlansın mı?`)) {
            resetUserBalance(userId);
        }
    }
}

async function modifyBalance(userId, amount) {
    try {
        const userRef = db.collection('economy').doc(userId);
        const doc = await userRef.get();
        
        if (doc.exists) {
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });
        } else {
            await userRef.set({
                balance: Math.max(0, amount),
                username: 'Bilinmeyen',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        const action = amount > 0 ? 'eklendi' : 'silindi';
        showToast(`✅ ${formatMoney(Math.abs(amount))} ${action}!`, 'success');
        addLog('success', `${userId} kullanıcısına ${formatMoney(amount)} ${action}`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

async function resetUserBalance(userId) {
    try {
        await db.collection('economy').doc(userId).delete();
        showToast('✅ Kullanıcı sıfırlandı!', 'success');
        addLog('warning', `${userId} ekonomi verileri sıfırlandı`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.showInterestModal = function() {
    const currentRate = document.getElementById('currentInterest').textContent;
    const newRate = parseFloat(prompt(`Yeni faiz oranı (şu an ${currentRate}):`));
    
    if (newRate >= 0) {
        db.collection('economy_stats').doc('global').update({ interestRate: newRate })
            .then(() => {
                showToast(`✅ Faiz oranı ${newRate}% olarak güncellendi!`, 'success');
                addLog('info', `Faiz oranı ${newRate}% olarak güncellendi`);
            })
            .catch(error => showToast('❌ Hata: ' + error.message, 'error'));
    }
}


// ========================================
// MESAJLAŞMA PANELİ
// ========================================

window.selectMessageType = function(type) {
    selectedMessageType = type;
    
    document.querySelectorAll('.message-type-card').forEach(card => {
        card.classList.toggle('active', card.dataset.type === type);
    });
    
    const targetSelector = document.getElementById('targetSelector');
    const targetInput = document.getElementById('targetId');
    
    if (type === 'announcement') {
        targetSelector.style.display = 'none';
    } else {
        targetSelector.style.display = 'block';
        targetInput.placeholder = type === 'dm' ? 'Kullanıcı ID' : 'Sunucu ID';
    }
}

// Embed preview güncelleme
['embedTitle', 'embedDescription', 'embedFooter', 'embedColor', 'embedThumbnail'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateEmbedPreview);
});

function updateEmbedPreview() {
    const preview = document.getElementById('embedPreview');
    if (!preview) return;
    
    const title = document.getElementById('embedTitle')?.value || 'Başlık';
    const desc = document.getElementById('embedDescription')?.value || 'Açıklama...';
    const color = document.getElementById('embedColor')?.value || '#5865F2';
    const footer = document.getElementById('embedFooter')?.value || '';
    const thumbnail = document.getElementById('embedThumbnail')?.value || '';
    
    preview.style.borderLeftColor = color;
    preview.innerHTML = `
        ${thumbnail ? `<img src="${thumbnail}" style="width:80px;height:80px;float:right;margin-left:15px;border-radius:8px;object-fit:cover;">` : ''}
        <div class="embed-preview-title" style="color:${color};">${escapeHtml(title)}</div>
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
        embed: { title, description, color, footer, thumbnail },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    };
    
    if (selectedMessageType !== 'announcement') {
        const targetId = document.getElementById('targetId').value.trim();
        if (!targetId) {
            showToast('❌ Hedef ID gerekli!', 'error');
            return;
        }
        messageData.targetId = targetId;
    }
    
    const typeNames = {
        'announcement': 'TÜM SUNUCULARA',
        'dm': 'Kullanıcıya DM',
        'server': 'Sunucuya'
    };
    
    if (!confirm(`${typeNames[selectedMessageType]} mesaj göndermek istediğine emin misin?`)) return;
    
    try {
        await db.collection('pending_messages').add(messageData);
        
        showToast('✅ Mesaj kuyruğa eklendi!', 'success');
        addLog('info', `Mesaj gönderildi: ${selectedMessageType}`);
        
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
        addLog('success', `Bot durumu güncellendi: ${activityType} ${statusText}`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.togglePatronMode = async function() {
    const btn = document.getElementById('patronModeBtn');
    const isActive = btn.classList.contains('toggle-active');
    
    try {
        await db.collection('bot_settings').doc('modes').set({
            patronMode: !isActive
        }, { merge: true });
        
        btn.classList.toggle('toggle-active');
        btn.innerHTML = isActive 
            ? '<i class="fas fa-toggle-off"></i> Patron Modunu Aç'
            : '<i class="fas fa-toggle-on"></i> Patron Modu Açık';
        
        showToast(isActive ? '🔓 Patron modu kapatıldı' : '🔒 Patron modu açıldı!', isActive ? 'info' : 'success');
        addLog('info', `Patron modu ${isActive ? 'kapatıldı' : 'açıldı'}`);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.toggleStealthMode = async function() {
    const btn = document.getElementById('stealthModeBtn');
    const isActive = btn.classList.contains('toggle-active');
    
    try {
        await db.collection('bot_settings').doc('modes').set({
            stealthMode: !isActive
        }, { merge: true });
        
        btn.classList.toggle('toggle-active');
        btn.innerHTML = isActive 
            ? '<i class="fas fa-toggle-off"></i> Gizli Modu Aç'
            : '<i class="fas fa-toggle-on"></i> Gizli Mod Açık';
        
        showToast(isActive ? '👁️ Gizli mod kapatıldı' : '🥷 Gizli mod açıldı!', isActive ? 'info' : 'success');
        addLog('info', `Gizli mod ${isActive ? 'kapatıldı' : 'açıldı'}`);
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
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        
        showToast('✅ Fake mesaj kuyruğa eklendi!', 'success');
        addLog('info', `Fake mesaj: ${userId}`);
        
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
            requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        
        showToast('✅ Rapor talebi gönderildi!', 'success');
        addLog('info', 'Günlük rapor talep edildi');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.showActiveUsers = function() {
    showToast('👥 Bu özellik yakında eklenecek!', 'info');
}


// ========================================
// LOG SİSTEMİ
// ========================================

function loadLogs() {
    console.log('📜 Loglar yükleniyor...');
    
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
                const icons = {
                    info: 'fa-info-circle',
                    success: 'fa-check-circle',
                    warning: 'fa-exclamation-triangle',
                    error: 'fa-times-circle'
                };
                
                const timestamp = log.timestamp?.toDate?.().toLocaleString('tr-TR') || 'Bilinmiyor';
                
                const item = document.createElement('div');
                item.className = 'log-item';
                item.dataset.type = log.type || 'info';
                item.innerHTML = `
                    <div class="log-icon ${log.type || 'info'}">
                        <i class="fas ${icons[log.type] || icons.info}"></i>
                    </div>
                    <div class="log-content">
                        <div class="log-message">${escapeHtml(log.message || 'Log mesajı')}</div>
                        <div class="log-meta">
                            <span>⏰ ${timestamp}</span>
                            ${log.userId ? `<span>👤 ${log.userId}</span>` : ''}
                        </div>
                    </div>
                `;
                
                logsList.appendChild(item);
            });
        });
}

window.filterLogs = function(type, btn) {
    document.querySelectorAll('.log-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.log-item').forEach(item => {
        item.style.display = (type === 'all' || item.dataset.type === type) ? 'flex' : 'none';
    });
}

window.addLog = async function(type, message, extra = {}) {
    try {
        await db.collection('logs').add({
            type,
            message,
            ...extra,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Log kaydetme hatası:', error);
    }
}


// ========================================
// FİREBASE OTOMATİK KURULUM
// ========================================

async function checkFirebaseSetup() {
    try {
        const doc = await db.collection('bot_settings').doc('status').get();
        if (!doc.exists) {
            showSetupButton();
        }
    } catch (error) {
        showSetupButton();
    }
}

function showSetupButton() {
    const btn = document.createElement('button');
    btn.id = 'setupBtn';
    btn.className = 'btn btn-warning';
    btn.style.cssText = 'position: fixed; top: 80px; right: 24px; z-index: 9999;';
    btn.innerHTML = '<i class="fas fa-cog"></i> Firebase Kurulumu';
    btn.onclick = initializeFirebase;
    document.body.appendChild(btn);
}

window.initializeFirebase = async function() {
    if (!confirm('Firebase collections oluşturulsun mu?')) return;
    
    const btn = document.getElementById('setupBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kuruluyor...';
    btn.disabled = true;
    
    try {
        // Bot Settings
        await db.collection('bot_settings').doc('status').set({
            type: 'online',
            text: '150+ Komut',
            activityType: 'PLAYING',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('bot_settings').doc('modes').set({
            patronMode: false,
            stealthMode: false
        });
        
        // Economy Stats
        await db.collection('economy_stats').doc('global').set({
            totalMoney: 0,
            activeUsers: 0,
            interestRate: 2.5
        });
        
        // Demo veriler
        await db.collection('servers').doc('demo').set({
            name: 'Demo Sunucu',
            memberCount: 150,
            channelCount: 12,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('economy').doc('demo').set({
            username: 'Demo Kullanıcı',
            balance: 10000
        });
        
        await addLog('success', 'Firebase kurulumu tamamlandı');
        
        showToast('🎉 Firebase kurulumu tamamlandı!', 'success');
        btn.innerHTML = '<i class="fas fa-check"></i> Kurulum Tamam';
        
        setTimeout(() => btn.remove(), 2000);
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
        btn.innerHTML = '<i class="fas fa-redo"></i> Tekrar Dene';
        btn.disabled = false;
    }
}


// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================

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

function turkishToSlug(text) {
    return text.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatNumber(num) {
    return new Intl.NumberFormat('tr-TR').format(num);
}

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR').format(amount);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ========================================
// MODAL DIŞI TIKLAMALAR
// ========================================

document.addEventListener('click', (e) => {
    if (e.target === document.getElementById('categoryModal')) closeCategoryModal();
    if (e.target === document.getElementById('commandModal')) closeCommandModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCategoryModal();
        closeCommandModal();
    }
});


// ========================================
// LIVE PREVIEW
// ========================================

document.getElementById('logoUrl')?.addEventListener('input', () => {
    updatePreview('logoUrl', 'logoPreview', 'logoPreviewImg');
});

document.getElementById('bannerUrl')?.addEventListener('input', () => {
    updatePreview('bannerUrl', 'bannerPreview', 'bannerPreviewImg');
});


// ========================================
// BAŞLANGIÇ
// ========================================

console.log('✅ Admin.js hazır!');
