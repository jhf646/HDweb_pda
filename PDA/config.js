// API 配置文件
const API_CONFIG = {
    // 基础服务地址
    BASE_URL_LOCAL: 'http://192.168.50.40:20000',
    // BASE_URL_REMOTE: 'http://117.50.117.118:20001',
     BASE_URL_REMOTE: 'http://192.168.1.14:20008',
    
    // 用户相关接口
    CHECK_USER_INFO: '/CheckUserInfo',
    
    // 入库相关接口
    QUERY_BARCODE_INFO: '/QueryBarcodeInfo',
    SUBMIT_PALLET_INPUT_NORMAL: '/SubmitPalletInputNormalByInventoryID',
    QUERY_PALLET_INFO_WITH_INVENTORY: '/QueryPalletInfoWithInventoryInfo',
    SUBMIT_PALLET_BIND_INVENTORY: '/SubmitPalletBindInventoryList',
    
    // 出库相关接口
    QUERY_PALLET_INFO: '/QueryPalletInfo',
    SUBMIT_PALLET_ITEM_QTY_MODIFY: '/SubmitPalletItemQtyModify',
    GET_LOCATION_INFO_WITH_PALLET: '/GetLocationInfoWithPalletLineListInfo',
    SUBMIT_PALLET_PREPARE: '/SubmitPalletPrepare',
    CONFIRM_OUTBOUND: '/ConfirmOutbound'
};

// 便捷方法 - 获取完整的API URL
function getApiUrl(endpoint, isRemote = false) {
    // const baseUrl = isRemote ? API_CONFIG.BASE_URL_REMOTE : API_CONFIG.BASE_URL_LOCAL;
    // const baseUrl = API_CONFIG.BASE_URL_LOCAL;
    const baseUrl = API_CONFIG.BASE_URL_REMOTE ;
    return baseUrl + endpoint;
}
