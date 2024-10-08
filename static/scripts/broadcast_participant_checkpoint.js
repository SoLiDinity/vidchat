document.addEventListener('DOMContentLoaded', () => {
    var displayNameInputElement = document.getElementById('display_name_input');
  
    // Event listener untuk mengirim display name saat tombol ditekan
    document.getElementById('btn_submit_name').addEventListener('click', () => {
      const displayName = displayNameInputElement.value.trim();
  
      if (displayName) {
        // Kirim display name ke server atau simpan dalam session
        console.log("Display Name:", displayName);
        // Implementasi untuk menyimpan atau mengirim display name ke server
      } else {
        alert('Tolong masukkan nama tampil Anda.');
      }
    });
  });
  