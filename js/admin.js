// ========================================
// ADMIN.JS - Yönetici Paneli (FIRESTORE + STATS)
// ========================================

console.log('🎛️ Admin.js yükleniyor (Firestore + Stats)...');

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

// ===== STATS TABS =====
document.querySelectorAll('.stats-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        
        document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.stats-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// ===== LOAD ALL DATA =====
function loadAllData() {
    loadHomepageData();
    loadBotStatus();
    loadBotStats();
    loadServerList();
    loadEconomyLeaderboard();
    loadMusicSessions();
    loadCommands();
}

// ===== LOAD HOMEPAGE DATA (FIRESTORE) =====
function loadHomepageData() {
    db.collection('settings').doc('homepage').onSnapshot((doc) => {
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
        badgeText: document.getElementById('badgeText').value,
        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('settings').doc('homepage').set(data, { merge: true });
        showToast('✅ Kaydedildi! Ana sayfayı yenile.', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== LOAD BOT STATUS (FIRESTORE) =====
function loadBotStatus() {
    db.collection('bot_stats').doc('general').onSnapshot((doc) => {
        const status = doc.exists ? doc.data() : {};
        const statusEl = document.getElementById('botStatus');
        
        if (!statusEl) return;
        
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('span:last-child');
        
        if (status && status.status === 'online') {
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

// ========================================
// 📊 BOT İSTATİSTİKLERİ (YENİ)
// ========================================

function loadBotStats() {
    console.log('📊 Bot istatistikleri yükleniyor...');
    
    db.collection('bot_stats').doc('general').onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('⚠️ Bot stats bulunamadı');
            return;
        }
        
        const data = doc.data();
        console.log('✅ Bot stats yüklendi:', data);
        
        // Ana kartlar
        document.getElementById('statServers').textContent = formatNumber(data.server_count || 0);
        document.getElementById('statUsers').textContent = formatNumber(data.user_count || 0);
        document.getElementById('statCommands').textContent = data.command_count || 0;
        document.getElementById('statUptime').textContent = data.uptime || '-';
        document.getElementById('statVoice').textContent = data.voice_connections || 0;
        document.getElementById('statPing').textContent = data.ping ? `${data.ping}ms` : '-';
        
        // Son güncelleme
        if (data.last_update) {
            const date = new Date(data.last_update);
            document.getElementById('lastUpdate').textContent = date.toLocaleString('tr-TR');
        }
    });
    
    // Müzik stats
    db.collection('bot_stats').doc('music').onSnapshot((doc) => {
        if (!doc.exists) return;
        
        const data = doc.data();
        document.getElementById('statListeners').textContent = data.total_listeners || 0;
    });
}

// ========================================
// 🏠 SUNUCU LİSTESİ
// ========================================

function loadServerList() {
    console.log('🏠 Sunucu listesi yükleniyor...');
    
    db.collection('bot_stats').doc('servers').onSnapshot((doc) => {
        const container = document.getElementById('serverList');
        const countEl = document.getElementById('serverCount');
        
        if (!doc.exists || !doc.data().servers) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>Henüz sunucu verisi yok</p>
                </div>
            `;
            return;
        }
        
        const servers = doc.data().servers;
        countEl.textContent = `${servers.length} sunucu`;
        
        container.innerHTML = servers.map(server => {
            const iconContent = server.icon 
                ? `<img src="${server.icon}" alt="${server.name}" class="server-icon">`
                : `<div class="server-icon">${server.name.charAt(0).toUpperCase()}</div>`;
            
            const boostBadge = server.boost_level > 0 
                ? `<span class="server-badge boost">Level ${server.boost_level}</span>` 
                : '';
            
            return `
                <div class="server-item">
                    ${iconContent}
                    <div class="server-info">
                        <div class="server-name">${escapeHtml(server.name)}</div>
                        <div class="server-members">
                            <i class="fas fa-users"></i> ${formatNumber(server.member_count)} üye
                            ${server.boost_count > 0 ? `<span style="margin-left: 10px;"><i class="fas fa-gem" style="color: #F47FFF;"></i> ${server.boost_count}</span>` : ''}
                        </div>
                    </div>
                    ${boostBadge}
                </div>
            `;
        }).join('');
    });
}

// ========================================
// 💰 EKONOMİ LEADERBOARD
// ========================================

function loadEconomyLeaderboard() {
    console.log('💰 Ekonomi leaderboard yükleniyor...');
    
    db.collection('leaderboards').doc('economy').onSnapshot((doc) => {
        const container = document.getElementById('leaderboardList');
        const countEl = document.getElementById('economyUserCount');
        const totalMoneyEl = document.getElementById('economyTotalMoney');
        const totalCashEl = document.getElementById('economyTotalCash');
        const totalBankEl = document.getElementById('economyTotalBank');
        const statTotalEl = document.getElementById('statTotalEconomy');
        
        if (!doc.exists) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coins"></i>
                    <p>Henüz ekonomi verisi yok</p>
                </div>
            `;
            return;
        }
        
        const data = doc.data();
        const users = data.users || [];
        
        // Özet bilgiler
        countEl.textContent = `${data.total_users || users.length} kullanıcı`;
        totalMoneyEl.textContent = formatNumber(data.total_economy || 0) + '💰';
        totalCashEl.textContent = formatNumber(data.total_cash || 0) + '💵';
        totalBankEl.textContent = formatNumber(data.total_bank || 0) + '🏦';
        statTotalEl.textContent = formatNumber(data.total_economy || 0);
        
        // Leaderboard listesi
        container.innerHTML = users.slice(0, 50).map((user, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
            
            const avatar = user.avatar 
                ? `<img src="${user.avatar}" alt="${user.username}" class="leaderboard-avatar">`
                : `<div class="leaderboard-avatar" style="background: var(--blurple); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${(user.username || '?').charAt(0).toUpperCase()}</div>`;
            
            return `
                <div class="leaderboard-item ${rankClass}">
                    <div class="leaderboard-rank">${rank}</div>
                    ${avatar}
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${escapeHtml(user.display_name || user.username || 'Bilinmeyen')}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            💵 ${formatNumber(user.cash || 0)} | 🏦 ${formatNumber(user.bank || 0)}
                        </div>
                    </div>
                    <div class="leaderboard-balance">${formatNumber(user.total || 0)}💰</div>
                </div>
            `;
        }).join('');
    });
}

// ========================================
// 🎵 MÜZİK OTURUMLARI
// ========================================

function loadMusicSessions() {
    console.log('🎵 Müzik oturumları yükleniyor...');
    
    db.collection('bot_stats').doc('music').onSnapshot((doc) => {
        const container = document.getElementById('musicList');
        const countEl = document.getElementById('musicActiveCount');
        
        if (!doc.exists) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <p>Aktif müzik oturumu yok</p>
                </div>
            `;
            countEl.textContent = '0 aktif';
            return;
        }
        
        const data = doc.data();
        const sessions = data.sessions || [];
        
        countEl.textContent = `${data.active_count || 0} aktif, ${data.total_connections || 0} bağlantı`;
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <p>Aktif müzik oturumu yok</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sessions.map(session => {
            const statusClass = session.is_playing ? 'playing' : 'paused';
            const statusIcon = session.is_playing ? 'fa-play' : session.is_paused ? 'fa-pause' : 'fa-stop';
            const statusText = session.is_playing ? 'Çalıyor' : session.is_paused ? 'Duraklatıldı' : 'Durduruldu';
            
            return `
                <div class="music-item ${session.is_playing ? 'playing' : ''}">
                    <div class="music-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                    </div>
                    <div class="music-info">
                        <div class="music-server">${escapeHtml(session.guild_name)}</div>
                        <div class="music-channel">
                            <i class="fas fa-volume-up"></i> ${escapeHtml(session.channel_name)} • ${statusText}
                        </div>
                    </div>
                    <div class="music-listeners">
                        <i class="fas fa-headphones"></i>
                        ${session.listeners}
                    </div>
                </div>
            `;
        }).join('');
    });
}

// ========================================
// KOMUT YÖNETİMİ (Aynı kalıyor)
// ========================================

function loadCommands() {
    console.log('🎮 Komutlar yükleniyor...');
    
    db.collection('commands').orderBy('order', 'asc').onSnapshot((snapshot) => {
        const container = document.getElementById('commandsList');
        
        if (!container) return;
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p style="font-size: 16px; margin-bottom: 10px;">Henüz kategori eklenmemiş</p>
                    <p style="font-size: 13px;">Yukarıdaki "Yeni Kategori Ekle" butonuna tıklayarak başla!</p>
                </div>
            `;
            allCommands = {};
            return;
        }
        
        allCommands = {};
        container.innerHTML = '';
        
        let index = 0;
        const totalDocs = snapshot.size;
        
        snapshot.forEach((doc) => {
            const catKey = doc.id;
            const category = doc.data();
            allCommands[catKey] = category;
            
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
                        <button class="btn-icon" onclick="moveCategoryDown('${catKey}')" title="Aşağı Taşı" ${index === totalDocs - 1 ? 'disabled style="opacity:0.3"' : ''}>
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
            index++;
        });
        
        console.log('✅ Komutlar yüklendi:', Object.keys(allCommands).length, 'kategori');
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

// ===== TOGGLE CATEGORY =====
window.toggleCategory = function(catKey) {
    const content = document.getElementById(`cat-${catKey}`);
    const header = document.querySelector(`[data-cat="${catKey}"]`);
    
    if (!content || !header) return;
    
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
    const keys = Object.keys(allCommands);
    const sorted = keys.sort((a, b) => (allCommands[a].order || 0) - (allCommands[b].order || 0));
    const index = sorted.indexOf(catKey);
    
    if (index <= 0) return;
    
    try {
        const prevKey = sorted[index - 1];
        const currentOrder = allCommands[catKey].order || index;
        const prevOrder = allCommands[prevKey].order || index - 1;
        
        await db.collection('commands').doc(catKey).update({ order: prevOrder });
        await db.collection('commands').doc(prevKey).update({ order: currentOrder });
        
        showToast('✅ Kategori yukarı taşındı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

window.moveCategoryDown = async function(catKey) {
    const keys = Object.keys(allCommands);
    const sorted = keys.sort((a, b) => (allCommands[a].order || 0) - (allCommands[b].order || 0));
    const index = sorted.indexOf(catKey);
    
    if (index >= sorted.length - 1) return;
    
    try {
        const nextKey = sorted[index + 1];
        const currentOrder = allCommands[catKey].order || index;
        const nextOrder = allCommands[nextKey].order || index + 1;
        
        await db.collection('commands').doc(catKey).update({ order: nextOrder });
        await db.collection('commands').doc(nextKey).update({ order: currentOrder });
        
        showToast('✅ Kategori aşağı taşındı!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== KATEGORİ MODAL =====
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
            await db.collection('commands').doc(editKey).update({ name, icon, color });
            showToast('✅ Kategori güncellendi!', 'success');
        } else {
            const catKey = name.toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            if (allCommands[catKey]) {
                showToast('❌ Bu isimde kategori zaten var!', 'error');
                return;
            }
            
            const maxOrder = Object.values(allCommands || {}).reduce((max, cat) => Math.max(max, cat.order || 0), 0);
            
            await db.collection('commands').doc(catKey).set({
                name, icon, color, order: maxOrder + 1, commands: {}
            });
            showToast('✅ Kategori eklendi!', 'success');
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
        ? `"${category?.name}" kategorisinde ${cmdCount} komut var! Silmek istediğine emin misin?`
        : `"${category?.name}" kategorisini silmek istediğine emin misin?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        await db.collection('commands').doc(catKey).delete();
        showToast('✅ Kategori silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== KOMUT MODAL =====
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
    
    if (!name || !catKey) {
        showToast('❌ Komut adı gerekli!', 'error');
        return;
    }
    
    const cmdKey = name.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const cmdData = {
        name,
        shortDesc: shortDesc || 'Açıklama yok',
        description: description || shortDesc || 'Açıklama yok',
        usage: usage || `/${name}`,
        example: example || `/${name}`,
        permission: permission || 'Herkes'
    };
    
    try {
        let currentCommands = allCommands[catKey]?.commands || {};
        
        if (oldCmdKey && oldCmdKey !== cmdKey) {
            delete currentCommands[oldCmdKey];
        }
        
        currentCommands[cmdKey] = cmdData;
        
        await db.collection('commands').doc(catKey).update({ commands: currentCommands });
        
        closeCommandModal();
        showToast(oldCmdKey ? '✅ Komut güncellendi!' : '✅ Komut eklendi!', 'success');
        
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
        let currentCommands = { ...(allCommands[catKey]?.commands || {}) };
        delete currentCommands[cmdKey];
        
        await db.collection('commands').doc(catKey).update({ commands: currentCommands });
        showToast('✅ Komut silindi!', 'success');
    } catch (error) {
        showToast('❌ Hata: ' + error.message, 'error');
    }
}

// ===== MODAL KAPAMA =====
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

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString('tr-TR');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('✅ Admin.js hazır! (Firestore + Stats)');
