document.addEventListener('DOMContentLoaded', function() {
    const dashboardTrigger = document.getElementById('dashboardTrigger');
    const megaMenu = document.getElementById('megaMenu');
    const closeMegaMenu = document.getElementById('closeMegaMenu');

   
    dashboardTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      megaMenu.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });

    
    closeMegaMenu.addEventListener('click', function() {
      megaMenu.style.display = 'none';
      document.body.style.overflow = 'auto';
    });

   
    megaMenu.addEventListener('click', function(e) {
      if (e.target === megaMenu) {
        megaMenu.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && megaMenu.style.display === 'block') {
        megaMenu.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  });