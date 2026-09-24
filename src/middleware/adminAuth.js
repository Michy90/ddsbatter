// Admin session guard
exports.requireAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) return next();
  res.redirect('/admin/login');
};
