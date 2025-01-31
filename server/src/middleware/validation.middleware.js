export const validateRegistration = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '請填寫所有必填欄位' });
    }

    // 驗證郵箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '無效的郵箱格式' });
    }

    // 驗證密碼長度
    if (password.length < 6) {
        return res.status(400).json({ message: '密碼長度至少為6個字符' });
    }

    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '請填寫所有必填欄位' });
    }

    next();
}; 