// // mws/roleCheck.mw.js
// module.exports = (injectable) => {
//     console.log('🔐 roleCheck middleware builder initialized');
    
//     return (allowedRoles) => {
//         const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
//         return (req, res, next) => {
//             try {
//                 if (!req.user) {
//                     return res.status(401).json({ 
//                         success: false, 
//                         error: 'Authentication required' 
//                     });
//                 }

//                 if (!req.user.role) {
//                     return res.status(403).json({ 
//                         success: false, 
//                         error: 'User role not found' 
//                     });
//                 }

//                 if (!roles.includes(req.user.role)) {
//                     return res.status(403).json({ 
//                         success: false, 
//                         error: `Access denied. Required role(s): ${roles.join(' or ')}` 
//                     });
//                 }

//                 next();
//             } catch (error) {
//                 console.error('Role check error:', error);
//                 return res.status(500).json({ 
//                     success: false, 
//                     error: 'Authorization failed' 
//                 });
//             }
//         };
//     };
// };

// mws/roleCheck.mw.js
module.exports = (injectable) => {
    return (allowedRoles) => {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        return (req, res, next) => {
            try {
                // Check if user exists
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                }

                // Check if user has role
                if (!req.user.role) {
                    return res.status(403).json({
                        success: false,
                        error: 'User role not defined'
                    });
                }

                // Check if role is allowed
                if (!roles.includes(req.user.role)) {
                    return res.status(403).json({
                        success: false,
                        error: `Access denied. Required role(s): ${roles.join(' or ')}`,
                        userRole: req.user.role
                    });
                }

                // Additional check for school admins
                if (req.user.role === 'school_admin' && !req.user.schoolId) {
                    return res.status(403).json({
                        success: false,
                        error: 'School admin must have a school ID'
                    });
                }

                next();
            } catch (error) {
                console.error('Role check error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Authorization check failed'
                });
            }
        };
    };
};