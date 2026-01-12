class PDASystem {
    constructor() {
        this.isLoggedIn = false;
        this.confirmResolve = null; // 用于Promise的resolve
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkLoginStatus();
        this.setupScannerListener();
        this.initConfirmDialog();
    }

    // 初始化自定义确认对话框
    initConfirmDialog() {
        const confirmDialog = document.getElementById('confirm-dialog');
        const confirmOk = document.getElementById('confirm-dialog-ok');
        const confirmCancel = document.getElementById('confirm-dialog-cancel');
        const overlay = confirmDialog.querySelector('.confirm-dialog-overlay');
        
        if (confirmOk) {
            confirmOk.addEventListener('click', () => {
                this.hideConfirmDialog();
                if (this.confirmResolve) {
                    this.confirmResolve(true);
                    this.confirmResolve = null;
                }
            });
        }
        
        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                this.hideConfirmDialog();
                if (this.confirmResolve) {
                    this.confirmResolve(false);
                    this.confirmResolve = null;
                }
            });
        }
        
        // 点击遮罩层关闭对话框
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideConfirmDialog();
                if (this.confirmResolve) {
                    this.confirmResolve(false);
                    this.confirmResolve = null;
                }
            });
        }
    }

    // 显示确认对话框
    showConfirm(message) {
        return new Promise((resolve) => {
            this.confirmResolve = resolve;
            const confirmDialog = document.getElementById('confirm-dialog');
            const messageEl = document.getElementById('confirm-dialog-message');
            
            if (messageEl) {
                messageEl.textContent = message;
            }
            
            if (confirmDialog) {
                confirmDialog.classList.add('show');
            }
        });
    }

    // 隐藏确认对话框
    hideConfirmDialog() {
        const confirmDialog = document.getElementById('confirm-dialog');
        if (confirmDialog) {
            confirmDialog.classList.remove('show');
        }
    }

    bindEvents() {
        // 登录表单提交
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 退出按钮
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // 入库表单提交
        document.getElementById('inbound-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleInboundSubmit();
        });

        // 出库表单提交
        document.getElementById('outbound-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleOutboundSubmit();
        });

        // 出库确认表单提交
        if (document.getElementById('confirm-form')) {
            document.getElementById('confirm-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleConfirmSubmit();
            });
        }

        // 导航菜单点击
        document.querySelectorAll('.nav-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.currentTarget.dataset.page;
                this.showSubPage(pageId);
            });
        });

        // 返回按钮点击
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const backPageId = e.currentTarget.dataset.back;
                this.showSubPage(backPageId);
            });
        });

        // 库存号输入框监听（用于扫码）
        const inboundInventoryInput = document.getElementById('inbound-inventory-id');
        const outboundItemInput = document.getElementById('outbound-item-id');
        const inboundPalletInput = document.getElementById('inbound-pallet-id');
        
        if (inboundInventoryInput) {
            inboundInventoryInput.addEventListener('input', (e) => {
                // 库存号输入时，如果长度合理则触发查询
                const value = e.target.value.trim();
                if (value && value.length > 5) {
                    this.queryInventoryInfo(value);
                }
            });
            
            inboundInventoryInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }

        if (inboundPalletInput) {
            inboundPalletInput.addEventListener('input', (e) => {
                // 入库托盘号输入时，如果长度合理则触发查询
                const value = e.target.value.trim();
                if (value && value.length > 0) {
                    this.queryPalletWithInventory(value);
                }
            });
            
            inboundPalletInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }
        
        // 库存表格按钮事件
        const btnAddInventory = document.getElementById('btn-add-inventory');
        const btnSubmitInventory = document.getElementById('btn-submit-inventory');
        const btnResetInventory = document.getElementById('btn-reset-inventory');
        
        if (btnAddInventory) {
            btnAddInventory.addEventListener('click', () => {
                this.addInventoryRow();
            });
        }
        
        if (btnSubmitInventory) {
            btnSubmitInventory.addEventListener('click', () => {
                this.submitInventoryBinding();
            });
        }
        
        if (btnResetInventory) {
            btnResetInventory.addEventListener('click', () => {
                this.resetInventoryForm();
            });
        }
        
        // 备料出库物料号输入框监听
        if (outboundItemInput) {
            outboundItemInput.addEventListener('input', (e) => {
                // 物料号输入时，如果长度合理则触发查询
                const value = e.target.value.trim();
                if (value && value.length > 0) {
                    this.queryLocationByItemID(value);
                }
            });
            
            outboundItemInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }
        
        // 出库确认托盘号输入框监听
        const confirmPalletInput = document.getElementById('confirm-pallet-id');
        const btnConfirmOutbound = document.getElementById('btn-confirm-outbound');
        const btnResetConfirm = document.getElementById('btn-reset-confirm');
        
        if (confirmPalletInput) {
            confirmPalletInput.addEventListener('input', (e) => {
                // 出库确认托盘号输入时，触发查询
                const value = e.target.value.trim();
                if (value && value.length > 0) {
                    this.queryConfirmPalletInfo(value);
                }
            });
            
            confirmPalletInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }
        
        if (btnConfirmOutbound) {
            btnConfirmOutbound.addEventListener('click', () => {
                this.submitConfirmOutbound();
            });
        }
        
        if (btnResetConfirm) {
            btnResetConfirm.addEventListener('click', () => {
                this.resetConfirmForm();
            });
        }
    }

    setupScannerListener() {
        // PDA扫码器通常会模拟键盘输入，快速输入内容
        let scannerBuffer = '';
        let scannerTimeout;

        document.addEventListener('keydown', (e) => {
            const activeInput = document.activeElement;
            if (activeInput && (activeInput.id === 'inbound-inventory-id' || activeInput.id === 'outbound-pallet-id')) {
                return; // 如果已经在输入框，不处理
            }

            // 监听扫码器输入（通常以回车结束）
            if (e.key === 'Enter') {
                if (scannerBuffer.trim()) {
                    this.processScannedData(scannerBuffer.trim());
                    scannerBuffer = '';
                    clearTimeout(scannerTimeout);
                }
            } else if (e.key.length === 1) {
                // 累积字符
                scannerBuffer += e.key;
                clearTimeout(scannerTimeout);
                scannerTimeout = setTimeout(() => {
                    scannerBuffer = ''; // 超时清空缓冲
                }, 100);
            }
        });
    }

    processScannedData(data) {
        console.log('扫描数据:', data);
        // 根据当前激活的子页面决定输入到哪个输入框
        const activeSubPage = document.querySelector('.sub-page.active');
        if (activeSubPage && activeSubPage.id === 'inbound-page') {
            // 入库页面：扫描托盘号
            document.getElementById('inbound-pallet-id').value = data;
            this.queryPalletWithInventory(data);
        } else if (activeSubPage && activeSubPage.id === 'outbound-page') {
            // 出库页面：扫描托盘号
            document.getElementById('outbound-pallet-id').value = data;
            this.handleOutboundScannerInput(data);
        }
    }

    handleInboundScannerInput(value) {
        // 入库扫码输入处理 - 扫码后触发查询托盘和库存信息
        if (value && value.length > 0) {
            this.queryPalletWithInventory(value);
        }
    }

    handleScannerInput(value, inputId) {
        // 只有出库扫码时才自动处理
        if (value && value.length > 5) {
            if (inputId === 'outbound-pallet-id') {
                this.handleOutboundScannerInput(value);
            }
            // 入库页面的库存号输入由input事件中的handleScannerInput处理查询
        }
    }

    handleOutboundScannerInput(value) {
        // 出库扫码输入处理 - 扫码后触发查询托盘信息
        if (value && value.length > 0) {
            this.queryPalletInfo(value);
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        try {
            // 调用登录API
            await this.submitLogin(username, password);
            this.isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username); // 保存用户名
            this.showPage('main-page');
            this.showSubPage('home-page'); // 确保显示首页
            this.showMessage('登录成功', 'success');
        } catch (error) {
            this.showMessage('登录失败: ' + error.message, 'error');
        }
    }

    async submitLogin(username, password) {
        this.showMessage('正在登录...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.CHECK_USER_INFO, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    UserID: username,
                    PassWord: password
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            // 根据返回的code判断是否成功
            if (data.code === '200') {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error(data.msg || '登录失败'));
            }
            
        } catch (error) {
            console.error('登录请求失败:', error);
            return Promise.reject(error);
        }
    }

    async simulateLogin(username, password) {
        // 模拟登录延迟
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username === 'admin' && password === '123456') {
                    resolve();
                } else {
                    reject(new Error('用户名或密码错误'));
                }
            }, 1000);
        });
    }

    handleLogout() {
        this.isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        this.showPage('login-page');
        document.getElementById('login-form').reset();
        document.getElementById('inbound-form').reset();
        this.clearResult();
    }

    checkLoginStatus() {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (loggedIn) {
            this.isLoggedIn = true;
            this.showPage('main-page');
            this.showSubPage('home-page'); // 确保显示首页
        } else {
            this.showPage('login-page');
        }
    }

    // 查询托盘和库存信息
    async queryPalletWithInventory(palletID) {
        this.showMessage('正在查询托盘信息...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.QUERY_PALLET_INFO_WITH_INVENTORY, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            console.log('查询托盘结果:', data);
            
            if (data.code === '200' && data.data) {
                // 检查托盘工作状态
                const palletWorkStatus = data.data.PalletWorkStatus;
                const statusArea = document.getElementById('pallet-status-area');
                
                if (palletWorkStatus === '空闲') {
                    // 托盘可用
                    statusArea.className = 'status-area show success';
                    statusArea.textContent = '✓ 该托盘可用';
                    this.showMessage('托盘可用', 'success');
                    
                    // 加载库存数据到表格
                    const inventoryData = data.datalist || [];
                    console.log('库存数据:', inventoryData);
                    this.loadInventoryTable(inventoryData);
                    
                    // 显示表格区域
                    const tableArea = document.getElementById('inventory-table-area');
                    console.log('表格区域状态前:', tableArea.className);
                    tableArea.classList.add('show');
                    console.log('表格区域状态后:', tableArea.className);
                } else {
                    // 托盘不可用
                    statusArea.className = 'status-area show error';
                    statusArea.textContent = '✗ 该托盘不可用';
                    this.showMessage('该托盘不可用，状态为: ' + palletWorkStatus, 'error');
                    
                    // 隐藏表格区域
                    document.getElementById('inventory-table-area').classList.remove('show');
                }
            } else {
                this.showMessage(`查询失败: ${data.msg}`, 'error');
                document.getElementById('inventory-table-area').classList.remove('show');
            }
            
        } catch (error) {
            console.error('查询托盘信息失败:', error);
            this.showMessage(`查询失败: ${error.message}`, 'error');
            document.getElementById('inventory-table-area').classList.remove('show');
        }
    }

    // 加载库存数据到表格
    loadInventoryTable(inventoryList) {
        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) {
            console.error('找不到表格tbody元素');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!inventoryList || inventoryList.length === 0) {
            console.warn('库存列表为空');
            // 添加一个空行提示用户
            return;
        }
        
        console.log(`加载 ${inventoryList.length} 条库存数据`);
        
        inventoryList.forEach((item, index) => {
            console.log(`处理第${index + 1}条数据:`, item);
            const row = this.createInventoryRow(item, index);
            tbody.appendChild(row);
        });
        
        // 绑定删除按钮事件
        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('tr').remove();
            });
        });
        
        console.log(`表格加载完成，共 ${tbody.children.length} 行`);
    }

    // 创建表格行
    createInventoryRow(item, index) {
        const row = document.createElement('tr');
        
        // 安全地获取值，防止undefined或null导致问题
        const itemID = String(item.ItemID || '').trim();
        const itemName = String(item.ItemName || '').trim();
        const itemModel = String(item.ItemModel || '').trim();
        const itemQty = Number(item.ItemQty || 0);
        const itemUnit = String(item.ItemUnit || '').trim();
        const orderCode = String(item.OrderCode || '').trim();
        
        row.innerHTML = `
            <td><input type="text" class="item-id" value="${itemID}" placeholder="物料号"></td>
            <td><input type="number" class="item-qty" value="${itemQty}" placeholder="数量" step="0.01"></td>
            <td><input type="text" class="item-model" value="${itemModel}" placeholder="型号规格"></td>
            <td><input type="text" class="item-unit" value="${itemUnit}" placeholder="单位"></td>
            <td><input type="text" class="order-code" value="${orderCode}" placeholder="单据号"></td>
            <td><input type="text" class="item-name" value="${itemName}" placeholder="描述"></td>
            <td><button type="button" class="btn-delete-row">删除</button></td>
        `;
        
        console.log(`创建表格行 ${index}:`, {itemID, itemName, itemModel, itemQty, itemUnit, orderCode});
        return row;
    }

    // 添加新的库存行
    addInventoryRow() {
        const tbody = document.getElementById('inventory-table-body');
        const row = this.createInventoryRow({}, tbody.children.length);
        tbody.appendChild(row);
        
        // 绑定删除按钮事件
        row.querySelector('.btn-delete-row').addEventListener('click', (e) => {
            e.target.closest('tr').remove();
        });
    }

    // 收集表格数据
    collectInventoryData() {
        const tbody = document.getElementById('inventory-table-body');
        const data = [];
        
        tbody.querySelectorAll('tr').forEach(row => {
            data.push({
                ItemID: row.querySelector('.item-id').value,
                ItemName: row.querySelector('.item-name').value,
                ItemModel: row.querySelector('.item-model').value,
                ItemQty: parseFloat(row.querySelector('.item-qty').value) || 0,
                ItemUnit: row.querySelector('.item-unit').value,
                OrderCode: row.querySelector('.order-code').value
            });
        });
        
        return data;
    }

    // 提交库存绑定
    async submitInventoryBinding() {
        const palletID = document.getElementById('inbound-pallet-id').value.trim();
        const inventoryData = this.collectInventoryData();
        
        if (!palletID) {
            this.showMessage('请先扫描托盘号', 'error');
            return;
        }
        
        if (inventoryData.length === 0) {
            this.showMessage('请添加库存数据', 'error');
            return;
        }
        
        // 验证所有行数据完整性
        const hasInvalidRows = inventoryData.some(item => 
            !item.ItemID || !item.ItemName || item.ItemQty <= 0
        );
        
        if (hasInvalidRows) {
            this.showMessage('请填写完整的库存信息（物料号、描述、数量为必填项）', 'error');
            return;
        }
        
        this.showMessage('正在提交库存绑定...', 'loading');
        
        try {
            // 获取登录用户名
            const username = localStorage.getItem('username') || '';
            
            // 构建请求数据
            const requestData = {
                data: {
                    PalletID: palletID,
                    DefaultToLocationID: '',
                    Creator: username,
                    Remark: ''
                },
                datalist: inventoryData.map(item => ({
                    ItemID: item.ItemID,
                    ItemName: item.ItemName,
                    ItemModel: item.ItemModel,
                    ItemQty: parseFloat(item.ItemQty),
                    ItemUnit: item.ItemUnit,
                    OrderCode: item.OrderCode || null
                }))
            };
            
            console.log('提交库存绑定数据:', requestData);
            
            // 调用API提交库存绑定
            const response = await fetch(getApiUrl(API_CONFIG.SUBMIT_PALLET_BIND_INVENTORY, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('提交库存绑定返回:', result);
            
            if (result.code === '200') {
                this.showMessage(result.msg || '库存绑定成功', 'success');
                // 延迟后重置表单
                setTimeout(() => {
                    this.resetInventoryForm();
                }, 1500);
            } else {
                throw new Error(result.msg || '绑定失败');
            }
            
        } catch (error) {
            console.error('提交库存绑定失败:', error);
            this.showMessage('提交失败: ' + error.message, 'error');
        }
    }

    // 重置库存表单
    resetInventoryForm() {
        document.getElementById('inbound-pallet-id').value = '';
        document.getElementById('pallet-status-area').className = 'status-area';
        document.getElementById('pallet-status-area').textContent = '';
        document.getElementById('inventory-table-area').classList.remove('show');
        document.getElementById('inventory-table-body').innerHTML = '';
    }

    // 查询物料号对应的库位和库存信息
    async queryLocationByItemID(itemID) {
        this.showOutboundMessage('正在查询库存信息...', 'loading');
        
        try {
            const response = await fetch(getApiUrl(API_CONFIG.GET_LOCATION_INFO_WITH_PALLET, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ItemID: itemID
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('查询库存信息返回:', result);
            
            if (result.code === '200' && result.datalist && result.datalist.length > 0) {
                this.showOutboundMessage(result.msg || '查询成功', 'success');
                this.loadOutboundTable(result.datalist);
            } else {
                throw new Error(result.msg || '未查询到库存信息');
            }
            
        } catch (error) {
            console.error('查询库存信息失败:', error);
            this.showOutboundMessage('查询失败: ' + error.message, 'error');
            this.hideOutboundTable();
        }
    }

    // 加载备料出库表格
    loadOutboundTable(dataList) {
        const tbody = document.getElementById('outbound-table-body');
        const tableArea = document.getElementById('outbound-table-area');
        
        if (!tbody || !tableArea) {
            console.error('未找到出库表格元素');
            return;
        }
        
        tbody.innerHTML = '';
        
        dataList.forEach((item, index) => {
            const row = this.createOutboundRow(item, index);
            tbody.appendChild(row);
            
            // 绑定出库按钮事件
            const btn = row.querySelector('.btn-outbound');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.handlePalletPrepare(item.PalletID);
                });
            }
        });
        
        tableArea.classList.add('show');
    }

    // 创建备料出库表格行
    createOutboundRow(item, index) {
        const row = document.createElement('tr');
        
        const locationName = String(item.LocationName || item.LocationID || '').trim();
        const palletID = String(item.PalletID || '').trim();
        const itemID = String(item.ItemID || '').trim();
        const itemName = String(item.ItemName || '').trim();
        const itemModel = String(item.ItemModel || '').trim();
        const itemQty = Number(item.ItemQty || 0);
        const itemUnit = String(item.ItemUnit || '').trim();
        
        row.innerHTML = `
            <td>${locationName}</td>
            <td>${palletID}</td>
            <td>${itemID}</td>
            <td>${itemName}</td>
            <td>${itemModel}</td>
            <td>${itemQty}</td>
            <td>${itemUnit}</td>
            <td><button type="button" class="btn-outbound btn-primary">出库</button></td>
        `;
        
        return row;
    }

    // 隐藏备料出库表格
    hideOutboundTable() {
        const tableArea = document.getElementById('outbound-table-area');
        if (tableArea) {
            tableArea.classList.remove('show');
        }
        const tbody = document.getElementById('outbound-table-body');
        if (tbody) {
            tbody.innerHTML = '';
        }
    }

    // 显示备料出库消息
    showOutboundMessage(message, type) {
        const statusArea = document.getElementById('outbound-status-area');
        if (!statusArea) return;
        
        statusArea.textContent = message;
        statusArea.className = 'status-area show ' + type;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusArea.classList.remove('show');
            }, 3000);
        }
    }

    // 处理备料出库
    async handlePalletPrepare(palletID) {
        if (!palletID) {
            this.showOutboundMessage('托盘号无效', 'error');
            return;
        }
        
        const confirmed = await this.showConfirm(`确认要将托盘 ${palletID} 备料出库吗？`);
        if (!confirmed) {
            return;
        }
        
        this.showOutboundMessage('正在提交备料出库...', 'loading');
        
        try {
            const response = await fetch(getApiUrl(API_CONFIG.SUBMIT_PALLET_PREPARE, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('备料出库返回:', result);
            
            if (result.code === '200') {
                this.showOutboundMessage(result.msg || '备料出库成功', 'success');
                // 重新查询物料信息
                const itemID = document.getElementById('outbound-item-id').value.trim();
                if (itemID) {
                    setTimeout(() => {
                        this.queryLocationByItemID(itemID);
                    }, 1500);
                }
            } else {
                throw new Error(result.msg || '备料出库失败');
            }
            
        } catch (error) {
            console.error('备料出库失败:', error);
            this.showOutboundMessage('出库失败: ' + error.message, 'error');
        }
    }

    async handleInboundSubmit() {
        const palletID = document.getElementById('inbound-pallet-id').value.trim();
        const inventoryID = document.getElementById('inbound-inventory-id').value.trim();
        
        if (!palletID) {
            this.showMessage('请输入托盘号', 'error');
            return;
        }
        
        if (!inventoryID) {
            this.showMessage('请输入库存号', 'error');
            return;
        }

        await this.submitPalletBinding(palletID, inventoryID);
    }

    async handleOutboundSubmit() {
        const palletID = document.getElementById('outbound-pallet-id').value.trim();
        const itemQty = document.getElementById('item-qty').value.trim();
        
        if (!palletID) {
            this.showMessage('请输入托盘号', 'error');
            return;
        }
        
        if (!itemQty || isNaN(itemQty) || parseInt(itemQty) <= 0) {
            this.showMessage('请输入有效的出库数量', 'error');
            return;
        }

        await this.submitOutboundModify(palletID, parseInt(itemQty));
    }

    async handleConfirmSubmit() {
        const orderID = document.getElementById('confirm-order-id').value.trim();
        const palletID = document.getElementById('confirm-pallet-id').value.trim();
        const status = document.getElementById('confirm-status').value.trim();
        
        if (!orderID) {
            this.showMessage('请输入订单号', 'error');
            return;
        }
        
        if (!palletID) {
            this.showMessage('请输入托盘号', 'error');
            return;
        }
        
        if (!status) {
            this.showMessage('请选择出库状态', 'error');
            return;
        }

        await this.submitOutboundConfirm(orderID, palletID, status);
    }


    async queryInventoryInfo(inventoryID) {
        this.showMessage('正在查询库存信息...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.QUERY_BARCODE_INFO, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    InventoryID: inventoryID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            this.showResult(data, 'inbound-result-area');
            this.showMessage('查询成功', 'success');
            
        } catch (error) {
            console.error('请求失败:', error);
            this.showMessage(`查询失败: ${error.message}`, 'error');
        }
    }

    async submitPalletBinding(palletID, inventoryID) {
        this.showMessage('正在提交绑定...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.SUBMIT_PALLET_INPUT_NORMAL, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID,
                    InventoryID: inventoryID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            // 根据返回的code判断是否成功
            if (data.code === '200') {
                this.showResult(data, 'inbound-result-area');
                this.showMessage('绑定成功', 'success');
                // 清空表单
                document.getElementById('inbound-form').reset();
            } else {
                this.showResult(data, 'inbound-result-area');
                this.showMessage(`绑定失败: ${data.msg}`, 'error');
            }
            
        } catch (error) {
            console.error('绑定请求失败:', error);
            this.showMessage(`绑定失败: ${error.message}`, 'error');
        }
    }

    async queryPalletInfo(palletID) {
        this.showMessage('正在查询托盘信息...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.QUERY_PALLET_INFO, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.code === '200') {
                // 将托盘号设置到输入框
                document.getElementById('outbound-pallet-id').value = palletID;
                // 将库存数量填充到只读输入框
                document.getElementById('outbound-item-qty').value = data.data.ItemQty || 0;
                // 自动聚焦到出库数量输入框
                document.getElementById('item-qty').focus();
                document.getElementById('item-qty').select();
                this.showResult(data, 'outbound-result-area');
                this.showMessage('查询成功', 'success');
            } else {
                this.showResult(data, 'outbound-result-area');
                this.showMessage(`查询失败: ${data.msg}`, 'error');
            }
            
        } catch (error) {
            console.error('查询托盘信息失败:', error);
            this.showMessage(`查询失败: ${error.message}`, 'error');
        }
    }

    async submitOutboundModify(palletID, itemQty) {
        this.showMessage('正在提交出库修改...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.SUBMIT_PALLET_ITEM_QTY_MODIFY, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID,
                    ItemQtyModify: itemQty  // 负数表示出库
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            this.showResult(data, 'outbound-result-area');
            this.showMessage('出库成功', 'success');
            
        } catch (error) {
            console.error('出库请求失败:', error);
            this.showMessage(`出库失败: ${error.message}`, 'error');
        }
    }

    async submitOutboundConfirm(orderID, palletID, status) {
        this.showMessage('正在提交出库确认...', 'loading');

        try {
            const response = await fetch(getApiUrl(API_CONFIG.SUBMIT_OUTBOUND_CONFIRM, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    OrderID: orderID,
                    PalletID: palletID,
                    Status: status
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            // 根据返回的code判断是否成功
            if (data.code === '200') {
                this.showResult(data, 'confirm-result-area');
                this.showMessage('出库确认成功', 'success');
                // 清空表单
                document.getElementById('confirm-form').reset();
            } else {
                this.showResult(data, 'confirm-result-area');
                this.showMessage(`出库确认失败: ${data.msg}`, 'error');
            }
            
        } catch (error) {
            console.error('出库确认请求失败:', error);
            this.showMessage(`出库确认失败: ${error.message}`, 'error');
        }
    }

    showResult(data, resultAreaId = 'inbound-result-area') {
        const resultArea = document.getElementById(resultAreaId);
        
        // 清空之前的结果列表
        resultArea.innerHTML = '';
        
        // 获取当前时间
        const currentTime = this.getCurrentTime();
        
        // 确定状态和提示
        const status = data.code === '200' ? '成功' : '失败';
        const statusClass = data.code === '200' ? 'success' : 'error';
        const msg = data.msg || '操作完成';
        
        // 从返回数据中提取物料号和数量
        let itemID = '-';
        let itemQty = '-';
        
        if (data.data) {
            itemID = data.data.ItemID || data.data.ItemCode || '-';
            itemQty = data.data.ItemQty || data.data.ItemQtyModify || '-';
        }
        
        // 生成列表项
        const listItem = `
            <div class="result-item">
                <div class="result-item-time">
                    <span class="label">时间:</span>
                    <span class="value">${currentTime}</span>
                </div>
                <div class="result-item-status">
                    <span class="label">状态:</span>
                    <span class="value status-${statusClass}">${status}</span>
                </div>
                <div class="result-item-msg">
                    <span class="label">提示:</span>
                    <span class="value">${msg}</span>
                </div>
            </div>
        `;
        
        // 创建新的列表容器
        const resultList = document.createElement('div');
        resultList.className = 'result-list';
        resultList.innerHTML = listItem;
        resultArea.appendChild(resultList);
    }
    
    getCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    clearResult(resultAreaId = 'inbound-result-area') {
        document.getElementById(resultAreaId).innerHTML = '';
    }

    // ===== 出库确认相关方法 =====
    
    /**
     * 查询出库确认托盘信息
     */
    async queryConfirmPalletInfo(palletID) {
        const statusArea = document.getElementById('confirm-status-area');
        const tableArea = document.getElementById('confirm-table-area');
        
        if (!palletID || palletID.trim() === '') {
            statusArea.textContent = '请输入托盘号';
            tableArea.style.display = 'none';
            return;
        }
        
        statusArea.textContent = '查询中...';
        tableArea.style.display = 'none';
        
        try {
            const response = await fetch(getApiUrl(API_CONFIG.QUERY_PALLET_INFO_WITH_INVENTORY, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    PalletID: palletID.trim()
                })
            });

            const result = await response.json();
            
            if (result.code === "200" && result.data && result.datalist) {
                // 出库确认不需要判断状态，直接显示数据
                if (result.datalist.length > 0) {
                    this.loadConfirmTable(result.datalist);
                    statusArea.textContent = `查询成功，共 ${result.datalist.length} 条记录`;
                } else {
                    statusArea.textContent = '该托盘暂无库存信息';
                    tableArea.style.display = 'none';
                }
            } else {
                statusArea.textContent = `查询失败: ${result.msg || '未知错误'}`;
                tableArea.style.display = 'none';
            }
        } catch (error) {
            console.error('查询托盘信息时出错:', error);
            statusArea.textContent = `查询失败: ${error.message}`;
            tableArea.style.display = 'none';
        }
    }
    
    /**
     * 加载出库确认表格
     */
    loadConfirmTable(inventoryList) {
        const tbody = document.getElementById('confirm-table-body');
        const tableArea = document.getElementById('confirm-table-area');
        
        tbody.innerHTML = '';
        
        inventoryList.forEach((item, index) => {
            const row = this.createConfirmRow(item, index);
            tbody.appendChild(row);
        });
        
        tableArea.style.display = 'block';
    }
    
    /**
     * 创建出库确认表格行
     */
    createConfirmRow(item, index) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-inventory-id', item.InventoryID || '');
        
        // 库存编号
        const tdInventoryID = document.createElement('td');
        tdInventoryID.textContent = item.InventoryID || '';
        tr.appendChild(tdInventoryID);
        
        // 物料号
        const tdItemID = document.createElement('td');
        tdItemID.textContent = item.ItemID || '';
        tr.appendChild(tdItemID);
        
        // 数量（只读）
        const tdItemQty = document.createElement('td');
        tdItemQty.textContent = item.ItemQty || '0';
        tr.appendChild(tdItemQty);
        
        // 出库数量（可编辑）
        const tdQtyModify = document.createElement('td');
        const inputQtyModify = document.createElement('input');
        inputQtyModify.type = 'number';
        inputQtyModify.step = '0.01';
        inputQtyModify.min = '0';
        inputQtyModify.max = item.ItemQty || '0';
        inputQtyModify.value = item.ItemQty || '0'; // 默认填充当前数量
        inputQtyModify.required = true;
        tdQtyModify.appendChild(inputQtyModify);
        tr.appendChild(tdQtyModify);
        
        return tr;
    }
    
    /**
     * 提交出库确认
     */
    async submitConfirmOutbound() {
        const palletInput = document.getElementById('confirm-pallet-id');
        const tbody = document.getElementById('confirm-table-body');
        const statusArea = document.getElementById('confirm-status-area');
        
        const palletID = palletInput.value.trim();
        
        if (!palletID) {
            this.showMessage('请输入托盘号', 'error');
            return;
        }
        
        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) {
            this.showMessage('没有可出库的数据', 'error');
            return;
        }
        
        // 收集数据
        const datalist = [];
        let hasError = false;
        
        rows.forEach(row => {
            const inventoryID = row.getAttribute('data-inventory-id');
            const qtyModifyInput = row.querySelector('input[type="number"]');
            const qtyModify = parseFloat(qtyModifyInput.value);
            
            if (isNaN(qtyModify) || qtyModify <= 0) {
                hasError = true;
                qtyModifyInput.style.borderColor = 'red';
            } else {
                qtyModifyInput.style.borderColor = '';
                datalist.push({
                    InventoryID: inventoryID,
                    ItemQtyModify: qtyModify
                });
            }
        });
        
        if (hasError) {
            this.showMessage('请填写有效的出库数量', 'error');
            return;
        }
        
        // 确认提交
        const confirmed = await this.showConfirm(`确认出库 ${datalist.length} 条数据吗？`);
        if (!confirmed) {
            return;
        }
        
        statusArea.textContent = '提交中...';
        
        try {
            const response = await fetch(getApiUrl(API_CONFIG.CONFIRM_OUTBOUND, false), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: {
                        PalletID: palletID
                    },
                    datalist: datalist
                })
            });

            const result = await response.json();
            
            if (result.code === "200") {
                this.showMessage('出库确认成功！', 'success');
                statusArea.textContent = '出库确认成功';
                
                // 清空表单
                setTimeout(() => {
                    this.resetConfirmForm();
                }, 1500);
            } else {
                this.showMessage(`出库确认失败: ${result.msg || '未知错误'}`, 'error');
                statusArea.textContent = `出库确认失败: ${result.msg || '未知错误'}`;
            }
        } catch (error) {
            console.error('提交出库确认时出错:', error);
            this.showMessage(`提交失败: ${error.message}`, 'error');
            statusArea.textContent = `提交失败: ${error.message}`;
        }
    }
    
    /**
     * 重置出库确认表单
     */
    resetConfirmForm() {
        const form = document.getElementById('confirm-form');
        const tbody = document.getElementById('confirm-table-body');
        const tableArea = document.getElementById('confirm-table-area');
        const statusArea = document.getElementById('confirm-status-area');
        
        form.reset();
        tbody.innerHTML = '';
        tableArea.style.display = 'none';
        statusArea.textContent = '';
        
        // 聚焦托盘号输入框
        const palletInput = document.getElementById('confirm-pallet-id');
        if (palletInput) {
            palletInput.focus();
        }
    }

    showMessage(message, type = 'info') {
        // 简单的消息提示
        const msgElement = document.createElement('div');
        msgElement.className = `message ${type}`;
        msgElement.textContent = message;
        msgElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            font-size: 16px;
        `;

        document.body.appendChild(msgElement);
        setTimeout(() => {
            document.body.removeChild(msgElement);
        }, 3000);
    }

    showPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示指定页面
        document.getElementById(pageId).classList.add('active');
        
        // 如果显示登录页，则退出全屏
        if (pageId === 'login-page') {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.log('退出全屏失败:', err);
                });
            }
        }
        // 如果显示主页，则尝试进入全屏
        else if (pageId === 'main-page') {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('全屏请求被拒绝:', err);
                });
            }
        }
    }

    showSubPage(subPageId) {
        // 隐藏所有子页面
        document.querySelectorAll('.sub-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示指定子页面
        document.getElementById(subPageId).classList.add('active');
        
        // 滚动到页面顶部
        const mainPage = document.getElementById('main-page');
        if (mainPage.scrollTop !== undefined) {
            mainPage.scrollTop = 0;
        }
        
        // 如果有.content容器，滚动它到顶部
        const content = document.querySelector('.content');
        if (content) {
            content.scrollTop = 0;
        }
    }
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    new PDASystem();
});

// PDA设备特性检测
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// 防止页面缩放
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

// 防止双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);