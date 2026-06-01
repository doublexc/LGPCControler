document.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const tvIpInput = document.getElementById('tvIpInput');
  const trackpad = document.getElementById('trackpad');
  const openWebBtn = document.getElementById('openWebBtn');
  const webUrlInput = document.getElementById('webUrlInput');
  
  let isTvConnected = false;

 // 1. ปุ่มปิดเครื่อง (แทนที่ START เดิม)
  document.getElementById('powerOffBtn').addEventListener('click', () => {
    if (confirm('คุณต้องการปิดทีวีใช่หรือไม่?')) {
      window.ipcRenderer.send('power-off');
    }
  });

  // ปุ่มเพิ่มลดเสียง
  document.getElementById('btnVolUp').addEventListener('click', () => {
    window.ipcRenderer.send('volume-control', 'up');
  });
  
  document.getElementById('btnVolDown').addEventListener('click', () => {
    window.ipcRenderer.send('volume-control', 'down');
  });

  // 2. ปุ่ม CONNECT สั่งสตาร์ทรีโมทและส่ง IP ไปหลังบ้าน
  connectBtn.addEventListener('click', () => {
    const ipAddress = tvIpInput.value.trim();
    if (!ipAddress) {
      alert('กรุณากรอกเลข IP address ของทีวีก่อนครับ!');
      return;
    }
    
    trackpad.textContent = 'กำลังเชื่อมต่อทีวี...';
    
    window.lgremote.start(ipAddress)
      .then((res) => {
        trackpad.textContent = 'เชื่อมต่อสำเร็จ! ลากเมาส์ค้างที่นี่ (ปล่อยนิ้ว=คลิก)';
        trackpad.classList.add('active');
        isTvConnected = true;
      })
      .catch((e) => {
        trackpad.textContent = 'เกิดข้อผิดพลาด: ' + e.message;
        trackpad.classList.remove('active');
        isTvConnected = false;
      });
  });

  // 3. ปุ่มเปิดลิ้งค์เว็บบราวเซอร์ ด้านล่างสุด
  openWebBtn.addEventListener('click', () => {
    let targetUrl = webUrlInput.value.trim();
    if (!targetUrl) {
      alert('กรุณากรอก ที่อยู่ url ที่ต้องการสั่งเปิดก่อนครับ!');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    window.ipcRenderer.send('open-web-url', targetUrl);
  });

  // 4. ปุ่มลัดตัวเลข 0-9 
  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const numValue = btn.getAttribute('data-val');
      const urlShortcutMap = {
        '1': 'https://doublexc.github.io/RD/?id=tvlink1',
        '2': 'https://doublexc.github.io/RD/?id=tvlink2',
        '3': 'https://doublexc.github.io/RD/?id=tvlink3',
        '4': 'https://doublexc.github.io/RD/?id=tvlink4',
        '0': 'https://doublexc.github.io/RD/?id=tvlink0',
        '5': 'https://doublexc.github.io/RD/?id=tvlink5',
        '6': 'https://doublexc.github.io/RD/?id=tvlink6',
        '7': 'https://doublexc.github.io/RD/?id=tvlink7',
        '8': 'https://doublexc.github.io/RD/?id=tvlink8',
        '9': 'https://doublexc.github.io/RD/?id=tvlink9'
      };
      const targetUrl = urlShortcutMap[numValue];
      if (targetUrl) {
        window.ipcRenderer.send('open-web-url', targetUrl);
      }
    });
  });

  // 5. ปุ่มระบบควบคุม: กลับ และ โฮม
  document.getElementById('btnBack').addEventListener('click', () => {
    window.ipcRenderer.send('navigate', 'BACK');
  });
  document.getElementById('btnHome').addEventListener('click', () => {
    window.ipcRenderer.send('navigate', 'HOME');
  });

  // 6. แทร็กแพดขวา (image1) ลากแล้วปล่อยเท่ากับคลิก
  let isTrackpadActive = false;

  trackpad.addEventListener('mousedown', () => { 
    if (isTvConnected) isTrackpadActive = true; 
  });

  window.addEventListener('mouseup', () => { 
    if (isTrackpadActive && isTvConnected) {
      isTrackpadActive = false; 
      window.ipcRenderer.send('click');
    }
  });

  trackpad.addEventListener('mousemove', (e) => {
    if (!isTrackpadActive || !isTvConnected) return;
    const dx = e.movementX;
    const dy = e.movementY;
    if (dx !== 0 || dy !== 0) {
      window.ipcRenderer.send('mouse-move', { dx: dx, dy: dy });
    }
  });

  // ==========================================
  // 🌟 ดักรับเลข IP จากระบบสแกนอัตโนมัติ (Auto-Scan)
  // ==========================================
  window.ipcRenderer.on('tv-found', (event, foundIp) => {
    // 1. เปลี่ยนข้อความบนแทร็กแพดตามที่คุณต้องการ
    trackpad.innerHTML = `IP ที่แนะนำคือ :<b style="color:#4CAF50; font-size:18px;">${foundIp}</b>`;
    
    // 2. [แถมฟีเจอร์หล่อๆ] ยัดเลข IP ลงช่องกรอกให้อัตโนมัติเลย จะได้ไม่ต้องพิมพ์เอง
    if (tvIpInput.value === '') {
      tvIpInput.value = foundIp;
    }
  });

  // เพิ่มต่อจากระบบเมาส์มูฟเดิมใน renderer.js
trackpad.addEventListener('wheel', (e) => {
  if (!isTvConnected) return;
  e.preventDefault();
  
  // ดักจับค่าการรูดขึ้น-ลง ซ้าย-ขวา
  const dx = Math.sign(e.deltaX);
  const dy = Math.sign(e.deltaY); 
  
  // ส่งคำสั่ง scroll แยกท่อออกไป
  window.ipcRenderer.send('mouse-scroll', { dx: dx, dy: dy });
});
});