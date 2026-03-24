const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

const ROLES = {
    STUDENT: 'STUDENT',
    REVIEWER: 'REVIEWER',
    RECRUITER: 'RECRUITER',
    COLLEGE_ADMIN: 'COLLEGE_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
};

module.exports = { authorize, ROLES };
