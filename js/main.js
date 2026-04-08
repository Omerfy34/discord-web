// ========================================
// MAIN.JS - WOWSY BOT WEBSITE (Firestore)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 WOWSY Bot yükleniyor...');
    
    initNavbar();
    loadHomepageData();
    loadCommands();
    loadStats();
    initModal();
});

// ===== NAVBAR SCROLL EFFECT =====
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active link based on scroll
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            if (window.pageYOffset >= top && window.pageYOffset < bottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${section.id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// ===== LOAD HOMEPAGE DATA (FIRESTORE) =====
function loadHomepageData() {
    console.log('📄 Ana sayfa verileri yükleniyor (Firestore)...');
    
    // Gerçek zamanlı dinleme
    homepageRef.onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('⚠️ Homepage verisi yok');
            return;
        }
        
        const data = doc.data();
        console.log('✅ Homepage yüklendi:', data);
        
        // Bot Name
        if (data.botName) {
            document.getElementById('nav-bot-name').textContent = data.botName;
            document.getElementById('footer-bot-name').textContent = data.botName;
        }
        
        // Logo
        if (data.logoUrl) {
            document.getElementById('nav-logo-img').src = data.logoUrl;
            document.getElementById('hero-bot-avatar').src = data.logoUrl;
            document.getElementById('footer-logo').src = data.logoUrl;
        }
        
        // Invite Link
        if (data.inviteLink) {
            document.getElementById('invite-btn-nav').href = data.inviteLink;
            document.getElementById('invite-btn-hero').href = data.inviteLink;
        }
        
        // Hero Text
        if (data.heroTitle) {
            document.getElementById('hero-title-text').textContent = data.heroTitle;
        }
        
        if (data.heroHighlight) {
            document.getElementById('hero-title-highlight').textContent = data.heroHighlight;
        }
        
        if (data.heroDescription) {
            document.getElementById('hero-description').textContent = data.heroDescription;
        }
        
        if (data.badgeText) {
            const badgeSpan = document.querySelector('#hero-badge span');
            if (badgeSpan) badgeSpan.textContent = data.badgeText;
        }
    }, (error) => {
        console.error('❌ Homepage hatası:', error);
    });
}

// ===== LOAD COMMANDS (FIRESTORE) =====
function loadCommands() {
    console.log('🎮 Komutlar yükleniyor (Firestore)...');
    
    // Gerçek zamanlı dinleme
    commandsRef.onSnapshot((snapshot) => {
        const tabsContainer = document.getElementById('command-tabs');
        const gridContainer = document.getElementById('commands-grid');
        
        tabsContainer.innerHTML = '';
        gridContainer.innerHTML = '';
        
        if (snapshot.empty) {
            console.log('⚠️ Komut yok');
            gridContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">Henüz komut eklenmemiş.</p>';
            return;
        }
        
        const categories = {};
        snapshot.forEach(doc => {
            categories[doc.id] = doc.data();
        });
        
        console.log('✅ Komutlar yüklendi:', Object.keys(categories).length, 'kategori');
        
        // Kategorileri sırala
        const sortedCategories = Object.entries(categories).sort((a, b) => {
            return (a[1].order || 0) - (b[1].order || 0);
        });
        
        let firstCategory = true;
        let allCommands = {};
        
        sortedCategories.forEach(([catKey, category]) => {
            // Tab oluştur
            const tab = document.createElement('button');
            tab.className = `command-tab ${firstCategory ? 'active' : ''}`;
            tab.dataset.category = catKey;
            tab.innerHTML = `
                <i class="fas ${category.icon || 'fa-terminal'}"></i>
                ${escapeHtml(category.name || catKey)}
            `;
            tab.addEventListener('click', () => switchCommandTab(catKey));
            tabsContainer.appendChild(tab);
            
            // Komutları sakla
            if (category.commands) {
                allCommands[catKey] = category;
            }
            
            firstCategory = false;
        });
        
        // İlk kategoriyi göster
        if (sortedCategories.length > 0) {
            renderCommands(sortedCategories[0][0], allCommands);
        }
        
        window._allCommands = allCommands;
        
    }, (error) => {
        console.error('❌ Komut hatası:', error);
    });
}

