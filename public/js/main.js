// Main JavaScript for MixTrip

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      
      // Toggle hamburger icon animation
      const bars = mobileMenuToggle.querySelectorAll('.bar');
      if (mobileMenu.classList.contains('active')) {
        bars[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
      } else {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
      }
    });
  }
  
  // User dropdown menu
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdown = document.querySelector('.dropdown');
  
  if (dropdownToggle && dropdown) {
    dropdownToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdown.classList.remove('active');
    });
  }
  
  // Copy share link
  const copyBtn = document.querySelector('.copy-btn');
  const shareUrl = document.querySelector('.share-url');
  
  if (copyBtn && shareUrl) {
    copyBtn.addEventListener('click', function() {
      // Select the text
      shareUrl.select();
      shareUrl.setSelectionRange(0, 99999); // For mobile devices
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl.value)
        .then(() => {
          // Change button text temporarily
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'คัดลอกแล้ว!';
          copyBtn.style.backgroundColor = '#28a745';
          
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    });
  }
  
  // Auto close alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  if (alerts.length > 0) {
    setTimeout(() => {
      alerts.forEach(alert => {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.style.display = 'none';
        }, 300);
      });
    }, 5000);
  }
});