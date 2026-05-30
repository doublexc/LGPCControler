const WebSocket = require('ws');
const readline = require('readline');

// 🛠️ ตรวจสอบ IP ให้ตรงกับทีวีของคุณ
const TV_IP = '192.168.1.33'; 
// 🔑 คีย์ลับที่คุณได้มา
const CLIENT_KEY = '630b8a7d80b94e524e3d2741fe2cebbb'; 

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const ws = new WebSocket(`wss://${TV_IP}:3001`);

console.log('🔄 กำลังเชื่อมต่อระบบรีโมทคีย์บอร์ด...');

ws.on('open', () => {
    // ส่งคีย์ล็อกอิน
    const pairingPayload = {
        type: 'register',
        id: 'register_0',
        payload: {
            'client-key': CLIENT_KEY,
            'manifest': { 'permissions': ['CONTROL_AUDIO', 'CONTROL_POWER', 'LAUNCH'] }
        }
    };
    ws.send(JSON.stringify(pairingPayload));
});

ws.on('message', (data) => {
    const response = JSON.parse(data);
    
    if (response.type === 'registered') {
        console.clear(); // เคลียร์หน้าจอให้สะอาด
        console.log('==========================================');
        console.log('📺 ✅ LG TV KEYBOARD REMOTE พร้อมใช้งานแล้ว!');
        console.log('==========================================');
        console.log('⌨️  [วิธีควบคุมผ่านคีย์บอร์ด PC]');
        console.log('   • ลูกศรขึ้น (Up Arrow)   : เพิ่มเสียง 🔊');
        console.log('   • ลูกศรลง (Down Arrow) : ลดเสียง 🔉');
        console.log('   • ปุ่ม M                 : ปิด/เปิดเสียง (Mute) 🔇');
        console.log('   • ปุ่ม H                 : เปิดแอป YouTube 📺');
        console.log('   • ปุ่ม P                 : ปิดทีวี (Power Off) 🔌');
        console.log('   • ปุ่ม Esc               : ออกจากโปรแกรม ❌');
        console.log('==========================================');
        console.log('Waiting for keypress...');

        // เริ่มต้นระบบดักจับการกดปุ่มคีย์บอร์ด
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true); // โหมดจับปุ่มกดเดี่ยวๆ โดยไม่ต้องกด Enter
        }

        process.stdin.on('keypress', (str, key) => {
            // ปุ่ม Esc สำหรับออกจากโปรแกรม
            if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
                console.log('\n🔌 ปิดโปรแกรมรีโมท...');
                ws.close();
                process.exit();
            }

            // คำสั่งตามปุ่มกด
            let uri = '';
            let payload = {};

            switch (key.name) {
                case 'up': // ลูกศรขึ้น
                    uri = 'ssap://audio/volumeUp';
                    console.log('-> สั่ง: เพิ่มเสียง 🔊');
                    break;
                case 'down': // ลูกศรลง
                    uri = 'ssap://audio/volumeDown';
                    console.log('-> สั่ง: ลดเสียง 🔉');
                    break;
                case 'm': // ปุ่ม M
                    uri = 'ssap://audio/setMute';
                    // ในที่นี้เราจะสั่งสลับสถานะ (ถ้าอยากให้ล็อกค่าต้องใส่ true/false)
                    console.log('-> สั่ง: สลับสถานะปิด/เปิดเสียง 🔇');
                    break;
                case 'h': // ปุ่ม H (Home/YouTube)
                    uri = 'ssap://system.launcher/open';
                    payload = { id: 'youtube.leanback' };
                    console.log('-> สั่ง: เปิดแอป YouTube 📺');
                    break;
                case 'p': // ปุ่ม P
                    uri = 'ssap://system/turnOff';
                    console.log('-> สั่ง: ปิดทีวี 🔌');
                    break;
            }

            // ถ้ามีคำสั่งตรงกับที่ตั้งไว้ ให้ส่งออกไปทาง WebSocket
            if (uri) {
                ws.send(JSON.stringify({
                    id: `cmd_${Date.now()}`,
                    type: 'request',
                    uri: uri,
                    payload: payload
                }));
            }
        });
    }
});

ws.on('error', (err) => console.error('❌ เกิดข้อผิดพลาด:', err.message));