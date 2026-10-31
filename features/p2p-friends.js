const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const dgram = require('dgram');
const crypto = require('crypto');
const electron = (() => { try { return require('electron'); } catch { return {}; } })();

class P2PFriendsNetwork {
  constructor() {
    this.appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));
    this.storagePath = path.join(this.appData, '.sklauncher', 'p2p_friends.json');
    this.data = {
      identity: null,
      friends: []
    };
    this.friendsWindow = null;
    this.heartbeatTimer = null;
    this.currentGame = {
      running: false,
      instanceName: null,
      server: null
    };

    this.loadStorage();
  }

  loadStorage() {
    try {
      if (fs.existsSync(this.storagePath)) {
        this.data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
      }
    } catch (e) {
      console.warn('[P2PFriends] Could not read storage file, initializing default:', e.message);
    }

    if (!this.data.identity || !this.data.identity.friendCode) {
      const codePart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const codePart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      this.data.identity = {
        friendCode: `SK-${codePart1}-${codePart2}`,
        username: 'Player_' + codePart1,
        createdAt: Date.now()
      };
      this.saveStorage();
    }

    if (!Array.isArray(this.data.friends)) {
      this.data.friends = [];
    }
  }

  saveStorage() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[P2PFriends] Failed to save storage:', e.message);
    }
  }

  
  getActiveAccount() {
    try {
      const accountsPath = path.join(this.appData, '.sklauncher', 'accounts.json');
      if (fs.existsSync(accountsPath)) {
        const accs = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
        const active = (accs.accounts || []).find(a => a.id === accs.activeAccountId) || (accs.accounts && accs.accounts[0]);
        if (active) return active;
      }
    } catch (e) {
      console.warn('[P2PFriends] Could not read accounts.json:', e.message);
    }
    return null;
  }

  getMyIdentity(activeUsername) {
    const activeAcc = this.getActiveAccount();
    if (activeAcc && activeAcc.username) {
      this.data.identity.username = activeAcc.username;
      this.data.identity.uuid = activeAcc.uuid;
      this.saveStorage();
    }
    if (activeUsername && activeUsername !== this.data.identity.username) {
      this.data.identity.username = activeUsername;
      this.saveStorage();
    }

    return {
      friendCode: this.data.identity.friendCode,
      username: this.data.identity.username,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(this.data.identity.username)}/64`,
      status: this.currentGame.running ? (this.currentGame.server ? 'in-game' : 'playing-solo') : 'online',
      server: this.currentGame.server,
      instanceName: this.currentGame.instanceName
    };
  }

  addFriend(code, preferredName) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === this.data.identity.friendCode) {
      return { success: false, error: "You cannot add yourself as a friend!" };
    }

    const existing = this.data.friends.find(f => f.friendCode === cleanCode);
    if (existing) {
      return { success: false, error: "This friend is already in your friends list." };
    }

    const username = preferredName ? preferredName.trim() : `Friend_${cleanCode.replace(/[^A-Z0-9]/g, '').slice(-4)}`;
    const newFriend = {
      friendCode: cleanCode,
      username: username,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`,
      status: 'online',
      currentServer: null,
      lastSeen: Date.now()
    };

    this.data.friends.push(newFriend);
    this.saveStorage();

    // Broadcast mutual ping
    this.broadcastPresence();

    return { success: true, friend: newFriend };
  }

  removeFriend(friendCode) {
    const idx = this.data.friends.findIndex(f => f.friendCode === friendCode);
    if (idx !== -1) {
      this.data.friends.splice(idx, 1);
      this.saveStorage();
      return { success: true };
    }
    return { success: false, error: 'Friend not found' };
  }

  listFriends() {
    // Update live presence and avatar URLs
    return this.data.friends.map(f => ({
      ...f,
      avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(f.username)}/64`
    }));
  }

  setGameRunning(running, instanceName = null, server = null) {
    this.currentGame.running = running;
    this.currentGame.instanceName = instanceName;
    this.currentGame.server = server;
    this.broadcastPresence();

    if (this.friendsWindow && !this.friendsWindow.isDestroyed()) {
      this.friendsWindow.webContents.send('p2p-friends:presence-updated', this.listFriends());
    }
  }

  broadcastPresence() {
    try {
      const payload = {
        friendCode: this.data.identity.friendCode,
        username: this.data.identity.username,
        status: this.currentGame.running ? (this.currentGame.server ? 'in-game' : 'playing-solo') : 'online',
        server: this.currentGame.server,
        instanceName: this.currentGame.instanceName,
        timestamp: Date.now()
      };

      // 1. LAN Broadcast over UDP
      try {
        const client = dgram.createSocket('udp4');
        client.bind(() => {
          client.setBroadcast(true);
          const msg = Buffer.from(JSON.stringify({ type: 'sklauncher-p2p', payload }));
          client.send(msg, 0, msg.length, 25564, '255.255.255.255', () => {
            try { client.close(); } catch {}
          });
        });
      } catch {}

      // 2. Global Zero-Config Cloud Relay (via ntfy pub/sub channel for each friend)
      for (const friend of this.data.friends) {
        this._sendHttpRelay(friend.friendCode, payload);
      }
    } catch (e) {
      console.warn('[P2PFriends] Error broadcasting presence:', e.message);
    }
  }

  _sendHttpRelay(targetCode, payload) {
    try {
      const topic = `sk-presence-${targetCode.replace(/[^A-Za-z0-9]/g, '').toLowerCase()}`;
      const req = https.request({
        hostname: 'ntfy.sh',
        path: `/${topic}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Title': 'Presence Update',
          'Priority': '1'
        },
        timeout: 4000
      });
      req.on('error', () => {});
      req.write(JSON.stringify(payload));
      req.end();
    } catch {}
  }

  openFriendsWindow() {
    if (this.friendsWindow && !this.friendsWindow.isDestroyed()) {
      this.friendsWindow.show();
      this.friendsWindow.focus();
      return this.friendsWindow;
    }

    const BrowserWindow = electron.BrowserWindow;
    if (!BrowserWindow) return null;

    const htmlPath = path.join(__dirname, '..', 'out', 'renderer', 'friends.html');

    this.friendsWindow = new BrowserWindow({
      width: 440,
      height: 680,
      minWidth: 380,
      minHeight: 500,
      title: 'Friends Network - SKLauncher',
      autoHideMenuBar: true,
      backgroundColor: '#18181b',
      webPreferences: {
        preload: path.join(__dirname, '..', 'out', 'preload', 'index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.friendsWindow.loadFile(htmlPath);

    this.friendsWindow.on('closed', () => {
      this.friendsWindow = null;
    });

    return this.friendsWindow;
  }

  registerIpc(ipcMain) {
    ipcMain.handle('custom-skin:import', async () => {
      const { dialog } = require('electron');
      const res = await dialog.showOpenDialog({
        title: 'Select Minecraft Skin (.png)',
        filters: [{ name: 'Minecraft Skin (*.png)', extensions: ['png'] }],
        properties: ['openFile']
      });
      if (res.canceled || !res.filePaths || !res.filePaths.length) {
        return { canceled: true };
      }

      const filePath = res.filePaths[0];
      const skinBytes = fs.readFileSync(filePath);

      const active = this.getActiveAccount();
      if (!active) {
        return { success: false, error: 'No active Minecraft account found in SKLauncher.' };
      }

      const rawUuid = (active.uuid || 'steve').replace(/-/g, '');
      const prefix = rawUuid.slice(0, 2);
      const skinDir = path.join(this.appData, '.sklauncher', 'assets', 'skins', prefix);
      if (!fs.existsSync(skinDir)) {
        fs.mkdirSync(skinDir, { recursive: true });
      }

      const targetPath = path.join(skinDir, rawUuid);
      fs.writeFileSync(targetPath, skinBytes);

      const dataUrl = 'data:image/png;base64,' + skinBytes.toString('base64');
      return {
        success: true,
        username: active.username,
        targetPath,
        dataUrl
      };
    });

    ipcMain.handle('p2p-friends:get-my-identity', async (event, currentUsername) => {
      return this.getMyIdentity(currentUsername);
    });

    ipcMain.handle('p2p-friends:list-friends', async () => {
      return this.listFriends();
    });

    ipcMain.handle('p2p-friends:add-friend', async (event, code, username) => {
      return this.addFriend(code, username);
    });

    ipcMain.handle('p2p-friends:remove-friend', async (event, code) => {
      return this.removeFriend(code);
    });

    ipcMain.handle('p2p-friends:open-window', async () => {
      return !!this.openFriendsWindow();
    });

    ipcMain.handle('p2p-friends:join-server', async (event, serverAddress) => {
      console.log('[P2PFriends] User requested to join friend server:', serverAddress);
      // Copy to clipboard or trigger instance launch with server address
      if (electron.clipboard) {
        electron.clipboard.writeText(serverAddress);
      }
      return {
        success: true,
        server: serverAddress,
        message: `Server address '${serverAddress}' copied to clipboard! Launch your instance and connect.`
      };
    });
  }
}

module.exports = new P2PFriendsNetwork();
