const dgram = require('dgram');

console.log('🔍 กำลังเริ่มสแกนหา LG Smart TV ในวงเน็ตบ้านของคุณ...');
console.log('⏳ (กรุณาเปิดทีวีทิ้งไว้ระหว่างสแกนนะครับ)');

// สร้างตัวรับส่งข้อมูลแบบ UDP
const client = dgram.createSocket('udp4');

// ข้อความมาตรฐานของโปรโตคอล SSDP เพื่อค้นหาอุปกรณ์ประเภท LG Smart TV (webOS)
const ssdpQuery = 
    'M-SEARCH * HTTP/1.1\r\n' +
    'HOST: 239.255.255.250:1900\r\n' +
    'MAN: "ssdp:discover"\r\n' +
    'MX: 3\r\n' +
    'ST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n' + // สแกนหาอุปกรณ์รับภาพ/เสียง
    '\r\n';

const message = Buffer.from(ssdpQuery);

// ยิงสัญญาณออกไปในวงเน็ตบ้าน (ผ่านเลข IP สากลสำหรับค้นหาอุปกรณ์ 239.255.255.250)
client.send(message, 0, message.length, 1900, '239.255.255.250', (err) => {
    if (err) {
        console.error('❌ ยิงสัญญาณล้มเหลว:', err.message);
        client.close();
    }
});

// คอยดักฟังว่ามีอุปกรณ์ตัวไหนตอบกลับสัญญาณมาบ้าง
client.on('message', (msg, rinfo) => {
    const response = msg.toString();
    
    // เช็กว่าข้อความที่ตอบกลับมา มีร่องรอยว่าเป็นทีวี LG หรือระบบ webOS ไหม
    if (response.includes('LG') || response.includes('WebOS') || response.includes('webOS')) {
        console.log('\n=============================================');
        console.log('📺 เจอ LG Smart TV แล้วครับ!');
        console.log(`📌 IP Address ของทีวีคือ: ${rinfo.address}`);
        console.log('=============================================');
        
        // เมื่อเจอแล้วให้ปิดระบบสแกนทันทีเพื่อประหยัดทรัพยากรเครื่อง
        client.close();

        // 🛠️ แก้ไขตรงนี้: สร้างตัวหยุดรอให้กด Enter ก่อนปิดหน้าต่าง
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('\n⌨️  จดเลข IP เรียบร้อยแล้ว กด Enter เพื่อปิดโปรแกรม...', () => {
            rl.close();
            process.exit(); // ค่อยปิดตัวเองหลังจากกด Enter
        });
    }
});

// ตั้งเวลาจังหวะสุดท้าย: ถ้าผ่านไป 10 วินาทีแล้วไม่มีอะไรตอบกลับมา ให้ปิดระบบอัตโนมัติ
setTimeout(() => {
    console.log('\n⏱️  หมดเวลาสแกน 10 วินาที ไม่พบทีวีในวงเน็ตนี้');
    console.log('💡 คำแนะนำ: เช็กให้ชัวร์ว่า PC กับ ทีวี ต่อ Wi-Fi ชื่อเดียวกันเป๊ะๆ นะครับ');
    client.close();
    process.exit();
}, 10000);