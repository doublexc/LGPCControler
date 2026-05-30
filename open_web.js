const WebSocket = require('ws');
const readline = require('readline');

// 🔑 คีย์ลับที่คุณได้มา (ใช้คีย์เดิมล็อกอินได้เลย ไม่ต้องกดยอมรับบนจอซ้ำ)
const CLIENT_KEY = '630b8a7d80b94e524e3d2741fe2cebbb'; 

// ตั้งค่าตัวรับค่าพิมพ์จาก Terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// สเต็ปที่ 1: ถามเลข IP ของทีวี
rl.question('🌐 กรุณาใส่เลข IP ของทีวี (เช่น 192.168.1.50): ', (ipInput) => {
    const TV_IP = ipInput.trim();

    // สเต็ปที่ 2: ถาม URL ที่ต้องการให้เปิด
    rl.question('🔗 กรุณาใส่ URL ของเว็บที่ต้องการให้เปิด (เช่น https://google.com): ', (urlInput) => {
        let targetUrl = urlInput.trim();

        // ตรวจสอบเติม https:// ข้างหน้าให้อัตโนมัติถ้าลืมพิมพ์
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        console.log(`\n🔄 กำลังเชื่อมต่อไปยังทีวี IP: ${TV_IP}...`);
        const ws = new WebSocket(`wss://${TV_IP}:3001`);

        // 1. เมื่อท่อ WebSocket เปิดสำเร็จ
        ws.on('open', () => {
            // ส่งคีย์ล็อกอินเข้าทีวี
            const pairingPayload = {
                type: 'register',
                id: 'register_0',
                payload: {
                    'client-key': CLIENT_KEY,
                    'manifest': { 'permissions': ['LAUNCH'] } // ขอสิทธิ์ในการเปิดแอป/เว็บ
                }
            };
            ws.send(JSON.stringify(pairingPayload));
        });

        // 2. เมื่อทีวีตอบรับและยืนยันคีย์สำเร็จ
        ws.on('message', (data) => {
            const response = JSON.parse(data);

            if (response.type === 'registered') {
                console.log('✅ ล็อกอินสำเร็จ!');
                console.log(`🚀 กำลังสั่งให้ทีวีเปิดเว็บ: ${targetUrl}`);

                // Payload พิเศษสำหรับสั่งให้ webOS เปิดระบบ Web Browser ขึ้นมาพร้อม URL ที่กำหนด
                const openWebPayload = {
                    id: 'open_browser_cmd',
                    type: 'request',
                    uri: 'ssap://system.launcher/open',
                    payload: {
                        id: 'com.webos.app.browser', // 🌐 เปลี่ยนมาใช้ ID แท้ของแอป Web Browser บน LG TV, // 💡 เคล็ดลับ: 'amazon' คือ ID ระบบภายในของแอป Web Browser บน LG TV
                        target: targetUrl // ลิงก์เว็บที่เราต้องการสั่งเปิด
                    }
                };

                ws.send(JSON.stringify(openWebPayload));
            }
            
            // ถ้าได้รับคำตอบตอบรับคำสั่งกลับมาจากทีวีแล้ว ให้ปิดโปรแกรม
            if (response.id === 'open_browser_cmd') {
                console.log('🎉 ส่งคำสั่งสำเร็จแล้ว! หน้าจอทีวีควรจะกำลังเปิดเว็บครับ');
                ws.close();
                rl.close();
                process.exit();
            }
        });

        // จัดการกรณีเกิดข้อผิดพลาด
        ws.on('error', (err) => {
            console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:', err.message);
            rl.close();
            process.exit();
        });
    });
});