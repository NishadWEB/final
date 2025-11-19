exports.getRoleSelection = (req, res) => {
  res.render('preloginpage/role-selection', {
    title: 'Choose Your Role - MediDiag',
    user: req.session.user
  });
};

exports.handleRoleSelection = (req, res) => {
  const { role } = req.body;
  
  if (role === 'patient') {
    res.redirect('/auth/register?role=patient');
  } else if (role === 'doctor') {
    res.redirect('/auth/register?role=doctor');
  } else {
    res.redirect('/role-selection');
  }
};