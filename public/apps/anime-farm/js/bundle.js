/* eslint-disable */
// =================================================================
// BUNDLE TỰ ĐỘNG: CHẠY TRỰC TIẾP KHÔNG CẦN LOCALHOST SERVER NÀO HẾT
// NGƯỜI DÙNG CHỈ CẦN DOUBLE-CLICK INDEX.HTML LÀ CHƠI ĐƯỢC NGAY!
// =================================================================

(function() {
  'use strict';

  // 1. DỮ LIỆU CÂY TRỒNG
  const CROPS = {
    wheat: {
      id: 'wheat',
      name: 'Lúa mì',
      icon: '🌾',
      seedIcon: '🌱',
      levelReq: 1,
      growTime: 10,
      waterBoost: 5,
      seedCost: 2,
      sellPrice: 5,
      orderPrice: 8,
      expGain: 3,
      color: '#eab308',
      description: 'Lương thực cơ bản, tưới nước rút ngắn 5 giây.'
    },
    cucumber: {
      id: 'cucumber',
      name: 'Dưa leo',
      icon: '🥒',
      seedIcon: '🌱',
      levelReq: 1,
      growTime: 20,
      waterBoost: 10,
      seedCost: 5,
      sellPrice: 12,
      orderPrice: 18,
      expGain: 6,
      color: '#22c55e',
      description: 'Dưa leo xanh giòn, tưới nước rút ngắn 10 giây.'
    },
    eggplant: {
      id: 'eggplant',
      name: 'Cà tím',
      icon: '🍆',
      seedIcon: '🌱',
      levelReq: 2,
      growTime: 40,
      waterBoost: 20,
      seedCost: 12,
      sellPrice: 30,
      orderPrice: 45,
      expGain: 14,
      color: '#9333ea',
      description: 'Quả cà tím căng bóng, tưới nước rút ngắn 20 giây.'
    },
    pepper: {
      id: 'pepper',
      name: 'Ớt đỏ',
      icon: '🌶️',
      seedIcon: '🌱',
      levelReq: 3,
      growTime: 70,
      waterBoost: 35,
      seedCost: 25,
      sellPrice: 65,
      orderPrice: 95,
      expGain: 25,
      color: '#ef4444',
      description: 'Ớt chín đỏ mọng, tưới nước rút ngắn 35 giây.'
    },
    carrot: {
      id: 'carrot',
      name: 'Cà rốt',
      icon: '🥕',
      seedIcon: '🌱',
      levelReq: 4,
      growTime: 120,
      waterBoost: 60,
      seedCost: 50,
      sellPrice: 130,
      orderPrice: 190,
      expGain: 55,
      color: '#f97316',
      description: 'Cà rốt bổ dưỡng, tưới nước rút ngắn 60 giây.'
    },
    corn: {
      id: 'corn',
      name: 'Bắp ngô',
      icon: '🌽',
      seedIcon: '🌱',
      levelReq: 5,
      growTime: 240,
      waterBoost: 120,
      seedCost: 100,
      sellPrice: 280,
      orderPrice: 400,
      expGain: 120,
      color: '#fbbf24',
      description: 'Bắp ngô ngọt ngào, tưới nước rút ngắn 120 giây.'
    }
  };

  // 2. CẤP ĐỘ VÀ KINH NGHIỆM
  const LEVELS = [
    { level: 1, expRequired: 0, rewardCoins: 0, unlockNote: 'Khởi đầu làm nông với Lúa mì & Dưa leo 🌱' },
    { level: 2, expRequired: 20, rewardCoins: 50, unlockNote: 'Mở khóa hạt giống: Cà tím 🍆' },
    { level: 3, expRequired: 60, rewardCoins: 120, unlockNote: 'Mở khóa hạt giống: Ớt đỏ 🌶️' },
    { level: 4, expRequired: 150, rewardCoins: 250, unlockNote: 'Mở khóa hạt giống: Cà rốt 🥕' },
    { level: 5, expRequired: 350, rewardCoins: 500, unlockNote: 'Mở khóa hạt giống: Bắp ngô 🌽' },
    { level: 6, expRequired: 750, rewardCoins: 1000, unlockNote: 'Đạt danh hiệu Phú Nông Làng Quê 🌾' },
    { level: 7, expRequired: 1500, rewardCoins: 2000, unlockNote: 'Đạt danh hiệu Đại Địa Chủ Miền Tây 🏡' },
    { level: 8, expRequired: 2500, rewardCoins: 3000, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 9 (Lv.8) 🚜' },
    { level: 9, expRequired: 4000, rewardCoins: 4000, unlockNote: 'Đạt danh hiệu Nhà Đầu Tư Nông Nghiệp 🌟' },
    { level: 10, expRequired: 6000, rewardCoins: 5000, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 10 (Lv.10) 🌻' },
    { level: 11, expRequired: 9000, rewardCoins: 6500, unlockNote: 'Đạt danh hiệu Triệu Phú Nông Thôn 💰' },
    { level: 12, expRequired: 13000, rewardCoins: 8000, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 11 (Lv.12) 💎' },
    { level: 13, expRequired: 18000, rewardCoins: 10000, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 12 (Lv.13) - Cực Phẩm Cánh Đồng! 👑' },
    { level: 14, expRequired: 25000, rewardCoins: 15000, unlockNote: 'Danh hiệu: Huyền Thoại Nông Trại Anime ⭐' },
    { level: 15, expRequired: 35000, rewardCoins: 20000, unlockNote: 'Danh hiệu: Bậc Thầy Nông Nghiệp Vĩ Đại 🏆' }
  ];

  function getLevelInfo(totalExp) {
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalExp >= LEVELS[i].expRequired) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }

    let progress = 100;
    let expCurrentLevel = totalExp - currentLevel.expRequired;
    let expToNext = 0;

    if (nextLevel) {
      const diff = nextLevel.expRequired - currentLevel.expRequired;
      progress = Math.min(100, Math.max(0, (expCurrentLevel / diff) * 100));
      expToNext = Math.max(0, nextLevel.expRequired - totalExp);
    }

    return {
      level: currentLevel.level,
      totalExp,
      expCurrentLevel,
      expToNext,
      progress,
      unlockNote: currentLevel.unlockNote,
      currentLevel,
      nextLevel
    };
  }

  // 3. HỆ THỐNG ÂM THANH PROCEDURAL (WEB AUDIO API)
  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    playHoe() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    }

    playPlant() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playWater() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.04, 0.08].forEach((delay, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 500 + idx * 150;
        osc.frequency.setValueAtTime(baseFreq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + delay + 0.06);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    }

    playHarvest() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.16);
      });
    }

    playCoin() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.22, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.26);
      });
    }

    playLevelUp() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + (idx === 3 ? 0.4 : 0.15));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    }

    playClick() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }
  }

  const sound = new SoundSystem();

  // 4. GAME STATE MANAGEMENT
  const STORAGE_KEY = 'FAM_FARM_GAME_SAVE_V6_3PLOTS';

  // Dọn dẹp save cũ để cập nhật ngay bàn cờ chuẩn 3 ô đầu game
  try {
    localStorage.removeItem('FAM_FARM_GAME_SAVE_V1');
    localStorage.removeItem('FAM_FARM_GAME_SAVE_V2');
    localStorage.removeItem('FAM_FARM_GAME_SAVE_V3');
    localStorage.removeItem('FAM_FARM_GAME_SAVE_V4_FRESH');
    localStorage.removeItem('FAM_FARM_GAME_SAVE_V5_TILLED');
    localStorage.removeItem('FAM_ORDERS_SAVE_V1');
    localStorage.removeItem('FAM_ORDERS_SAVE_V2');
    localStorage.removeItem('FAM_ORDERS_SAVE_V3');
  } catch (e) {}

  class GameState {
    constructor() {
      this.coins = 100;
      this.exp = 0;
      this.barnCapacity = 60;
      this.selectedTool = 'seed';
      this.selectedSeed = 'wheat';
      this.lastSavedAt = Date.now();
      this.plots = [];
      this.inventory = {
        seeds: {
          wheat: 6,
          cucumber: 4,
          eggplant: 0,
          pepper: 0,
          carrot: 0,
          corn: 0
        },
        crops: {
          wheat: 0,
          cucumber: 0,
          eggplant: 0,
          pepper: 0,
          carrot: 0,
          corn: 0
        }
      };
      this.stats = { totalHarvests: 0, totalEarned: 0 };
      this.listeners = [];
      this.initDefaultPlots();
    }

    initDefaultPlots() {
      // Đầu game chuẩn: Chỉ có 3 ô đầu tiên mở sẵn để trồng trọt, 9 ô còn lại đều bị khóa cần lên cấp và tiền vàng để mở dần!
      this.plots = [
        { id: 0, status: 'TILLED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 0, reqLevel: 1 },
        { id: 1, status: 'TILLED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 0, reqLevel: 1 },
        { id: 2, status: 'TILLED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 0, reqLevel: 1 },

        { id: 3, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 30, reqLevel: 2 },
        { id: 4, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 60, reqLevel: 3 },
        { id: 5, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 100, reqLevel: 4 },
        { id: 6, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 150, reqLevel: 5 },
        { id: 7, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 220, reqLevel: 6 },
        { id: 8, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 320, reqLevel: 8 },
        { id: 9, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 450, reqLevel: 10 },
        { id: 10, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 600, reqLevel: 12 },
        { id: 11, status: 'LOCKED', cropId: null, growthProgress: 0, elapsedSeconds: 0, growDuration: 0, isWatered: false, unlockCost: 800, reqLevel: 13 }
      ];
    }

    subscribe(fn) { this.listeners.push(fn); }
    notify(evt, data) { this.listeners.forEach(fn => fn(evt, data, this)); }
    getLevelData() { return getLevelInfo(this.exp); }
    getBarnUsage() {
      let total = 0;
      for (const k in this.inventory.crops) total += this.inventory.crops[k] || 0;
      return total;
    }

    addCoins(amount) {
      this.coins = Math.max(0, this.coins + amount);
      if (amount > 0) this.stats.totalEarned += amount;
      this.notify('COINS_CHANGED', { amount, current: this.coins });
      this.save();
    }

    addExp(amount) {
      const prev = this.getLevelData().level;
      this.exp += amount;
      const cur = this.getLevelData();
      this.notify('EXP_CHANGED', { amount, current: this.exp, levelData: cur });
      if (cur.level > prev) {
        this.notify('LEVEL_UP', {
          newLevel: cur.level,
          rewardCoins: cur.rewardCoins,
          unlockNote: cur.unlockNote
        });
        if (cur.rewardCoins > 0) this.addCoins(cur.rewardCoins);
      }
      this.save();
    }

    unlockPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'LOCKED') return false;
      if (this.coins < plot.unlockCost) return { success: false, reason: 'NOT_ENOUGH_COINS' };
      this.addCoins(-plot.unlockCost);
      plot.status = 'TILLED';
      this.notify('PLOT_UNLOCKED', { plot });
      this.save();
      return { success: true };
    }

    tillPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (plot && plot.status === 'RAW') {
        plot.status = 'TILLED';
        plot.isWatered = false;
        this.notify('PLOT_TILLED', { plot });
        this.save();
        return true;
      }
      return false;
    }

    plantSeed(plotId, cropId = this.selectedSeed) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'TILLED') return false;
      const crop = CROPS[cropId];
      if (!crop) return false;
      if (this.getLevelData().level < crop.levelReq) return { success: false, reason: 'LEVEL_LOCKED', levelReq: crop.levelReq };
      if ((this.inventory.seeds[cropId] || 0) <= 0) return { success: false, reason: 'NO_SEEDS' };

      this.inventory.seeds[cropId]--;
      plot.cropId = cropId;
      plot.growDuration = crop.growTime;
      plot.elapsedSeconds = 0;
      plot.growthProgress = 0;
      plot.isWatered = false;
      plot.status = 'PLANTED_DRY';
      this.notify('PLOT_PLANTED', { plot, crop });
      this.save();
      return { success: true, crop };
    }

    waterPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      // Chỉ cho phép tưới khi ô đất đã trồng cây và đang cần nước (PLANTED_DRY)
      if (!plot || !plot.cropId || plot.status !== 'PLANTED_DRY' || plot.isWatered) {
        return { success: false, boostSeconds: 0, reason: 'NOT_WATERABLE' };
      }

      const crop = CROPS[plot.cropId];
      const boostSeconds = crop ? (crop.waterBoost || Math.floor(crop.growTime * 0.5)) : 0;
      plot.elapsedSeconds = Math.min(plot.growDuration, plot.elapsedSeconds + boostSeconds);
      plot.growthProgress = Math.min(100, (plot.elapsedSeconds / plot.growDuration) * 100);
      plot.isWatered = true;

      if (plot.elapsedSeconds >= plot.growDuration) {
        plot.status = 'MATURE';
        plot.growthProgress = 100;
        this.notify('CROP_MATURED', { plot });
      } else {
        plot.status = 'PLANTED_WATERED';
        this.notify('PLOT_WATERED', { plot, boostSeconds, crop });
      }

      this.save();
      return { success: true, boostSeconds, crop };
    }

    harvestPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'MATURE') return null;
      const crop = CROPS[plot.cropId];
      if (!crop) return null;
      if (this.getBarnUsage() >= this.barnCapacity) return { success: false, reason: 'BARN_FULL' };

      this.inventory.crops[crop.id] = (this.inventory.crops[crop.id] || 0) + 1;
      this.stats.totalHarvests++;
      this.addExp(crop.expGain);

      const harvestedCrop = { ...crop };
      plot.status = 'TILLED';
      plot.cropId = null;
      plot.growthProgress = 0;
      plot.elapsedSeconds = 0;
      plot.isWatered = false;
      this.notify('PLOT_HARVESTED', { plot, crop: harvestedCrop });
      this.save();
      return { success: true, crop: harvestedCrop };
    }

    digPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot) return { success: false, reason: 'NOT_FOUND' };
      if (plot.status !== 'PLANTED_DRY' && plot.status !== 'PLANTED_WATERED' && plot.status !== 'MATURE') {
        return { success: false, reason: 'NO_CROP' };
      }
      const crop = CROPS[plot.cropId] || { name: 'Cây trồng' };
      plot.status = 'TILLED';
      plot.cropId = null;
      plot.growthProgress = 0;
      plot.elapsedSeconds = 0;
      plot.isWatered = false;
      this.notify('PLOT_CLEARED', { plot, crop });
      this.save();
      return { success: true, crop };
    }

    tick(seconds = 1) {
      let changed = false;
      this.plots.forEach(plot => {
        if ((plot.status === 'PLANTED_WATERED' || plot.status === 'PLANTED_DRY') && plot.cropId) {
          const speed = plot.isWatered ? 1.0 : 0.5;
          plot.elapsedSeconds += seconds * speed;
          plot.growthProgress = Math.min(100, (plot.elapsedSeconds / plot.growDuration) * 100);
          if (plot.elapsedSeconds >= plot.growDuration) {
            plot.status = 'MATURE';
            plot.growthProgress = 100;
            this.notify('CROP_MATURED', { plot });
          }
          changed = true;
        }
      });
      if (changed) this.notify('PLOTS_UPDATED', { plots: this.plots });
    }

    buySeeds(cropId, quantity = 1) {
      const crop = CROPS[cropId];
      if (!crop) return false;
      const total = crop.seedCost * quantity;
      if (this.coins < total) return { success: false, reason: 'NOT_ENOUGH_COINS' };
      if (this.getLevelData().level < crop.levelReq) return { success: false, reason: 'LEVEL_LOCKED' };

      this.addCoins(-total);
      this.inventory.seeds[cropId] = (this.inventory.seeds[cropId] || 0) + quantity;
      this.notify('SEEDS_BOUGHT', { cropId, quantity, total });
      this.save();
      return { success: true, total };
    }

    sellCrop(cropId, quantity = 1) {
      const available = this.inventory.crops[cropId] || 0;
      if (available < quantity) return false;
      const crop = CROPS[cropId];
      if (!crop) return false;
      const earned = crop.sellPrice * quantity;
      this.inventory.crops[cropId] -= quantity;
      this.addCoins(earned);
      this.notify('CROPS_SOLD', { cropId, quantity, earned });
      this.save();
      return { success: true, earned };
    }

    sellAllCrops() {
      let totalEarned = 0;
      let itemsSold = 0;
      for (const cropId in this.inventory.crops) {
        const count = this.inventory.crops[cropId] || 0;
        if (count > 0) {
          const crop = CROPS[cropId];
          if (crop) {
            totalEarned += crop.sellPrice * count;
            itemsSold += count;
            this.inventory.crops[cropId] = 0;
          }
        }
      }
      if (totalEarned > 0) {
        this.addCoins(totalEarned);
        this.notify('ALL_CROPS_SOLD', { totalEarned, itemsSold });
        this.save();
      }
      return { totalEarned, itemsSold };
    }

    upgradeBarn() {
      const cost = Math.round(this.barnCapacity * 4);
      if (this.coins < cost) return { success: false, reason: 'NOT_ENOUGH_COINS' };
      this.addCoins(-cost);
      this.barnCapacity += 30;
      this.notify('BARN_UPGRADED', { newCapacity: this.barnCapacity });
      this.save();
      return { success: true, newCapacity: this.barnCapacity, cost };
    }

    save() {
      try {
        this.lastSavedAt = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          coins: this.coins,
          exp: this.exp,
          barnCapacity: this.barnCapacity,
          selectedTool: this.selectedTool,
          selectedSeed: this.selectedSeed,
          plots: this.plots,
          inventory: this.inventory,
          stats: this.stats,
          lastSavedAt: this.lastSavedAt
        }));
      } catch (e) {}
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { loaded: false };
        const data = JSON.parse(raw);
        this.coins = typeof data.coins === 'number' ? data.coins : 150;
        this.exp = typeof data.exp === 'number' ? data.exp : 25;
        this.barnCapacity = data.barnCapacity || 60;
        this.selectedTool = data.selectedTool || 'hoe';
        this.selectedSeed = data.selectedSeed || 'cucumber';
        this.inventory = data.inventory || this.inventory;
        if (Array.isArray(data.plots)) {
          this.plots = data.plots.map(p => {
            if ((p.status === 'TILLED' || p.status === 'RAW' || !p.cropId) && p.isWatered) {
              p.isWatered = false;
            }
            return p;
          });
        }

        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - (data.lastSavedAt || now)) / 1000));
        let matured = 0;
        if (diff > 0) {
          this.plots.forEach(plot => {
            if (plot.status === 'PLANTED_WATERED' && plot.cropId) {
              plot.elapsedSeconds += diff;
              plot.growthProgress = Math.min(100, (plot.elapsedSeconds / plot.growDuration) * 100);
              if (plot.elapsedSeconds >= plot.growDuration) {
                plot.status = 'MATURE';
                plot.growthProgress = 100;
                matured++;
              }
            }
          });
        }
        this.lastSavedAt = now;
        return { loaded: true, offlineSeconds: diff, maturedCount: matured };
      } catch (e) {
        return { loaded: false };
      }
    }
  }

  const state = new GameState();

  // 5. VECTOR SVG CÂY TRỒNG ĐỨNG THẲNG BILLBOARD
  function getPlantSvg(cropId, progress = 100) {
    if (progress < 25) {
      return `
        <svg class="plant-svg stage-sprout" viewBox="0 0 60 70" width="50" height="60">
          <ellipse cx="30" cy="65" rx="14" ry="5" fill="rgba(0,0,0,0.35)" />
          <path d="M30 65 Q29 45 30 36" stroke="#4ade80" stroke-width="4.5" stroke-linecap="round" fill="none" />
          <path d="M30 45 C18 42 16 28 26 26 C32 30 30 45 30 45 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.2" />
          <path d="M30 40 C42 38 44 24 34 22 C28 28 30 40 30 40 Z" fill="#4ade80" stroke="#16a34a" stroke-width="1.2" />
        </svg>
      `;
    }
    if (progress < 65) {
      return `
        <svg class="plant-svg stage-growing" viewBox="0 0 80 100" width="68" height="85">
          <ellipse cx="40" cy="94" rx="22" ry="7" fill="rgba(0,0,0,0.38)" />
          <path d="M40 94 Q39 58 40 28" stroke="#16a34a" stroke-width="5.5" stroke-linecap="round" fill="none" />
          <path d="M40 68 C22 62 16 44 30 40 C40 48 40 68 40 68 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5" />
          <path d="M40 52 C58 46 64 28 50 24 C38 32 40 52 40 52 Z" fill="#4ade80" stroke="#16a34a" stroke-width="1.5" />
          <polygon points="40,22 42,26 47,26 43,29 45,34 40,31 35,34 37,29 33,26 38,26" fill="#fde047" stroke="#ca8a04" stroke-width="0.8" />
        </svg>
      `;
    }

    switch (cropId) {
      case 'eggplant':
        return `
          <svg class="plant-svg plant-eggplant" viewBox="0 0 100 135" width="88" height="118">
            <ellipse cx="50" cy="125" rx="30" ry="9" fill="rgba(0,0,0,0.4)" />
            <path d="M50 125 Q48 70 50 22" stroke="#52b72c" stroke-width="6" stroke-linecap="round" fill="none" />
            <path d="M49 88 Q32 75 28 56" stroke="#469e24" stroke-width="4.5" stroke-linecap="round" fill="none" />
            <path d="M50 82 Q68 70 72 52" stroke="#469e24" stroke-width="4.5" stroke-linecap="round" fill="none" />
            <path d="M50 48 C30 35 24 16 45 18 C58 26 50 48 50 48 Z" fill="#5cc832" stroke="#367d18" stroke-width="1.8" />
            <path d="M50 36 C70 24 76 8 58 12 C44 20 50 36 50 36 Z" fill="#75dc48" stroke="#367d18" stroke-width="1.8" />
            <g transform="translate(50, 18)">
              <polygon points="0,-8 2.5,-2.5 8,-2.5 3.5,1 5,7 0,3.5 -5,7 -3.5,1 -8,-2.5 -2.5,-2.5" fill="#ffe033" stroke="#d49b00" stroke-width="0.8" />
              <circle cx="0" cy="0" r="2.2" fill="#ff9900" />
            </g>
            <g transform="translate(18, 54)">
              <path d="M10 0 L10 10" stroke="#469e24" stroke-width="3" fill="none" />
              <path d="M4 10 L16 10 L14 15 L10 13 L6 15 Z" fill="#52b72c" stroke="#2e6c14" stroke-width="1" />
              <path d="M5 12 C0 24 -1 44 7 54 C15 62 25 58 25 46 C25 32 18 15 13 12 Z" fill="url(#eggplantGradB)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.35))" />
              <path d="M7 20 C4 28 5 42 10 48" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round" fill="none" />
            </g>
            <g transform="translate(48, 48)">
              <path d="M10 0 L10 10" stroke="#469e24" stroke-width="3" fill="none" />
              <path d="M4 10 L16 10 L14 15 L10 13 L6 15 Z" fill="#52b72c" stroke="#2e6c14" stroke-width="1" />
              <path d="M5 12 C-1 25 0 46 8 56 C17 64 26 60 26 48 C26 34 19 15 13 12 Z" fill="url(#eggplantGradB)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
              <path d="M8 22 C5 30 6 44 11 50" stroke="rgba(255,255,255,0.6)" stroke-width="3" stroke-linecap="round" fill="none" />
            </g>
            <defs>
              <linearGradient id="eggplantGradB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b3ee6" />
                <stop offset="35%" stop-color="#5522b0" />
                <stop offset="70%" stop-color="#2d1266" />
                <stop offset="100%" stop-color="#190640" />
              </linearGradient>
            </defs>
          </svg>
        `;
      case 'cucumber':
        return `
          <svg class="plant-svg plant-cucumber" viewBox="0 0 100 135" width="88" height="118">
            <ellipse cx="50" cy="125" rx="28" ry="8" fill="rgba(0,0,0,0.38)" />
            <path d="M50 125 Q52 70 48 20" stroke="#48b82a" stroke-width="5.5" stroke-linecap="round" fill="none" />
            <path d="M49 84 Q30 72 26 50" stroke="#40a022" stroke-width="4" stroke-linecap="round" fill="none" />
            <path d="M50 72 Q70 60 74 44" stroke="#40a022" stroke-width="4" stroke-linecap="round" fill="none" />
            <path d="M48 38 C30 24 26 6 46 10 C58 18 48 38 48 38 Z" fill="#58c42f" stroke="#327e16" stroke-width="1.8" />
            <path d="M50 26 C68 14 76 4 60 8 C46 14 50 26 50 26 Z" fill="#75dc48" stroke="#327e16" stroke-width="1.8" />
            <g transform="translate(48, 14)">
              <polygon points="0,-7 2,-2 7,-2 3,1 4.5,6 0,3 -4.5,6 -3,1 -7,-2 -2,-2" fill="#ffe033" stroke="#d49b00" stroke-width="0.8" />
              <circle cx="0" cy="0" r="2" fill="#ff9900" />
            </g>
            <g transform="translate(20, 52)">
              <path d="M8 0 L8 10" stroke="#368018" stroke-width="3" fill="none" />
              <path d="M8 10 C2 24 1 42 7 55 C12 60 17 58 18 50 C20 38 18 20 13 10 Z" fill="url(#cucumberGradB)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.35))" />
              <path d="M9 16 Q7 35 11 50" stroke="#b4f598" stroke-width="1.6" stroke-dasharray="3,2" fill="none" />
              <polygon points="8,55 10,58 12,58 11,59 12,62 8,60 5,62 7,59 5,58 7,58" fill="#ffd700" />
            </g>
            <g transform="translate(50, 44)">
              <path d="M8 0 L8 10" stroke="#368018" stroke-width="3" fill="none" />
              <path d="M8 10 C2 26 1 46 8 58 C13 64 19 62 19 52 C21 40 18 20 13 10 Z" fill="url(#cucumberGradB)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
              <path d="M9 18 Q7 38 11 54" stroke="#b4f598" stroke-width="1.8" stroke-dasharray="3,2" fill="none" />
              <polygon points="8,58 10,61 12,61 11,62 12,65 8,63 5,65 7,62 5,61 7,61" fill="#ffd700" />
            </g>
            <defs>
              <linearGradient id="cucumberGradB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6ee755" />
                <stop offset="45%" stop-color="#38a820" />
                <stop offset="100%" stop-color="#1d660e" />
              </linearGradient>
            </defs>
          </svg>
        `;
      case 'pepper':
      default:
        return `
          <svg class="plant-svg plant-pepper" viewBox="0 0 100 135" width="88" height="118">
            <ellipse cx="50" cy="125" rx="28" ry="8" fill="rgba(0,0,0,0.38)" />
            <path d="M50 125 Q48 70 50 24" stroke="#48b82a" stroke-width="5.5" stroke-linecap="round" fill="none" />
            <path d="M49 88 Q28 74 24 55" stroke="#40a022" stroke-width="4.2" stroke-linecap="round" fill="none" />
            <path d="M50 78 Q72 65 74 48" stroke="#40a022" stroke-width="4.2" stroke-linecap="round" fill="none" />
            <path d="M50 46 C32 30 28 14 48 18 C60 25 50 46 50 46 Z" fill="#58c42f" stroke="#327e16" stroke-width="1.8" />
            <path d="M50 34 C68 20 74 6 58 10 C46 18 50 34 50 34 Z" fill="#75dc48" stroke="#327e16" stroke-width="1.8" />
            <g transform="translate(18, 54)">
              <path d="M9 0 L9 10" stroke="#368018" stroke-width="3" fill="none" />
              <path d="M4 10 L14 10 L12 14 L9 12 L6 14 Z" fill="#48b82a" />
              <path d="M6 10 C1 22 2 38 10 48 C11 50 13 48 14 42 C17 32 16 16 12 10 Z" fill="url(#pepperGradB)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.35))" />
              <path d="M8 18 C6 26 7 38 10 44" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none" />
            </g>
            <g transform="translate(48, 48)">
              <path d="M9 0 L9 10" stroke="#368018" stroke-width="3" fill="none" />
              <path d="M4 10 L14 10 L12 14 L9 12 L6 14 Z" fill="#48b82a" />
              <path d="M6 10 C0 24 1 42 10 52 C12 55 14 52 15 44 C18 34 17 18 13 10 Z" fill="url(#pepperGradB)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))" />
              <path d="M8 20 C6 28 7 42 11 48" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none" />
            </g>
            <defs>
              <linearGradient id="pepperGradB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff4444" />
                <stop offset="50%" stop-color="#e60000" />
                <stop offset="100%" stop-color="#800000" />
              </linearGradient>
            </defs>
          </svg>
        `;
    }
  }

  // HÀM TẠO OVERLAY VIỀN CỎ TỰ NHIÊN MỀM MẠI CHO Ô ĐẤT
  function getSoilSvg(plot) {
    if (plot.status === 'TILLED' || plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED' || plot.status === 'MATURE') {
      return `
        <svg class="soil-overlay-svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style="position:absolute;inset:0;pointer-events:none;">
          <!-- Viền cỏ mềm tự nhiên len lỏi bờ luống đất -->
          <path d="M-2 92 Q15 85 30 92 Q50 86 70 93 Q85 87 102 92 L102 102 L-2 102 Z" fill="#4d9b1a" opacity="0.85" />
          <path d="M0 0 L12 0 Q6 12 0 20 Z" fill="#60b522" opacity="0.6" />
          <!-- Vài bông hoa dại nhỏ xíu trên bờ đất -->
          <circle cx="8" cy="94" r="2.2" fill="#fde047" />
          <circle cx="88" cy="93" r="2.2" fill="#fde047" />
        </svg>
      `;
    }
    return '';
  }

  // 6. FARM RENDERER
  class FarmRenderer {
    constructor(gridElement) {
      this.gridElement = gridElement;
      this.plotElements = new Map();
    }

    renderInitial() {
      this.gridElement.innerHTML = '';
      this.plotElements.clear();

      const TILE_W = 116;
      const TILE_H = 58;
      const HALF_W = TILE_W / 2; // 58
      const HALF_H = TILE_H / 2; // 29
      const ORIGIN_X = 2 * HALF_W; // 116px (để ô góc trái có x = 0)
      const ORIGIN_Y = 0;

      state.plots.forEach(plot => {
        const plotEl = document.createElement('div');
        plotEl.className = 'farm-plot';
        plotEl.dataset.plotId = plot.id;

        // Tính toạ độ Isometric 2:1 chuẩn game Liên Quân / Hay Day
        const col = plot.id % 4;
        const row = Math.floor(plot.id / 4);
        const x = (col - row) * HALF_W + ORIGIN_X;
        const y = (col + row) * HALF_H + ORIGIN_Y;
        const zIndex = (col + row) * 2 + 1;

        plotEl.style.left = `${x}px`;
        plotEl.style.top = `${y}px`;
        plotEl.style.zIndex = zIndex;

        plotEl.innerHTML = `
          <div class="plot-tile-wrapper">
            <svg class="plot-diamond-svg" viewBox="0 0 116 58" width="116" height="58">
              <!-- 1. Bờ luống nổi 2.5D bo tròn 4 đỉnh (Raised Ridge) -->
              <polygon class="plot-ridge" points="58,5 111,29 58,53 5,29" />
              <!-- 2. Lòng luống đất trũng sâu vào 6px (Sunken Trough) -->
              <polygon class="plot-trough" points="58,11 99,29 58,47 17,29" />
              <!-- 3. Rãnh chìm trong lòng luống -->
              <polygon class="plot-trough-groove" points="58,12 97,29 58,46 19,29" fill="none" />
            </svg>
          </div>
          <div class="plot-billboard-container">
            <div class="plot-content"></div>
            <div class="plot-timer-badge hidden">
              <span class="timer-text">00:00</span>
              <div class="timer-progress"><div class="timer-bar"></div></div>
            </div>
          </div>
        `;

        this.gridElement.appendChild(plotEl);
        this.plotElements.set(plot.id, plotEl);
        this.updatePlotElement(plot, plotEl);
      });
    }

    updatePlotElement(plot, plotEl = this.plotElements.get(plot.id)) {
      if (!plotEl) return;
      const contentEl = plotEl.querySelector('.plot-content');
      const timerBadge = plotEl.querySelector('.plot-timer-badge');
      const timerText = plotEl.querySelector('.timer-text');
      const timerBar = plotEl.querySelector('.timer-bar');

      const progressBucket = Math.floor((plot.growthProgress || 0) / 30);
      const visualKey = `${plot.status}_${plot.cropId}_${plot.isWatered}_${progressBucket}`;

      // Chỉ build lại HTML khi trạng thái cây hoặc đất thực sự thay đổi
      if (plotEl._cachedVisualKey !== visualKey) {
        plotEl._cachedVisualKey = visualKey;
        plotEl.className = `farm-plot status-${plot.status.toLowerCase()} ${plot.isWatered ? 'is-watered' : ''}`;

        switch (plot.status) {
          case 'LOCKED':
            // Ô LOCKED: Biển gỗ mini báo level mở khóa chuẩn 1:1 ảnh 1 Liên Quân
            contentEl.innerHTML = `<div class="plot-lock-sign"><span>🔒 Lv.${plot.reqLevel}</span></div>`;
            timerBadge.classList.add('hidden');
            break;

          case 'RAW':
            contentEl.innerHTML = `<div class="plot-wild-grass"><span class="grass-tuft">🌱</span></div>`;
            timerBadge.classList.add('hidden');
            break;

          case 'TILLED':
            contentEl.innerHTML = '<div class="plot-tilled-empty"></div>';
            timerBadge.classList.add('hidden');
            break;

          case 'PLANTED_DRY':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-thirsty">
                ${getPlantSvg(plot.cropId, 15)}
                <div class="iso-water-alert" title="Cần tưới nước để rút ngắn thời gian!"><span class="water-alert-icon">🚿</span></div>
              </div>
            `;
            timerBadge.classList.remove('hidden');
            break;

          case 'PLANTED_WATERED':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-growing-glow">
                ${getPlantSvg(plot.cropId, plot.growthProgress || 20)}
              </div>
            `;
            timerBadge.classList.remove('hidden');
            break;

          case 'MATURE':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-mature crop-ready-bounce">
                <div class="mature-sun-glow"></div>
                ${getPlantSvg(plot.cropId, 100)}
                <div class="iso-harvest-badge"><span>Thu hoạch!</span></div>
                <div class="plant-sparkles-cluster">
                  <span class="sparkle s1">✨</span>
                  <span class="sparkle s2">🌸</span>
                  <span class="sparkle s3">✨</span>
                  <span class="sparkle s4">⭐</span>
                </div>
              </div>
            `;
            timerBadge.classList.add('hidden');
            break;
        }
      }

      // Cập nhật nhẹ đồng hồ đếm ngược
      if (plot.status === 'PLANTED_WATERED' || plot.status === 'PLANTED_DRY') {
        const rem = Math.max(0, Math.ceil(plot.growDuration - plot.elapsedSeconds));
        const mins = Math.floor(rem / 60);
        const secs = rem % 60;
        timerText.textContent = `⏳ ${mins > 0 ? mins + 'p' : ''}${secs < 10 && mins > 0 ? '0' : ''}${secs}s`;
        if (timerBar) timerBar.style.width = `${plot.growthProgress || 0}%`;
        timerBadge.classList.remove('hidden');
      }
    }

    updateAll() {
      state.plots.forEach(plot => this.updatePlotElement(plot));
    }
  }

  // 7. BẢNG ĐƠN HÀNG THỊ TRẤN
  const ORDERS_STORAGE_KEY = 'FAM_ORDERS_SAVE_V3';
  const CUSTOMERS = [
    { name: 'Bác Ba Nông Dân', avatar: '👨‍🌾', dialog: 'Bác cần nông sản tươi đem bán phiên chợ sớm làng mình!' },
    { name: 'Chị Lan Tiệm Bánh', avatar: '👩‍🍳', dialog: 'Tiệm bánh ngọt đang cần thêm nguyên liệu tươi ngon.' },
    { name: 'Khách Sạn Mùa Hè', avatar: '🏨', dialog: 'Đơn hàng cao cấp cho các đoàn khách du lịch ghé thăm.' }
  ];

  class OrderSystem {
    constructor() {
      this.orders = [];
      this.loadOrders();
      if (this.orders.length === 0) this.generateOrders(3);
    }

    getUnlockedCrops() {
      const lvl = state.getLevelData().level;
      return Object.values(CROPS).filter(c => c.levelReq <= lvl);
    }

    generateSingleOrder(id) {
      const unlocked = this.getUnlockedCrops();
      const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      const count = Math.min(unlocked.length, Math.random() > 0.5 ? 2 : 1);
      const shuffled = [...unlocked].sort(() => 0.5 - Math.random());
      const items = [];
      let totalCoins = 0;
      let totalExp = 0;

      for (let i = 0; i < count; i++) {
        const crop = shuffled[i];
        const qty = Math.max(1, Math.floor(6 / crop.levelReq) + Math.floor(Math.random() * 2));
        items.push({ cropId: crop.id, quantity: qty });
        totalCoins += crop.orderPrice * qty;
        totalExp += crop.expGain * qty * 2;
      }

      return {
        id: id || 'order_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        customerName: customer.name,
        customerAvatar: customer.avatar,
        dialog: customer.dialog,
        items,
        rewardCoins: totalCoins,
        rewardExp: totalExp
      };
    }

    generateOrders(count = 3) {
      this.orders = [];
      for (let i = 0; i < count; i++) this.orders.push(this.generateSingleOrder());
      this.saveOrders();
    }

    canCompleteOrder(order) {
      return order.items.every(item => (state.inventory.crops[item.cropId] || 0) >= item.quantity);
    }

    completeOrder(orderId) {
      const idx = this.orders.findIndex(o => o.id === orderId);
      if (idx === -1) return { success: false };
      const order = this.orders[idx];
      if (!this.canCompleteOrder(order)) return { success: false, reason: 'NOT_ENOUGH_ITEMS' };

      order.items.forEach(item => state.inventory.crops[item.cropId] -= item.quantity);
      state.addCoins(order.rewardCoins);
      state.addExp(order.rewardExp);
      sound.playCoin();
      this.orders[idx] = this.generateSingleOrder();
      this.saveOrders();
      return { success: true, rewardCoins: order.rewardCoins, rewardExp: order.rewardExp };
    }

    discardOrder(orderId) {
      const idx = this.orders.findIndex(o => o.id === orderId);
      if (idx === -1) return false;
      this.orders[idx] = this.generateSingleOrder();
      this.saveOrders();
      return true;
    }

    saveOrders() {
      try { localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders)); } catch (e) {}
    }

    loadOrders() {
      try {
        const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (raw) this.orders = JSON.parse(raw);
      } catch (e) {
        this.orders = [];
      }
    }
  }

  const orderSystem = new OrderSystem();

  // 8. TƯƠNG TÁC CHUỘT VÀ CẢM ỨNG: PHẢN HỒI NGAY TỨC THÌ 0MS & GIEO LIÊN TỤC
  class FarmInteractions {
    constructor(gridElement, renderer) {
      this.gridElement = gridElement;
      this.renderer = renderer;
      this.isDown = false;
      this.lastPlotId = null;
      this.quickSeedId = (typeof state !== 'undefined' && state.selectedSeed) ? state.selectedSeed : 'wheat';
      this.bindEvents();
    }

    getClosestPlot(x, y) {
      const plots = this.gridElement.querySelectorAll('.farm-plot');
      let closest = null;
      let minDistance = Infinity;

      plots.forEach(plot => {
        const rect = plot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(centerX - x, centerY - y);
        // Nhận diện trong bán kính 85px quanh tâm ô (bao phủ toàn bộ khe hở isometric)
        if (dist < minDistance && dist < 85) {
          minDistance = dist;
          closest = plot;
        }
      });

      return closest;
    }

    bindEvents() {
      // 1. Chạm/Click chuột xuống ô đất
      this.gridElement.addEventListener('pointerdown', (e) => {
        // Đừng chặn sự kiện nếu đang bấm vào menu chọn cây hoặc popup thông tin cây
        if (e.target.closest('#plot-crop-popup') || e.target.closest('#crop-info-popup')) return;

        this.isDown = true;
        this.isDragging = false;
        this.startX = e.clientX;
        this.startY = e.clientY;

        let plotEl = e.target.closest('.farm-plot');
        if (!plotEl) {
          plotEl = this.getClosestPlot(e.clientX, e.clientY);
        }
        if (plotEl) {
          const plotId = parseInt(plotEl.dataset.plotId, 10);
          this.startPlotId = plotId;
          this.lastPlotId = plotId;

          // Click trực tiếp vào ô đất
          this.handleClickPlot(plotId, plotEl, e);
        }
      });

      // 2. Rê chuột / vuốt ngón tay qua nhiều ô: Chế độ vuốt nhanh hàng loạt!
      window.addEventListener('pointermove', (e) => {
        if (!this.isDown) return;
        const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
        if (dist > 12) {
          this.isDragging = true;
        }
        if (!this.isDragging) return;

        const el = document.elementFromPoint(e.clientX, e.clientY);
        let plotEl = el ? el.closest('.farm-plot') : null;
        if (!plotEl && el && (el.closest('.farm-grid') || el.closest('.farm-lawn-plateau'))) {
          plotEl = this.getClosestPlot(e.clientX, e.clientY);
        }
        if (!plotEl) return;
        const plotId = parseInt(plotEl.dataset.plotId, 10);
        if (isNaN(plotId) || this.lastPlotId === plotId) return;
        this.lastPlotId = plotId;

        // Vuốt qua ô khác: Thu hoạch nhanh / tưới nhanh / gieo nhanh
        this.handleQuickSwipe(plotId, plotEl);
      });

      window.addEventListener('pointerup', () => {
        this.isDown = false;
        this.isDragging = false;
        this.startPlotId = null;
        this.lastPlotId = null;
      });

      window.addEventListener('pointercancel', () => {
        this.isDown = false;
        this.isDragging = false;
        this.startPlotId = null;
        this.lastPlotId = null;
      });

      // Hàm kiểm thử tự động 12 ô đất
      window.testFarmPlots = () => {
        console.log('=== KIỂM THỬ 12 Ô ĐẤT ISOMETRIC 2.5D ===');
        const plots = document.querySelectorAll('.farm-plot');
        console.log(`Tổng số ô tìm thấy: ${plots.length}/12`);
        let passed = 0;
        plots.forEach((p, idx) => {
          const id = parseInt(p.dataset.plotId, 10);
          const rect = p.getBoundingClientRect();
          console.log(`Ô #${id}: Left=${Math.round(rect.left)}px, Top=${Math.round(rect.top)}px, W=${Math.round(rect.width)}px, H=${Math.round(rect.height)}px`);
          if (id === idx && rect.width > 0 && rect.height > 0) passed++;
        });
        console.log(`Kết quả: ${passed}/12 ô đất sẵn sàng tương tác hoàn hảo!`);
        return passed === 12;
      };
    }

    // HÀM GIEO TRỰC TIẾP LIÊN TỤC KHI VUỐT NHANH
    plantCropDirectly(plotId, plotEl, cropId) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot || (plot.status !== 'TILLED' && plot.status !== 'RAW')) return false;
      if (plot.status === 'RAW') plot.status = 'TILLED';

      const userLvl = state.getLevelData().level;
      let crop = CROPS[cropId];
      if (!crop || userLvl < crop.levelReq) {
        crop = CROPS['wheat'];
        cropId = 'wheat';
      }
      if (!crop) return false;

      let count = state.inventory.seeds[cropId] || 0;

      // Nếu hết hạt giống: Tự động mua hạt tiếp nếu còn đủ tiền
      if (count <= 0) {
        if (state.coins >= crop.seedCost) {
          state.addCoins(-crop.seedCost);
          state.inventory.seeds[cropId] = 1;
          if (ui) ui.showFloatingText(plotEl, `-${crop.seedCost} 💰`, 'cost');
        } else {
          sound.playClick();
          if (ui) {
            ui.showToast(`Hết tiền mua thêm hạt ${crop.name}!`, 'warning');
            ui.openCropPicker(plotId, plotEl, this.renderer);
          }
          this.quickSeedId = null;
          return false;
        }
      }

      state.selectedSeed = cropId;
      const res = state.plantSeed(plotId, cropId);
      if (res && res.success) {
        sound.playPlant();
        if (ui) ui.showFloatingText(plotEl, `-1 🌱`, 'seed');
        this.renderer.updatePlotElement(plot);
        if (ui) {
          ui.updateHUD();
          ui.updateActionBadges();
        }
        return true;
      }
      return false;
    }

    // 1. CLICK BÌNH THƯỜNG VÀO Ô ĐẤT:
    // - Ô đất trống -> LUÔN HIỆN MENU HẠT GIỐNG ĐỂ NGƯỜI DÙNG CHỌN
    // - Ô chín -> Thu hoạch
    // - Ô khô -> Tưới nước
    // - Ô khóa -> Báo mở khóa
    handleClickPlot(plotId, plotEl, e = null) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot) return;

      // 0. CHẾ ĐỘ ĐÀO CÂY (NHỔ BỎ CÂY TRỒNG)
      if (state.selectedTool === 'dig') {
        if (plot.cropId && (plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED' || plot.status === 'MATURE')) {
          const res = state.digPlot(plotId);
          if (res && res.success) {
            sound.playClick();
            if (ui) {
              ui.createDirtParticles(plotEl);
              ui.showFloatingText(plotEl, '⛏️ Đã đào cây', 'cost');
              ui.showToast(`Đã đào bỏ ${res.crop.name}! Đất đã sẵn sàng để trồng mới 🌱`, 'info');
              ui.updateHUD();
              ui.updateActionBadges();
              ui.closeCropInfo();
            }
            this.renderer.updatePlotElement(plot);
          }
        } else {
          sound.playClick();
          if (ui) ui.showToast('Ô đất này không có cây trồng để đào!', 'info');
        }
        return;
      }

      // 1. Ô ĐẤT BỊ KHÓA
      if (plot.status === 'LOCKED') {
        const userLvl = state.getLevelData().level;
        const reqLvl = plot.reqLevel || 2;
        if (userLvl < reqLvl) {
          sound.playClick();
          if (ui) ui.showToast(`Chưa được canh tác: Cần Cấp ${reqLvl}!`, 'warning');
          return;
        }
        if (state.coins >= plot.unlockCost) {
          const res = state.unlockPlot(plotId);
          if (res.success) {
            sound.playCoin();
            if (ui) {
              ui.showFloatingText(plotEl, `-${plot.unlockCost} 💰`, 'cost');
              ui.showToast(`Đã mở khóa ô đất số ${plotId + 1}!`, 'success');
            }
            this.renderer.updatePlotElement(plot);
            setTimeout(() => {
              if (ui) ui.openCropPicker(plotId, plotEl, this.renderer);
            }, 250);
          }
        } else {
          sound.playClick();
          if (ui) ui.showToast(`Cần ${plot.unlockCost} vàng để mở ô đất này!`, 'warning');
        }
        return;
      }

      // 2. CÂY ĐÃ CHÍN -> THU HOẠCH
      if (plot.status === 'MATURE') {
        const res = state.harvestPlot(plotId);
        if (res && res.success) {
          sound.playHarvest();
          if (ui) {
            ui.showFloatingText(plotEl, `+1 ${res.crop.icon}`, 'crop');
            ui.showFloatingText(plotEl, `+${res.crop.expGain} EXP ✨`, 'exp', 35);
          }
          this.renderer.updatePlotElement(plot);
        } else if (res && res.reason === 'BARN_FULL') {
          sound.playClick();
          if (ui) ui.showToast('Nhà kho đã đầy! Hãy bán bớt nông sản.', 'warning');
        }
        return;
      }

      // 3. CÂY ĐANG CHỜ CHÍN (CẦN TƯỚI NƯỚC HOẶC ĐANG LỚN) -> XEM THÔNG TIN CÂY TRỒNG
      if (plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED') {
        // Nếu nhấp trúng biểu tượng giọt nước/vòi sen hoặc đang chọn công cụ tưới nước
        const isWaterAlertClick = e && e.target && e.target.closest('.iso-water-alert');
        if (isWaterAlertClick || (plot.status === 'PLANTED_DRY' && state.selectedTool === 'water')) {
          const res = state.waterPlot(plotId);
          if (res && res.success) {
            sound.playWater();
            if (ui) {
              ui.createWaterSplashes(plotEl);
              if (res.boostSeconds > 0) {
                ui.showFloatingText(plotEl, `-${res.boostSeconds}s ⏳💧`, 'water');
                ui.showToast(`Đã tưới nước! Rút ngắn -${res.boostSeconds}s thời gian chờ 💧✨`, 'success');
              } else {
                ui.showFloatingText(plotEl, '💧 Tưới', 'water');
              }
              ui.updateActionBadges();
            }
            this.renderer.updatePlotElement(plot);
          }
          return;
        }

        // Bấm vào cây khi đang chờ chín -> Mở popup xem thông tin chi tiết của cây!
        if (ui) {
          ui.closeCropPicker();
          ui.openCropInfo(plotId, plotEl);
        }
        return;
      }

      // 4. Ô ĐẤT TRỐNG (TILLED HOẶC RAW):
      // ĐÚNG CHUẨN YÊU CẦU: "bình thường cứ ấn vào ô đất là hiện menu hạt giống rồi mới chọn"
      if (plot.status === 'TILLED' || plot.status === 'RAW') {
        if (plot.status === 'RAW') {
          plot.status = 'TILLED';
          this.renderer.updatePlotElement(plot);
        }
        // Luôn luôn mở popup menu hạt giống để người dùng chọn!
        if (ui) {
          ui.closeCropInfo();
          ui.openCropPicker(plotId, plotEl, this.renderer);
        }
        return;
      }
    }

    // 2. THAO TÁC NHANH KHI VUỐT QUA NHIỀU Ô (SWIPE / BATCH QUICK ACTION)
    handleQuickSwipe(plotId, plotEl) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot) return;

      const tool = state.selectedTool;

      // Vuốt đào cây nhanh khi công cụ là Đào Cây
      if (tool === 'dig') {
        if (plot.cropId && (plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED' || plot.status === 'MATURE')) {
          const res = state.digPlot(plotId);
          if (res && res.success) {
            sound.playClick();
            if (ui) {
              ui.createDirtParticles(plotEl);
              ui.showFloatingText(plotEl, '⛏️ Đã đào', 'cost');
              ui.updateHUD();
              ui.updateActionBadges();
            }
            this.renderer.updatePlotElement(plot);
          }
        }
        return;
      }

      // Vuốt thu hoạch nhanh cây chín
      if (plot.status === 'MATURE') {
        const res = state.harvestPlot(plotId);
        if (res && res.success) {
          sound.playHarvest();
          if (ui) {
            ui.showFloatingText(plotEl, `+1 ${res.crop.icon}`, 'crop');
            ui.showFloatingText(plotEl, `+${res.crop.expGain} EXP ✨`, 'exp', 35);
          }
          this.renderer.updatePlotElement(plot);
        }
        return;
      }

      // Vuốt tưới nhanh khi công cụ là Tưới
      if (tool === 'water' || plot.status === 'PLANTED_DRY') {
        if (plot.status === 'PLANTED_DRY') {
          if (state.waterPlot(plotId)) {
            sound.playWater();
            if (ui) ui.createWaterSplashes(plotEl);
            this.renderer.updatePlotElement(plot);
          }
        }
        return;
      }

      // Vuốt gieo hạt nhanh khi công cụ là Gieo hạt
      if (tool === 'seed' && (plot.status === 'TILLED' || plot.status === 'RAW')) {
        const activeSeed = this.quickSeedId || state.selectedSeed || 'wheat';
        this.plantCropDirectly(plotId, plotEl, activeSeed);
      }
    }
  }

  // 9. UI CONTROLLER
  class UIManager {
    constructor() {
      this.activePlotId = null;
      this.activePlotEl = null;
      this.activeRenderer = null;
      this.activeCropInfoPlotId = null;
      this.activeCropInfoPlotEl = null;

      this.dom = {
        coinsCount: document.getElementById('hud-coins'),
        barnIndicator: document.getElementById('hud-barn-count'),
        expProgress: document.getElementById('hud-exp-progress'),
        toolButtons: document.querySelectorAll('.tool-btn'),
        btnAutoPlant: document.getElementById('btn-auto-plant'),
        btnRandomPlant: document.getElementById('btn-random-plant'),
        btnWaterAll: document.getElementById('btn-water-all'),
        btnHarvestAll: document.getElementById('btn-harvest-all'),
        badgePlantCount: document.getElementById('badge-plant-count'),
        badgeWaterCount: document.getElementById('badge-water-count'),
        badgeHarvestCount: document.getElementById('badge-harvest-count'),
        btnDigCrop: document.getElementById('btn-dig-crop'),
        btnPopupRandomPlant: document.getElementById('btn-popup-random-plant'),
        seedPicker: document.getElementById('seed-picker-dock'),
        plotCropPopup: document.getElementById('plot-crop-popup'),
        cropPopupList: document.getElementById('crop-popup-list'),
        btnCloseCropPopup: document.getElementById('btn-close-crop-popup'),
        cropInfoPopup: document.getElementById('crop-info-popup'),
        cropInfoIcon: document.getElementById('crop-info-icon'),
        cropInfoName: document.getElementById('crop-info-name'),
        cropInfoStatus: document.getElementById('crop-info-status'),
        cropInfoTimeRem: document.getElementById('crop-info-time-rem'),
        cropInfoBarFill: document.getElementById('crop-info-bar-fill'),
        cropInfoSell: document.getElementById('crop-info-sell'),
        cropInfoExp: document.getElementById('crop-info-exp'),
        cropInfoWaterBoost: document.getElementById('crop-info-water-boost'),
        cropInfoWaterAction: document.getElementById('crop-info-water-action'),
        btnCloseCropInfo: document.getElementById('btn-close-crop-info'),
        shopModal: document.getElementById('shop-modal'),
        barnModal: document.getElementById('barn-modal'),
        ordersModal: document.getElementById('orders-modal'),
        guideModal: document.getElementById('guide-modal'),
        levelupModal: document.getElementById('levelup-modal'),
        btnOpenShop: document.getElementById('btn-open-shop'),
        btnOpenBarn: document.getElementById('btn-open-barn'),
        btnOpenOrders: document.getElementById('btn-open-orders'),
        btnOpenGuide: document.getElementById('btn-open-guide'),
        btnQuickShop: document.getElementById('btn-quick-shop'),
        btnHeaderBarn: document.getElementById('btn-header-barn'),
        btnAudioToggle: document.getElementById('btn-audio-toggle'),
        btnAssistant: document.getElementById('btn-assistant'),
        frogMascot: document.getElementById('frog-mascot'),
        shopList: document.getElementById('shop-items-list'),
        barnList: document.getElementById('barn-items-list'),
        ordersList: document.getElementById('orders-items-list'),
        guideList: document.getElementById('guide-items-list'),
        barnUsageText: document.getElementById('barn-usage-text'),
        barnCapacityText: document.getElementById('barn-capacity-text'),
        btnUpgradeBarn: document.getElementById('btn-upgrade-barn'),
        btnSellAll: document.getElementById('btn-sell-all'),
        toastContainer: document.getElementById('toast-container'),
        profileModal: document.getElementById('profile-modal'),
        profileModalBody: document.getElementById('profile-modal-body'),
        hudProfileCard: document.getElementById('hud-profile-card')
      };

      this.bindEvents();
      this.renderSeedPicker();
      this.updateHUD();
    }

    bindEvents() {
      if (this.dom.hudProfileCard) {
        this.dom.hudProfileCard.addEventListener('click', (e) => {
          if (e.target.closest('.btn-back-nav')) return;
          sound.playClick();
          this.openProfileModal();
        });
      }

      if (this.dom.toolButtons) {
        this.dom.toolButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            sound.playClick();
            this.selectTool(btn.dataset.tool);
          });
        });
      }

      if (this.dom.btnAutoPlant) {
        this.dom.btnAutoPlant.addEventListener('click', () => {
          this.handleAutoPlant();
        });
      }

      if (this.dom.btnRandomPlant) {
        this.dom.btnRandomPlant.addEventListener('click', () => {
          if (this.dom.btnDigCrop) this.dom.btnDigCrop.classList.remove('active');
          this.handleRandomPlant();
        });
      }

      if (this.dom.btnDigCrop) {
        this.dom.btnDigCrop.addEventListener('click', () => {
          sound.playClick();
          if (state.selectedTool === 'dig') {
            state.selectedTool = 'seed';
            this.dom.btnDigCrop.classList.remove('active');
            this.showToast('Đã tắt chế độ Đào Cây', 'info');
          } else {
            state.selectedTool = 'dig';
            document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
            this.dom.btnDigCrop.classList.add('active');
            this.showToast('Chế độ Đào Cây ⛏️: Chạm hoặc vuốt qua cây bạn muốn nhổ bỏ!', 'info');
          }
        });
      }

      if (this.dom.btnPopupRandomPlant) {
        this.dom.btnPopupRandomPlant.addEventListener('click', () => {
          this.handleRandomPlant();
        });
      }

      if (this.dom.btnWaterAll) {
        this.dom.btnWaterAll.addEventListener('click', () => {
          this.handleWaterAll();
        });
      }

      if (this.dom.btnHarvestAll) {
        this.dom.btnHarvestAll.addEventListener('click', () => {
          this.handleHarvestAll();
        });
      }

      if (this.dom.btnCloseCropPopup) {
        this.dom.btnCloseCropPopup.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playClick();
          this.closeCropPicker();
        });
      }

      if (this.dom.btnCloseCropInfo) {
        this.dom.btnCloseCropInfo.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playClick();
          this.closeCropInfo();
        });
      }

      // Chạm ra ngoài để đóng menu chọn cây trồng hoặc popup thông tin cây
      document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('#plot-crop-popup') && !e.target.closest('.farm-plot')) {
          this.closeCropPicker();
        }
        if (!e.target.closest('#crop-info-popup') && !e.target.closest('.farm-plot')) {
          this.closeCropInfo();
        }
      });

      this.dom.btnOpenShop.addEventListener('click', () => { sound.playClick(); this.openShop(); });
      if (this.dom.btnQuickShop) this.dom.btnQuickShop.addEventListener('click', () => { sound.playClick(); this.openShop(); });
      this.dom.btnOpenBarn.addEventListener('click', () => { sound.playClick(); this.openBarn(); });
      if (this.dom.btnHeaderBarn) this.dom.btnHeaderBarn.addEventListener('click', () => { sound.playClick(); this.openBarn(); });
      this.dom.btnOpenOrders.addEventListener('click', () => { sound.playClick(); this.openOrders(); });
      if (this.dom.btnOpenGuide) this.dom.btnOpenGuide.addEventListener('click', () => { sound.playClick(); this.openGuide(); });

      if (this.dom.btnAssistant) {
        this.dom.btnAssistant.addEventListener('click', () => {
          sound.playClick();
          const hasMature = state.plots.some(p => p.status === 'MATURE');
          const hasGrowing = state.plots.some(p => p.status === 'PLANTED_WATERED');
          const hasTilled = state.plots.some(p => p.status === 'TILLED');
          if (hasMature) {
            this.showToast('Trợ lý: "Nông sản đã chín rồi đó! Hãy chọn Liềm và chạm vào để thu hoạch nha!"', 'info');
          } else if (hasGrowing) {
            this.showToast('Trợ lý: "Cây đang lớn rất nhanh theo thời gian thực. Bạn tranh thủ xới thêm đất nhé!"', 'info');
          } else if (hasTilled) {
            this.showToast('Trợ lý: "Đất đã cày sẵn rồi! Hãy chọn Gieo, nhấp chọn hạt Lúa mì và gieo xuống đất nha!"', 'info');
          } else {
            this.showToast('Trợ lý: "Hãy chọn Cuốc xới các ô cỏ xanh để mở rộng đất trồng trọt nhé!"', 'info');
          }
        });
      }

      if (this.dom.frogMascot) {
        this.dom.frogMascot.addEventListener('click', () => {
          sound.playCoin();
          const bonus = Math.floor(Math.random() * 5) + 3;
          state.addCoins(bonus);
          this.showFloatingText(this.dom.frogMascot, `+${bonus} 💰 Ếch may mắn!`, 'crop');
          this.showToast(`Chú ếch thần tài thưởng bạn +${bonus} vàng!`, 'success');
        });
      }

      this.dom.btnAudioToggle.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        this.dom.btnAudioToggle.textContent = isMuted ? '🔇' : '🔊';
        this.showToast(isMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh', 'info');
      });

      document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-close')) {
            sound.playClick();
            this.closeAllModals();
          }
        });
      });

      this.dom.btnUpgradeBarn.addEventListener('click', () => {
        const res = state.upgradeBarn();
        if (res.success) {
          sound.playCoin();
          this.showToast(`Nâng cấp kho thành công! Sức chứa: ${res.newCapacity}`, 'success');
          this.openBarn();
          this.updateHUD();
        } else {
          sound.playClick();
          this.showToast('Không đủ tiền vàng!', 'warning');
        }
      });

      this.dom.btnSellAll.addEventListener('click', () => {
        const res = state.sellAllCrops();
        if (res.itemsSold > 0) {
          sound.playCoin();
          this.showToast(`Đã bán ${res.itemsSold} nông sản, nhận +${res.totalEarned} 💰!`, 'success');
          this.openBarn();
          this.updateHUD();
        } else {
          sound.playClick();
          this.showToast('Trong kho không có nông sản!', 'warning');
        }
      });

      document.getElementById('btn-close-levelup').addEventListener('click', () => {
        sound.playClick();
        this.dom.levelupModal.classList.add('hidden');
      });
    }

    updateDockSeedButton(crop) {
      const seedBtn = document.querySelector('.tool-btn[data-tool="seed"]');
      if (seedBtn && crop) {
        seedBtn.innerHTML = `
          <span class="tool-icon">${crop.icon}</span>
          <span class="tool-name">${crop.name}</span>
        `;
        seedBtn.title = `Đang chọn: ${crop.name} (Chạm để đổi cây)`;
      }
    }

    resetDockSeedButton() {
      const seedBtn = document.querySelector('.tool-btn[data-tool="seed"]');
      if (seedBtn) {
        seedBtn.innerHTML = `
          <span class="tool-icon">🌱</span>
          <span class="tool-name">Đổi cây</span>
        `;
        seedBtn.title = `Chạm vào ô đất để chọn cây mới`;
      }
    }

    selectTool(tool) {
      state.selectedTool = tool;
      if (this.dom.toolButtons) {
        this.dom.toolButtons.forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
      }
      if (tool === 'seed') {
        if (farmInteractions) {
          farmInteractions.quickSeedId = null;
        }
        this.resetDockSeedButton();
        this.showToast('Chạm vào ô đất để chọn cây mới!', 'info');
        if (this.dom.seedPicker) this.dom.seedPicker.classList.remove('hidden');
      } else {
        if (this.dom.seedPicker) this.dom.seedPicker.classList.add('hidden');
      }
    }

    renderSeedPicker() {
      if (!this.dom.seedPicker) return;
      this.dom.seedPicker.innerHTML = '';
      const lvl = state.getLevelData().level;
      Object.values(CROPS).forEach(crop => {
        const unlocked = lvl >= crop.levelReq;
        const count = state.inventory.seeds[crop.id] || 0;
        const item = document.createElement('div');
        item.className = `seed-pick-item ${state.selectedSeed === crop.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        item.title = unlocked ? `${crop.name} (${crop.growTime}s)` : `Cần Level ${crop.levelReq}`;
        item.innerHTML = `<span class="seed-icon">${crop.icon}</span><span class="seed-count">${unlocked ? count : '🔒'}</span>`;

        if (unlocked) {
          item.addEventListener('click', () => {
            sound.playClick();
            state.selectedSeed = crop.id;
            if (farmInteractions) {
              farmInteractions.quickSeedId = crop.id;
            }
            this.updateDockSeedButton(crop);
            document.querySelectorAll('.seed-pick-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            this.showToast(`Đã chọn ${crop.name}! Chạm hoặc vuốt các ô đất để gieo tiếp.`, 'info');
          });
        }
        this.dom.seedPicker.appendChild(item);
      });
    }

    updateHUD() {
      this.dom.coinsCount.textContent = state.coins.toLocaleString('vi-VN');
      const lvl = state.getLevelData();
      this.dom.expProgress.style.width = `${lvl.progress}%`;
      const usage = state.getBarnUsage();
      this.dom.barnIndicator.textContent = `${usage}/${state.barnCapacity}`;

      const levelBadge = document.getElementById('hud-level-badge');
      if (levelBadge) levelBadge.textContent = lvl.level;

      const guideCounter = document.getElementById('guide-progress-text');
      if (guideCounter) {
        const total = Object.keys(CROPS).length;
        const unlocked = Object.values(CROPS).filter(c => c.levelReq <= lvl.level).length;
        guideCounter.textContent = `${unlocked}/${total}`;
      }

      const ribbonText = document.getElementById('ribbon-text-display');
      if (ribbonText) {
        const hasMature = state.plots.some(p => p.status === 'MATURE');
        const hasGrowing = state.plots.some(p => p.status === 'PLANTED_WATERED');
        const hasDry = state.plots.some(p => p.status === 'PLANTED_DRY');

        if (hasMature) {
          ribbonText.innerHTML = '🌟 Nông sản đã chín vàng! Chạm hoặc <strong>vuốt qua các ô</strong> để gặt!';
        } else if (hasDry) {
          ribbonText.innerHTML = '💧 Cây đang khát nước! Hãy chạm vào để tưới nước.';
        } else if (hasGrowing) {
          ribbonText.innerHTML = '⏳ Cây đang lớn dần theo thời gian thực... Bạn có thể mở rộng thêm ô đất!';
        } else {
          if (farmInteractions && farmInteractions.quickSeedId) {
            const currentCrop = CROPS[farmInteractions.quickSeedId];
            ribbonText.innerHTML = `🌱 Đang trồng <strong>${currentCrop ? currentCrop.name : 'Cây'}</strong>! Chạm hoặc vuốt tiếp các ô để gieo liên tục.`;
          } else {
            ribbonText.innerHTML = 'Nhiệm vụ: Chạm vào ô đất để <strong>chọn cây gieo trồng</strong>!';
          }
        }
      }

      this.renderSeedPicker();
      this.updateActionBadges();
    }

    updateActionBadges() {
      // Đếm số ô đất trống có thể gieo
      const plantablePlots = state.plots.filter(p => p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW'));
      const plantCount = plantablePlots.length;
      if (this.dom.badgePlantCount) {
        this.dom.badgePlantCount.textContent = plantCount;
        if (plantCount > 0) {
          this.dom.badgePlantCount.classList.remove('hidden');
        } else {
          this.dom.badgePlantCount.classList.add('hidden');
        }
      }

      // Đếm số cây đang cần tưới nước để rút ngắn thời gian lớn
      const dryPlots = state.plots.filter(p => p.status === 'PLANTED_DRY' && p.cropId && !p.isWatered);
      const waterCount = dryPlots.length;
      if (this.dom.badgeWaterCount) {
        this.dom.badgeWaterCount.textContent = waterCount;
        if (waterCount > 0) {
          this.dom.badgeWaterCount.classList.remove('hidden');
        } else {
          this.dom.badgeWaterCount.classList.add('hidden');
        }
      }

      // Đếm số ô cây đã chín
      const maturePlots = state.plots.filter(p => p.status === 'MATURE');
      const matureCount = maturePlots.length;
      if (this.dom.badgeHarvestCount) {
        this.dom.badgeHarvestCount.textContent = matureCount;
        if (matureCount > 0) {
          this.dom.badgeHarvestCount.classList.remove('hidden');
        } else {
          this.dom.badgeHarvestCount.classList.add('hidden');
        }
      }
    }

    handleAutoPlant() {
      // Tìm tất cả các ô đất chưa gieo và đã mở khóa
      const plantablePlots = state.plots.filter(p => 
        p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW')
      );

      if (plantablePlots.length === 0) {
        sound.playClick();
        this.showToast('Tất cả các ô đất đều đã được gieo trồng! 🌱', 'info');
        return;
      }

      // Xác định loại hạt giống gieo: ưu tiên hạt đang chọn (selectedSeed), nếu chưa có thì chọn Lúa mì
      const userLvl = state.getLevelData().level;
      let targetCropId = state.selectedSeed || 'wheat';
      if (!CROPS[targetCropId] || userLvl < CROPS[targetCropId].levelReq) {
        targetCropId = 'wheat';
      }
      const crop = CROPS[targetCropId];

      sound.playPlant();
      let plantedCount = 0;
      let stopEarlyReason = null;

      plantablePlots.forEach((plot, index) => {
        setTimeout(() => {
          if (stopEarlyReason) return;

          const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
          if (!plotEl) return;

          const planted = window.farmInteractions ? window.farmInteractions.plantCropDirectly(plot.id, plotEl, targetCropId) : false;
          if (planted) {
            plantedCount++;
            this.createDirtParticles(plotEl);
          } else {
            // Hết hạt và hết tiền mua
            stopEarlyReason = 'NO_COINS';
          }

          if (index === plantablePlots.length - 1 || stopEarlyReason) {
            if (plantedCount > 0) {
              sound.playPlant();
              this.showToast(`Đã tự động gieo ${crop.name} vào ${plantedCount} ô đất! 💧 Hãy tưới nước để rút ngắn -${crop.waterBoost}s`, 'success');
            } else if (stopEarlyReason === 'NO_COINS') {
              this.showToast(`Không đủ tiền mua hạt giống ${crop.name}!`, 'warning');
            }
            this.updateHUD();
            this.updateActionBadges();
            this.closeCropPicker();
          }
        }, index * 60);
      });
    }

    handleRandomPlant() {
      const plantablePlots = state.plots.filter(p => 
        p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW')
      );

      if (plantablePlots.length === 0) {
        sound.playClick();
        this.showToast('Tất cả các ô đất đều đã được gieo trồng! 🌱', 'info');
        return;
      }

      // Lấy danh sách các cây trồng mà người chơi đã mở khóa theo cấp độ
      const userLvl = state.getLevelData().level;
      const unlockedCrops = Object.keys(CROPS).filter(k => userLvl >= CROPS[k].levelReq);

      if (unlockedCrops.length === 0) {
        this.showToast('Chưa có cây trồng nào khả dụng!', 'warning');
        return;
      }

      sound.playPlant();
      let plantedCount = 0;
      const cropStats = {};

      plantablePlots.forEach((plot, index) => {
        setTimeout(() => {
          const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
          if (!plotEl) return;

          // Lọc các cây mà người chơi có thể trồng (còn hạt hoặc còn đủ tiền mua)
          const availableForPlot = unlockedCrops.filter(k => {
            const hasSeed = (state.inventory.seeds[k] || 0) > 0;
            const canAfford = state.coins >= CROPS[k].seedCost;
            return hasSeed || canAfford;
          });

          // Nếu hết tiền mua tất cả các loại cây mở khóa, fallback về lúa mì hoặc dừng
          let randomCropId = null;
          if (availableForPlot.length > 0) {
            randomCropId = availableForPlot[Math.floor(Math.random() * availableForPlot.length)];
          } else if (state.coins >= CROPS['wheat'].seedCost) {
            randomCropId = 'wheat';
          }

          if (randomCropId && window.farmInteractions) {
            const planted = window.farmInteractions.plantCropDirectly(plot.id, plotEl, randomCropId);
            if (planted) {
              plantedCount++;
              cropStats[randomCropId] = (cropStats[randomCropId] || 0) + 1;
              this.createDirtParticles(plotEl);
            }
          }

          if (index === plantablePlots.length - 1) {
            if (plantedCount > 0) {
              sound.playPlant();
              const cropNamesSummary = Object.keys(cropStats).map(k => `${CROPS[k].icon} ${CROPS[k].name} (x${cropStats[k]})`).join(', ');
              this.showToast(`Đã gieo ngẫu nhiên ${plantedCount} ô: ${cropNamesSummary}! 🎲🌱`, 'success');
            } else {
              this.showToast('Không đủ vàng để mua thêm hạt giống ngẫu nhiên!', 'warning');
            }
            this.updateHUD();
            this.updateActionBadges();
            this.closeCropPicker();
          }
        }, index * 60);
      });
    }

    handleWaterAll() {
      // Chỉ tưới nước cho các ô ĐÃ TRỒNG CÂY và ĐANG CẦN NƯỚC (PLANTED_DRY)
      const waterablePlots = state.plots.filter(p => p.status === 'PLANTED_DRY' && p.cropId && !p.isWatered);
      if (waterablePlots.length === 0) {
        sound.playClick();
        this.showToast('Không có cây trồng nào cần tưới nước lúc này! 🌱', 'info');
        return;
      }

      sound.playWater();
      let count = 0;
      let totalBoost = 0;
      waterablePlots.forEach((plot, index) => {
        setTimeout(() => {
          const res = state.waterPlot(plot.id);
          const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`) || document.querySelector(`.farm-plot[data-id="${plot.id}"]`);
          if (plotEl) {
            this.createWaterSplashes(plotEl);
            if (res && res.boostSeconds > 0) {
              this.showFloatingText(plotEl, `-${res.boostSeconds}s ⏳💧`, 'water');
              totalBoost += res.boostSeconds;
            } else {
              this.showFloatingText(plotEl, '💧 Tưới', 'water');
            }
          }
          const rend = this.activeRenderer || window.farmRenderer;
          if (rend) {
            rend.updatePlotElement(plot);
          }
          count++;
          if (count === waterablePlots.length) {
            sound.playWater();
            this.showToast(`Đã tưới nước toàn bộ cây trồng! Đã rút ngắn thời gian chờ 💧✨`, 'success');
            this.updateActionBadges();
          }
        }, index * 60);
      });
    }

    handleHarvestAll() {
      const maturePlots = state.plots.filter(p => p.status === 'MATURE');
      if (maturePlots.length === 0) {
        sound.playClick();
        this.showToast('Chưa có nông sản nào chín để thu hoạch! 🌾', 'info');
        return;
      }

      const barnFree = state.barnCapacity - state.getBarnUsage();
      if (barnFree <= 0) {
        sound.playClick();
        this.showToast('Nhà kho đã đầy! Hãy vào kho bán bớt nông sản trước nhé 🧺', 'warning');
        return;
      }

      let count = 0;
      const toHarvest = maturePlots.slice(0, barnFree);

      toHarvest.forEach((plot, index) => {
        setTimeout(() => {
          const res = state.harvestPlot(plot.id);
          if (res && res.success) {
            sound.playHarvest();
            const plotEl = document.querySelector(`.farm-plot[data-id="${plot.id}"]`);
            if (plotEl) {
              this.showFloatingText(plotEl, `+1 ${res.crop.icon}`, 'crop');
              this.showFloatingText(plotEl, `+${res.crop.expGain} EXP ✨`, 'exp', 35);
            }
            const rend = this.activeRenderer || window.farmRenderer;
            if (rend) {
              rend.updatePlotElement(plot);
            }
            count++;
          }

          if (index === toHarvest.length - 1) {
            this.updateHUD();
            this.updateActionBadges();
            if (maturePlots.length > toHarvest.length) {
              this.showToast(`Đã gặt ${count} nông sản! Kho đã đầy, bán bớt để gặt tiếp. 🌾`, 'warning');
            } else {
              this.showToast(`Thu hoạch thành công tất cả ${count} nông sản! 🌾🎉`, 'success');
            }
          }
        }, index * 70);
      });
    }

    openShop() {
      this.closeAllModals();
      this.dom.shopModal.classList.remove('hidden');
      this.dom.shopList.innerHTML = '';
      const lvl = state.getLevelData().level;

      Object.values(CROPS).forEach(crop => {
        const unlocked = lvl >= crop.levelReq;
        const count = state.inventory.seeds[crop.id] || 0;
        const card = document.createElement('div');
        card.className = `shop-item-card ${!unlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div class="shop-item-header">
            <span class="shop-item-icon">${crop.icon}</span>
            <div class="shop-item-meta">
              <h4>${crop.name}</h4>
              <span class="shop-item-desc">Lớn sau ${crop.growTime}s - EXP +${crop.expGain}</span>
            </div>
          </div>
          <div class="shop-item-body">
            <div class="shop-item-stats">
              <span>Đang có: <strong>${count}</strong></span>
              <span>Giá: <strong class="gold-text">${crop.seedCost} 💰</strong></span>
            </div>
            ${!unlocked ? `<div class="lock-tag">🔒 Mở ở Cấp ${crop.levelReq}</div>` : `
              <div class="shop-actions">
                <button class="btn-buy" data-crop="${crop.id}" data-qty="1">Mua 1 (${crop.seedCost} 💰)</button>
                <button class="btn-buy btn-buy-pack" data-crop="${crop.id}" data-qty="5">Mua 5 (${crop.seedCost * 5} 💰)</button>
              </div>
            `}
          </div>
        `;

        if (unlocked) {
          card.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', () => {
              const res = state.buySeeds(btn.dataset.crop, parseInt(btn.dataset.qty, 10));
              if (res.success) {
                sound.playCoin();
                this.showToast(`Đã mua hạt giống ${crop.name}!`, 'success');
                this.updateHUD();
                this.openShop();
              } else {
                sound.playClick();
                this.showToast('Không đủ tiền vàng!', 'warning');
              }
            });
          });
        }
        this.dom.shopList.appendChild(card);
      });
    }

    openBarn() {
      this.closeAllModals();
      this.dom.barnModal.classList.remove('hidden');
      this.dom.barnList.innerHTML = '';
      this.dom.barnUsageText.textContent = state.getBarnUsage();
      this.dom.barnCapacityText.textContent = state.barnCapacity;
      this.dom.btnUpgradeBarn.textContent = `Nâng cấp +30 chỗ (${Math.round(state.barnCapacity * 4)} 💰)`;

      let has = false;
      Object.values(CROPS).forEach(crop => {
        const count = state.inventory.crops[crop.id] || 0;
        if (count > 0) {
          has = true;
          const card = document.createElement('div');
          card.className = 'barn-item-card';
          card.innerHTML = `
            <div class="barn-item-left">
              <span class="barn-item-icon">${crop.icon}</span>
              <div><h4>${crop.name}</h4><span class="barn-qty">Có: <strong>${count}</strong></span></div>
            </div>
            <div class="barn-item-right">
              <span class="barn-price">+${crop.sellPrice} 💰 / cái</span>
              <div class="barn-btn-group">
                <button class="btn-sell-single" data-crop="${crop.id}">Bán 1</button>
                <button class="btn-sell-bulk" data-crop="${crop.id}" data-count="${count}">Bán hết (${count * crop.sellPrice} 💰)</button>
              </div>
            </div>
          `;
          card.querySelector('.btn-sell-single').addEventListener('click', () => {
            state.sellCrop(crop.id, 1);
            sound.playCoin();
            this.updateHUD();
            this.openBarn();
          });
          card.querySelector('.btn-sell-bulk').addEventListener('click', () => {
            state.sellCrop(crop.id, count);
            sound.playCoin();
            this.showToast(`Đã bán ${count} ${crop.name}!`, 'success');
            this.updateHUD();
            this.openBarn();
          });
          this.dom.barnList.appendChild(card);
        }
      });
      if (!has) {
        this.dom.barnList.innerHTML = `<div class="empty-state"><span>🧺</span><p>Nhà kho đang trống.</p></div>`;
      }
    }

    openOrders() {
      this.closeAllModals();
      this.dom.ordersModal.classList.remove('hidden');
      this.dom.ordersList.innerHTML = '';

      orderSystem.orders.forEach(order => {
        const canComplete = orderSystem.canCompleteOrder(order);
        const card = document.createElement('div');
        card.className = `order-card ${canComplete ? 'ready' : ''}`;
        let itemsHtml = order.items.map(item => {
          const crop = CROPS[item.cropId];
          const owned = state.inventory.crops[item.cropId] || 0;
          return `<div class="order-item-req ${owned >= item.quantity ? 'enough' : 'lacking'}">
            <span>${crop.icon} ${crop.name}</span><strong>${owned}/${item.quantity}</strong>
          </div>`;
        }).join('');

        card.innerHTML = `
          <div class="order-header">
            <span class="customer-avatar">${order.customerAvatar}</span>
            <div class="customer-meta"><h4>${order.customerName}</h4><p class="order-dialog">"${order.dialog}"</p></div>
          </div>
          <div class="order-requirements">${itemsHtml}</div>
          <div class="order-footer">
            <div class="order-rewards"><span class="reward-gold">+${order.rewardCoins} 💰</span><span class="reward-exp">+${order.rewardExp} ✨</span></div>
            <div class="order-actions">
              <button class="btn-discard-order" data-id="${order.id}">Đổi</button>
              <button class="btn-deliver-order ${canComplete ? 'highlight-btn' : ''}" data-id="${order.id}" ${!canComplete ? 'disabled' : ''}>
                ${canComplete ? 'Giao hàng' : 'Thiếu hàng'}
              </button>
            </div>
          </div>
        `;

        if (canComplete) {
          card.querySelector('.btn-deliver-order').addEventListener('click', () => {
            const res = orderSystem.completeOrder(order.id);
            if (res.success) {
              this.showToast(`Hoàn thành đơn hàng! Nhận +${res.rewardCoins} 💰!`, 'success');
              this.updateHUD();
              this.openOrders();
            }
          });
        }
        card.querySelector('.btn-discard-order').addEventListener('click', () => {
          sound.playClick();
          orderSystem.discardOrder(order.id);
          this.openOrders();
        });
        this.dom.ordersList.appendChild(card);
      });
    }

    openGuide() {
      this.closeAllModals();
      this.dom.guideModal.classList.remove('hidden');
      this.dom.guideList.innerHTML = '';
      const lvl = state.getLevelData().level;
      Object.values(CROPS).forEach(crop => {
        const unlocked = lvl >= crop.levelReq;
        const card = document.createElement('div');
        card.className = `shop-item-card ${!unlocked ? 'locked' : ''}`;
        card.innerHTML = `
          <div class="shop-item-header">
            <span class="shop-item-icon">${crop.icon}</span>
            <div class="shop-item-meta">
              <h4>${crop.name} ${unlocked ? '✅' : '🔒 Khóa'}</h4>
              <span class="shop-item-desc">${crop.description}</span>
            </div>
          </div>
          <div class="shop-item-body">
            <div class="shop-item-stats">
              <span>Lớn: <strong>${crop.growTime}s</strong></span>
              <span>Bán: <strong class="gold-text">${crop.sellPrice} 💰</strong></span>
            </div>
          </div>
        `;
        this.dom.guideList.appendChild(card);
      });
    }

    openProfileModal() {
      this.closeAllModals();
      const lvl = state.getLevelData();
      const modal = this.dom.profileModal;
      const body = this.dom.profileModalBody;
      if (!modal || !body) return;

      const titleMap = {
        1: 'Tân Thủ Làm Nông 🌱',
        2: 'Nông Dân Cần Cù 🌿',
        3: 'Nông Gia Tiềm Năng 🌾',
        4: 'Chủ Trang Trại Nhỏ 🚜',
        5: 'Phú Nông Làng Quê 🌻',
        6: 'Đại Điền Chủ Trù Phú 🏡',
        7: 'Đại Địa Chủ Miền Tây 💎',
        8: 'Nhà Đầu Tư Nông Nghiệp 🌟',
        9: 'Bá Chủ Nông Sản 🌾',
        10: 'Triệu Phú Nông Thôn 💰',
        11: 'Thương Gia Xuất Chúng 👑',
        12: 'Huyền Thoại Nông Trại ⭐',
        13: 'Bậc Thầy Nông Nghiệp 🏆'
      };
      const playerTitle = titleMap[lvl.level] || 'Huyền Thoại Nông Trại 👑';

      const currentLvlExp = lvl.currentLevel ? lvl.currentLevel.expRequired : 0;
      const diff = lvl.nextLevel ? (lvl.nextLevel.expRequired - currentLvlExp) : 1000;
      const progressPercent = Math.round(lvl.progress || 0);

      const unlockedPlots = state.plots.filter(p => p.status !== 'LOCKED').length;
      const totalPlots = state.plots.length;
      const totalCropsCount = state.inventory.crops ? Object.values(state.inventory.crops).reduce((a, b) => a + b, 0) : 0;
      const totalHarvested = state.stats ? (state.stats.totalHarvested || 0) : 0;

      body.innerHTML = `
        <div class="profile-hero-section">
          <div class="profile-avatar-wrapper">
            <img src="assets/farmer_avatar.jpg" alt="Avatar Nông Dân" class="profile-avatar-large" />
            <span class="profile-level-badge">Cấp ${lvl.level}</span>
          </div>
          <div class="profile-identity">
            <h3 class="profile-farm-name">Trang trại của bạn <span class="badge-verified">✓</span></h3>
            <div class="profile-farm-title">${playerTitle}</div>
            <div class="profile-tag-row">
              <span class="profile-pill-tag">💰 ${state.coins.toLocaleString()} Vàng</span>
              <span class="profile-pill-tag">⭐ ${state.exp.toLocaleString()} Tổng EXP</span>
            </div>
          </div>
        </div>

        <div class="profile-exp-card">
          <div class="exp-card-header">
            <span class="exp-card-title">⭐ TIẾN TRÌNH CẤP ĐỘ</span>
            <span class="exp-card-percent">${progressPercent}%</span>
          </div>
          
          <div class="profile-exp-bar-track">
            <div class="profile-exp-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <div class="exp-details-grid">
            <div class="exp-stat-item">
              <span class="stat-label">EXP trong cấp này:</span>
              <span class="stat-value"><strong>${lvl.expCurrentLevel.toLocaleString()}</strong> / ${diff.toLocaleString()} EXP</span>
            </div>
            <div class="exp-stat-item">
              <span class="stat-label">${lvl.nextLevel ? 'Kinh nghiệm cần lên cấp:' : 'Trạng thái cấp:'}</span>
              <span class="stat-value highlight-need">${lvl.nextLevel ? `Còn thiếu <strong>${lvl.expToNext.toLocaleString()}</strong> EXP` : 'Đã đạt cấp tối đa! 👑'}</span>
            </div>
          </div>
        </div>

        ${lvl.nextLevel ? `
          <div class="profile-next-reward-card">
            <div class="next-reward-header">
              <div class="next-level-tag">
                <span class="star-icon">🌟</span>
                <span>QUYỀN LỢI CẤP TIẾP THEO: <strong>CẤP ${lvl.nextLevel.level}</strong></span>
              </div>
              <span class="reward-gold-tag">+${lvl.nextLevel.rewardCoins.toLocaleString()} 💰</span>
            </div>
            <div class="next-reward-content">
              <div class="reward-bullet-item">
                <span class="bullet-icon">🎁</span>
                <span class="bullet-text">${lvl.nextLevel.unlockNote}</span>
              </div>
            </div>
          </div>
        ` : `
          <div class="profile-max-level-card">
            🎉 Bạn đã đạt cấp độ vinh danh cao nhất của nông trại!
          </div>
        `}

        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <span class="stat-box-icon">🌾</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${totalHarvested.toLocaleString()}</span>
              <span class="stat-box-name">Đã thu hoạch</span>
            </div>
          </div>

          <div class="profile-stat-box">
            <span class="stat-box-icon">🏡</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${unlockedPlots} / ${totalPlots}</span>
              <span class="stat-box-name">Ô đất canh tác</span>
            </div>
          </div>

          <div class="profile-stat-box">
            <span class="stat-box-icon">🧺</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${totalCropsCount} / ${state.barnCapacity}</span>
              <span class="stat-box-name">Kho nông sản</span>
            </div>
          </div>

          <div class="profile-stat-box">
            <span class="stat-box-icon">📜</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${state.stats ? (state.stats.ordersCompleted || 0) : 0}</span>
              <span class="stat-box-name">Đơn hoàn thành</span>
            </div>
          </div>
        </div>

        <div class="profile-tip-box">
          <span class="tip-icon">💡</span>
          <span class="tip-text"><strong>Mẹo lên cấp:</strong> Thu hoạch các cây trồng dài ngày và giao <strong>Đơn Hàng Thị Trấn</strong> 📜 để nhận được lượng lớn EXP!</span>
        </div>
      `;

      modal.classList.remove('hidden');
    }

    closeAllModals() {
      [this.dom.shopModal, this.dom.barnModal, this.dom.ordersModal, this.dom.guideModal, this.dom.profileModal].forEach(m => {
        if (m) m.classList.add('hidden');
      });
      this.closeCropPicker();
      this.closeCropInfo();
    }

    showFloatingText(parentEl, text, type = 'normal', offsetY = 0) {
      if (!parentEl) return;
      const floater = document.createElement('div');
      floater.className = `floating-text float-type-${type}`;
      floater.textContent = text;
      if (offsetY) floater.style.top = `${offsetY}px`;
      parentEl.appendChild(floater);
      setTimeout(() => floater.remove(), 1200);
    }

    createDirtParticles(parentEl) {
      for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'dirt-particle';
        const a = Math.random() * Math.PI * 2;
        const d = 15 + Math.random() * 20;
        p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        parentEl.appendChild(p);
        setTimeout(() => p.remove(), 400);
      }
    }

    createWaterSplashes(parentEl) {
      for (let i = 0; i < 4; i++) {
        const p = document.createElement('div');
        p.className = 'water-splash-particle';
        const a = Math.random() * Math.PI * 2;
        const d = 12 + Math.random() * 18;
        p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        parentEl.appendChild(p);
        setTimeout(() => p.remove(), 500);
      }
    }

    showToast(msg, type = 'info') {
      const t = document.createElement('div');
      t.className = `toast-item toast-${type}`;
      t.textContent = msg;
      this.dom.toastContainer.appendChild(t);
      setTimeout(() => {
        t.classList.add('fade-out');
        setTimeout(() => t.remove(), 400);
      }, 2800);
    }

    showLockedSignpost(plotId, plotEl, reqLevel) {
      if (!plotEl) return;
      const contentEl = plotEl.querySelector('.plot-content');
      if (!contentEl) return;
      let existingSign = contentEl.querySelector('.iso-signpost');
      if (!existingSign) {
        const signEl = document.createElement('div');
        signEl.className = 'iso-signpost';
        signEl.innerHTML = `
          <div class="signpost-board">
            <div class="sign-crest">🌾</div>
            <div class="sign-text-col">
              <span class="sign-line1">Chưa được</span>
              <span class="sign-line2">canh tác Lv.${reqLevel}</span>
            </div>
          </div>
          <div class="signpost-arrow"></div>
        `;
        contentEl.appendChild(signEl);
        setTimeout(() => {
          signEl.classList.add('fade-out');
          setTimeout(() => signEl.remove(), 300);
        }, 1600);
      }
    }

    openCropPicker(plotId, plotEl, renderer = null) {
      this.activePlotId = plotId;
      this.activePlotEl = plotEl;
      if (renderer) this.activeRenderer = renderer;

      // Đánh dấu viền sáng ô đất đang được nhắm tới
      document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
      if (plotEl) plotEl.classList.add('plot-target-active');

      this.renderCropPicker(plotId);

      const popup = this.dom.plotCropPopup;
      if (!popup) return;

      popup.classList.remove('hidden');
      this.positionCropPicker(plotEl);

      sound.playClick();
    }

    positionCropPicker(plotEl) {
      const popup = this.dom.plotCropPopup;
      if (!popup || !plotEl) return;

      const rect = plotEl.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const popupHeight = popupRect.height || 140;
      const popupWidth = popupRect.width || 280;

      // Giữ popup nằm trọn trong 2 mép màn hình
      let popupX = rect.left + rect.width / 2;
      const minX = popupWidth / 2 + 10;
      const maxX = window.innerWidth - popupWidth / 2 - 10;
      popupX = Math.max(minX, Math.min(maxX, popupX));

      // Tính Y: Nếu khoảng trống phía trên quá nhỏ (< popupHeight + 75px sát header), lật popup XUỐNG DƯỚI
      const topSpace = rect.top;
      const arrowEl = popup.querySelector('.crop-popup-arrow');

      if (topSpace < popupHeight + 75) {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.bottom + 14}px`;
        popup.style.transform = `translateX(-50%)`;
        if (arrowEl) {
          arrowEl.style.top = '-9px';
          arrowEl.style.bottom = 'auto';
          arrowEl.style.borderTop = 'none';
          arrowEl.style.borderBottom = '9px solid #f59e0b';
        }
      } else {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.top - 12}px`;
        popup.style.transform = `translate(-50%, -100%)`;
        if (arrowEl) {
          arrowEl.style.top = 'auto';
          arrowEl.style.bottom = '-9px';
          arrowEl.style.borderBottom = 'none';
          arrowEl.style.borderTop = '9px solid #f59e0b';
        }
      }
    }

    closeCropPicker() {
      if (this.dom.plotCropPopup) {
        this.dom.plotCropPopup.classList.add('hidden');
      }
      if (!this.activeCropInfoPlotId) {
        document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
      }
      this.activePlotId = null;
      this.activePlotEl = null;
    }

    openCropInfo(plotId, plotEl) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot || !plot.cropId) return;
      const crop = CROPS[plot.cropId];
      if (!crop) return;

      this.closeCropPicker();
      this.activeCropInfoPlotId = plotId;
      this.activeCropInfoPlotEl = plotEl;

      document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
      if (plotEl) plotEl.classList.add('plot-target-active');

      this.updateCropInfoContent(plot, crop);

      const popup = this.dom.cropInfoPopup;
      if (!popup) return;

      popup.classList.remove('hidden');
      this.positionCropInfoPopup(plotEl);

      sound.playClick();
    }

    positionCropInfoPopup(plotEl) {
      const popup = this.dom.cropInfoPopup;
      if (!popup || !plotEl) return;

      const rect = plotEl.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const popupHeight = popupRect.height || 180;
      const popupWidth = popupRect.width || 290;

      let popupX = rect.left + rect.width / 2;
      const minX = popupWidth / 2 + 10;
      const maxX = window.innerWidth - popupWidth / 2 - 10;
      popupX = Math.max(minX, Math.min(maxX, popupX));

      const topSpace = rect.top;
      const arrowEl = popup.querySelector('.crop-info-arrow');

      if (topSpace < popupHeight + 80) {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.bottom + 14}px`;
        popup.style.transform = `translateX(-50%)`;
        if (arrowEl) {
          arrowEl.style.top = '-9px';
          arrowEl.style.bottom = 'auto';
          arrowEl.style.borderTop = 'none';
          arrowEl.style.borderBottom = '9px solid #f59e0b';
        }
      } else {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.top - 12}px`;
        popup.style.transform = `translate(-50%, -100%)`;
        if (arrowEl) {
          arrowEl.style.top = 'auto';
          arrowEl.style.bottom = '-9px';
          arrowEl.style.borderBottom = 'none';
          arrowEl.style.borderTop = '9px solid #f59e0b';
        }
      }
    }

    updateCropInfoContent(plot, crop) {
      if (!plot || !crop) return;

      if (this.dom.cropInfoIcon) this.dom.cropInfoIcon.textContent = crop.icon;
      if (this.dom.cropInfoName) this.dom.cropInfoName.textContent = `${crop.name} (Ô #${plot.id + 1})`;

      const rem = Math.max(0, Math.ceil(plot.growDuration - plot.elapsedSeconds));
      const mins = Math.floor(rem / 60);
      const secs = rem % 60;
      const progress = Math.min(100, Math.max(0, Math.round(plot.growthProgress || 0)));

      if (plot.status === 'MATURE') {
        if (this.dom.cropInfoStatus) this.dom.cropInfoStatus.innerHTML = '<span style="color:#eab308; font-weight:800;">Đã chín vàng! 🌾</span>';
        if (this.dom.cropInfoTimeRem) this.dom.cropInfoTimeRem.textContent = 'Sẵn sàng thu hoạch! ✨';
        if (this.dom.cropInfoBarFill) this.dom.cropInfoBarFill.style.width = '100%';
        if (this.dom.cropInfoWaterAction) {
          this.dom.cropInfoWaterAction.innerHTML = `
            <button id="btn-crop-info-harvest" class="crop-info-water-btn" style="background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-color:#4ade80;">
              🌾 Thu Hoạch Ngay (+${crop.sellPrice} 💰)
            </button>
          `;
          const btnHarvest = this.dom.cropInfoWaterAction.querySelector('#btn-crop-info-harvest');
          if (btnHarvest) {
            btnHarvest.addEventListener('click', (e) => {
              e.stopPropagation();
              const res = state.harvestPlot(plot.id);
              if (res && res.success) {
                sound.playHarvest();
                if (this.activeCropInfoPlotEl) {
                  this.showFloatingText(this.activeCropInfoPlotEl, `+1 ${res.crop.icon}`, 'crop');
                  this.showFloatingText(this.activeCropInfoPlotEl, `+${res.crop.expGain} EXP ✨`, 'exp', 35);
                }
                const rend = this.activeRenderer || window.farmRenderer;
                if (rend) rend.updatePlotElement(plot);
                this.updateHUD();
                this.updateActionBadges();
                this.closeCropInfo();
              } else if (res && res.reason === 'BARN_FULL') {
                sound.playClick();
                this.showToast('Nhà kho đã đầy! Hãy bán bớt nông sản.', 'warning');
              }
            });
          }
        }
      } else {
        if (plot.status === 'PLANTED_DRY') {
          if (this.dom.cropInfoStatus) this.dom.cropInfoStatus.innerHTML = '<span style="color:#38bdf8; font-weight:700;">Đang khát nước 💧</span>';
        } else {
          if (this.dom.cropInfoStatus) this.dom.cropInfoStatus.innerHTML = '<span style="color:#22c55e; font-weight:700;">Đang phát triển xanh tốt 🌱</span>';
        }

        if (this.dom.cropInfoTimeRem) {
          this.dom.cropInfoTimeRem.textContent = `⏳ ${mins > 0 ? mins + 'p ' : ''}${secs}s (${progress}%)`;
        }
        if (this.dom.cropInfoBarFill) {
          this.dom.cropInfoBarFill.style.width = `${progress}%`;
        }

        if (this.dom.cropInfoWaterAction) {
          if (plot.status === 'PLANTED_DRY') {
            this.dom.cropInfoWaterAction.innerHTML = `
              <button id="btn-crop-info-water" class="crop-info-water-btn">
                🚿 Tưới Nước Ngay (-${crop.waterBoost}s ⏳)
              </button>
            `;
            const btnWater = this.dom.cropInfoWaterAction.querySelector('#btn-crop-info-water');
            if (btnWater) {
              btnWater.addEventListener('click', (e) => {
                e.stopPropagation();
                const res = state.waterPlot(plot.id);
                if (res && res.success) {
                  sound.playWater();
                  if (this.activeCropInfoPlotEl) {
                    this.createWaterSplashes(this.activeCropInfoPlotEl);
                    if (res.boostSeconds > 0) {
                      this.showFloatingText(this.activeCropInfoPlotEl, `-${res.boostSeconds}s ⏳💧`, 'water');
                      this.showToast(`Đã tưới nước! Rút ngắn -${res.boostSeconds}s thời gian chờ 💧✨`, 'success');
                    } else {
                      this.showFloatingText(this.activeCropInfoPlotEl, '💧 Tưới', 'water');
                    }
                  }
                  const rend = this.activeRenderer || window.farmRenderer;
                  if (rend) rend.updatePlotElement(plot);
                  this.updateActionBadges();
                  this.updateCropInfoContent(plot, crop);
                }
              });
            }
          } else {
            this.dom.cropInfoWaterAction.innerHTML = `
              <div class="crop-info-watered-notice">💧 Đã tưới nước (Rút ngắn -${crop.waterBoost}s thành công)</div>
            `;
          }
        }
      }

      if (this.dom.cropInfoSell) this.dom.cropInfoSell.textContent = `+${crop.sellPrice} 💰`;
      if (this.dom.cropInfoExp) this.dom.cropInfoExp.textContent = `+${crop.expGain} ⭐`;
      if (this.dom.cropInfoWaterBoost) this.dom.cropInfoWaterBoost.textContent = `-${crop.waterBoost}s 💧`;

      const btnDig = document.getElementById('btn-crop-info-dig');
      if (btnDig) {
        btnDig.onclick = (e) => {
          e.stopPropagation();
          const res = state.digPlot(plot.id);
          if (res && res.success) {
            sound.playClick();
            if (this.activeCropInfoPlotEl) {
              this.createDirtParticles(this.activeCropInfoPlotEl);
              this.showFloatingText(this.activeCropInfoPlotEl, '⛏️ Đã đào cây', 'cost');
              this.showToast(`Đã đào bỏ ${res.crop.name}! Đất đã sẵn sàng trồng mới 🌱`, 'info');
            }
            const rend = this.activeRenderer || window.farmRenderer;
            if (rend) rend.updatePlotElement(plot);
            this.updateHUD();
            this.updateActionBadges();
            this.closeCropInfo();
          }
        };
      }
    }

    closeCropInfo() {
      if (this.dom.cropInfoPopup) {
        this.dom.cropInfoPopup.classList.add('hidden');
      }
      if (!this.activePlotId) {
        document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
      }
      this.activeCropInfoPlotId = null;
      this.activeCropInfoPlotEl = null;
    }

    renderCropPicker(plotId) {
      if (!this.dom.cropPopupList) return;
      this.dom.cropPopupList.innerHTML = '';
      const userLvl = state.getLevelData().level;

      const titleEl = this.dom.plotCropPopup ? this.dom.plotCropPopup.querySelector('.crop-popup-title') : null;
      if (titleEl) {
        titleEl.innerHTML = `🌱 CHỌN CÂY TRỒNG <span style="font-size:0.75rem; color:#fde047; margin-left:6px; font-weight:700;">(Ô #${plotId + 1})</span>`;
      }

      for (const key in CROPS) {
        const crop = CROPS[key];
        const count = state.inventory.seeds[key] || 0;
        const isLocked = userLvl < crop.levelReq;

        const card = document.createElement('div');
        card.className = `crop-choice-card ${isLocked ? 'is-locked' : ''}`;
        card.innerHTML = `
          <span class="crop-choice-icon">${crop.icon}</span>
          <span class="crop-choice-name">${crop.name}</span>
          <span class="crop-choice-time">${crop.growTime}s <span style="color:#38bdf8; font-weight:800; font-size:0.68rem;">(💧-${crop.waterBoost}s)</span></span>
          ${isLocked 
            ? `<span class="crop-choice-badge badge-lock">Lv.${crop.levelReq}</span>` 
            : (count > 0 
              ? `<span class="crop-choice-badge">x${count}</span>` 
              : `<span class="crop-choice-badge badge-buy">${crop.seedCost}💰</span>`
            )
          }
        `;

        if (!isLocked) {
          card.addEventListener('pointerdown', (e) => {
            e.stopPropagation();

            const startX = e.clientX;
            const startY = e.clientY;
            let isDrag = false;
            let dragGhost = null;
            const plantedIds = new Set();
            let lastHoverPlotEl = null;

            const onPointerMove = (moveEvt) => {
              const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
              if (dist > 6 && !isDrag) {
                isDrag = true;
                sound.playClick();

                if (this.dom.plotCropPopup) {
                  this.dom.plotCropPopup.classList.add('is-dragging');
                }

                dragGhost = document.createElement('div');
                dragGhost.className = 'seed-drag-ghost';
                dragGhost.innerHTML = `
                  <div class="seed-drag-ghost-bubble">
                    <span class="drag-icon">${crop.icon}</span>
                  </div>
                  <span class="seed-drag-ghost-label">${crop.name}</span>
                `;
                document.body.appendChild(dragGhost);
              }

              if (isDrag && dragGhost) {
                dragGhost.style.left = `${moveEvt.clientX}px`;
                dragGhost.style.top = `${moveEvt.clientY}px`;

                const el = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
                let plotEl = el ? el.closest('.farm-plot') : null;
                if (!plotEl && window.farmInteractions) {
                  plotEl = window.farmInteractions.getClosestPlot(moveEvt.clientX, moveEvt.clientY);
                }

                if (lastHoverPlotEl && lastHoverPlotEl !== plotEl) {
                  lastHoverPlotEl.classList.remove('plot-drag-hover');
                }

                if (plotEl) {
                  plotEl.classList.add('plot-drag-hover');
                  lastHoverPlotEl = plotEl;

                  const targetId = parseInt(plotEl.dataset.plotId, 10);
                  if (!isNaN(targetId) && !plantedIds.has(targetId)) {
                    const plotData = state.plots.find(p => p.id === targetId);
                    if (plotData && (plotData.status === 'TILLED' || plotData.status === 'RAW')) {
                      if (window.farmInteractions) {
                        const planted = window.farmInteractions.plantCropDirectly(targetId, plotEl, key);
                        if (planted) {
                          plantedIds.add(targetId);
                          this.createDirtParticles(plotEl);
                        }
                      }
                    }
                  }
                }
              }
            };

            const onPointerUp = () => {
              window.removeEventListener('pointermove', onPointerMove);
              window.removeEventListener('pointerup', onPointerUp);
              window.removeEventListener('pointercancel', onPointerUp);

              if (lastHoverPlotEl) {
                lastHoverPlotEl.classList.remove('plot-drag-hover');
                lastHoverPlotEl = null;
              }

              if (dragGhost) {
                dragGhost.remove();
                dragGhost = null;
              }

              if (this.dom.plotCropPopup) {
                this.dom.plotCropPopup.classList.remove('is-dragging');
              }

              if (isDrag) {
                if (plantedIds.size > 0) {
                  this.showToast(`Đã gieo ${crop.name} vào ${plantedIds.size} ô đất! Hãy tưới nước để rút ngắn -${crop.waterBoost}s 💧`, 'success');
                }
                this.closeCropPicker();
              } else {
                // Nhấp chuột hoặc chạm nhẹ: Gieo vào ô đất đã chọn
                this.handleCropChoice(key, plotId);
              }
            };

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp, { once: true });
            window.addEventListener('pointercancel', onPointerUp, { once: true });
          });
        }

        this.dom.cropPopupList.appendChild(card);
      }
    }

    handleCropChoice(cropId, plotId) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot || (plot.status !== 'TILLED' && plot.status !== 'RAW')) {
        this.closeCropPicker();
        return;
      }
      if (plot.status === 'RAW') plot.status = 'TILLED';

      const crop = CROPS[cropId];
      let count = state.inventory.seeds[cropId] || 0;

      // Nếu hết hạt giống nhưng có tiền: Tự động mua và gieo luôn!
      if (count <= 0) {
        if (state.coins >= crop.seedCost) {
          state.addCoins(-crop.seedCost);
          state.inventory.seeds[cropId] = 1;
          this.showFloatingText(this.activePlotEl, `-${crop.seedCost} 💰`, 'cost');
        } else {
          sound.playClick();
          this.showToast(`Không đủ tiền mua hạt giống ${crop.name} (${crop.seedCost} 💰)!`, 'warning');
          return;
        }
      }

      state.selectedSeed = cropId;
      if (farmInteractions) {
        farmInteractions.quickSeedId = cropId;
      }
      const res = state.plantSeed(plotId, cropId);
      if (res && res.success) {
        sound.playPlant();
        this.showFloatingText(this.activePlotEl, `-1 🌱`, 'seed');
        
        // Cây non xuất hiện yêu cầu tưới nước!
        if (this.activeRenderer) {
          this.activeRenderer.updatePlotElement(plot);
        }
        this.showToast(`Đã gieo ${crop.name}! Hãy tưới nước để rút ngắn -${crop.waterBoost}s 💧`, 'info');
      }

      this.updateDockSeedButton(crop);
      this.renderSeedPicker();
      this.updateHUD();
      this.updateActionBadges();

      // TỰ ĐỘNG CHUYỂN BẢNG CHỌN SANG Ô ĐẤT TIẾP THEO (Ô 2, 3, 4...)
      const plantablePlots = state.plots.filter(p => 
        p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW')
      );

      // Tìm ô tiếp theo có id lớn hơn plotId hiện tại
      let nextPlot = plantablePlots.find(p => p.id > plotId);
      if (!nextPlot && plantablePlots.length > 0) {
        // Quay vòng lại ô trống đầu tiên nếu đã đến cuối hàng
        nextPlot = plantablePlots[0];
      }

      if (nextPlot) {
        const nextPlotEl = document.querySelector(`.farm-plot[data-plot-id="${nextPlot.id}"]`);
        if (nextPlotEl) {
          this.activePlotId = nextPlot.id;
          this.activePlotEl = nextPlotEl;

          // Chuyển viền sáng vàng sang ô tiếp theo
          document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
          nextPlotEl.classList.add('plot-target-active');

          // GIỮ CỐ ĐỊNH VỊ TRÍ MENU: Menu đứng yên tại chỗ để người chơi nhấp chuột liên tục không bị lệch nút!
          // Vẽ lại menu để cập nhật số lượng hạt giống / giá tiền và target sang ô mới
          this.renderCropPicker(nextPlot.id);
          return;
        }
      }

      // Nếu không còn ô đất trống nào nữa -> Đóng bảng chọn
      this.closeCropPicker();
      this.showToast(`Đã gieo hạt xong tất cả các ô đất! Hãy tưới nước để cây lớn nhanh 💧`, 'success');
    }

    showLevelUpModal(newLevel, rewardCoins, unlockNote) {
      sound.playLevelUp();
      document.getElementById('levelup-number').textContent = newLevel;
      document.getElementById('levelup-reward').textContent = rewardCoins > 0 ? `+${rewardCoins} 💰 Thưởng` : '';
      document.getElementById('levelup-note').textContent = unlockNote;
      this.dom.levelupModal.classList.remove('hidden');
    }
  }

  let ui = null;
  let farmInteractions = null;

  // 10. KHỞI CHẠY GAME
  document.addEventListener('DOMContentLoaded', () => {
    state.load();
    ui = new UIManager();

    const gridEl = document.getElementById('farm-grid');
    const renderer = new FarmRenderer(gridEl);
    renderer.renderInitial();
    ui.activeRenderer = renderer;
    window.farmRenderer = renderer;

    farmInteractions = new FarmInteractions(gridEl, renderer);
    window.farmInteractions = farmInteractions;

    state.subscribe((eventType, data) => {
      if (['COINS_CHANGED', 'EXP_CHANGED', 'SEEDS_BOUGHT', 'CROPS_SOLD', 'ALL_CROPS_SOLD', 'BARN_UPGRADED'].includes(eventType)) {
        ui.updateHUD();
      } else if (eventType === 'LEVEL_UP') {
        ui.showLevelUpModal(data.newLevel, data.rewardCoins, data.unlockNote);
        ui.updateHUD();
      } else if (eventType === 'CROP_MATURED') {
        renderer.updatePlotElement(data.plot);
        ui.updateActionBadges();
      } else if (eventType === 'PLOT_WATERED' || eventType === 'PLOT_PLANTED') {
        ui.updateActionBadges();
      }
    });

    setInterval(() => {
      state.tick(1);
      renderer.updateAll();
      ui.updateActionBadges();
      if (ui.activeCropInfoPlotId !== null) {
        const plot = state.plots.find(p => p.id === ui.activeCropInfoPlotId);
        if (plot && plot.cropId && (plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED' || plot.status === 'MATURE')) {
          ui.updateCropInfoContent(plot, CROPS[plot.cropId]);
        } else {
          ui.closeCropInfo();
        }
      }
    }, 1000);

    window.addEventListener('resize', () => {
      if (ui.activeCropInfoPlotId !== null && ui.activeCropInfoPlotEl) {
        ui.positionCropInfoPopup(ui.activeCropInfoPlotEl);
      }
      if (ui.activePlotId !== null && ui.activePlotEl) {
        ui.positionCropPicker(ui.activePlotEl);
      }
    });

    setInterval(() => {
      state.save();
    }, 5000);

    window.addEventListener('pointerdown', () => {
      sound.init();
    }, { once: true });
  });

})();

