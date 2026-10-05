/* ===== NeuroViz 主应用逻辑 ===== */

class NeuroVizApp {
    constructor() {
        // Viewer instances
        this.viewers = {};
        this.sliceViewers = {};
        this.chartManager = null;

        // State
        this.currentModule = 'module1';
        this.isDataLoaded = false;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.fpsFrames = 0;
        this.fpsLastTime = performance.now();
        this.pendingFiles = null;

        // Parcellation data
        this.currentAtlas = 'hcp_mmp';
        this.currentHemi = 'both';
        this.atlasColorMap = this.buildAtlasColorMap();

        // Captcha state
        this.captchaText = '';
        this.captchaTextReg = '';

        // Rename target
        this.renameTargetId = null;

        this.init();
    }

    // ===== 初始化 =====
    init() {
        this.setupNavigation();
        this.setupLogin();
        this.setupUserDropdown();
        this.setupSettings();
        this.setupHistory();
        this.setupImport();
        this.setupDataNaming();
        this.setupRename();
        this.setupExport();
        this.setupCitationBar();
        this.loadUserFromStorage();

        // Auto-load standard brain on first visit
        if (this.isLoggedIn) {
            this.applyLoggedInUI();
        }
        setTimeout(() => {
            if (!this.isDataLoaded) {
                this.loadDemoData(true);
            }
        }, 500);

        // FPS counter
        this.startFpsCounter();
    }

