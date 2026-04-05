// ========================================
// MAIN.JS - WOWSY BOT WEBSITE (FIRESTORE)
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

// ===== LOAD HOMEPAGE DATA FROM FIRESTORE =====
function loadHomepageData() {
    console.log('📄 Ana sayfa verileri yükleniyor...');
    
    db.collection('settings').doc('homepage').onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('⚠️ Firestore\'da homepage verisi yok');
            return;
        }
        
        const data = doc.data();
        console.log('✅ Homepage verileri yüklendi:', data);
        
        // Bot Name
        if (data.botName) {
            const navName = document.getElementById('nav-bot-name');
            const footerName = document.getElementById('footer-bot-name');
            if (navName) navName.textContent = data.botName;
            if (footerName) footerName.textContent = data.botName;
        }
        
        // Logo URL
        if (data.logoUrl) {
            const navLogo = document.getElementById('nav-logo-img');
            const heroAvatar = document.getElementById('hero-bot-avatar');
            const footerLogo = document.getElementById('footer-logo');
            if (navLogo) navLogo.src = data.logoUrl;
            if (heroAvatar) heroAvatar.src = data.logoUrl;
            if (footerLogo) footerLogo.src = data.logoUrl;
        }
        
        // Invite Link
        if (data.inviteLink) {
            const inviteNav = document.getElementById('invite-btn-nav');
            const inviteHero = document.getElementById('invite-btn-hero');
            if (inviteNav) inviteNav.href = data.inviteLink;
            if (inviteHero) inviteHero.href = data.inviteLink;
        }
        
        // Hero Title
        if (data.heroTitle) {
            const heroTitle = document.getElementById('hero-title-text');
            if (heroTitle) heroTitle.textContent = data.heroTitle;
        }
        
        // Hero Highlight
        if (data.heroHighlight) {
            const heroHighlight = document.getElementById('hero-title-highlight');
            if (heroHighlight) heroHighlight.textContent = data.heroHighlight;
        }
        
        // Hero Description
        if (data.heroDescription) {
            const heroDesc = document.getElementById('hero-description');
            if (heroDesc) heroDesc.textContent = data.heroDescription;
        }
        
        // Badge Text
        if (data.badgeText) {
            const badgeSpan = document.querySelector('#hero-badge span');
            if (badgeSpan) badgeSpan.textContent = data.badgeText;
        }
        
    }, (error) => {
        console.error('❌ Homepage yükleme hatası:', error);
    });
}

// ===== LOAD COMMANDS FROM FIRESTORE =====
function loadCommands() {
    console.log('🎮 Komutlar yükleniyor...');
    
    db.collection('commands').orderBy('order', 'asc').onSnapshot((snapshot) => {
        const tabsContainer = document.getElementById('command-tabs');
        const gridContainer = document.getElementById('commands-grid');
        
        if (!tabsContainer || !gridContainer) return;
        
        tabsContainer.innerHTML = '';
        gridContainer.innerHTML = '';
        
        if (snapshot.empty) {
            console.log('⚠️ Firestore\'da komut verisi yok');
            gridContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 40px;">Henüz komut eklenmemiş.</p>';
            return;
        }
        
        console.log('✅ Komutlar yüklendi:', snapshot.size, 'kategori');
        
        let firstCategory = true;
        let allCommands = {};
        let firstCatKey = null;
        
        snapshot.forEach((doc) => {
            const catKey = doc.id;
            const category = doc.data();
            
            if (firstCategory) {
                firstCatKey = catKey;
            }
            
            // Create tab
            const tab = document.createElement('button');
            tab.className = `command-tab ${firstCategory ? 'active' : ''}`;
            tab.dataset.category = catKey;
            tab.innerHTML = `
                <i class="fas ${category.icon || 'fa-terminal'}"></i>
                ${escapeHtml(category.name || catKey)}
            `;
            tab.addEventListener('click', () => switchCommandTab(catKey));
            tabsContainer.appendChild(tab);
            
            // Store commands
            allCommands[catKey] = category;
            
            firstCategory = false;
        });
        
        // Render first category
        if (firstCatKey) {
            renderCommands(firstCatKey, allCommands);
        }
        
        // Store globally
        window._allCommands = allCommands;
        
    }, (error) => {
        console.error('❌ Komut yükleme hatası:', error);
    });
}

// ===== SWITCH COMMAND TAB =====
function switchCommandTab(categoryKey) {
    // Update active tab
    document.querySelectorAll('.command-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.command-tab[data-category="${categoryKey}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Render commands
    renderCommands(categoryKey, window._allCommands);
}

// ===== RENDER COMMANDS =====
function renderCommands(categoryKey, allCommands) {
    const grid = document.getElementById('commands-grid');
    if (!grid) return;
    
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
    
    if (!modal || !closeBtn) return;
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

// ===== OPEN COMMAND MODAL =====
function openCommandModal(cmd, category) {
    const modal = document.getElementById('commandModal');
    if (!modal) return;
    
    const bgColor = category.color ? hexToRgba(category.color, 0.2) : 'rgba(88, 101, 242, 0.2)';
    const iconColor = category.color || '#5865F2';
    
    const modalIcon = document.getElementById('modalIcon');
    if (modalIcon) {
        modalIcon.style.background = bgColor;
        modalIcon.style.color = iconColor;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDescription');
    const modalUsage = document.getElementById('modalUsage');
    const modalExample = document.getElementById('modalExample');
    const modalPerm = document.getElementById('modalPermission');
    
    if (modalTitle) modalTitle.textContent = `/${cmd.name || ''}`;
    if (modalDesc) modalDesc.textContent = cmd.description || 'Açıklama yok';
    if (modalUsage) modalUsage.textContent = cmd.usage || `/${cmd.name}`;
    if (modalExample) modalExample.textContent = cmd.example || `/${cmd.name}`;
    if (modalPerm) modalPerm.textContent = cmd.permission || 'Herkes';
    
    modal.classList.add('active');
}

// ===== LOAD STATS FROM FIRESTORE =====
function loadStats() {
    console.log('📊 İstatistikler yükleniyor...');
    
    db.collection('bot_stats').doc('general').onSnapshot((doc) => {
        if (!doc.exists) {
            console.log('⚠️ Firestore\'da stats verisi yok');
            return;
        }
        
        const data = doc.data();
        console.log('✅ İstatistikler yüklendi:', data);
        
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
                label: 'Komut', 
                value: data.command_count || 0, 
                color: '#FEE75C' 
            },
            { 
                icon: 'fa-clock', 
                label: 'Durum', 
                value: data.uptime || 'online', 
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
        console.error('❌ Stats yükleme hatası:', error);
    });
}

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

console.log('✅ main.js yüklendi! (Firestore)');