// ===== SWITCH COMMAND TAB =====
function switchCommandTab(categoryKey) {
    document.querySelectorAll('.command-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.command-tab[data-category="${categoryKey}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    renderCommands(categoryKey, window._allCommands);
}

// ===== RENDER COMMANDS =====
function renderCommands(categoryKey, allCommands) {
    const grid = document.getElementById('commands-grid');
    grid.innerHTML = '';
    
    const category = allCommands[categoryKey];
    if (!category || !category.commands) {
        grid.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">Bu kategoride komut yok.</p>';
        return;
    }
    
    const commands = category.commands;
    const bgColor = category.color ? hexToRgba(category.color, 0.15) : 'rgba(88, 101, 242, 0.15)';
    const iconColor = category.color || '#5865F2';
    
    Object.entries(commands).forEach(([cmdKey, cmd], index) => {
        const card = document.createElement('div');
        card.className = 'command-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="cmd-icon" style="background: ${bgColor}; color: ${iconColor};">
                <i class="fas ${category.icon || 'fa-terminal'}"></i>
            </div>
            <div class="cmd-info">
                <div class="cmd-name">/${escapeHtml(cmd.name || cmdKey)}</div>
                <div class="cmd-short">${escapeHtml(cmd.shortDesc || '')}</div>
            </div>
            <div class="cmd-arrow"><i class="fas fa-chevron-right"></i></div>
        `;
        
        card.addEventListener('click', () => openCommandModal(cmd, category));
        grid.appendChild(card);
    });
}

// ===== INIT MODAL =====
function initModal() {
    const modal = document.getElementById('commandModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

// ===== OPEN COMMAND MODAL =====
function openCommandModal(cmd, category) {
    const modal = document.getElementById('commandModal');
    const bgColor = category.color ? hexToRgba(category.color, 0.2) : 'rgba(88, 101, 242, 0.2)';
    const iconColor = category.color || '#5865F2';
    
    document.getElementById('modalIcon').style.background = bgColor;
    document.getElementById('modalIcon').style.color = iconColor;
    document.getElementById('modalTitle').textContent = `/${cmd.name || ''}`;
    document.getElementById('modalDescription').textContent = cmd.description || 'Açıklama yok';
    document.getElementById('modalUsage').textContent = cmd.usage || `/${cmd.name}`;
    document.getElementById('modalExample').textContent = cmd.example || `/${cmd.name}`;
    document.getElementById('modalPermission').textContent = cmd.permission || 'Herkes';
    
    modal.classList.add('active');
}

// ===== LOAD STATS (FIRESTORE) =====
function loadStats() {
    console.log('📊 İstatistikler yükleniyor (Firestore)...');
    
    // Gerçek zamanlı dinleme
    statsRef.onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('⚠️ Stats verisi yok');
            return;
        }
        
        const data = doc.data();
        console.log('✅ Stats yüklendi:', data);
        
        // Hero stats
        animateNumber('stat-servers', data.server_count || 0);
        animateNumber('stat-users', data.user_count || 0);
        
        // Stats grid
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;
        
        statsGrid.innerHTML = '';
        
        const statsData = [
            { 
                icon: 'fa-server', 
                label: 'Sunucu', 
                value: data.server_count || 0, 
                color: '#57F287' 
            },
            { 
                icon: 'fa-users', 
                label: 'Kullanıcı', 
                value: data.user_count || 0, 
                color: '#5865F2' 
            },
            { 
                icon: 'fa-terminal', 
                label: 'Komut Kullanımı', 
                value: data.total_commands || 0, 
                color: '#FEE75C' 
            },
            { 
                icon: 'fa-clock', 
                label: 'Çalışma Süresi', 
                value: data.uptime || '0s', 
                color: '#EB459E', 
                isText: true 
            }
        ];
        
        statsData.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-icon-big" style="background: ${hexToRgba(stat.color, 0.15)}; color: ${stat.color};">
                    <i class="fas ${stat.icon}"></i>
                </div>
                <span class="stat-number">${stat.isText ? stat.value : formatNumber(stat.value)}</span>
                <span class="stat-label">${stat.label}</span>
            `;
            statsGrid.appendChild(card);
        });
    }, (error) => {
        console.error('❌ Stats hatası:', error);
    });
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
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
    return num.toString();
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const duration = 1500;
    const start = parseInt(el.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = formatNumber(Math.round(current));
    }, 16);
}

console.log('✅ main.js (Firestore) hazır!');
