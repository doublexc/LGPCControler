const { contextBridge, ipcRenderer } = require('electron');

console.log('preload loaded');

contextBridge.exposeInMainWorld('lgremote', {
  start: async (ipAddress) => {
    return await ipcRenderer.invoke('start-remote', ipAddress);
  }
});

// 🌟 แก้ตรงนี้! ห่อหุ้มคำสั่ง send ด้วย ...args เพื่อแอบส่งข้อมูลผ่านด่านความปลอดภัยของ Electron
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  }
});