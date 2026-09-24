document.addEventListener('DOMContentLoaded', () => {
  // Show/hide delivery address field
  const radios   = document.querySelectorAll('input[name="delivery_method"]');
  const addrWrap = document.getElementById('deliveryAddressWrap');
  if (radios.length && addrWrap) {
    radios.forEach(r => {
      r.addEventListener('change', () => {
        addrWrap.style.display = (r.value === 'delivery' && r.checked) ? '' : 'none';
      });
    });
  }

  // Enforce min date — 3 days from today
  const dateInput = document.getElementById('eventDate');
  if (dateInput) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    dateInput.min = minDate.toISOString().slice(0, 10);
    if (dateInput.value && dateInput.value < dateInput.min) {
      dateInput.value = '';
    }
  }
});