    // ===== 导航 =====
    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const moduleId = tab.dataset.module;
                this.switchModule(moduleId);
            });
        });
    }

    switchModule(moduleId) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-module="${moduleId}"]`);
        if (activeTab) activeTab.classList.add('active');

        document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(moduleId);
        if (panel) panel.classList.add('active');

        this.currentModule = moduleId;

        setTimeout(() => {
            switch (moduleId) {
                case 'module1': this.initModule1(); break;
                case 'module2': this.initModule2(); break;
                case 'module3': this.initModule3(); break;
                case 'module4': this.initModule4(); break;
            }
            if (this.chartManager) this.chartManager.resizeAll();
        }, 100);
    }

    // ===== 用户持久化 =====
    loadUserFromStorage() {
        const saved = localStorage.getItem('neuroviz_user');
        if (saved) {
            try {
                const user = JSON.parse(saved);
                this.currentUser = user;
                this.isLoggedIn = true;
                this.applyLoggedInUI();
            } catch (e) { /* ignore parse error */ }
        }
    }

    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem('neuroviz_user', JSON.stringify(this.currentUser));
        }
    }

    getHistoryFromStorage() {
        const saved = localStorage.getItem('neuroviz_history');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return []; }
        }
        return [];
    }

    saveHistoryToStorage(history) {
        localStorage.setItem('neuroviz_history', JSON.stringify(history));
    }

    getAllUsersFromStorage() {
        const saved = localStorage.getItem('neuroviz_all_users');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return {}; }
        }
        return {};
    }

    saveAllUsersToStorage(users) {
        localStorage.setItem('neuroviz_all_users', JSON.stringify(users));
    }

    // ===== 登录系统 =====
    setupLogin() {
        const btnLogin = document.getElementById('btnLogin');
        const btnCloseLogin = document.getElementById('btnCloseLogin');
        const loginModal = document.getElementById('loginModal');

        btnLogin.addEventListener('click', () => {
            if (this.isLoggedIn) {
                this.toggleDropdown();
                return;
            }
            this.resetLoginSteps();
            loginModal.classList.add('active');
        });

        btnCloseLogin.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });

        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.classList.remove('active');
        });

        // 步骤1：检查邮箱
        const btnCheckEmail = document.getElementById('btnCheckEmail');
        btnCheckEmail.addEventListener('click', () => {
            this.checkEmailAndProceed();
        });

        // 回车键提交邮箱
        document.getElementById('loginEmail').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.checkEmailAndProceed();
        });

        // 步骤2：登录提交
        const btnSubmitLogin = document.getElementById('btnSubmitLogin');
        btnSubmitLogin.addEventListener('click', () => {
            this.submitLogin();
        });

        document.getElementById('loginPassword').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitLogin();
        });

        // 步骤3：注册提交
        const btnSubmitRegister = document.getElementById('btnSubmitRegister');
        btnSubmitRegister.addEventListener('click', () => {
            this.submitRegister();
        });

        // 忘记密码
        document.getElementById('linkForgotPwd').addEventListener('click', (e) => {
            e.preventDefault();
            this.setToast('重置密码功能：请输入邮箱后将发送重置链接（演示模式）', 'info');
        });

        // 刷新验证码
        document.getElementById('btnRefreshCaptcha').addEventListener('click', () => {
            this.captchaText = this.generateCaptcha('captchaCanvas');
        });
        document.getElementById('btnRefreshCaptchaReg').addEventListener('click', () => {
            this.captchaTextReg = this.generateCaptcha('captchaCanvasReg');
        });

        // 初始生成验证码
        this.captchaText = this.generateCaptcha('captchaCanvas');
        this.captchaTextReg = this.generateCaptcha('captchaCanvasReg');
    }

    resetLoginSteps() {
        document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
        document.getElementById('loginStep1').classList.add('active');
        document.getElementById('loginTitle').textContent = '欢迎使用 NeuroViz';
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('captchaInput').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regConfirmPwd').value = '';
        document.getElementById('captchaInputReg').value = '';
    }

    checkEmailAndProceed() {
        const email = document.getElementById('loginEmail').value.trim();
        if (!this.validateEmail(email)) {
            this.setToast('请输入有效的邮箱地址', 'error');
            return;
        }

        const allUsers = this.getAllUsersFromStorage();
        if (allUsers[email]) {
            // 已注册 → 进入密码验证 + 验证码
            document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
            document.getElementById('loginStep2').classList.add('active');
            document.getElementById('loginEmailDisplay').textContent = `登录: ${email}`;
            document.getElementById('loginTitle').textContent = '用户登录';
            document.getElementById('loginPassword').focus();
            this.captchaText = this.generateCaptcha('captchaCanvas');
            document.getElementById('captchaInput').value = '';
        } else {
            // 未注册 → 进入注册设置密码 + 验证码
            document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
            document.getElementById('loginStep3').classList.add('active');
            document.getElementById('loginTitle').textContent = '创建新账户';
            this.captchaTextReg = this.generateCaptcha('captchaCanvasReg');
            document.getElementById('captchaInputReg').value = '';
        }
    }

    submitLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const captchaInput = document.getElementById('captchaInput').value.trim();

        if (!password) {
            this.setToast('请输入密码', 'error');
            return;
        }

        if (captchaInput.toLowerCase() !== this.captchaText.toLowerCase()) {
            this.setToast('验证码错误，请重新输入', 'error');
            this.captchaText = this.generateCaptcha('captchaCanvas');
            document.getElementById('captchaInput').value = '';
            return;
        }

        const allUsers = this.getAllUsersFromStorage();
        const user = allUsers[email];

        if (!user || user.password !== password) {
            this.setToast('邮箱或密码错误', 'error');
            document.getElementById('loginPassword').value = '';
            return;
        }

        // 登录成功
        this.currentUser = user;
        this.isLoggedIn = true;
        this.saveUserToStorage();
        document.getElementById('loginModal').classList.remove('active');
        this.applyLoggedInUI();
        this.setToast(`欢迎回来，${user.nickname || user.email.split('@')[0]}！`, 'success');
    }

    submitRegister() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPwd = document.getElementById('regConfirmPwd').value;
        const captchaInput = document.getElementById('captchaInputReg').value.trim();

        if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            this.setToast('密码至少8位，且需包含字母和数字', 'error');
            return;
        }

        if (password !== confirmPwd) {
            this.setToast('两次密码输入不一致', 'error');
            return;
        }

        if (captchaInput.toLowerCase() !== this.captchaTextReg.toLowerCase()) {
            this.setToast('验证码错误，请重新输入', 'error');
            this.captchaTextReg = this.generateCaptcha('captchaCanvasReg');
            document.getElementById('captchaInputReg').value = '';
            return;
        }

        // 创建新用户
        const newUser = {
            email: email,
            password: password,
            nickname: email.split('@')[0],
            avatar: null,
            phone: '',
            orgType: '',
            orgName: '',
            orgDept: '',
            registeredAt: new Date().toISOString(),
        };

        const allUsers = this.getAllUsersFromStorage();
        allUsers[email] = newUser;
        this.saveAllUsersToStorage(allUsers);

        this.currentUser = newUser;
        this.isLoggedIn = true;
        this.saveUserToStorage();

        document.getElementById('loginModal').classList.remove('active');
        this.applyLoggedInUI();
        this.setToast(`注册成功！欢迎，${newUser.nickname}！`, 'success');
    }

    applyLoggedInUI() {
        if (!this.currentUser) return;

        const user = this.currentUser;
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const btnLogin = document.getElementById('btnLogin');

        userAvatar.classList.add('logged-in');
        if (user.avatar) {
            userAvatar.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
        } else {
            userAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
        }
        userName.textContent = user.nickname || user.email.split('@')[0];
        btnLogin.innerHTML = '<i class="fa-solid fa-user-gear"></i> 账户';
        btnLogin.style.background = '#4CAF50';

        // 绑定用户区域点击展开下拉菜单
        const userArea = document.getElementById('userArea');
        userArea.style.cursor = 'pointer';
        userArea.onclick = (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        };
    }

    // ===== 用户下拉菜单 =====
    setupUserDropdown() {
        document.addEventListener('click', () => {
            document.getElementById('userDropdown').classList.remove('active');
        });

        document.getElementById('userDropdown').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const dropdown = document.getElementById('userDropdown');
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                dropdown.classList.remove('active');
                if (action === 'settings') this.openSettings();
                if (action === 'history') this.openHistory();
                if (action === 'logout') this.logout();
            });
        });
    }

    toggleDropdown() {
        if (!this.isLoggedIn) return;
        document.getElementById('userDropdown').classList.toggle('active');
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('neuroviz_user');

        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const btnLogin = document.getElementById('btnLogin');
        const userArea = document.getElementById('userArea');

        userAvatar.classList.remove('logged-in');
        userAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
        userName.textContent = '未登录';
        btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> 登录';
        btnLogin.style.background = 'var(--primary)';
        userArea.style.cursor = 'default';
        userArea.onclick = null;

        this.setToast('已退出登录', 'info');
    }

    // ===== 个人设置 =====
    setupSettings() {
        document.getElementById('btnCloseSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('settingsModal')) {
                document.getElementById('settingsModal').classList.remove('active');
            }
        });

        // 更换头像
        document.getElementById('btnChangeAvatar').addEventListener('click', () => {
            document.getElementById('avatarFileInput').click();
        });

        document.getElementById('avatarFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target.result;
                    document.getElementById('settingsAvatarPreview').innerHTML =
                        `<img src="${dataUrl}" alt="avatar">`;
                    // 暂存到 currentUser（保存时一起提交）
                    this._tempAvatar = dataUrl;
                };
                reader.readAsDataURL(file);
            }
        });

        // 绑定手机号
        document.getElementById('btnBindPhone').addEventListener('click', () => {
            const phone = document.getElementById('settingsPhone').value.trim();
            if (!/^1[3-9]\d{9}$/.test(phone)) {
                this.setToast('请输入有效的手机号', 'error');
                return;
            }
            document.getElementById('phoneCodeRow').style.display = 'block';
            this.setToast('验证码已发送（演示模式：任意6位数字即可）', 'info');
            this._pendingPhone = phone;
        });

        // 保存设置
        document.getElementById('btnSaveSettings').addEventListener('click', () => {
            this.saveSettings();
        });
    }

    openSettings() {
        if (!this.currentUser) return;
        const user = this.currentUser;
        document.getElementById('settingsNickname').value = user.nickname || '';
        document.getElementById('settingsPhone').value = user.phone || '';
        document.getElementById('settingsOrgType').value = user.orgType || '';
        document.getElementById('settingsOrgName').value = user.orgName || '';
        document.getElementById('settingsOrgDept').value = user.orgDept || '';

        const preview = document.getElementById('settingsAvatarPreview');
        if (user.avatar) {
            preview.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
        } else {
            preview.innerHTML = '<i class="fa-solid fa-user"></i>';
        }

        document.getElementById('phoneCodeRow').style.display = 'none';
        document.getElementById('phoneCodeInput').value = '';
        this._tempAvatar = null;
        this._pendingPhone = null;

        document.getElementById('settingsModal').classList.add('active');
    }

    saveSettings() {
        const nickname = document.getElementById('settingsNickname').value.trim();
        const phone = document.getElementById('settingsPhone').value.trim();
        const phoneCode = document.getElementById('phoneCodeInput').value.trim();
        const orgType = document.getElementById('settingsOrgType').value;
        const orgName = document.getElementById('settingsOrgName').value.trim();
        const orgDept = document.getElementById('settingsOrgDept').value.trim();

        // 如果填写了手机号且显示了验证码输入框，需要验证
        if (phone && document.getElementById('phoneCodeRow').style.display !== 'none') {
            if (!phoneCode || phoneCode.length !== 6) {
                this.setToast('请输入6位短信验证码', 'error');
                return;
            }
            // 演示模式：任意6位数字
        }

        this.currentUser.nickname = nickname || this.currentUser.email.split('@')[0];
        this.currentUser.phone = phone;
        this.currentUser.orgType = orgType;
        this.currentUser.orgName = orgName;
        this.currentUser.orgDept = orgDept;

        if (this._tempAvatar) {
            this.currentUser.avatar = this._tempAvatar;
        }

        // 同步到全局用户表
        const allUsers = this.getAllUsersFromStorage();
        allUsers[this.currentUser.email] = this.currentUser;
        this.saveAllUsersToStorage(allUsers);

        this.saveUserToStorage();
        document.getElementById('settingsModal').classList.remove('active');
        this.applyLoggedInUI();
        this.setToast('个人设置已保存', 'success');
    }

    // ===== 历史记录 =====
    setupHistory() {
        document.getElementById('btnCloseHistory').addEventListener('click', () => {
            document.getElementById('historyModal').classList.remove('active');
        });

        document.getElementById('historyModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('historyModal')) {
                document.getElementById('historyModal').classList.remove('active');
            }
        });

        document.getElementById('historySearch').addEventListener('input', () => {
            this.renderHistoryList();
        });
    }

    openHistory() {
        document.getElementById('historySearch').value = '';
        this.renderHistoryList();
        document.getElementById('historyModal').classList.add('active');
    }

    renderHistoryList() {
        const history = this.getHistoryFromStorage();
        const searchQuery = document.getElementById('historySearch').value.trim().toLowerCase();
        const container = document.getElementById('historyList');

        let filtered = history;
        if (searchQuery) {
            filtered = history.filter(h => h.name.toLowerCase().includes(searchQuery));
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i class="fa-solid fa-inbox"></i>
                    <p>${searchQuery ? '未找到匹配记录' : '暂无历史记录'}</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map((h, index) => {
            const icon = this.getHistoryIcon(h.type);
            const date = new Date(h.createdAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const fileCount = h.files ? h.files.length : 0;
            const fileInfo = fileCount > 0 ? `${fileCount} 个文件` : '空数据集';

            return `
                <div class="history-item" data-id="${h.id}">
                    <div class="history-item-icon">${icon}</div>
                    <div class="history-item-info">
                        <div class="history-item-name">${this.escapeHtml(h.name)}</div>
                        <div class="history-item-meta">${dateStr} · ${fileInfo} · ${h.type || '多模态数据'}</div>
                    </div>
                    <div class="history-item-actions">
                        <button title="加载此数据" onclick="window.neuroVizApp.loadHistoryItem('${h.id}')">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <button title="重命名" onclick="window.neuroVizApp.openRename('${h.id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button title="删除" class="btn-delete" onclick="window.neuroVizApp.deleteHistoryItem('${h.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    getHistoryIcon(type) {
        const icons = {
            '结构像数据': '<i class="fa-solid fa-brain"></i>',
            '功能像数据': '<i class="fa-solid fa-wave-square"></i>',
            '弥散像数据': '<i class="fa-solid fa-draw-polygon"></i>',
            '多模态数据': '<i class="fa-solid fa-layer-group"></i>',
        };
        return icons[type] || icons['多模态数据'];
    }

    addHistoryItem(name, files, type) {
        const history = this.getHistoryFromStorage();
        const item = {
            id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            type: type || '多模态数据',
            files: files ? Array.from(files).map(f => ({ name: f.name, size: f.size })) : [],
            createdAt: new Date().toISOString(),
        };
        history.unshift(item);
        this.saveHistoryToStorage(history);
        return item;
    }

    loadHistoryItem(id) {
        const history = this.getHistoryFromStorage();
        const item = history.find(h => h.id === id);
        if (!item) return;

        document.getElementById('historyModal').classList.remove('active');
        this.isDataLoaded = true;
        this.setToast(`已加载历史数据: ${item.name}`, 'success');
        document.getElementById('statusText').innerHTML =
            `<i class="fa-solid fa-circle-check" style="color:#4CAF50;"></i> 已加载: ${this.escapeHtml(item.name)}`;

        // 隐藏引用栏（表示加载的是用户数据）
        const citationBar = document.getElementById('citationBar');
        if (citationBar) citationBar.style.display = 'none';

        this.afterDataLoad();
    }

    openRename(id) {
        this.renameTargetId = id;
        const history = this.getHistoryFromStorage();
        const item = history.find(h => h.id === id);
        if (item) {
            document.getElementById('renameInput').value = item.name;
        }
        document.getElementById('renameModal').classList.add('active');
    }

    deleteHistoryItem(id) {
        const history = this.getHistoryFromStorage();
        const filtered = history.filter(h => h.id !== id);
        this.saveHistoryToStorage(filtered);
        this.renderHistoryList();
        this.setToast('记录已删除', 'info');
    }

    // ===== 重命名弹窗 =====
    setupRename() {
        document.getElementById('btnCloseRename').addEventListener('click', () => {
            document.getElementById('renameModal').classList.remove('active');
        });
        document.getElementById('renameModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('renameModal')) {
                document.getElementById('renameModal').classList.remove('active');
            }
        });
        document.getElementById('btnConfirmRename').addEventListener('click', () => {
            this.confirmRename();
        });
        document.getElementById('renameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirmRename();
        });
    }

    confirmRename() {
        const newName = document.getElementById('renameInput').value.trim();
        if (!newName) {
            this.setToast('名称不能为空', 'error');
            return;
        }

        const history = this.getHistoryFromStorage();
        const item = history.find(h => h.id === this.renameTargetId);
        if (item) {
            item.name = newName;
            this.saveHistoryToStorage(history);
        }
        document.getElementById('renameModal').classList.remove('active');
        this.renderHistoryList();
        this.setToast('重命名成功', 'success');
    }

    // ===== 数据导入 =====
    setupImport() {
        const btnImport = document.getElementById('btnImport');
        const btnCloseImport = document.getElementById('btnCloseImport');
        const importModal = document.getElementById('importModal');
        const btnLoadDemo = document.getElementById('btnLoadDemo');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        btnImport.addEventListener('click', () => {
            importModal.classList.add('active');
        });

        btnCloseImport.addEventListener('click', () => {
            importModal.classList.remove('active');
        });

        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) importModal.classList.remove('active');
        });

        // 拖拽上传
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                importModal.classList.remove('active');
                this.triggerDataNaming(files, '多模态数据');
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importModal.classList.remove('active');
                this.triggerDataNaming(e.target.files, '多模态数据');
                fileInput.value = '';
            }
        });

        // 导入模块卡片
        document.querySelectorAll('.import-module-card').forEach(card => {
            card.addEventListener('click', () => {
                importModal.classList.remove('active');
                const type = card.dataset.type;
                const labels = { structural: '结构像数据', functional: '功能像数据', diffusion: '弥散像数据' };
                fileInput.click();
                // 标记类型，在文件选择后使用
                this._pendingImportType = labels[type];
            });
        });

        // 加载演示数据
        btnLoadDemo.addEventListener('click', () => {
            this.loadDemoData(false);
            importModal.classList.remove('active');
        });
    }

    triggerDataNaming(files, type) {
        this.pendingFiles = files;
        this._pendingType = type || '多模态数据';

        const now = new Date();
        const defaultName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        document.getElementById('dataNameInput').value = '';
        document.getElementById('defaultDataName').textContent = defaultName;
        document.getElementById('dataNameModal').classList.add('active');
        document.getElementById('dataNameInput').focus();
    }

    // ===== 数据命名弹窗 =====
    setupDataNaming() {
        document.getElementById('btnCloseDataName').addEventListener('click', () => {
            document.getElementById('dataNameModal').classList.remove('active');
            this.pendingFiles = null;
        });

        document.getElementById('dataNameModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('dataNameModal')) {
                document.getElementById('dataNameModal').classList.remove('active');
            }
        });

        document.getElementById('btnSkipName').addEventListener('click', () => {
            const defaultName = document.getElementById('defaultDataName').textContent;
            this.confirmDataName(defaultName);
        });

        document.getElementById('btnConfirmName').addEventListener('click', () => {
            const name = document.getElementById('dataNameInput').value.trim();
            const defaultName = document.getElementById('defaultDataName').textContent;
            this.confirmDataName(name || defaultName);
        });

        document.getElementById('dataNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = document.getElementById('dataNameInput').value.trim();
                const defaultName = document.getElementById('defaultDataName').textContent;
                this.confirmDataName(name || defaultName);
            }
        });
    }

    confirmDataName(name) {
        const files = this.pendingFiles;
        const type = this._pendingType || '多模态数据';

        // 保存到历史记录
        if (this.isLoggedIn) {
            this.addHistoryItem(name, files, type);
        }

        const names = files ? Array.from(files).map(f => f.name).join(', ') : '无文件';
        this.setToast(`数据 "${name}" 已就绪 (${files ? files.length : 0} 个文件)`, 'success');
        this.isDataLoaded = true;

        document.getElementById('dataNameModal').classList.remove('active');
        document.getElementById('statusText').innerHTML =
            `<i class="fa-solid fa-circle-check" style="color:#4CAF50;"></i> 当前数据: ${this.escapeHtml(name)}`;

        // 隐藏引用栏
        document.getElementById('citationBar').style.display = 'none';

        this.pendingFiles = null;
        this.afterDataLoad();
    }

    loadDemoData(silent = false) {
        this.isDataLoaded = true;
        if (!silent) {
            this.setToast('演示数据集加载成功！所有模块已就绪', 'success');
        }
        document.getElementById('statusText').innerHTML =
            '<i class="fa-solid fa-circle-check" style="color:#4CAF50;"></i> 演示模式 — 标准脑模板数据就绪';

        // 显示引用栏
        document.getElementById('citationBar').style.display = '';

        this.afterDataLoad();
    }

    afterDataLoad() {
        switch (this.currentModule) {
            case 'module1': this.initModule1(); break;
            case 'module2': this.initModule2(); break;
            case 'module3': this.initModule3(); break;
            case 'module4': this.initModule4(); break;
        }
    }

    // ===== 模块1：结构分区可视化 =====
    async initModule1() {
        if (this.viewers['viewer1']) return;

        const viewer = new BrainViewer('viewer3D1', {
            onRegionClick: (userData) => this.handleRegionClick(userData, 'regionInfo1'),
        });
        this.viewers['viewer1'] = viewer;

        await viewer.createFullBrain(this.currentAtlas, this.currentHemi);

        viewer.addSubcorticalStructures([
            ...SUBCORTICAL_STRUCTURES,
            ...CEREBELLAR_REGIONS,
            ...WHITE_MATTER_STRUCTURES,
        ]);

        this.buildStructuralLegend();
        this.setupLegendSearch();
        this.setupAtlasControls();
        this.updateAtlasWatermark();

        // 清除高亮按钮
        const btnClearFocus = document.getElementById('btnClearFocus1');
        if (btnClearFocus) {
            btnClearFocus.addEventListener('click', () => {
                viewer.clearCorticalFocus();
                viewer.clearSubcorticalFocus();
                viewer.resetView();
                document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
                document.getElementById('regionInfo1').innerHTML = '<p class="placeholder">点击右侧分区名称查看详情并跳转3D视图</p>';
            });
        }
    }

    // 将 hex 颜色字符串 "#RRGGBB" 解析为 {r, g, b} (0-1) 对象
    parseColor(hex) {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16) / 255,
            g: parseInt(hex.substring(2, 4), 16) / 255,
            b: parseInt(hex.substring(4, 6), 16) / 255,
        };
    }

    buildAtlasColorMap() {
        const map = {};
        const regions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        regions.forEach((r) => {
            map[r.id] = r.color;
        });
        return map;
    }

    setupLegendSearch() {
        const searchInput = document.getElementById('legendSearchInput');
        const searchHint = document.getElementById('legendSearchHint');
        if (!searchInput) return;

        // 构建搜索索引：中文名 + 英文 id
        const allLegendItems = document.querySelectorAll('#structuralLegend .legend-item');
        const searchIndex = [];
        allLegendItems.forEach(item => {
            const nameEl = item.querySelector('.legend-name');
            const regionId = item.dataset.region || '';
            const name = nameEl ? nameEl.textContent.trim() : '';
            const aliases = item.dataset.aliases || '';
            searchIndex.push({ element: item, name, id: regionId, aliases });
        });

        let isComposing = false;

        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            searchHint.classList.remove('visible');
            searchInput.classList.remove('error');

            // 清空时不改变图例显示，保持所有项可点击
            if (!query) return;

            // 查找匹配项（名称、ID、别名均参与匹配）
            const matches = searchIndex.filter(entry =>
                entry.name.toLowerCase().includes(query) ||
                entry.id.toLowerCase().includes(query) ||
                entry.aliases.toLowerCase().includes(query)
            );

            if (matches.length === 0) {
                // 输入法组合过程中不提示错误，避免拼音中间态误报
                if (isComposing) return;
                // 未找到：显示错误提示
                searchHint.textContent = '未找到该脑区';
                searchHint.classList.add('visible');
                searchInput.classList.add('error');
            } else {
                // 找到匹配：滚动到第一个匹配项并触发点击跳转
                // 不隐藏其他项，保证用户仍可手动点击任意图例
                const firstMatch = matches[0].element;
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstMatch.click();
                // 跳转瞬间清空搜索框
                searchInput.value = '';
                searchHint.classList.remove('visible');
                searchInput.classList.remove('error');
            }
        };

        // 处理中文输入法：组合过程中不报错，但不自动跳转
        searchInput.addEventListener('compositionstart', () => { isComposing = true; });
        searchInput.addEventListener('compositionend', () => { isComposing = false; });

        // 不再绑定 input 事件 —— 仅通过回车或搜索按钮触发跳转

        // ESC 清空搜索
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearLegendSearch();
            }
            // 回车键触发搜索并跳转
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // 搜索按钮点击触发搜索并跳转
        const searchBtn = document.getElementById('legendSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                performSearch();
            });
        }
    }

    // 清空搜索框状态（含重置视野）
    clearLegendSearch() {
        const searchInput = document.getElementById('legendSearchInput');
        const searchHint = document.getElementById('legendSearchHint');
        if (!searchInput) return;
        searchInput.value = '';
        searchHint.classList.remove('visible');
        searchInput.classList.remove('error');
        const viewer = this.viewers['viewer1'];
        if (viewer) {
            viewer.clearCorticalFocus();
            viewer.clearSubcorticalFocus();
            viewer.resetView();
        }
        document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
        document.getElementById('regionInfo1').innerHTML = '<p class="placeholder">点击右侧分区名称查看详情并跳转3D视图</p>';
        searchInput.blur();
    }

    buildStructuralLegend() {
        const corticalEl = document.getElementById('corticalLegend');
        const subcorticalEl = document.getElementById('subcorticalLegend');
        const cerebellarEl = document.getElementById('cerebellarLegend');
        const whiteMatterEl = document.getElementById('whiteMatterLegend');

        // 脑叶英文 → 中文
        const lobeMap = {
            frontal: '额叶', parietal: '顶叶', temporal: '颞叶',
            occipital: '枕叶', insula: '岛叶', cingulate: '扣带/内侧',
            '其他皮层': '其他皮层'
        };
        // 渲染全部皮层分区（不只是前16个）
        const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        corticalEl.innerHTML = atlasRegions.map(r => {
            const aliases = (r.aliases || []).join(' ');
            return `
            <div class="legend-item" data-region="${r.id}" data-color="${r.color}" data-type="cortical" data-aliases="${aliases}">
                <div class="legend-color" style="background:${r.color};"></div>
                <span class="legend-name">${r.name}</span>
                <span style="font-size:10px;color:var(--text-muted);">${lobeMap[r.lobe] || r.lobe}</span>
            </div>
        `}).join('');

        subcorticalEl.innerHTML = SUBCORTICAL_STRUCTURES.map(s => `
            <div class="legend-item" data-region="${s.id}" data-color="${s.color}" data-type="subcortical">
                <div class="legend-color" style="background:${s.color};"></div>
                <span class="legend-name">${s.name}</span>
                <span style="font-size:10px;color:var(--text-muted);">${s.region}</span>
            </div>
        `).join('');

        cerebellarEl.innerHTML = CEREBELLAR_REGIONS.map(c => `
            <div class="legend-item" data-region="${c.id}" data-color="${c.color}" data-type="cerebellar">
                <div class="legend-color" style="background:${c.color};"></div>
                <span class="legend-name">${c.name}</span>
                <span style="font-size:10px;color:var(--text-muted);">${c.region}</span>
            </div>
        `).join('');

        whiteMatterEl.innerHTML = WHITE_MATTER_STRUCTURES.map(w => `
            <div class="legend-item" data-region="${w.id}" data-color="${w.color}" data-type="whitematter">
                <div class="legend-color" style="background:${w.color};"></div>
                <span class="legend-name">${w.name}</span>
                <span style="font-size:10px;color:var(--text-muted);">${w.region}</span>
            </div>
        `).join('');

        // 点击图例项 → 高亮 + 跳转视角
        document.querySelectorAll('#structuralLegend .legend-item').forEach(item => {
            item.addEventListener('click', () => {
                const regionId = item.dataset.region;
                const regionColor = item.dataset.color;
                const regionType = item.dataset.type;
                const viewer = this.viewers['viewer1'];
                if (!viewer) {
                    console.warn('[NeuroViz] Legend click: no viewer available');
                    return;
                }

                console.log('[NeuroViz] Legend click:', regionId, regionColor, regionType);

                // 先清除所有高亮
                viewer.clearCorticalFocus();
                viewer.clearSubcorticalFocus();
                this._focusedRegion = null;

                // 取消其他图例项的选中态
                document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');

                if (regionType === 'cortical') {
                    // 皮层区域：使用顶点颜色聚焦
                    viewer.focusCorticalRegion(regionColor);
                    this._focusedRegion = { id: regionId, color: regionColor, type: 'cortical' };

                    // 计算区域空间信息（中心 + 表面法线）
                    const info = viewer.getRegionSpatialInfo(regionColor, 'both');
                    console.log('[NeuroViz] Region info for', regionId, ':', info);
                    const brainCenter = viewer.brainCenter || { x: 0, y: 0, z: 0 };
                    if (info) {
                        // 相机放在区域远离大脑中心的一侧，目标始终为大脑中心，保证旋转中心稳定
                        const camDist = 160;
                        const dx = info.x - brainCenter.x;
                        const dy = info.y - brainCenter.y;
                        const dz = info.z - brainCenter.z;
                        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                        const camPos = [
                            info.x + (dx / len) * camDist,
                            info.y + (dy / len) * camDist,
                            info.z + (dz / len) * camDist
                        ];
                        viewer.animateCameraTo(camPos, [brainCenter.x, brainCenter.y, brainCenter.z]);
                    } else {
                        console.warn('[NeuroViz] No spatial info found for', regionId);
                        viewer.animateCameraTo([brainCenter.x, brainCenter.y + 40, brainCenter.z + 240], [brainCenter.x, brainCenter.y, brainCenter.z]);
                    }
                } else {
                    // 皮层下/小脑/白质：皮层透明化 + 高亮球体
                    viewer.focusSubcorticalRegion(regionId);
                    this._focusedRegion = { id: regionId, color: regionColor, type: 'subcortical' };

                    // 飞向该结构，目标保持为大脑中心，避免旋转中心跑到结构边缘
                    const pos = viewer.getSubcorticalPosition(regionId);
                    const brainCenter = viewer.brainCenter || { x: 0, y: 0, z: 0 };
                    const isCerebellar = pos.y < -35;
                    const camDist = isCerebellar ? 180 : 140;
                    const dx = pos.x - brainCenter.x;
                    const dy = pos.y - brainCenter.y;
                    const dz = pos.z - brainCenter.z;
                    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                    const camPos = [
                        pos.x + (dx / len) * camDist,
                        pos.y + (dy / len) * camDist,
                        pos.z + (dz / len) * camDist
                    ];
                    viewer.animateCameraTo(camPos, [brainCenter.x, brainCenter.y, brainCenter.z]);
                }

                this.showRegionInfo(regionId, 'regionInfo1');
            });
        });
    }

    updateAtlasWatermark() {
        const watermark = document.getElementById('watermark1');
        if (!watermark) return;
        const meta = (typeof ATLAS_METADATA !== 'undefined' ? ATLAS_METADATA[this.currentAtlas] : null) || { name: this.currentAtlas };
        watermark.textContent = `数据来源：ICBM MNI152 / ${meta.name} (${meta.citation})`;
    }

    setupAtlasControls() {
        const atlasSelect = document.getElementById('atlasSelect');
        const hemiSelect = document.getElementById('hemiSelect');
        const btnReset = document.getElementById('btnResetView1');
        const btnScreenshot = document.getElementById('btnScreenshot1');

        atlasSelect.addEventListener('change', async () => {
            this.currentAtlas = atlasSelect.value;
            this.atlasColorMap = this.buildAtlasColorMap();
            this.setToast(`已切换到 ${atlasSelect.options[atlasSelect.selectedIndex].text}`, 'info');
            const viewer = this.viewers['viewer1'];
            if (viewer) {
                await viewer.createFullBrain(this.currentAtlas, this.currentHemi);
                viewer.addSubcorticalStructures([
                    ...SUBCORTICAL_STRUCTURES,
                    ...CEREBELLAR_REGIONS,
                    ...WHITE_MATTER_STRUCTURES,
                ]);
                viewer.clearCorticalFocus();
                viewer.clearSubcorticalFocus();
            }
            this.buildStructuralLegend();
            this.setupLegendSearch();
            this.updateAtlasWatermark();
            document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
            document.getElementById('regionInfo1').innerHTML = '<p class="placeholder">点击右侧分区名称查看详情并跳转3D视图</p>';
        });

        hemiSelect.addEventListener('change', async () => {
            this.currentHemi = hemiSelect.value;
            const viewer = this.viewers['viewer1'];
            if (viewer) {
                await viewer.createFullBrain(this.currentAtlas, this.currentHemi);
                viewer.addSubcorticalStructures([
                    ...SUBCORTICAL_STRUCTURES,
                    ...CEREBELLAR_REGIONS,
                    ...WHITE_MATTER_STRUCTURES,
                ]);
                viewer.clearCorticalFocus();
                viewer.clearSubcorticalFocus();
            }
            document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
            document.getElementById('regionInfo1').innerHTML = '<p class="placeholder">点击右侧分区名称查看详情并跳转3D视图</p>';
        });

        btnReset.addEventListener('click', () => {
            const viewer = this.viewers['viewer1'];
            if (viewer) {
                viewer.resetView();
                viewer.clearCorticalFocus();
                viewer.clearSubcorticalFocus();
            }
            document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
            document.getElementById('regionInfo1').innerHTML = '<p class="placeholder">点击右侧分区名称查看详情并跳转3D视图</p>';
        });

        btnScreenshot.addEventListener('click', () => {
            const viewer = this.viewers['viewer1'];
            if (viewer) {
                const dataUrl = viewer.screenshot();
                this.downloadImage(dataUrl, 'neuroviz-structural.png');
            }
        });
    }

    handleRegionClick(userData, infoPanelId) {
        const viewer = this.viewers['viewer1'] || this.viewers['viewer4'];
        if (!viewer) return;

        if (userData.type === 'subcortical') {
            this.showRegionInfo(userData.id, infoPanelId);
            viewer.clearCorticalFocus();
            viewer.focusSubcorticalRegion(userData.id);

            // 飞向结构，目标保持为大脑中心
            const pos = viewer.getSubcorticalPosition(userData.id);
            const brainCenter = viewer.brainCenter || { x: 0, y: 0, z: 0 };
            const camDist = 140;
            const dx = pos.x - brainCenter.x;
            const dy = pos.y - brainCenter.y;
            const dz = pos.z - brainCenter.z;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
            const camPos = [
                pos.x + (dx / len) * camDist,
                pos.y + (dy / len) * camDist,
                pos.z + (dz / len) * camDist
            ];
            viewer.animateCameraTo(camPos, [brainCenter.x, brainCenter.y, brainCenter.z]);

            // 更新图例选中态
            document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
            const legendItem = document.querySelector(`#structuralLegend .legend-item[data-region="${userData.id}"]`);
            if (legendItem) {
                legendItem.classList.add('selected');
                legendItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (userData.type === 'cortex') {
            // 皮层点击：使用 three-brain 反查的区域 ID
            const regionId = userData.regionId;
            if (!regionId) return;
            this.showRegionInfo(regionId, infoPanelId);
            if (viewer) {
                const regionColor = this.atlasColorMap[regionId];
                if (regionColor) {
                    viewer.clearSubcorticalFocus();
                    viewer.focusCorticalRegion(regionColor);
                    const info = viewer.getRegionSpatialInfo(regionColor, 'both');
                    const brainCenter = viewer.brainCenter || { x: 0, y: 0, z: 0 };
                    if (info) {
                        const camDist = 160;
                        const dx = info.x - brainCenter.x;
                        const dy = info.y - brainCenter.y;
                        const dz = info.z - brainCenter.z;
                        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                        viewer.animateCameraTo(
                            [info.x + (dx / len) * camDist, info.y + (dy / len) * camDist, info.z + (dz / len) * camDist],
                            [brainCenter.x, brainCenter.y, brainCenter.z]
                        );
                    }
                }
            }
            // 更新图例选中态
            document.querySelectorAll('#structuralLegend .legend-item').forEach(el => el.classList.remove('selected'));
            const legendItem = document.querySelector(`#structuralLegend .legend-item[data-region="${regionId}"]`);
            if (legendItem) {
                legendItem.classList.add('selected');
                legendItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    showRegionInfo(regionId, panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 先查旧 Desikan REGION_DETAILS（兼容旧数据）
        const detail = (typeof REGION_DETAILS !== 'undefined') ? REGION_DETAILS[regionId] : undefined;
        if (detail) {
            panel.innerHTML = `
                <div class="region-info-card">
                    <h4>${detail.name} <small style="color:var(--text-muted);font-weight:400;">${detail.nameEn}</small></h4>
                    <div class="info-func"><i class="fa-solid fa-brain"></i> ${detail.func}</div>
                    <div class="info-row"><span>体积</span><span>${detail.volume}</span></div>
                    <div class="info-row"><span>皮层厚度</span><span>${detail.thickness}</span></div>
                    <div class="info-row"><span>表面积</span><span>${detail.area}</span></div>
                    <p class="ref">文献引用: ${detail.ref}</p>
                </div>
            `;
            return;
        }

        // 查找皮层下结构
        const subcFound = [...SUBCORTICAL_STRUCTURES, ...CEREBELLAR_REGIONS, ...WHITE_MATTER_STRUCTURES]
            .find(s => s.id === regionId);
        if (subcFound) {
            panel.innerHTML = `
                <div class="region-info-card">
                    <h4>${subcFound.name}</h4>
                    <div class="info-row"><span>分类</span><span>${subcFound.region}</span></div>
                    <div class="info-row"><span>ID</span><span>${subcFound.id}</span></div>
                    <p class="ref">Fischl et al., 2002, Neuron</p>
                </div>
            `;
            return;
        }

        // 当前图谱的皮层区域
        const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        const atlasRegion = atlasRegions.find(r => r.id === regionId);
        if (atlasRegion) {
            const color = atlasRegion.color || '#888';
            const hemi = atlasRegion.hemi === 'left' ? '左半球' : atlasRegion.hemi === 'right' ? '右半球' : '未知';
            const lobeMap = {
                frontal: '额叶', parietal: '顶叶', temporal: '颞叶',
                occipital: '枕叶', insula: '岛叶', cingulate: '扣带/内侧'
            };
            const lobeName = lobeMap[atlasRegion.lobe] || atlasRegion.lobe || '其他';
            // 基于脑叶生成一段功能描述
            const lobeFuncDesc = {
                frontal: '额叶区域，参与运动控制、执行功能、决策与工作记忆。',
                parietal: '顶叶区域，参与躯体感觉整合、空间注意与视觉运动协调。',
                temporal: '颞叶区域，参与听觉处理、语言理解与记忆编码。',
                occipital: '枕叶区域，参与视觉信息的分层处理与整合。',
                insula: '岛叶区域，参与躯体感觉、内脏感觉与情绪加工。',
                cingulate: '扣带/内侧区域，参与情绪调节、自我参照与认知控制。'
            }[atlasRegion.lobe] || '皮层分区，参与多种高级脑功能。';
            // 尝试补充更具体的描述
            const funcDesc = this._getRegionSpecificDesc(regionId, atlasRegion) || lobeFuncDesc;

            // 从 3D 视图获取该区域在当前模型中的顶点数
            const viewer = this.viewers['viewer1'] || this.viewers['viewer4'];
            let vertexInfo = '';
            if (viewer && typeof viewer.getRegionVertexCount === 'function') {
                const count = viewer.getRegionVertexCount(regionId);
                if (count !== null) {
                    vertexInfo = `<div class="info-row"><span>模型顶点</span><span>${count.toLocaleString()}</span></div>`;
                }
            }

            // 别名
            const aliases = (atlasRegion.aliases || []).filter(a => a && a.trim());
            const aliasesHtml = aliases.length > 0
                ? `<div class="info-row"><span>别名</span><span>${aliases.slice(0, 6).join('、')}</span></div>`
                : '';

            const meta = (typeof ATLAS_METADATA !== 'undefined' ? ATLAS_METADATA[this.currentAtlas] : null) || { name: this.currentAtlas, citation: '' };

            panel.innerHTML = `
                <div class="region-info-card">
                    <h4>${atlasRegion.name}</h4>
                    <div class="info-func"><i class="fa-solid fa-brain"></i> ${funcDesc}</div>
                    <div class="info-row"><span>半球</span><span>${hemi}</span></div>
                    <div class="info-row"><span>脑叶</span><span>${lobeName}</span></div>
                    ${aliasesHtml}
                    <div class="info-row"><span>图谱</span><span>${meta.name}</span></div>
                    <div class="info-row"><span>区域ID</span><span>${regionId}</span></div>
                    ${vertexInfo}
                    <div class="info-row"><span>颜色</span><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:${color};vertical-align:middle;margin-right:4px;"></span></div>
                    <p class="ref">${meta.citation}${meta.description ? ' · ' + meta.description : ''}</p>
                </div>
            `;
            return;
        }

        // 未找到
        panel.innerHTML = '<p class="placeholder">未找到该区域信息</p>';
    }

    _getRegionSpecificDesc(regionId, region) {
        // 根据区域 ID 或名称给出更具体的功能描述
        const code = regionId.replace(/^[LR]_/, '').replace(/_ROI$/, '');
        const name = region.name || '';
        if (/V[1-8]|V3A|V3B|V3CD|V4t|V6|V6A|V7|V8|VIP|VMV|VVC|LO[123]|PIT/.test(code)) {
            return '视觉皮层区域，参与视觉信息的层级处理、形状/运动/颜色识别。';
        }
        if (/A[145]|LBelt|MBelt|PBelt|TA2|STV/.test(code)) {
            return '听觉皮层区域，参与声音频率、语义与听觉空间定位处理。';
        }
        if (/44|45|47/.test(code) || name.includes('布洛卡')) {
            return '经典语言产生区，参与语音加工、句法与口语输出。';
        }
        if (/4|6a|6d|6ma|6mp|6r|6v/.test(code)) {
            return '运动与前运动皮层，参与随意运动计划、执行与运动学习。';
        }
        if (/1|2|3a|3b|43/.test(code)) {
            return '初级与联合体感皮层，参与躯体感觉、触觉与本体感觉处理。';
        }
        if (/H$|HIP|EC|PreS|ProS|PHA|PH|PHT|PeEc/.test(code)) {
            return '内侧颞叶/海马系统区域，参与情景记忆编码、空间导航与嗅周加工。';
        }
        if (/FFC/.test(code)) {
            return '梭状回面部区，参与面孔识别与视觉专家化加工。';
        }
        if (/FEF|PEF|SCEF/.test(code)) {
            return '眼动控制网络区域，参与眼跳、注意转移与视觉空间注意。';
        }
        if (/9|46|10d/.test(code)) {
            return '背外侧/背侧前额叶区域，参与工作记忆、认知控制与目标导向行为。';
        }
        if (/10v|OFC|pOFC|11|14/.test(code)) {
            return '腹内侧/眶额皮层区域，参与价值评估、决策与情绪调节。';
        }
        if (/24|25|32|33|cingulate|扣带/.test(name)) {
            return '扣带皮层区域，参与情绪调节、疼痛、冲突监控与自我参照加工。';
        }
        if (/13|52|55|FOP|OP|PoI|岛叶|岛盖/.test(name)) {
            return '岛叶/岛盖区域，参与躯体感觉、内脏感觉、厌恶与情绪意识。';
        }
        return null;
    }

    // ===== 模块2：功能网络可视化 =====
    initModule2() {
        document.querySelectorAll('.func-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const viewId = tab.dataset.view;
                document.querySelectorAll('.func-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.func-view').forEach(v => v.classList.remove('active'));
                const view = document.getElementById(`view-${viewId}`);
                if (view) view.classList.add('active');

                setTimeout(() => {
                    if (!this.chartManager) this.chartManager = new ChartManager();
                    switch (viewId) {
                        case 'connectivity':
                            this.chartManager.initHeatmap('chartHeatmap');
                            break;
                        case 'chord':
                            this.chartManager.initChord('chartChord');
                            break;
                        case 'circular':
                            this.chartManager.initCircular('chartCircular');
                            break;
                    }
                }, 150);
            });
        });

        if (!this.viewers['viewer2']) {
            const viewer = new BrainViewer('viewer3D2');
            viewer.createFullBrain(null, 'both');
            viewer.addNetworkOverlay(YEO7_NETWORKS);
            this.viewers['viewer2'] = viewer;
        }

        if (!this.viewers['activation']) {
            const actViewer = new BrainViewer('viewer3DActivation');
            actViewer.createFullBrain(null, 'both');
            const motorActivations = [
                { phi: 0.8, theta: 0 },
                { phi: 0.9, theta: 3.14 },
                { phi: 2.3, theta: 1.57 },
                { phi: 2.4, theta: 4.71 },
            ];
            actViewer.addActivationOverlay(motorActivations);
            this.viewers['activation'] = actViewer;
        }

        this.buildNetworkLegend();

        if (this.chartManager) {
            this.chartManager.initNetworkStats('networkStats');
        } else {
            this.chartManager = new ChartManager();
            this.chartManager.initNetworkStats('networkStats');
        }

        const yeoSelect = document.getElementById('yeoSelect');
        if (yeoSelect) {
            yeoSelect.addEventListener('change', () => {
                const networks = yeoSelect.value === '7' ? YEO7_NETWORKS : YEO17_NETWORKS;
                const viewer = this.viewers['viewer2'];
                if (viewer) {
                    viewer.removeOverlay();
                    viewer.addNetworkOverlay(networks);
                }
                this.setToast(`已切换到 Yeo ${yeoSelect.value} 网络模板`, 'info');
            });
        }

        const taskSelect = document.getElementById('taskSelect');
        const thresholdSlider = document.getElementById('thresholdSlider');
        const thresholdValue = document.getElementById('thresholdValue');

        if (taskSelect) {
            taskSelect.addEventListener('change', () => this.updateActivationOverlay());
        }
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', () => {
                thresholdValue.textContent = `阈值: ${(thresholdSlider.value / 2).toFixed(1)}`;
                this.updateActivationOverlay();
            });
        }

        const btnReset2 = document.getElementById('btnResetView2');
        if (btnReset2) {
            btnReset2.addEventListener('click', () => {
                const viewer = this.viewers['viewer2'];
                if (viewer) viewer.resetView();
            });
        }
    }

    updateActivationOverlay() {
        const viewer = this.viewers['activation'];
        if (!viewer) return;

        const task = document.getElementById('taskSelect').value;
        viewer.removeOverlay();

        const activationMaps = {
            motor: [
                { phi: 0.7, theta: 0 }, { phi: 0.8, theta: 3.14 },
                { phi: 2.3, theta: 1.57 }, { phi: 2.4, theta: 4.71 },
            ],
            language: [
                { phi: 0.4, theta: 1.2 }, { phi: 0.5, theta: 2.0 },
                { phi: 1.6, theta: 3.5 }, { phi: 1.7, theta: 4.8 },
            ],
            workingMemory: [
                { phi: 0.3, theta: 2.5 }, { phi: 0.4, theta: 3.8 },
                { phi: 1.2, theta: 5.0 }, { phi: 2.5, theta: 2.0 },
            ],
            emotion: [
                { phi: 1.8, theta: 1.8 }, { phi: 1.9, theta: 3.2 },
                { phi: 1.0, theta: 0.5 }, { phi: 2.7, theta: 4.0 },
            ],
        };

        const activations = activationMaps[task] || activationMaps.motor;
        viewer.addActivationOverlay(activations);
    }

    buildNetworkLegend() {
        const container = document.getElementById('networkLegend');
        if (!container) return;
        container.innerHTML = YEO7_NETWORKS.map(n => `
            <div class="legend-item">
                <div class="legend-color" style="background:${n.color};"></div>
                <span class="legend-name">${n.name}</span>
            </div>
        `).join('');
    }

    // ===== 模块3：白质连接 =====
    initModule3() {
        if (this.viewers['viewer3']) return;

        const viewer = new BrainViewer('viewer3D3', {
            cameraPosition: [0, -30, 320],
        });
        viewer.createFullBrain(null, 'both');
        viewer.addNetworkOverlay(YEO7_NETWORKS);
        viewer.generateDemoTracts();
        this.viewers['viewer3'] = viewer;

        const tractSelect = document.getElementById('tractSelect');
        if (tractSelect) {
            tractSelect.style.height = 'auto';
            tractSelect.addEventListener('change', () => {
                const selected = tractSelect.value;
                const v = this.viewers['viewer3'];
                if (v) {
                    if (selected === 'all') {
                        v.setTractVisibility(null, true);
                    } else {
                        v.setTractVisibility(null, false);
                        v.setTractVisibility(selected, true);
                    }
                }
                document.querySelectorAll('.tract-card').forEach(card => {
                    card.classList.remove('highlighted');
                });
                if (selected !== 'all') {
                    const card = document.querySelector(`[data-tract="${selected}"]`);
                    if (card) card.classList.add('highlighted');
                }
            });
        }

        const toggleFunc = document.getElementById('toggleFuncOverlay');
        if (toggleFunc) {
            toggleFunc.addEventListener('change', () => {
                const v = this.viewers['viewer3'];
                if (v) {
                    if (toggleFunc.checked) {
                        v.addNetworkOverlay(YEO7_NETWORKS);
                    } else {
                        v.removeOverlay();
                    }
                }
            });
        }

        document.querySelectorAll('.tract-card').forEach(card => {
            card.addEventListener('click', () => {
                const tract = card.dataset.tract;
                const v = this.viewers['viewer3'];
                if (v) {
                    v.setTractVisibility(null, false);
                    v.setTractVisibility(tract, true);
                }
                document.querySelectorAll('.tract-card').forEach(c => c.classList.remove('highlighted'));
                card.classList.add('highlighted');
                if (tractSelect) tractSelect.value = tract;
            });
        });

        const btnReset3 = document.getElementById('btnResetView3');
        if (btnReset3) {
            btnReset3.addEventListener('click', () => {
                const v = this.viewers['viewer3'];
                if (v) v.resetView();
            });
        }
    }

    // ===== 模块4：交互分析 =====
    initModule4() {
        if (this.viewers['viewer4']) return;

        const viewer = new BrainViewer('viewer3D4', {
            cameraPosition: [0, 0, 260],
        });
        viewer.createFullBrain(this.currentAtlas, 'both');
        viewer.addSubcorticalStructures([
            ...SUBCORTICAL_STRUCTURES,
            ...CEREBELLAR_REGIONS,
            ...WHITE_MATTER_STRUCTURES,
        ]);
        viewer.options.onRegionClick = (userData) => this.handleRegionClick(userData, 'queryResult');
        this.viewers['viewer4'] = viewer;

        this.sliceViewers = {
            axial: new SliceViewer('canvasAxial'),
            sagittal: new SliceViewer('canvasSagittal'),
            coronal: new SliceViewer('canvasCoronal'),
        };

        ['Axial', 'Sagittal', 'Coronal'].forEach(orient => {
            const slider = document.getElementById(`slider${orient}`);
            if (slider) {
                slider.addEventListener('input', () => {
                    const key = orient.toLowerCase();
                    if (this.sliceViewers[key]) {
                        this.sliceViewers[key].setSlice(parseInt(slider.value));
                    }
                });
            }
        });

        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                const grid = document.getElementById('multiViewGrid');
                if (mode === 'single3d') {
                    grid.classList.add('single-3d');
                } else {
                    grid.classList.remove('single-3d');
                }
                setTimeout(() => {
                    const v = this.viewers['viewer4'];
                    if (v) v.onResize();
                    Object.values(this.sliceViewers).forEach(s => s.resize());
                }, 100);
            });
        });

        const regionSearch = document.getElementById('regionSearch');
        if (regionSearch) {
            regionSearch.addEventListener('input', () => {
                const query = regionSearch.value.toLowerCase();
                if (query.length < 2) {
                    document.getElementById('queryResult').innerHTML =
                        '<p class="placeholder">点击3D视图中的脑区或搜索查看详情</p>';
                    return;
                }
                const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
                const allRegions = [
                    ...atlasRegions,
                    ...SUBCORTICAL_STRUCTURES.map(s => ({ id: s.id, name: s.name })),
                ];
                const results = allRegions.filter(r =>
                    r.name.toLowerCase().includes(query) ||
                    r.id.toLowerCase().includes(query) ||
                    (r.aliases || []).some(a => a.toLowerCase().includes(query))
                );

                if (results.length > 0) {
                    this.showRegionInfo(results[0].id, 'queryResult');
                } else {
                    document.getElementById('queryResult').innerHTML =
                        '<p class="placeholder">未找到匹配的脑区</p>';
                }
            });
        }

        if (!this.chartManager) this.chartManager = new ChartManager();
        this.chartManager.initComparisonChart('comparisonChart');

        window.addEventListener('resize', () => {
            if (this.sliceViewers) {
                Object.values(this.sliceViewers).forEach(s => s.resize());
            }
            if (this.chartManager) this.chartManager.resizeAll();
        });
    }

    // ===== 导出功能 =====
    setupExport() {
        document.getElementById('btnExportScreenshot').addEventListener('click', () => {
            const viewer = this.getCurrentViewer();
            if (viewer) {
                const dataUrl = viewer.screenshot();
                this.downloadImage(dataUrl, `neuroviz-${Date.now()}.png`);
                this.setToast('高清截图已保存', 'success');
            } else {
                this.setToast('请先切换到3D视图', 'error');
            }
        });

        document.getElementById('btnExportVideo').addEventListener('click', () => {
            const viewer = this.getCurrentViewer();
            if (!viewer) {
                this.setToast('请先切换到3D视图', 'error');
                return;
            }
            this.setToast('旋转视频导出中...（演示模式，请使用截图功能）', 'info');
        });

        document.getElementById('btnExportReport').addEventListener('click', () => {
            this.generateReport();
            this.setToast('数据报表已生成', 'success');
        });

        document.getElementById('btnExportData').addEventListener('click', () => {
            this.exportCSV();
            this.setToast('CSV 数据已导出', 'success');
        });
    }

    getCurrentViewer() {
        switch (this.currentModule) {
            case 'module1': return this.viewers['viewer1'];
            case 'module2': return this.viewers['viewer2'];
            case 'module3': return this.viewers['viewer3'];
            case 'module4': return this.viewers['viewer4'];
            default: return null;
        }
    }

    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }

    generateReport() {
        const zScores = generateZScores();
        const reportData = zScores.map(z => ({
            脑区: z.name,
            '皮层厚度_Zscore': z.thickness.toFixed(2),
            '体积_Zscore': z.volume.toFixed(2),
            '表面积_Zscore': z.area.toFixed(2),
        }));

        const csvContent = 'data:text/csv;charset=utf-8,' +
            Object.keys(reportData[0]).join(',') + '\n' +
            reportData.map(r => Object.values(r).join(',')).join('\n');

        const link = document.createElement('a');
        link.download = `neuroviz-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.href = encodeURI(csvContent);
        link.click();
    }

    exportCSV() {
        const matrix = generateConnectivityMatrix(YEO7_NETWORKS);
        let csv = '网络,' + YEO7_NETWORKS.map(n => n.name).join(',') + '\n';
        YEO7_NETWORKS.forEach((n, i) => {
            csv += n.name + ',' + matrix[i].join(',') + '\n';
        });

        const link = document.createElement('a');
        link.download = `neuroviz-connectivity-${new Date().toISOString().slice(0, 10)}.csv`;
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        link.click();
    }

    // ===== 引用栏 =====
    setupCitationBar() {
        const btn = document.getElementById('btnCitationToggle');
        const bar = document.getElementById('citationBar');
        if (btn && bar) {
            btn.addEventListener('click', () => {
                bar.classList.toggle('collapsed');
                btn.innerHTML = bar.classList.contains('collapsed')
                    ? '<i class="fa-solid fa-chevron-up"></i>'
                    : '<i class="fa-solid fa-chevron-down"></i>';
            });
        }
    }

    // ===== 工具方法 =====
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    generateCaptcha(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return '';
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空
        ctx.fillStyle = '#f5f7fa';
        ctx.fillRect(0, 0, width, height);

        // 生成随机文本
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let text = '';
        for (let i = 0; i < 5; i++) {
            text += chars[Math.floor(Math.random() * chars.length)];
        }

        // 绘制干扰线
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 200}, 0.5)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.lineTo(Math.random() * width, Math.random() * height);
            ctx.stroke();
        }

        // 绘制文本
        for (let i = 0; i < text.length; i++) {
            ctx.fillStyle = `rgb(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 150 + 50})`;
            ctx.font = `${22 + Math.random() * 8}px "Segoe UI", sans-serif`;
            ctx.save();
            ctx.translate(20 + i * 24, height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(text[i], 0, 8);
            ctx.restore();
        }

        // 干扰点
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, 0.4)`;
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        return text;
    }

    setToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
        toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    startFpsCounter() {
        let frames = 0;
        let lastTime = performance.now();
        const update = () => {
            frames++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                const fps = Math.round(frames / ((now - lastTime) / 1000));
                const el = document.getElementById('fpsCounter');
                if (el) el.textContent = `FPS: ${fps}`;
                frames = 0;
                lastTime = now;
            }
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
}

// ===== 启动应用 =====
// three-brain.js 是 ES module，异步加载；app.js 是普通脚本，可能先执行。
// 轮询等待 BrainViewer / SliceViewer / echarts 都就绪后再初始化，避免 ReferenceError。
(function tryInitApp() {
    const startTime = tryInitApp.startTime || (tryInitApp.startTime = performance.now());
    if (
        typeof BrainViewer === 'undefined' ||
        typeof SliceViewer === 'undefined' ||
        typeof echarts === 'undefined'
    ) {
        if (performance.now() - startTime > 15000) {
            const status = document.getElementById('statusText');
            if (status) {
                status.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#f44336;"></i> 依赖加载失败：无法从 CDN 加载 Three.js / ECharts，请检查网络连接';
            }
            console.error('[NeuroViz] 依赖加载超时：BrainViewer/SliceViewer/echarts 未就绪');
            return;
        }
        setTimeout(tryInitApp, 50);
        return;
    }
    window.neuroVizApp = new NeuroVizApp();
})();
