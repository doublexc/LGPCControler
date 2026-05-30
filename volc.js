const WebSocket = require('ws');

// 🛠️ ตรวจสอบ IP ให้ตรงกับทีวีของคุณ
const TV_IP = '192.168.1.33'; 
// 🔑 ใส่คีย์ลับที่ได้มาเรียบร้อยแล้ว ไม่ต้องกดยอมรับบนจออีก
const CLIENT_KEY = '630b8a7d80b94e524e3d2741fe2cebbb'; 

console.log('🔄 กำลังยิงสัญญาณควบคุมไปยัง LG TV...');

// ปลดล็อกระบบรักษาความปลอดภัยชั่วคราว
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const ws = new WebSocket(`wss://${TV_IP}:3001`);

// 1. เมื่อเชื่อมต่อสำเร็จ
ws.on('open', () => {
    // ส่งคีย์ล็อกอินเข้าทีวีทันที
    const pairingPayload = {
        type: 'register',
        id: 'register_0',
        payload: {
            'client-key': CLIENT_KEY,
            'manifest': {
                'permissions': ['CONTROL_AUDIO']
            }
        }
    };
    ws.send(JSON.stringify(pairingPayload));
});

// 2. เมื่อทีวีตอบกลับและยืนยันคีย์สำเร็จ
ws.on('message', (data) => {
    const response = JSON.parse(data);
    
    if (response.type === 'registered') {
        console.log('✅ ล็อกอินด้วยคีย์สำเร็จ! กำลังสั่งลดเสียง 5 ขีด...');
        
        // ฟังก์ชันวนลูปส่งคำสั่งลดเสียงแบบหน่วงเวลาเล็กน้อยเพื่อความเสถียร
        let count = 0;
        const interval = setInterval(() => {
            if (count < 5) {
                const volumeDownPayload = {
                    id: `vol_down_${count}`,
                    type: 'request',
                    uri: 'ssap://audio/volumeDown'
                };
                ws.send(JSON.stringify(volumeDownPayload));
                console.log(`🔊 ลดเสียงครั้งที่ ${count + 1}`);
                count++;
            } else {
                clearInterval(interval); // ครบ 5 ครั้งแล้วให้หยุดลูป
                console.log('🎉 สั่งลดเสียงครบ 5 ขีดเรียบร้อยแล้ว!');
                
                // แจ้งเตือนเสร็จสิ้นบนจอทีวี
                ws.send(JSON.stringify({
                    id: 'toast_done',
                    type: 'request',
                    uri: 'ssap://system.notifications/createToast',
                    payload: { message: 'PC สั่งลดเสียงลง 5 ขีดเรียบร้อย! 📉' }
                }));
                
                // ปิดการเชื่อมต่อหลังจากทำงานเสร็จ 2 วินาที
                setTimeout(() => ws.close(), 2000);
            }
        }, 150); // หน่วงเวลา 150 มิลลิวินาที (0.15 วินาที) ต่อการกด 1 ครั้ง
    }
});

ws.on('error', (err) => console.error('❌ เกิดข้อผิดพลาด:', err.message));
ws.on('close', () => console.log('🔌 ปิดท่อส่งสัญญาณเรียบร้อย'));