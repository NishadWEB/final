exports.getAbout = (req, res) => {
  res.render('launchpage/about', { 
    title: 'About MediDiag - Bridging Healthcare Gaps',
    user: req.session.user 
  });
};

exports.getMission = (req, res) => {
  res.render('launchpage/about', { 
    title: 'Our Mission & Vision - MediDiag',
    user: req.session.user,
    activeTab: 'mission'
  });
};

exports.getValues = (req, res) => {
  res.render('launchpage/about', { 
    title: 'Our Values - MediDiag',
    user: req.session.user,
    activeTab: 'values'
  });
};