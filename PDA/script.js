class PDASystem {
    constructor() {
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkLoginStatus();
        this.setupScannerListener();
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

        // 导航菜单点击
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pageId = e.target.dataset.page;
                this.showSubPage(pageId);
                
                // 更新导航按钮状态
                document.querySelectorAll('.nav-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // 库存号输入框监听（用于扫码）
        const inboundInventoryInput = document.getElementById('inbound-inventory-id');
        const outboundPalletInput = document.getElementById('outbound-pallet-id');
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
            inboundPalletInput.addEventListener('focus', (e) => {
                e.target.select();
            });
        }
        
        if (outboundPalletInput) {
            outboundPalletInput.addEventListener('input', (e) => {
                // 出库托盘号输入时，如果长度合理则触发查询
                const value = e.target.value.trim();
                if (value && value.length > 5) {
                    this.queryPalletInfo(value);
                }
            });
            
            outboundPalletInput.addEventListener('focus', (e) => {
                e.target.select();
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
        if (activeSubPage && activeSubPage.id === 'outbound-page') {
            document.getElementById('outbound-pallet-id').value = data;
            this.handleOutboundScannerInput(data);
        } else {
            document.getElementById('inbound-inventory-id').value = data;
            this.handleInboundScannerInput(data);
        }
    }

    handleInboundScannerInput(value) {
        // 入库扫码输入处理 - 扫码后触发查询库存信息
        if (value && value.length > 0) {
            this.queryInventoryInfo(value);
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
            this.showPage('main-page');
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
        } else {
            this.showPage('login-page');
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
    }

    showSubPage(subPageId) {
        // 隐藏所有子页面
        document.querySelectorAll('.sub-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示指定子页面
        document.getElementById(subPageId).classList.add('active');
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