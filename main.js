const { app, BrowserWindow, ipcMain } = require('electron'); // 🌟 หัวใจสำคัญ: ต้องมี ipcMain ตรงนี้!
const path = require('path');

let remoteStarted = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  
  // ส่งข้อความ Console จากหน้า UI มาพ่นบน Terminal คอมพิวเตอร์
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Renderer finished loading.');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// =================================================================
// 🔎 ตัวดักเช็กสัญญาณจากหน้า UI (ถ้ากดปุ่มแล้ว จะมาโผล่บน Terminal ทันที)
// =================================================================

// 1. เช็กปุ่ม CONNECT
ipcMain.handle('start-remote', async (event, ipAddress) => {
  console.log(`🔌 [Terminal Check] ปุ่ม CONNECT ถูกกด! เลข IP ที่ส่งมาคือ: ${ipAddress}`);
  global.targetTvIp = ipAddress; 
  if (remoteStarted) return { ok: true, already: true };
  try {
    require(path.join(__dirname, 'remote.js'));
    remoteStarted = true;
    return { ok: true };
  } catch (e) {
    console.error('Failed to start remote:', e);
    return { ok: false, error: e.message };
  }
});

// 2. เช็กปุ่ม เปิดลิ้งค์ URL
ipcMain.on('open-web-url', (event, targetUrl) => {
  console.log(`🚀 [Terminal Check] ปุ่มเปิดลิ้งค์ถูกกด! URL คือ: ${targetUrl}`);
  if (global.sendOpenWebCommand && typeof global.sendOpenWebCommand === 'function') {
    global.sendOpenWebCommand(targetUrl);
  }
});

// 3. เช็กปุ่มทิศทาง ปุ่มกลับ ปุ่มโฮม
ipcMain.on('navigate', (event, direction) => {
  console.log(`🎮 [Terminal Check] ปุ่มระบบถูกกด: ${direction}`);
  if (global.sendNavigateCommand && typeof global.sendNavigateCommand === 'function') {
    global.sendNavigateCommand(direction);
  }
});

// แปะเพิ่มในโซน ipcMain ของ main.js
ipcMain.on('mouse-scroll', (event, data) => {
  if (global.sendScrollCommand && typeof global.sendScrollCommand === 'function') {
    // โยนค่า dx, dy ต่อไปให้ไฟล์ remote.js
    global.sendScrollCommand(data.dx, data.dy); 
  }
});

// 4. เช็กจังหวะปล่อยเมาส์ (คลิกอัตโนมัติ)
ipcMain.on('click', (event) => {
  console.log(`🖱️ [Terminal Check] อีเวนต์ปล่อยเมาส์ทำงาน (CLICK)`);
  if (global.sendClickCommand && typeof global.sendClickCommand === 'function') {
    global.sendClickCommand();
  }
});

// 5. เช็กจังหวะลากขยับเมาส์บน แทร็กแพด
ipcMain.on('mouse-move', (event, data) => {
  console.log(`📐 [Terminal Check] เมาส์ขยับบนแทร็กแพด: dx=${data.dx}, dy=${data.dy}`);
  if (global.sendMouseMoveCommand && typeof global.sendMouseMoveCommand === 'function') {
    global.sendMouseMoveCommand(data.dx, data.dy);
  }
});