export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: '驗證錯誤',
            errors: err.errors
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: '未授權訪問'
        });
    }
    
    return res.status(500).json({
        success: false,
        message: '服務器內部錯誤'
    });
}; 