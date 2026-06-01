const WebSocket = require('ws');

// ดึงค่า Dynamic IP ที่รับมาจากหน้าช่องกรอก UI
const TV_IP = global.targetTvIp || '192.168.1.35'; 

console.log(`🔄 กำลังสถาปนาท่อเชื่อมต่อไปยัง LG TV: ${TV_IP}...`);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ws = new WebSocket(`wss://${TV_IP}:3001`);
let pointerWs = null; 

ws.on('open', () => {
    const pairingPayload = {
        type: 'register',
        id: 'register_0',
        payload: {
            'client-key': ' ', 
            'manifest': {
                'permissions': [
                    'LAUNCH', 'CONTROL_AUDIO', 'CONTROL_POWER', 'READ_INSTALLED_APPS',
                    'CONTROL_INPUT_TEXT', 'TEST_OPEN', 'CHECK_LOGGEDIN',
                    'CONTROL_INPUT_JOYSTICK', 'CONTROL_MOUSE_AND_KEYBOARD', 
                    'WRITE_NOTIFICATION_TOAST', 'SUBSCRIBE', 'READ_SETTINGS'
                ]
            }
        }
    };
    ws.send(JSON.stringify(pairingPayload));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.type === 'registered') {
        // ขออนุมัติท่อพิเศษพอร์ตเมาส์รีโมท (ท่อที่ 2)
        ws.send(JSON.stringify({
            id: 'req_pointer_socket',
            type: 'request',
            uri: 'ssap://com.webos.service.networkinput/getPointerInputSocket'
        }));
    }

    if (response.id === 'req_pointer_socket' && response.payload && response.payload.socketPath) {
        pointerWs = new WebSocket(response.payload.socketPath);
    }
});

ws.on('error', (err) => { console.error('❌ Error:', err.message); });

// ==========================================
// 🚀 ฟังก์ชันสั่งเปิดเว็บไซต์บนบราวเซอร์ทีวี
// ==========================================
global.sendOpenWebCommand = (targetUrl) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  console.log(`🚀 สั่งเปิดบราวเซอร์ทีวีไปที่ลิ้งค์: ${targetUrl}`);
  const openWebPayload = {
    id: 'open_browser_cmd',
    type: 'request',
    uri: 'ssap://system.launcher/open',
    payload: {
      id: 'com.webos.app.browser',
      target: targetUrl
    }
  };
  ws.send(JSON.stringify(openWebPayload));
};

// 🌟 แก้ไขบล็อกนี้ใน remote.js
global.sendScrollCommand = (dx, dy) => {
  // เปลี่ยนจาก inputSocket เป็น pointerWs และใช้ WebSocket.OPEN ให้เป็นมาตรฐานเดียวกัน
  if (pointerWs && pointerWs.readyState === WebSocket.OPEN) {
    pointerWs.send(`type:scroll\ndx:${dx}\ndy:${dy}\n\n`);
  }
};

// ==========================================
// 🎮 ฟังก์ชันรีโมทนำทาง และ ควบคุมปุ่มระบบหลัก (Home, Back)
// ==========================================
global.sendNavigateCommand = (direction) => {
  if (!pointerWs || pointerWs.readyState !== WebSocket.OPEN) return;
  
  // ตรวจจับถ้าเป็นคำสั่งปุ่มระบบ ให้ยิงชื่อปุ่มเข้าท่อ Pointer ตรงๆ
  if (direction === 'BACK' || direction === 'HOME') {
    pointerWs.send(`type:button\nname:${direction}\n\n`);
    console.log(`🔮 [System Button] ส่งคำสั่งระบบ: ${direction}`);
    return;
  }
  
  pointerWs.send(`type:button\nname:${direction}\n\n`);
};

global.sendMouseMoveCommand = (dx, dy) => {
  if (!pointerWs || pointerWs.readyState !== WebSocket.OPEN) return; 
  const sensitivity = 2.5; 
  pointerWs.send(`type:move\ndx:${Math.round(dx * sensitivity)}\ndy:${Math.round(dy * sensitivity)}\ndown:0\n\n`);
};

global.sendClickCommand = () => {
  if (!pointerWs || pointerWs.readyState !== WebSocket.OPEN) return;
  pointerWs.send('type:button\nname:CLICK\n\n');
  pointerWs.send('type:button\nname:ENTER\n\n');
};

// ==========================================
// 🔴 ฟังก์ชันปิดเครื่องทีวี
// ==========================================
global.sendPowerOffCommand = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const payload = {
    id: 'power_off_cmd',
    type: 'request',
    uri: 'ssap://system/turnOff'
  };
  ws.send(JSON.stringify(payload));
};

// ==========================================
// 🔊 ฟังก์ชันเพิ่ม-ลดเสียง
// ==========================================
global.sendVolumeCommand = (action) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  // ตรวจสอบว่ากดปุ่ม up หรือ down แล้วเลือก uri ให้ถูก
  const uri = action === 'up' ? 'ssap://audio/volumeUp' : 'ssap://audio/volumeDown';
  
  const payload = {
    id: 'volume_cmd_' + action,
    type: 'request',
    uri: uri
  };
  ws.send(JSON.stringify(payload));
};