const { contextBridge, ipcRenderer } = require('electron');

console.log('preload loaded');

contextBridge.exposeInMainWorld('lgremote', {
  start: async (ipAddress) => {
    return await ipcRenderer.invoke('start-remote', ipAddress);
  }
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  // ท่อส่งข้อมูลจากหน้าบ้าน ไป หลังบ้าน (ของเดิม)
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
  
  // 🌟 ท่อใหม่ที่เพิ่มเข้ามา: รับข้อมูลจากหลังบ้าน มา หน้าบ้าน
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  }
});