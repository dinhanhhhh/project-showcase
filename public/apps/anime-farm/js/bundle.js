/* eslint-disable */
// =================================================================
// ANIME FARM 2.5D — GAMEPLAY ENGINE v2.0 (TỐI ƯU HÓA TOÀN DIỆN)
// - 6 SVG cây trồng riêng biệt (Lúa mì, Dưa leo, Cà tím, Ớt, Cà rốt, Bắp ngô)
// - Năng lượng thực 🍃 + Bón phân tăng tốc ⚡
// - Thời tiết động (Nắng / Mưa tự tưới / Cầu vồng thưởng)
// - Thu hoạch Vàng x2 + Chuỗi Combo + Tưới 1 chạm + Báo đơn hàng & mở đất
// =================================================================

(function() {
  'use strict';

  // 1. DỮ LIỆU CÂY TRỒNG (Cân bằng thời gian & lợi nhuận)
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
      sellPrice: 6,
      orderPrice: 10,
      expGain: 4,
      color: '#eab308',
      description: 'Lương thực cơ bản, lớn siêu nhanh; tưới nước rút ngắn 5 giây.'
    },
    cucumber: {
      id: 'cucumber',
      name: 'Dưa leo',
      icon: '🥒',
      seedIcon: '🌱',
      levelReq: 1,
      growTime: 18,
      waterBoost: 9,
      seedCost: 5,
      sellPrice: 14,
      orderPrice: 22,
      expGain: 8,
      color: '#22c55e',
      description: 'Dưa leo xanh giòn mát, tưới nước rút ngắn 9 giây.'
    },
    eggplant: {
      id: 'eggplant',
      name: 'Cà tím',
      icon: '🍆',
      seedIcon: '🌱',
      levelReq: 2,
      growTime: 34,
      waterBoost: 17,
      seedCost: 12,
      sellPrice: 34,
      orderPrice: 52,
      expGain: 16,
      color: '#9333ea',
      description: 'Quả cà tím căng bóng, tưới nước rút ngắn 17 giây.'
    },
    pepper: {
      id: 'pepper',
      name: 'Ớt đỏ',
      icon: '🌶️',
      seedIcon: '🌱',
      levelReq: 3,
      growTime: 56,
      waterBoost: 28,
      seedCost: 25,
      sellPrice: 72,
      orderPrice: 108,
      expGain: 30,
      color: '#ef4444',
      description: 'Ớt chín đỏ mọng, lợi nhuận cao; tưới nước rút ngắn 28 giây.'
    },
    carrot: {
      id: 'carrot',
      name: 'Cà rốt',
      icon: '🥕',
      seedIcon: '🌱',
      levelReq: 4,
      growTime: 90,
      waterBoost: 45,
      seedCost: 48,
      sellPrice: 140,
      orderPrice: 210,
      expGain: 58,
      color: '#f97316',
      description: 'Cà rốt giòn ngọt bổ dưỡng, tưới nước rút ngắn 45 giây.'
    },
    corn: {
      id: 'corn',
      name: 'Bắp ngô',
      icon: '🌽',
      seedIcon: '🌱',
      levelReq: 5,
      growTime: 150,
      waterBoost: 75,
      seedCost: 90,
      sellPrice: 285,
      orderPrice: 420,
      expGain: 115,
      color: '#fbbf24',
      description: 'Bắp ngô vàng rực cực phẩm, tưới nước rút ngắn 75 giây.'
    }
  };

  // 2. CẤP ĐỘ VÀ KINH NGHIỆM (Cân bằng mượt, mở khóa nhanh & có cảm giác tiến bộ rõ)
  const LEVELS = [
    { level: 1, expRequired: 0, rewardCoins: 0, unlockNote: 'Khởi đầu làm nông với Lúa mì & Dưa leo 🌱' },
    { level: 2, expRequired: 15, rewardCoins: 50, unlockNote: 'Mở khóa Cà tím 🍆 & Ô đất số 4 (30 💰)' },
    { level: 3, expRequired: 45, rewardCoins: 120, unlockNote: 'Mở khóa Ớt đỏ 🌶️ & Ô đất số 5 (60 💰)' },
    { level: 4, expRequired: 100, rewardCoins: 220, unlockNote: 'Mở khóa Cà rốt 🥕 & Ô đất số 6 (100 💰)' },
    { level: 5, expRequired: 190, rewardCoins: 400, unlockNote: 'Mở khóa Bắp ngô 🌽 & Ô đất số 7 (150 💰)' },
    { level: 6, expRequired: 320, rewardCoins: 650, unlockNote: 'Danh hiệu Phú Nông Làng Quê 🌾 & Ô đất số 8' },
    { level: 7, expRequired: 500, rewardCoins: 900, unlockNote: 'Danh hiệu Đại Địa Chủ Miền Tây 🏡' },
    { level: 8, expRequired: 750, rewardCoins: 1200, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 9 (Lv.8) 🚜' },
    { level: 9, expRequired: 1100, rewardCoins: 1600, unlockNote: 'Danh hiệu Nhà Đầu Tư Nông Nghiệp 🌟' },
    { level: 10, expRequired: 1550, rewardCoins: 2200, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 10 (Lv.10) 🌻' },
    { level: 11, expRequired: 2100, rewardCoins: 3000, unlockNote: 'Danh hiệu Triệu Phú Nông Thôn 💰' },
    { level: 12, expRequired: 2800, rewardCoins: 4000, unlockNote: 'Đủ điều kiện mở khóa Ô đất số 11 (Lv.12) 💎' },
    { level: 13, expRequired: 3600, rewardCoins: 5500, unlockNote: 'Mở khóa Ô đất số 12 — Cực Phẩm Cánh Đồng! 👑' },
    { level: 14, expRequired: 4600, rewardCoins: 7500, unlockNote: 'Danh hiệu: Huyền Thoại Nông Trại Anime ⭐' },
    { level: 15, expRequired: 6000, rewardCoins: 10000, unlockNote: 'Danh hiệu: Bậc Thầy Nông Nghiệp Vĩ Đại 🏆' }
  ];

  const WEATHER_TYPES = {
    sunny: {
      id: 'sunny',
      icon: '☀️',
      label: 'Nắng Đẹp',
      desc: 'Trời quang đãng, canh tác thuận lợi (Tưới nước x2 tốc độ lớn).',
      durationSec: 40
    },
    rain: {
      id: 'rain',
      icon: '🌦️',
      label: 'Mưa Rào',
      desc: 'Mưa rào mát mẻ — Tự động tưới mát mọi cây trồng đang khát nước!',
      durationSec: 22
    },
    rainbow: {
      id: 'rainbow',
      icon: '🌈',
      label: 'Cầu Vồng',
      desc: 'Hào quang Cầu Vồng: +50% EXP & Nhân đôi tỉ lệ Thu Hoạch Vàng (30%)!',
      durationSec: 22
    }
  };

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
    const expCurrentLevel = totalExp - currentLevel.expRequired;
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
      rewardCoins: currentLevel.rewardCoins,
      unlockNote: currentLevel.unlockNote,
      currentLevel,
      nextLevel
    };
  }

  function getRemainingRealSeconds(plot) {
    if (!plot || !plot.growDuration) return 0;
    const speed = plot.isWatered ? 1.0 : 0.5;
    return Math.max(0, Math.ceil((plot.growDuration - plot.elapsedSeconds) / speed));
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

    playPlant() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(490, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
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
        gain.gain.setValueAtTime(0.14, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    }

    playHarvest(comboStep = 0) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const pitchMult = Math.pow(2, Math.min(comboStep, 6) / 12);
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * pitchMult, now + idx * 0.045);
        gain.gain.setValueAtTime(0.16, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.15);
      });
    }

    playBoost() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.16, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.04 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.2);
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
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.07 + 0.24);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
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
        gain.gain.setValueAtTime(0.24, now + idx * 0.1);
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
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  const sound = new SoundSystem();

  // 4. GAME STATE MANAGEMENT
  const STORAGE_KEY = 'FAM_FARM_GAME_SAVE_V6_3PLOTS';

  try {
    ['FAM_FARM_GAME_SAVE_V1', 'FAM_FARM_GAME_SAVE_V2', 'FAM_FARM_GAME_SAVE_V3', 'FAM_FARM_GAME_SAVE_V4_FRESH', 'FAM_FARM_GAME_SAVE_V5_TILLED'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch (e) {}

  class GameState {
    constructor() {
      this.coins = 100;
      this.exp = 0;
      this.energy = 100;
      this.maxEnergy = 100;
      this.energyTickCounter = 0;
      this.barnCapacity = 60;
      this.selectedTool = 'seed';
      this.selectedSeed = 'wheat';
      this.weather = 'sunny';
      this.weatherTimeLeft = WEATHER_TYPES.sunny.durationSec;
      this.harvestCombo = 0;
      this.lastHarvestAt = 0;
      this.lastSavedAt = Date.now();
      this.plots = [];
      this.inventory = {
        seeds: { wheat: 6, cucumber: 4, eggplant: 0, pepper: 0, carrot: 0, corn: 0 },
        crops: { wheat: 0, cucumber: 0, eggplant: 0, pepper: 0, carrot: 0, corn: 0 }
      };
      this.stats = {
        totalHarvests: 0,
        totalEarned: 0,
        ordersCompleted: 0,
        goldenHarvests: 0
      };
      this.listeners = [];
      this.initDefaultPlots();
    }

    initDefaultPlots() {
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
    getWeatherData() { return WEATHER_TYPES[this.weather] || WEATHER_TYPES.sunny; }

    getBarnUsage() {
      let total = 0;
      for (const k in this.inventory.crops) total += this.inventory.crops[k] || 0;
      return total;
    }

    addEnergy(amount) {
      const next = Math.max(0, Math.min(this.maxEnergy, Math.round(this.energy + amount)));
      if (next !== this.energy) {
        this.energy = next;
        this.notify('ENERGY_CHANGED', { current: this.energy, max: this.maxEnergy });
      }
    }

    addCoins(amount) {
      this.coins = Math.max(0, this.coins + amount);
      if (amount > 0) this.stats.totalEarned = (this.stats.totalEarned || 0) + amount;
      this.notify('COINS_CHANGED', { amount, current: this.coins });
      this.save();
    }

    addExp(amount) {
      const prev = this.getLevelData().level;
      this.exp += amount;
      const cur = this.getLevelData();
      this.notify('EXP_CHANGED', { amount, current: this.exp, levelData: cur });
      if (cur.level > prev) {
        let totalRewardCoins = 0;
        for (let lv = prev + 1; lv <= cur.level; lv++) {
          const lvDef = LEVELS.find(item => item.level === lv);
          if (lvDef && lvDef.rewardCoins > 0) totalRewardCoins += lvDef.rewardCoins;
        }
        this.notify('LEVEL_UP', {
          newLevel: cur.level,
          rewardCoins: totalRewardCoins,
          unlockNote: cur.unlockNote
        });
        if (totalRewardCoins > 0) this.addCoins(totalRewardCoins);
      }
      this.save();
    }

    unlockPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'LOCKED') return { success: false, reason: 'INVALID' };
      const userLvl = this.getLevelData().level;
      if (userLvl < (plot.reqLevel || 2)) return { success: false, reason: 'LEVEL_LOCKED' };
      if (this.coins < plot.unlockCost) return { success: false, reason: 'NOT_ENOUGH_COINS' };
      this.addCoins(-plot.unlockCost);
      plot.status = 'TILLED';
      this.notify('PLOT_UNLOCKED', { plot });
      this.save();
      return { success: true };
    }

    plantSeed(plotId, cropId = this.selectedSeed) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'TILLED') return { success: false };
      const crop = CROPS[cropId];
      if (!crop) return { success: false };
      if (this.getLevelData().level < crop.levelReq) return { success: false, reason: 'LEVEL_LOCKED', levelReq: crop.levelReq };
      if ((this.inventory.seeds[cropId] || 0) <= 0) return { success: false, reason: 'NO_SEEDS' };

      this.inventory.seeds[cropId]--;
      plot.cropId = cropId;
      plot.growDuration = crop.growTime;
      plot.elapsedSeconds = 0;
      plot.growthProgress = 0;
      // Nếu đang có Mưa Rào -> tự động ẩm mượt ngay khi gieo!
      if (this.weather === 'rain') {
        plot.isWatered = true;
        plot.status = 'PLANTED_WATERED';
      } else {
        plot.isWatered = false;
        plot.status = 'PLANTED_DRY';
      }
      this.notify('PLOT_PLANTED', { plot, crop });
      this.save();
      return { success: true, crop, autoWatered: this.weather === 'rain' };
    }

    waterPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
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

    fertilizePlot(plotId, energyCost = 8, progressBoostRatio = 0.5) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || !plot.cropId || (plot.status !== 'PLANTED_DRY' && plot.status !== 'PLANTED_WATERED')) {
        return { success: false, reason: 'NOT_GROWING' };
      }
      if (this.energy < energyCost) {
        return { success: false, reason: 'NOT_ENOUGH_ENERGY', needed: energyCost };
      }

      this.addEnergy(-energyCost);
      const boostSec = Math.max(4, Math.round(plot.growDuration * progressBoostRatio));
      plot.elapsedSeconds = Math.min(plot.growDuration, plot.elapsedSeconds + boostSec);
      plot.growthProgress = Math.min(100, (plot.elapsedSeconds / plot.growDuration) * 100);
      plot.isWatered = true;

      if (plot.elapsedSeconds >= plot.growDuration) {
        plot.status = 'MATURE';
        plot.growthProgress = 100;
        this.notify('CROP_MATURED', { plot });
      } else {
        plot.status = 'PLANTED_WATERED';
      }

      this.save();
      return { success: true, plot, boostSec, matured: plot.status === 'MATURE' };
    }

    fertilizeAll(energyCost = 20, progressBoostRatio = 0.4) {
      const growing = this.plots.filter(p => (p.status === 'PLANTED_DRY' || p.status === 'PLANTED_WATERED') && p.cropId);
      if (growing.length === 0) {
        return { success: false, reason: 'NO_GROWING_CROPS' };
      }
      if (this.energy < energyCost) {
        return { success: false, reason: 'NOT_ENOUGH_ENERGY', needed: energyCost };
      }

      this.addEnergy(-energyCost);
      let maturedCount = 0;
      growing.forEach(plot => {
        const boostSec = Math.max(4, Math.round(plot.growDuration * progressBoostRatio));
        plot.elapsedSeconds = Math.min(plot.growDuration, plot.elapsedSeconds + boostSec);
        plot.growthProgress = Math.min(100, (plot.elapsedSeconds / plot.growDuration) * 100);
        plot.isWatered = true;
        if (plot.elapsedSeconds >= plot.growDuration) {
          plot.status = 'MATURE';
          plot.growthProgress = 100;
          maturedCount++;
          this.notify('CROP_MATURED', { plot });
        } else {
          plot.status = 'PLANTED_WATERED';
        }
      });

      this.save();
      return { success: true, affectedPlots: growing, maturedCount };
    }

    harvestPlot(plotId) {
      const plot = this.plots.find(p => p.id === plotId);
      if (!plot || plot.status !== 'MATURE') return null;
      const crop = CROPS[plot.cropId];
      if (!crop) return null;
      const barnFree = this.barnCapacity - this.getBarnUsage();
      if (barnFree <= 0) return { success: false, reason: 'BARN_FULL' };

      // Combo thu hoạch liên tiếp trong vòng 4.5 giây
      const now = Date.now();
      if (now - this.lastHarvestAt <= 4500) {
        this.harvestCombo = Math.min(10, this.harvestCombo + 1);
      } else {
        this.harvestCombo = 1;
      }
      this.lastHarvestAt = now;

      // Cơ chế Thu Hoạch Vàng (15% bình thường, 30% khi trời Cầu Vồng)
      const goldenChance = this.weather === 'rainbow' ? 0.30 : 0.15;
      const isGolden = Math.random() < goldenChance;
      const yieldCount = isGolden && barnFree >= 2 ? 2 : 1;
      const bonusGold = isGolden ? crop.sellPrice : 0;

      // Tính EXP gồm bonus Cầu Vồng (+50%) & Combo (+10%/step tối đa +50%)
      const weatherExpMult = this.weather === 'rainbow' ? 1.5 : 1.0;
      const comboExpMult = 1 + Math.min(5, Math.max(0, this.harvestCombo - 1)) * 0.1;
      const earnedExp = Math.max(1, Math.round(crop.expGain * weatherExpMult * comboExpMult));

      this.inventory.crops[crop.id] = (this.inventory.crops[crop.id] || 0) + yieldCount;
      this.stats.totalHarvests = (this.stats.totalHarvests || 0) + yieldCount;
      if (isGolden) {
        this.stats.goldenHarvests = (this.stats.goldenHarvests || 0) + 1;
        this.addCoins(bonusGold);
      }

      // Thu hoạch giúp hồi +4 Năng lượng lá xanh
      this.addEnergy(4);
      this.addExp(earnedExp);

      const harvestedCrop = { ...crop };
      plot.status = 'TILLED';
      plot.cropId = null;
      plot.growthProgress = 0;
      plot.elapsedSeconds = 0;
      plot.isWatered = false;
      this.notify('PLOT_HARVESTED', { plot, crop: harvestedCrop, isGolden, yieldCount, bonusGold, earnedExp });
      this.save();
      return {
        success: true,
        crop: harvestedCrop,
        isGolden,
        yieldCount,
        bonusGold,
        earnedExp,
        combo: this.harvestCombo
      };
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

    advanceWeather() {
      let nextWeather = 'sunny';
      if (this.weather === 'sunny') {
        nextWeather = Math.random() < 0.55 ? 'rain' : 'rainbow';
      } else {
        nextWeather = 'sunny';
      }
      this.weather = nextWeather;
      this.weatherTimeLeft = WEATHER_TYPES[nextWeather].durationSec;
      this.notify('WEATHER_CHANGED', { weather: WEATHER_TYPES[nextWeather] });

      // Khi chuyển sang Mưa Rào -> tự động tưới miễn phí mọi cây đang khô!
      if (nextWeather === 'rain') {
        const dryPlots = this.plots.filter(p => p.status === 'PLANTED_DRY' && p.cropId && !p.isWatered);
        dryPlots.forEach(p => {
          this.waterPlot(p.id);
        });
        if (dryPlots.length > 0) {
          this.notify('RAIN_AUTO_WATERED', { count: dryPlots.length, plots: dryPlots });
        }
      }
    }

    tick(seconds = 1) {
      // 1. Hồi năng lượng tự nhiên (+1 mỗi 2 giây)
      this.energyTickCounter += seconds;
      if (this.energyTickCounter >= 2) {
        const regen = Math.floor(this.energyTickCounter / 2);
        this.energyTickCounter %= 2;
        if (this.energy < this.maxEnergy) {
          this.addEnergy(regen);
        }
      }

      // 2. Thời tiết động
      this.weatherTimeLeft -= seconds;
      if (this.weatherTimeLeft <= 0) {
        this.advanceWeather();
      }

      // 3. Tiến độ lớn của từng cây
      let changed = false;
      this.plots.forEach(plot => {
        if ((plot.status === 'PLANTED_WATERED' || plot.status === 'PLANTED_DRY') && plot.cropId) {
          if (this.weather === 'rain' && plot.status === 'PLANTED_DRY') {
            this.waterPlot(plot.id);
            changed = true;
            return;
          }
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
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, reason: 'INVALID_QUANTITY' };
      }
      const crop = CROPS[cropId];
      if (!crop) return { success: false };
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
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, reason: 'INVALID_QUANTITY' };
      }
      const available = this.inventory.crops[cropId] || 0;
      if (available < quantity) return { success: false };
      const crop = CROPS[cropId];
      if (!crop) return { success: false };
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
      const cost = Math.round(this.barnCapacity * 3);
      if (this.coins < cost) return { success: false, reason: 'NOT_ENOUGH_COINS' };
      this.addCoins(-cost);
      this.barnCapacity += 30;
      this.notify('BARN_UPGRADED', { newCapacity: this.barnCapacity });
      this.save();
      return { success: true, newCapacity: this.barnCapacity, cost };
    }

    resetFarm() {
      this.coins = 100;
      this.exp = 0;
      this.energy = 100;
      this.barnCapacity = 60;
      this.selectedTool = 'seed';
      this.selectedSeed = 'wheat';
      this.weather = 'sunny';
      this.weatherTimeLeft = WEATHER_TYPES.sunny.durationSec;
      this.harvestCombo = 0;
      this.inventory = {
        seeds: { wheat: 6, cucumber: 4, eggplant: 0, pepper: 0, carrot: 0, corn: 0 },
        crops: { wheat: 0, cucumber: 0, eggplant: 0, pepper: 0, carrot: 0, corn: 0 }
      };
      this.stats = { totalHarvests: 0, totalEarned: 0, ordersCompleted: 0, goldenHarvests: 0 };
      this.initDefaultPlots();
      this.save();
    }

    save() {
      try {
        this.lastSavedAt = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          coins: this.coins,
          exp: this.exp,
          energy: this.energy,
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
        this.coins = typeof data.coins === 'number' ? data.coins : 100;
        this.exp = typeof data.exp === 'number' ? data.exp : 0;
        this.energy = typeof data.energy === 'number' ? Math.max(0, Math.min(this.maxEnergy, data.energy)) : 100;
        this.barnCapacity = data.barnCapacity || 60;
        this.selectedTool = data.selectedTool || 'seed';
        this.selectedSeed = data.selectedSeed || 'wheat';
        if (data.inventory) {
          this.inventory.seeds = { ...this.inventory.seeds, ...(data.inventory.seeds || {}) };
          this.inventory.crops = { ...this.inventory.crops, ...(data.inventory.crops || {}) };
        }
        if (data.stats) {
          this.stats = {
            totalHarvests: data.stats.totalHarvests || data.stats.totalHarvested || 0,
            totalEarned: data.stats.totalEarned || 0,
            ordersCompleted: data.stats.ordersCompleted || 0,
            goldenHarvests: data.stats.goldenHarvests || 0
          };
        }
        if (Array.isArray(data.plots) && data.plots.length === 12) {
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
          this.energy = Math.min(this.maxEnergy, this.energy + Math.floor(diff / 2));
          this.plots.forEach(plot => {
            if ((plot.status === 'PLANTED_WATERED' || plot.status === 'PLANTED_DRY') && plot.cropId) {
              const speed = plot.isWatered ? 1.0 : 0.5;
              plot.elapsedSeconds += diff * speed;
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

  // 5. SPRITE PNG VẼ TAY STUDIO GHIBLI TÁCH NỀN TRONG SUỐT CHO TOÀN BỘ 8 GIAI ĐOẠN CÂY TRỒNG
  function getPlantSvg(cropId, progress = 100) {
    if (progress < 25) {
      return `<img src="assets/crops/sprout.png" alt="Mầm non" class="plant-sprite-img stage-sprout" draggable="false" />`;
    }
    if (progress < 65) {
      return `<img src="assets/crops/growing.png" alt="Cây đang lớn" class="plant-sprite-img stage-growing" draggable="false" />`;
    }

    const matureKey = ['wheat', 'cucumber', 'eggplant', 'pepper', 'carrot', 'corn'].includes(cropId)
      ? cropId
      : 'wheat';
    const altLabel = (CROPS[matureKey] && CROPS[matureKey].name) ? CROPS[matureKey].name : 'Cây trồng';
    return `<img src="assets/crops/${matureKey}.png" alt="${altLabel}" class="plant-sprite-img plant-${matureKey}" draggable="false" />`;
  }

  // 6. FARM RENDERER
  class FarmRenderer {
    constructor(gridElement) {
      this.gridElement = gridElement;
      this.plotElements = new Map();
      this.badgeElements = new Map();
    }

    renderInitial() {
      this.gridElement.innerHTML = '';
      this.plotElements.clear();
      this.badgeElements.clear();

      const TILE_W = 116;
      const TILE_H = 58;
      const HALF_W = TILE_W / 2;
      const HALF_H = TILE_H / 2;
      const ORIGIN_X = 2 * HALF_W;
      const ORIGIN_Y = 0;

      const badgeLayer = document.createElement('div');
      badgeLayer.id = 'farm-badge-layer';
      badgeLayer.className = 'farm-badge-layer';

      state.plots.forEach(plot => {
        const plotEl = document.createElement('div');
        plotEl.className = 'farm-plot';
        plotEl.dataset.plotId = plot.id;
        plotEl.setAttribute('role', 'button');
        plotEl.setAttribute('tabindex', '0');

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
            <svg class="plot-diamond-svg" viewBox="0 0 116 64" width="116" height="64">
              <polygon class="plot-side-left" points="4,29 58,54 58,61 4,36" />
              <polygon class="plot-side-right" points="112,29 58,54 58,61 112,36" />
              <polygon class="plot-ridge" points="58,4 112,29 58,54 4,29" />
              <polygon class="plot-trough" points="58,8 104,29 58,50 12,29" />
              <polyline class="plot-sun-rim" points="7,28 58,5 109,28" />
              <polygon class="plot-trough-groove" points="58,10 100,29 58,48 16,29" fill="none" />
            </svg>
          </div>
          <div class="plot-billboard-container">
            <div class="plot-content"></div>
          </div>
        `;

        this.gridElement.appendChild(plotEl);
        this.plotElements.set(plot.id, plotEl);

        const badgeSlot = document.createElement('div');
        badgeSlot.className = 'plot-badge-slot';
        badgeSlot.dataset.plotId = plot.id;
        badgeSlot.style.left = `${x + HALF_W}px`;
        badgeSlot.style.top = `${y + 38}px`;
        badgeSlot.innerHTML = `
          <div class="plot-timer-badge hidden" data-plot-id="${plot.id}">
            <span class="timer-text">00:00</span>
          </div>
          <div class="iso-harvest-badge hidden" data-plot-id="${plot.id}" title="Chạm hoặc vuốt để thu hoạch!">
            <span>🌾 Gặt</span>
          </div>
        `;
        badgeLayer.appendChild(badgeSlot);
        this.badgeElements.set(plot.id, badgeSlot);
      });

      this.gridElement.appendChild(badgeLayer);
      state.plots.forEach(plot => this.updatePlotElement(plot));
    }

    updatePlotElement(plot, plotEl = this.plotElements.get(plot.id)) {
      if (!plotEl) return;
      const contentEl = plotEl.querySelector('.plot-content');
      const badgeSlot = this.badgeElements.get(plot.id);
      const timerBadge = badgeSlot ? badgeSlot.querySelector('.plot-timer-badge') : null;
      const timerText = timerBadge ? timerBadge.querySelector('.timer-text') : null;
      const harvestBadge = badgeSlot ? badgeSlot.querySelector('.iso-harvest-badge') : null;

      const userLvl = state.getLevelData().level;
      const canUnlockLvl = plot.status === 'LOCKED' && userLvl >= (plot.reqLevel || 2);
      const canUnlockCoins = canUnlockLvl && state.coins >= (plot.unlockCost || 0);
      const progressBucket = plot.growthProgress >= 65 ? 2 : plot.growthProgress >= 25 ? 1 : 0;
      const visualKey = `${plot.status}_${plot.cropId}_${plot.isWatered}_${progressBucket}_${canUnlockLvl}_${canUnlockCoins}`;

      if (plotEl._cachedVisualKey !== visualKey) {
        plotEl._cachedVisualKey = visualKey;
        plotEl.className = `farm-plot status-${plot.status.toLowerCase()} ${plot.isWatered ? 'is-watered' : ''}`;

        switch (plot.status) {
          case 'LOCKED': {
            if (canUnlockCoins) {
              contentEl.innerHTML = `<div class="plot-lock-sign unlockable unlockable-ready"><span>🔓 Mở ${plot.unlockCost}💰</span></div>`;
              plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: Sẵn sàng mở khóa với ${plot.unlockCost} vàng`);
            } else if (canUnlockLvl) {
              contentEl.innerHTML = `<div class="plot-lock-sign unlockable"><span>🔓 ${plot.unlockCost}💰</span></div>`;
              plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: Cần ${plot.unlockCost} vàng để mở`);
            } else {
              contentEl.innerHTML = `<div class="plot-lock-sign"><span>🔒 Lv.${plot.reqLevel}</span></div>`;
              plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: Khóa, cần cấp ${plot.reqLevel}`);
            }
            break;
          }

          case 'RAW':
            contentEl.innerHTML = '<div class="plot-wild-grass"><span class="grass-tuft">🌱</span></div>';
            plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: Đất hoang`);
            break;

          case 'TILLED':
            contentEl.innerHTML = '<div class="plot-tilled-empty"></div>';
            plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: Đất trống, chạm để gieo hạt`);
            break;

          case 'PLANTED_DRY':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-thirsty">
                ${getPlantSvg(plot.cropId, Math.max(15, plot.growthProgress || 15))}
              </div>
            `;
            plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: ${CROPS[plot.cropId]?.name || 'Cây'} đang cần tưới`);
            break;

          case 'PLANTED_WATERED':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-growing-glow">
                ${getPlantSvg(plot.cropId, Math.max(25, plot.growthProgress || 25))}
              </div>
            `;
            plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: ${CROPS[plot.cropId]?.name || 'Cây'} đang lớn`);
            break;

          case 'MATURE':
            contentEl.innerHTML = `
              <div class="plant-billboard plant-mature crop-ready-bounce">
                <div class="mature-sun-glow"></div>
                ${getPlantSvg(plot.cropId, 100)}
                <div class="plant-sparkles-cluster">
                  <span class="sparkle s1">✨</span>
                  <span class="sparkle s2">🌸</span>
                  <span class="sparkle s3">✨</span>
                  <span class="sparkle s4">⭐</span>
                </div>
              </div>
            `;
            plotEl.setAttribute('aria-label', `Ô đất ${plot.id + 1}: ${CROPS[plot.cropId]?.name || 'Cây'} đã chín, chạm để thu hoạch`);
            break;
        }
      }

      if (plot.status === 'MATURE') {
        if (harvestBadge) harvestBadge.classList.remove('hidden');
        if (timerBadge) {
          timerBadge.classList.add('hidden');
          timerBadge.classList.remove('is-thirsty');
        }
      } else if (plot.status === 'PLANTED_WATERED' || plot.status === 'PLANTED_DRY') {
        if (harvestBadge) harvestBadge.classList.add('hidden');
        if (timerBadge && timerText) {
          const isDry = plot.status === 'PLANTED_DRY';
          const rem = getRemainingRealSeconds(plot);
          const mins = Math.floor(rem / 60);
          const secs = rem % 60;
          const speedTag = isDry ? '🚿' : '⏳';
          timerText.textContent = `${speedTag} ${mins > 0 ? mins + 'p' : ''}${secs < 10 && mins > 0 ? '0' : ''}${secs}s`;
          timerBadge.classList.toggle('is-thirsty', isDry);
          timerBadge.title = isDry ? 'Chạm để tưới nước ngay!' : 'Đang lớn (x2 tốc độ)';
          timerBadge.classList.remove('hidden');
        }
      } else {
        if (harvestBadge) harvestBadge.classList.add('hidden');
        if (timerBadge) {
          timerBadge.classList.add('hidden');
          timerBadge.classList.remove('is-thirsty');
        }
      }
    }

    updateAll() {
      state.plots.forEach(plot => this.updatePlotElement(plot));
    }
  }

  // 7. BẢNG ĐƠN HÀNG THỊ TRẤN
  const ORDERS_STORAGE_KEY = 'FAM_ORDERS_SAVE_V4';
  const CUSTOMERS = [
    { name: 'Bác Ba Nông Dân', avatar: '👨‍🌾', dialog: 'Bác cần nông sản tươi đem bán phiên chợ sớm làng mình!' },
    { name: 'Chị Lan Tiệm Bánh', avatar: '👩‍🍳', dialog: 'Tiệm bánh ngọt đang cần thêm nguyên liệu tươi ngon.' },
    { name: 'Khách Sạn Mùa Hè', avatar: '🏨', dialog: 'Đơn hàng cao cấp cho các đoàn khách du lịch ghé thăm.' },
    { name: 'Bé Mây Quán Trà', avatar: '🧋', dialog: 'Quán nhỏ cần nông sản sạch làm thực đơn cuối tuần!' }
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
      const count = Math.min(unlocked.length, Math.random() > 0.45 ? 2 : 1);
      const shuffled = [...unlocked].sort(() => 0.5 - Math.random());
      const items = [];
      let totalCoins = 0;
      let totalExp = 0;

      for (let i = 0; i < count; i++) {
        const crop = shuffled[i];
        const qty = Math.max(1, Math.min(4, Math.floor(4 / crop.levelReq) + Math.floor(Math.random() * 2)));
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

    getDeliverableCount() {
      return this.orders.filter(o => this.canCompleteOrder(o)).length;
    }

    completeOrder(orderId) {
      const idx = this.orders.findIndex(o => o.id === orderId);
      if (idx === -1) return { success: false };
      const order = this.orders[idx];
      if (!this.canCompleteOrder(order)) return { success: false, reason: 'NOT_ENOUGH_ITEMS' };

      order.items.forEach(item => { state.inventory.crops[item.cropId] -= item.quantity; });
      state.stats.ordersCompleted = (state.stats.ordersCompleted || 0) + 1;
      state.addCoins(order.rewardCoins);
      state.addExp(order.rewardExp);
      state.addEnergy(12);
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

  // 8. TƯƠNG TÁC CHUỘT & CẢM ỨNG 1 CHẠM + VUỐT HÀNG LOẠT
  class FarmInteractions {
    constructor(gridElement, renderer) {
      this.gridElement = gridElement;
      this.renderer = renderer;
      this.isDown = false;
      this.lastPlotId = null;
      this.quickSeedId = state.selectedSeed || 'wheat';
      this.bindEvents();
    }

    getClosestPlot(x, y) {
      const plots = this.gridElement.querySelectorAll('.farm-plot');
      let closest = null;
      let bestScore = Infinity;

      plots.forEach(plot => {
        const rect = plot.getBoundingClientRect();
        const halfW = rect.width / 2 || 58;
        const halfH = rect.height / 2 || 29;
        const centerX = rect.left + halfW;
        const centerY = rect.top + halfH;
        // Khoảng cách chuẩn hình thoi isometric: <= 1.0 là nằm trọn trong ô đất
        const diamondDist = Math.abs(x - centerX) / halfW + Math.abs(y - centerY) / halfH;
        if (diamondDist < bestScore && diamondDist <= 1.35) {
          bestScore = diamondDist;
          closest = plot;
        }
      });

      return closest;
    }

    bindEvents() {
      this.gridElement.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const plotEl = e.target.closest('.farm-plot');
        if (!plotEl) return;
        e.preventDefault();
        const plotId = parseInt(plotEl.dataset.plotId, 10);
        if (!isNaN(plotId)) this.handleClickPlot(plotId, plotEl);
      });

      this.gridElement.addEventListener('pointerdown', (e) => {
        if (e.target.closest('#plot-crop-popup') || e.target.closest('#crop-info-popup')) return;

        this.isDown = true;
        this.isDragging = false;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const badgeTarget = e.target.closest('.plot-timer-badge[data-plot-id], .iso-harvest-badge[data-plot-id]');
        let plotEl = badgeTarget
          ? this.renderer.plotElements.get(parseInt(badgeTarget.dataset.plotId, 10))
          : e.target.closest('.farm-plot');
        if (!plotEl) {
          plotEl = this.getClosestPlot(e.clientX, e.clientY);
        }
        if (plotEl) {
          const plotId = parseInt(plotEl.dataset.plotId, 10);
          this.startPlotId = plotId;
          this.lastPlotId = plotId;
          this.handleClickPlot(plotId, plotEl);
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (!this.isDown) return;
        const dist = Math.hypot(e.clientX - this.startX, e.clientY - this.startY);
        if (dist > 12) this.isDragging = true;
        if (!this.isDragging) return;

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const badgeTarget = el ? el.closest('.plot-timer-badge[data-plot-id], .iso-harvest-badge[data-plot-id]') : null;
        let plotEl = badgeTarget
          ? this.renderer.plotElements.get(parseInt(badgeTarget.dataset.plotId, 10))
          : (el ? el.closest('.farm-plot') : null);
        if (!plotEl && el && (el.closest('.farm-grid') || el.closest('.farm-lawn-plateau'))) {
          plotEl = this.getClosestPlot(e.clientX, e.clientY);
        }
        if (!plotEl) return;
        const plotId = parseInt(plotEl.dataset.plotId, 10);
        if (isNaN(plotId) || this.lastPlotId === plotId) return;
        this.lastPlotId = plotId;

        this.handleQuickSwipe(plotId, plotEl);
      });

      const stopDrag = () => {
        this.isDown = false;
        this.isDragging = false;
        this.startPlotId = null;
        this.lastPlotId = null;
      };
      window.addEventListener('pointerup', stopDrag);
      window.addEventListener('pointercancel', stopDrag);
    }

    plantCropDirectly(plotId, plotEl, cropId) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot || (plot.status !== 'TILLED' && plot.status !== 'RAW')) return false;
      if (plot.status === 'RAW') plot.status = 'TILLED';

      const userLvl = state.getLevelData().level;
      let crop = CROPS[cropId];
      if (!crop || userLvl < crop.levelReq) {
        crop = CROPS.wheat;
        cropId = 'wheat';
      }
      if (!crop) return false;

      const count = state.inventory.seeds[cropId] || 0;
      if (count <= 0) {
        if (state.coins >= crop.seedCost) {
          state.addCoins(-crop.seedCost);
          state.inventory.seeds[cropId] = 1;
          if (ui) ui.showFloatingText(plotEl, `-${crop.seedCost} 💰`, 'cost');
        } else {
          sound.playClick();
          if (ui) {
            ui.showToast(`Hết tiền mua thêm hạt ${crop.name}!`, 'warning');
          }
          return false;
        }
      }

      state.selectedSeed = cropId;
      const res = state.plantSeed(plotId, cropId);
      if (res && res.success) {
        sound.playPlant();
        if (ui) ui.showFloatingText(plotEl, res.autoWatered ? `🌱+💧` : `-1 🌱`, 'seed');
        this.renderer.updatePlotElement(plot);
        if (ui) {
          ui.updateHUD();
          ui.updateActionBadges();
        }
        return true;
      }
      return false;
    }

    handleHarvestFeedback(plot, plotEl, res) {
      sound.playHarvest(res.combo - 1);
      if (res.isGolden) {
        sound.playCoin();
      }
      if (ui) {
        if (res.isGolden) {
          ui.showFloatingText(plotEl, `🌟 +${res.yieldCount} ${res.crop.icon} +${res.bonusGold}💰`, 'golden');
          ui.showToast(`🌟 THU HOẠCH VÀNG! Nhận x${res.yieldCount} ${res.crop.name} & thưởng +${res.bonusGold} 💰!`, 'success');
        } else {
          const comboTag = res.combo >= 3 ? ` (x${res.combo}🔥)` : '';
          ui.showFloatingText(plotEl, `+1 ${res.crop.icon}${comboTag}`, 'crop');
        }
        ui.showFloatingText(plotEl, `+${res.earnedExp} EXP ✨`, 'exp', 22);
        ui.updateHUD();
        ui.updateActionBadges();
      }
      this.renderer.updatePlotElement(plot);
    }

    handleClickPlot(plotId, plotEl) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot) return;

      // 0. CHẾ ĐỘ ĐÀO CÂY
      if (state.selectedTool === 'dig') {
        if (plot.cropId && (plot.status === 'PLANTED_DRY' || plot.status === 'PLANTED_WATERED' || plot.status === 'MATURE')) {
          const res = state.digPlot(plotId);
          if (res && res.success) {
            sound.playClick();
            if (ui) {
              ui.createDirtParticles(plotEl);
              ui.showFloatingText(plotEl, '⛏️ Đã đào cây', 'cost');
              ui.showToast(`Đã đào bỏ ${res.crop.name}! Đất sẵn sàng trồng mới 🌱`, 'info');
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
          if (ui) {
            ui.showLockedSignpost(plotId, plotEl, reqLvl);
            ui.showToast(`Cần đạt Cấp ${reqLvl} (và ${plot.unlockCost} 💰) để mở ô đất này!`, 'warning');
          }
          return;
        }
        if (state.coins >= plot.unlockCost) {
          const res = state.unlockPlot(plotId);
          if (res.success) {
            sound.playCoin();
            if (ui) {
              ui.createDirtParticles(plotEl);
              ui.showFloatingText(plotEl, `-${plot.unlockCost} 💰`, 'cost');
              ui.showToast(`🎉 Đã mở khóa ô đất số ${plotId + 1}!`, 'success');
              ui.updateHUD();
            }
            this.renderer.updatePlotElement(plot);
            setTimeout(() => {
              if (ui) ui.openCropPicker(plotId, plotEl, this.renderer);
            }, 220);
          }
        } else {
          sound.playClick();
          if (ui) ui.showToast(`Cần ${plot.unlockCost} vàng để mở ô đất số ${plotId + 1} (còn thiếu ${plot.unlockCost - state.coins} 💰)!`, 'warning');
        }
        return;
      }

      // 2. CÂY ĐÃ CHÍN -> THU HOẠCH NGAY 1 CHẠM
      if (plot.status === 'MATURE') {
        const res = state.harvestPlot(plotId);
        if (res && res.success) {
          this.handleHarvestFeedback(plot, plotEl, res);
        } else if (res && res.reason === 'BARN_FULL') {
          sound.playClick();
          if (ui) ui.showToast('Nhà kho đã đầy! Hãy giao Đơn Hàng hoặc bán bớt nông sản.', 'warning');
        }
        return;
      }

      // 3. CÂY ĐANG KHÁT NƯỚC (PLANTED_DRY) -> TƯỚI NGAY 1 CHẠM (Không bắt mở popup 2 bước!)
      if (plot.status === 'PLANTED_DRY') {
        const res = state.waterPlot(plotId);
        if (res && res.success) {
          sound.playWater();
          if (ui) {
            ui.createWaterSplashes(plotEl);
            ui.showFloatingText(plotEl, `-${res.boostSeconds}s 💧`, 'water');
            ui.updateHUD();
            ui.updateActionBadges();
          }
          this.renderer.updatePlotElement(plot);
        }
        return;
      }

      // 4. CÂY ĐANG LỚN XANH TỐT (PLANTED_WATERED) -> Mở bảng thông tin chi tiết & nút Bón phân
      if (plot.status === 'PLANTED_WATERED') {
        if (ui) {
          ui.closeCropPicker();
          ui.openCropInfo(plotId, plotEl);
        }
        return;
      }

      // 5. Ô ĐẤT TRỐNG -> Mở menu chọn cây trồng
      if (plot.status === 'TILLED' || plot.status === 'RAW') {
        if (plot.status === 'RAW') {
          plot.status = 'TILLED';
          this.renderer.updatePlotElement(plot);
        }
        if (ui) {
          ui.closeCropInfo();
          ui.openCropPicker(plotId, plotEl, this.renderer);
        }
      }
    }

    handleQuickSwipe(plotId, plotEl) {
      const plot = state.plots.find(p => p.id === plotId);
      if (!plot) return;

      if (state.selectedTool === 'dig') {
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

      if (plot.status === 'MATURE') {
        const res = state.harvestPlot(plotId);
        if (res && res.success) {
          this.handleHarvestFeedback(plot, plotEl, res);
        }
        return;
      }

      if (plot.status === 'PLANTED_DRY') {
        const res = state.waterPlot(plotId);
        if (res && res.success) {
          sound.playWater();
          if (ui) {
            ui.createWaterSplashes(plotEl);
            ui.showFloatingText(plotEl, `-${res.boostSeconds}s 💧`, 'water');
            ui.updateActionBadges();
          }
          this.renderer.updatePlotElement(plot);
        }
        return;
      }

      if (state.selectedTool === 'seed' && (plot.status === 'TILLED' || plot.status === 'RAW')) {
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
      this.isBatchBusy = false;

      this.dom = {
        coinsCount: document.getElementById('hud-coins'),
        barnIndicator: document.getElementById('hud-barn-count'),
        expProgress: document.getElementById('hud-exp-progress'),
        energyVal: document.getElementById('hud-energy-val'),
        btnEnergyBoost: document.getElementById('btn-energy-boost'),
        weatherPill: document.getElementById('hud-weather-pill'),
        weatherIcon: document.getElementById('hud-weather-icon'),
        weatherLabel: document.getElementById('hud-weather-label'),
        badgeOrdersReady: document.getElementById('badge-orders-ready'),
        btnAutoPlant: document.getElementById('btn-auto-plant'),
        btnRandomPlant: document.getElementById('btn-random-plant'),
        btnWaterAll: document.getElementById('btn-water-all'),
        btnHarvestAll: document.getElementById('btn-harvest-all'),
        badgePlantCount: document.getElementById('badge-plant-count'),
        badgeWaterCount: document.getElementById('badge-water-count'),
        badgeHarvestCount: document.getElementById('badge-harvest-count'),
        btnDigCrop: document.getElementById('btn-dig-crop'),
        btnPopupRandomPlant: document.getElementById('btn-popup-random-plant'),
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
      this.updateHUD();
      this.updateWeatherHUD();
    }

    bindEvents() {
      if (this.dom.hudProfileCard) {
        this.dom.hudProfileCard.addEventListener('click', () => {
          sound.playClick();
          this.openProfileModal();
        });
      }

      if (this.dom.weatherPill) {
        this.dom.weatherPill.addEventListener('click', () => {
          sound.playClick();
          const w = state.getWeatherData();
          this.showToast(`${w.icon} ${w.label} (còn ${state.weatherTimeLeft}s): ${w.desc}`, 'info');
        });
      }

      if (this.dom.btnEnergyBoost) {
        this.dom.btnEnergyBoost.addEventListener('click', () => {
          this.handleFertilizeAll();
        });
      }

      if (this.dom.btnAutoPlant) {
        this.dom.btnAutoPlant.addEventListener('click', () => {
          if (this.dom.btnDigCrop) this.dom.btnDigCrop.classList.remove('active');
          state.selectedTool = 'seed';
          this.handleAutoPlant();
        });
      }

      if (this.dom.btnRandomPlant) {
        this.dom.btnRandomPlant.addEventListener('click', () => {
          if (this.dom.btnDigCrop) this.dom.btnDigCrop.classList.remove('active');
          state.selectedTool = 'seed';
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
            this.showToast('Chế độ Đào Cây ⛏️: Chạm hoặc vuốt qua cây muốn nhổ bỏ!', 'info');
          }
        });
      }

      if (this.dom.btnPopupRandomPlant) {
        this.dom.btnPopupRandomPlant.addEventListener('click', () => {
          this.handleRandomPlant();
        });
      }

      if (this.dom.btnWaterAll) {
        this.dom.btnWaterAll.addEventListener('click', () => this.handleWaterAll());
      }

      if (this.dom.btnHarvestAll) {
        this.dom.btnHarvestAll.addEventListener('click', () => this.handleHarvestAll());
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

      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (e.key === 'Escape') {
          this.closeAllModals();
          return;
        }

        const modalsOpen = [
          this.dom.shopModal,
          this.dom.barnModal,
          this.dom.ordersModal,
          this.dom.guideModal,
          this.dom.profileModal,
          this.dom.levelupModal,
        ].some((m) => m && !m.classList.contains('hidden'));
        if (modalsOpen) return;

        const key = e.key.toLowerCase();
        if (key === '1' || key === 'g') {
          e.preventDefault();
          this.dom.btnAutoPlant?.click();
        } else if (key === '2' || key === 'w') {
          e.preventDefault();
          this.dom.btnWaterAll?.click();
        } else if (key === '3' || key === 'h') {
          e.preventDefault();
          this.dom.btnHarvestAll?.click();
        } else if (key === '4' || key === 'f') {
          e.preventDefault();
          this.dom.btnEnergyBoost?.click();
        }
      });

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
          const deliverable = orderSystem.getDeliverableCount();
          const userLvl = state.getLevelData().level;
          const unlockable = state.plots.find(p => p.status === 'LOCKED' && userLvl >= p.reqLevel && state.coins >= p.unlockCost);
          const hasMature = state.plots.some(p => p.status === 'MATURE');
          const hasDry = state.plots.some(p => p.status === 'PLANTED_DRY');
          const hasGrowing = state.plots.some(p => p.status === 'PLANTED_WATERED');
          const hasEmpty = state.plots.some(p => p.status === 'TILLED' || p.status === 'RAW');

          if (deliverable > 0) {
            this.showToast(`Trợ lý: "Có ${deliverable} Đơn Hàng thị trấn sẵn sàng giao! Bấm 📜 Đơn để nhận thưởng Vàng & x2 EXP!"`, 'success');
          } else if (unlockable) {
            this.showToast(`Trợ lý: "Bạn đủ điều kiện mở Ô đất #${unlockable.id + 1} (${unlockable.unlockCost} 💰) rồi! Chạm vào biển xanh 🔓 để mở rộng cánh đồng!"`, 'success');
          } else if (hasMature) {
            this.showToast('Trợ lý: "Cây đã chín vàng! Vuốt nhanh qua cánh đồng hoặc bấm Thu Hoạch Tất Cả để săn Combo & Thu Hoạch Vàng 🌟!"', 'info');
          } else if (hasDry) {
            this.showToast('Trợ lý: "Chạm 1 lần trực tiếp lên cây đang khát nước để tưới ngay — vừa rút ngắn thời gian vừa tăng x2 tốc độ lớn 💧!"', 'info');
          } else if (hasGrowing && state.energy >= 20) {
            this.showToast('Trợ lý: "Bạn đang có Năng lượng 🍃! Bấm nút 🍃 ⚡Bón ở góc trên để thúc toàn bộ cây lớn vọt +40%!"', 'info');
          } else if (hasEmpty) {
            this.showToast('Trợ lý: "Chạm ô đất trống để chọn hạt, hoặc bấm Tự Động Gieo / Gieo Ngẫu Nhiên để gieo hàng loạt!"', 'info');
          } else {
            this.showToast('Trợ lý: "Đợi cây lớn một chút nhé! Khi trời đổ Mưa Rào 🌦️ cây sẽ tự tưới, còn Cầu Vồng 🌈 sẽ nhân thưởng EXP!"', 'info');
          }
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

    updateWeatherHUD() {
      const w = state.getWeatherData();
      if (this.dom.weatherIcon) this.dom.weatherIcon.textContent = w.icon;
      if (this.dom.weatherLabel) this.dom.weatherLabel.textContent = w.label;
      if (this.dom.weatherPill) {
        this.dom.weatherPill.className = `weather-pill ${w.id === 'rain' ? 'is-rain' : w.id === 'rainbow' ? 'is-rainbow' : ''}`;
      }
      document.body.classList.toggle('weather-rain', w.id === 'rain');
      document.body.classList.toggle('weather-rainbow', w.id === 'rainbow');
      if (this.rainRenderer) {
        this.rainRenderer.setActive(w.id === 'rain');
      }
    }

    updateHUD() {
      this.dom.coinsCount.textContent = state.coins.toLocaleString('vi-VN');
      const lvl = state.getLevelData();
      this.dom.expProgress.style.width = `${lvl.progress}%`;
      const usage = state.getBarnUsage();
      this.dom.barnIndicator.textContent = `${usage}/${state.barnCapacity}`;

      if (this.dom.energyVal) {
        this.dom.energyVal.textContent = `${state.energy}/${state.maxEnergy}`;
      }
      if (this.dom.btnEnergyBoost) {
        const hasGrowing = state.plots.some(p => (p.status === 'PLANTED_DRY' || p.status === 'PLANTED_WATERED') && p.cropId);
        this.dom.btnEnergyBoost.classList.toggle('can-boost', state.energy >= 20 && hasGrowing);
      }

      const levelBadge = document.getElementById('hud-level-badge');
      if (levelBadge) levelBadge.textContent = lvl.level;

      const guideCounter = document.getElementById('guide-progress-text');
      if (guideCounter) {
        const total = Object.keys(CROPS).length;
        const unlocked = Object.values(CROPS).filter(c => c.levelReq <= lvl.level).length;
        guideCounter.textContent = `${unlocked}/${total}`;
      }

      const deliverableOrders = orderSystem.getDeliverableCount();
      if (this.dom.badgeOrdersReady) {
        this.dom.badgeOrdersReady.textContent = deliverableOrders;
        this.dom.badgeOrdersReady.classList.toggle('hidden', deliverableOrders <= 0);
      }

      const ribbonText = document.getElementById('ribbon-text-display');
      if (ribbonText) {
        const unlockable = state.plots.find(p => p.status === 'LOCKED' && lvl.level >= p.reqLevel && state.coins >= p.unlockCost);
        const hasMature = state.plots.some(p => p.status === 'MATURE');
        const hasGrowing = state.plots.some(p => p.status === 'PLANTED_WATERED');
        const hasDry = state.plots.some(p => p.status === 'PLANTED_DRY');

        if (deliverableOrders > 0) {
          ribbonText.innerHTML = `📜 Có <strong>${deliverableOrders} Đơn Hàng</strong> sẵn sàng giao! Bấm <strong>Đơn</strong> để nhận thưởng x2 EXP!`;
        } else if (hasMature) {
          ribbonText.innerHTML = '🌟 Nông sản đã chín vàng! Chạm hoặc <strong>vuốt qua các ô</strong> để gặt & ăn Combo!';
        } else if (unlockable) {
          ribbonText.innerHTML = `🔓 Đủ điều kiện mở <strong>Ô đất #${unlockable.id + 1}</strong> (${unlockable.unlockCost} 💰) — Chạm biển xanh để mở!`;
        } else if (hasDry) {
          ribbonText.innerHTML = '💧 Cây đang khát nước! Chạm <strong>1 lần</strong> lên cây hoặc bấm <strong>Tưới Tất Cả</strong> để tăng x2 tốc độ!';
        } else if (hasGrowing) {
          ribbonText.innerHTML = state.energy >= 20
            ? '⚡ Cây đang lớn... Bấm <strong>🍃 ⚡Bón</strong> (-20 năng lượng) để tăng tốc +40% ngay!'
            : '⏳ Cây đang lớn xanh tốt... Năng lượng 🍃 tự hồi mỗi 2 giây!';
        } else {
          ribbonText.innerHTML = 'Nhiệm vụ: Chạm vào ô đất trống để <strong>chọn cây gieo trồng</strong>!';
        }
      }

      this.updateActionBadges();
    }

    updateActionBadges() {
      const plantCount = state.plots.filter(p => p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW')).length;
      if (this.dom.badgePlantCount) {
        this.dom.badgePlantCount.textContent = plantCount;
        this.dom.badgePlantCount.classList.toggle('hidden', plantCount <= 0);
      }

      const waterCount = state.plots.filter(p => p.status === 'PLANTED_DRY' && p.cropId && !p.isWatered).length;
      if (this.dom.badgeWaterCount) {
        this.dom.badgeWaterCount.textContent = waterCount;
        this.dom.badgeWaterCount.classList.toggle('hidden', waterCount <= 0);
      }

      const matureCount = state.plots.filter(p => p.status === 'MATURE').length;
      if (this.dom.badgeHarvestCount) {
        this.dom.badgeHarvestCount.textContent = matureCount;
        this.dom.badgeHarvestCount.classList.toggle('hidden', matureCount <= 0);
      }

      if (this.dom.btnEnergyBoost) {
        const hasGrowing = state.plots.some(p => (p.status === 'PLANTED_DRY' || p.status === 'PLANTED_WATERED') && p.cropId);
        this.dom.btnEnergyBoost.classList.toggle('can-boost', state.energy >= 20 && hasGrowing);
      }
    }

    handleFertilizeAll() {
      const res = state.fertilizeAll(20, 0.4);
      if (!res.success) {
        sound.playClick();
        if (res.reason === 'NO_GROWING_CROPS') {
          this.showToast('Chưa có cây đang lớn để bón phân! Hãy gieo hạt trước 🌱', 'info');
        } else if (res.reason === 'NOT_ENOUGH_ENERGY') {
          this.showToast(`Cần 20 Năng lượng 🍃 để Bón Phân toàn vườn (hiện có ${state.energy}/100, tự hồi +1/2s).`, 'warning');
        }
        return;
      }

      sound.playBoost();
      const rend = this.activeRenderer || window.farmRenderer;
      res.affectedPlots.forEach(plot => {
        const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
        if (plotEl) {
          this.createWaterSplashes(plotEl);
          this.showFloatingText(plotEl, plot.status === 'MATURE' ? '⚡ CHÍN NGAY!' : '⚡ +40% lớn!', 'golden');
        }
        if (rend) rend.updatePlotElement(plot);
      });

      this.showToast(
        res.maturedCount > 0
          ? `⚡ Đã bón phân ${res.affectedPlots.length} ô (-20 🍃) — ${res.maturedCount} cây chín ngay lập tức! 🌟`
          : `⚡ Đã bón phân ${res.affectedPlots.length} ô (-20 🍃) — tăng vọt +40% tiến độ lớn!`,
        'success'
      );
      this.updateHUD();
    }

    handleAutoPlant() {
      if (this.isBatchBusy) return;
      const plantablePlots = state.plots.filter(p => p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW'));
      if (plantablePlots.length === 0) {
        sound.playClick();
        this.showToast('Tất cả các ô đất đã được gieo trồng! 🌱', 'info');
        return;
      }

      const userLvl = state.getLevelData().level;
      let targetCropId = state.selectedSeed || 'wheat';
      if (!CROPS[targetCropId] || userLvl < CROPS[targetCropId].levelReq) {
        targetCropId = 'wheat';
      }
      const crop = CROPS[targetCropId];

      this.isBatchBusy = true;
      let plantedCount = 0;
      let stopEarlyReason = null;

      plantablePlots.forEach((plot, index) => {
        setTimeout(() => {
          if (!stopEarlyReason) {
            const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
            if (plotEl) {
              const planted = window.farmInteractions ? window.farmInteractions.plantCropDirectly(plot.id, plotEl, targetCropId) : false;
              if (planted) {
                plantedCount++;
                this.createDirtParticles(plotEl);
              } else {
                stopEarlyReason = 'NO_COINS';
              }
            }
          }

          if (index === plantablePlots.length - 1) {
            this.isBatchBusy = false;
            if (plantedCount > 0) {
              this.showToast(`Đã gieo ${crop.name} vào ${plantedCount} ô đất! 🌱`, 'success');
            } else if (stopEarlyReason === 'NO_COINS') {
              this.showToast(`Không đủ vàng mua hạt giống ${crop.name}!`, 'warning');
            }
            this.updateHUD();
            this.closeCropPicker();
          }
        }, index * 55);
      });
    }

    handleRandomPlant() {
      if (this.isBatchBusy) return;
      const plantablePlots = state.plots.filter(p => p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW'));
      if (plantablePlots.length === 0) {
        sound.playClick();
        this.showToast('Tất cả các ô đất đã được gieo trồng! 🌱', 'info');
        return;
      }

      const userLvl = state.getLevelData().level;
      const unlockedCrops = Object.keys(CROPS).filter(k => userLvl >= CROPS[k].levelReq);
      if (unlockedCrops.length === 0) return;

      this.isBatchBusy = true;
      let plantedCount = 0;
      const cropStats = {};

      plantablePlots.forEach((plot, index) => {
        setTimeout(() => {
          const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
          if (plotEl) {
            const availableForPlot = unlockedCrops.filter(k => (state.inventory.seeds[k] || 0) > 0 || state.coins >= CROPS[k].seedCost);
            const randomCropId = availableForPlot.length > 0
              ? availableForPlot[Math.floor(Math.random() * availableForPlot.length)]
              : null;

            if (randomCropId && window.farmInteractions) {
              const planted = window.farmInteractions.plantCropDirectly(plot.id, plotEl, randomCropId);
              if (planted) {
                plantedCount++;
                cropStats[randomCropId] = (cropStats[randomCropId] || 0) + 1;
                this.createDirtParticles(plotEl);
              }
            }
          }

          if (index === plantablePlots.length - 1) {
            this.isBatchBusy = false;
            if (plantedCount > 0) {
              const summary = Object.keys(cropStats).map(k => `${CROPS[k].icon} ${CROPS[k].name} x${cropStats[k]}`).join(', ');
              this.showToast(`Đã gieo ngẫu nhiên ${plantedCount} ô: ${summary}! 🎲`, 'success');
            } else {
              this.showToast('Không đủ vàng để mua thêm hạt giống!', 'warning');
            }
            this.updateHUD();
            this.closeCropPicker();
          }
        }, index * 55);
      });
    }

    handleWaterAll() {
      if (this.isBatchBusy) return;
      const waterablePlots = state.plots.filter(p => p.status === 'PLANTED_DRY' && p.cropId && !p.isWatered);
      if (waterablePlots.length === 0) {
        sound.playClick();
        this.showToast('Không có cây trồng nào cần tưới nước lúc này! 🌱', 'info');
        return;
      }

      this.isBatchBusy = true;
      sound.playWater();
      waterablePlots.forEach((plot, index) => {
        setTimeout(() => {
          const res = state.waterPlot(plot.id);
          const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
          if (plotEl && res && res.success) {
            this.createWaterSplashes(plotEl);
            this.showFloatingText(plotEl, `-${res.boostSeconds}s 💧`, 'water');
          }
          const rend = this.activeRenderer || window.farmRenderer;
          if (rend) rend.updatePlotElement(plot);

          if (index === waterablePlots.length - 1) {
            this.isBatchBusy = false;
            this.showToast(`Đã tưới mát ${waterablePlots.length} ô cây — tăng x2 tốc độ lớn! 💧✨`, 'success');
            this.updateHUD();
          }
        }, index * 55);
      });
    }

    handleHarvestAll() {
      if (this.isBatchBusy) return;
      const maturePlots = state.plots.filter(p => p.status === 'MATURE');
      if (maturePlots.length === 0) {
        sound.playClick();
        this.showToast('Chưa có nông sản nào chín để thu hoạch! 🌾', 'info');
        return;
      }

      const barnFree = state.barnCapacity - state.getBarnUsage();
      if (barnFree <= 0) {
        sound.playClick();
        this.showToast('Nhà kho đã đầy! Hãy giao Đơn Hàng hoặc bán bớt nông sản 🧺', 'warning');
        return;
      }

      this.isBatchBusy = true;
      let totalItems = 0;
      let goldenCount = 0;
      const toHarvest = maturePlots.slice(0, barnFree);

      toHarvest.forEach((plot, index) => {
        setTimeout(() => {
          const res = state.harvestPlot(plot.id);
          if (res && res.success) {
            sound.playHarvest(index);
            if (res.isGolden) goldenCount++;
            totalItems += res.yieldCount;
            const plotEl = document.querySelector(`.farm-plot[data-plot-id="${plot.id}"]`);
            if (plotEl) {
              if (res.isGolden) {
                this.showFloatingText(plotEl, `🌟 +${res.yieldCount} ${res.crop.icon} +${res.bonusGold}💰`, 'golden');
              } else {
                this.showFloatingText(plotEl, `+1 ${res.crop.icon}`, 'crop');
              }
              this.showFloatingText(plotEl, `+${res.earnedExp} EXP ✨`, 'exp', 22);
            }
            const rend = this.activeRenderer || window.farmRenderer;
            if (rend) rend.updatePlotElement(plot);
          }

          if (index === toHarvest.length - 1) {
            this.isBatchBusy = false;
            this.updateHUD();
            if (goldenCount > 0) {
              sound.playCoin();
              this.showToast(`🌟 Thu hoạch ${totalItems} nông sản (${goldenCount} Thu Hoạch Vàng)! 🌾🎉`, 'success');
            } else {
              this.showToast(`Thu hoạch thành công ${totalItems} nông sản! 🌾🎉`, 'success');
            }
          }
        }, index * 65);
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
              <span class="shop-item-desc">${crop.growTime}s (💧-${crop.waterBoost}s) · Bán +${crop.sellPrice}💰 · EXP +${crop.expGain}</span>
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
      this.dom.btnUpgradeBarn.textContent = `Nâng cấp +30 chỗ (${Math.round(state.barnCapacity * 3)} 💰)`;

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
        this.dom.barnList.innerHTML = '<div class="empty-state"><span>🧺</span><p>Nhà kho đang trống.</p></div>';
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
        const itemsHtml = order.items.map(item => {
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
            <div class="order-rewards"><span class="reward-gold">+${order.rewardCoins} 💰</span><span class="reward-exp">+${order.rewardExp} ✨</span><span class="reward-exp" style="color:#16a34a;">+12 🍃</span></div>
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
              this.showToast(`Hoàn thành đơn hàng! +${res.rewardCoins} 💰 · +${res.rewardExp} ✨ · +12 🍃`, 'success');
              this.updateHUD();
              this.openOrders();
            }
          });
        }
        card.querySelector('.btn-discard-order').addEventListener('click', () => {
          sound.playClick();
          orderSystem.discardOrder(order.id);
          this.updateHUD();
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
              <h4>${crop.name} ${unlocked ? '✅' : `🔒 Lv.${crop.levelReq}`}</h4>
              <span class="shop-item-desc">${crop.description}</span>
            </div>
          </div>
          <div class="shop-item-body">
            <div class="shop-item-stats">
              <span>Lớn: <strong>${crop.growTime}s</strong></span>
              <span>Bán: <strong class="gold-text">${crop.sellPrice} 💰</strong></span>
              <span>Đơn: <strong style="color:#16a34a;">${crop.orderPrice} 💰</strong></span>
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
      const totalHarvested = state.stats ? (state.stats.totalHarvests || 0) : 0;
      const ordersCompleted = state.stats ? (state.stats.ordersCompleted || 0) : 0;
      const goldenHarvests = state.stats ? (state.stats.goldenHarvests || 0) : 0;

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
              <span class="profile-pill-tag">⭐ ${state.exp.toLocaleString()} EXP</span>
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
              <span class="stat-label">${lvl.nextLevel ? 'Cần thêm để lên cấp:' : 'Trạng thái cấp:'}</span>
              <span class="stat-value highlight-need">${lvl.nextLevel ? `Còn thiếu <strong>${lvl.expToNext.toLocaleString()}</strong> EXP` : 'Đã đạt cấp tối đa! 👑'}</span>
            </div>
          </div>
        </div>

        ${lvl.nextLevel ? `
          <div class="profile-next-reward-card">
            <div class="next-reward-header">
              <div class="next-level-tag">
                <span class="star-icon">🌟</span>
                <span>QUYỀN LỢI CẤP ${lvl.nextLevel.level}</span>
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
        ` : '<div class="profile-max-level-card">🎉 Bạn đã đạt cấp độ vinh danh cao nhất!</div>'}

        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <span class="stat-box-icon">🌾</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${totalHarvested.toLocaleString()}</span>
              <span class="stat-box-name">Đã thu hoạch</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-box-icon">🌟</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${goldenHarvests.toLocaleString()}</span>
              <span class="stat-box-name">Thu hoạch vàng</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-box-icon">🏡</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${unlockedPlots} / ${totalPlots}</span>
              <span class="stat-box-name">Ô đất mở khóa</span>
            </div>
          </div>
          <div class="profile-stat-box">
            <span class="stat-box-icon">📜</span>
            <div class="stat-box-info">
              <span class="stat-box-num">${ordersCompleted.toLocaleString()}</span>
              <span class="stat-box-name">Đơn hoàn thành</span>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:4px;">
          <span style="font-size:0.78rem; color:#64748b;">💡 Giao Đơn Hàng cho thưởng Vàng cao hơn 50% & x2 EXP!</span>
          <button id="btn-reset-farm" class="btn-action-secondary" style="font-size:0.75rem; padding:6px 12px; color:#b91c1c; background:#fee2e2; flex-shrink:0;">🔄 Chơi lại</button>
        </div>
      `;

      const resetBtn = body.querySelector('#btn-reset-farm');
      if (resetBtn) {
        let armTimer = null;
        resetBtn.addEventListener('click', () => {
          if (resetBtn.dataset.armed !== 'true') {
            resetBtn.dataset.armed = 'true';
            resetBtn.textContent = '⚠️ Bấm lại để xác nhận!';
            resetBtn.style.background = '#dc2626';
            resetBtn.style.color = '#ffffff';
            sound.playClick();
            armTimer = setTimeout(() => {
              resetBtn.dataset.armed = 'false';
              resetBtn.textContent = '🔄 Chơi lại';
              resetBtn.style.background = '#fee2e2';
              resetBtn.style.color = '#b91c1c';
            }, 4000);
            return;
          }
          if (armTimer) clearTimeout(armTimer);
          state.resetFarm();
          orderSystem.generateOrders(3);
          if (window.farmRenderer) window.farmRenderer.renderInitial();
          this.closeAllModals();
          this.updateHUD();
          this.updateWeatherHUD();
          this.showToast('Đã khởi tạo nông trại mới tinh! 🌱', 'info');
        });
      }

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
      if (offsetY) floater.style.top = `${-12 + offsetY}px`;
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
        setTimeout(() => p.remove(), 480);
      }
    }

    createWaterSplashes(parentEl) {
      for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'water-splash-particle';
        const a = Math.random() * Math.PI * 2;
        const d = 14 + Math.random() * 20;
        p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
        p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
        parentEl.appendChild(p);
        setTimeout(() => p.remove(), 500);
      }
    }

    showToast(msg, type = 'info') {
      // Loại bỏ toast trùng nội dung đang hiển thị để tránh xếp chồng lặp lại
      Array.from(this.dom.toastContainer.children).forEach(existing => {
        if (existing.textContent === msg) existing.remove();
      });
      // Giữ tối đa 2 toast cùng lúc để không che cây trồng & màn hình Mobile
      while (this.dom.toastContainer.children.length >= 2) {
        this.dom.toastContainer.firstChild.remove();
      }
      const t = document.createElement('div');
      t.className = `toast-item toast-${type}`;
      t.textContent = msg;
      this.dom.toastContainer.appendChild(t);
      setTimeout(() => {
        t.classList.add('fade-out');
        setTimeout(() => t.remove(), 320);
      }, 2100);
    }

    showLockedSignpost(plotId, plotEl, reqLevel) {
      if (!plotEl) return;
      const contentEl = plotEl.querySelector('.plot-content');
      if (!contentEl) return;
      if (!contentEl.querySelector('.iso-signpost')) {
        const signEl = document.createElement('div');
        signEl.className = 'iso-signpost';
        signEl.innerHTML = `
          <div class="signpost-board">
            <div class="sign-crest">🌾</div>
            <div class="sign-text-col">
              <span class="sign-line1">Mở khóa tại</span>
              <span class="sign-line2">Cấp ${reqLevel}</span>
            </div>
          </div>
          <div class="signpost-arrow"></div>
        `;
        contentEl.appendChild(signEl);
        setTimeout(() => {
          signEl.classList.add('fade-out');
          setTimeout(() => signEl.remove(), 300);
        }, 1500);
      }
    }

    openCropPicker(plotId, plotEl, renderer = null) {
      this.activePlotId = plotId;
      this.activePlotEl = plotEl;
      if (renderer) this.activeRenderer = renderer;

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

      let popupX = rect.left + rect.width / 2;
      const minX = popupWidth / 2 + 10;
      const maxX = window.innerWidth - popupWidth / 2 - 10;
      popupX = Math.max(minX, Math.min(maxX, popupX));

      const topSpace = rect.top;
      const arrowEl = popup.querySelector('.crop-popup-arrow');

      if (topSpace < popupHeight + 105) {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${Math.min(window.innerHeight - popupHeight - 115, rect.bottom + 14)}px`;
        popup.style.transform = 'translateX(-50%)';
        if (arrowEl) {
          arrowEl.style.top = '-9px';
          arrowEl.style.bottom = 'auto';
          arrowEl.style.borderTop = 'none';
          arrowEl.style.borderBottom = '9px solid #f59e0b';
        }
      } else {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.top - 12}px`;
        popup.style.transform = 'translate(-50%, -100%)';
        if (arrowEl) {
          arrowEl.style.top = 'auto';
          arrowEl.style.bottom = '-9px';
          arrowEl.style.borderBottom = 'none';
          arrowEl.style.borderTop = '9px solid #f59e0b';
        }
      }
    }

    closeCropPicker() {
      if (this.dom.plotCropPopup) this.dom.plotCropPopup.classList.add('hidden');
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

      if (topSpace < popupHeight + 105) {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${Math.min(window.innerHeight - popupHeight - 115, rect.bottom + 14)}px`;
        popup.style.transform = 'translateX(-50%)';
        if (arrowEl) {
          arrowEl.style.top = '-9px';
          arrowEl.style.bottom = 'auto';
          arrowEl.style.borderTop = 'none';
          arrowEl.style.borderBottom = '9px solid #f59e0b';
        }
      } else {
        popup.style.left = `${popupX}px`;
        popup.style.top = `${rect.top - 12}px`;
        popup.style.transform = 'translate(-50%, -100%)';
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

      const rem = getRemainingRealSeconds(plot);
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
              if (res && res.success && window.farmInteractions) {
                window.farmInteractions.handleHarvestFeedback(plot, this.activeCropInfoPlotEl, res);
                this.closeCropInfo();
              } else if (res && res.reason === 'BARN_FULL') {
                sound.playClick();
                this.showToast('Nhà kho đã đầy! Hãy giao đơn hoặc bán bớt nông sản.', 'warning');
              }
            });
          }
        }
      } else {
        if (this.dom.cropInfoStatus) {
          this.dom.cropInfoStatus.innerHTML = plot.status === 'PLANTED_DRY'
            ? '<span style="color:#38bdf8; font-weight:700;">Đang khát nước (tốc độ 0.5x) 💧</span>'
            : '<span style="color:#22c55e; font-weight:700;">Đang phát triển xanh tốt (1.0x) 🌱</span>';
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
                    this.showFloatingText(this.activeCropInfoPlotEl, `-${res.boostSeconds}s 💧`, 'water');
                  }
                  if (window.farmRenderer) window.farmRenderer.updatePlotElement(plot);
                  this.updateHUD();
                  this.updateCropInfoContent(plot, crop);
                }
              });
            }
          } else {
            this.dom.cropInfoWaterAction.innerHTML = `
              <button id="btn-crop-info-fertilize" class="crop-info-water-btn" style="background:linear-gradient(135deg, #16a34a 0%, #15803d 100%); border-color:#4ade80;">
                ⚡ Bón Phân Tăng Tốc (+50% · -8 🍃)
              </button>
            `;
            const btnFert = this.dom.cropInfoWaterAction.querySelector('#btn-crop-info-fertilize');
            if (btnFert) {
              btnFert.addEventListener('click', (e) => {
                e.stopPropagation();
                const res = state.fertilizePlot(plot.id, 8, 0.5);
                if (res && res.success) {
                  sound.playBoost();
                  if (this.activeCropInfoPlotEl) {
                    this.createWaterSplashes(this.activeCropInfoPlotEl);
                    this.showFloatingText(this.activeCropInfoPlotEl, res.matured ? '⚡ CHÍN NGAY!' : '⚡ +50% lớn!', 'golden');
                  }
                  if (window.farmRenderer) window.farmRenderer.updatePlotElement(plot);
                  this.updateHUD();
                  this.updateCropInfoContent(plot, crop);
                } else {
                  sound.playClick();
                  this.showToast(`Cần 8 Năng lượng 🍃 (đang có ${state.energy}/100)!`, 'warning');
                }
              });
            }
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
            }
            if (window.farmRenderer) window.farmRenderer.updatePlotElement(plot);
            this.updateHUD();
            this.closeCropInfo();
          }
        };
      }
    }

    closeCropInfo() {
      if (this.dom.cropInfoPopup) this.dom.cropInfoPopup.classList.add('hidden');
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
          <span class="crop-choice-time">${crop.growTime}s <span style="color:#38bdf8; font-weight:800; font-size:0.65rem;">(💧-${crop.waterBoost}s)</span></span>
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
                if (this.dom.plotCropPopup) this.dom.plotCropPopup.classList.add('is-dragging');
                dragGhost = document.createElement('div');
                dragGhost.className = 'seed-drag-ghost';
                dragGhost.innerHTML = `
                  <div class="seed-drag-ghost-bubble"><span class="drag-icon">${crop.icon}</span></div>
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
                      if (window.farmInteractions && window.farmInteractions.plantCropDirectly(targetId, plotEl, key)) {
                        plantedIds.add(targetId);
                        this.createDirtParticles(plotEl);
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

              if (lastHoverPlotEl) lastHoverPlotEl.classList.remove('plot-drag-hover');
              if (dragGhost) dragGhost.remove();
              if (this.dom.plotCropPopup) this.dom.plotCropPopup.classList.remove('is-dragging');

              if (isDrag) {
                if (plantedIds.size > 0) {
                  this.showToast(`Đã kéo gieo ${crop.name} vào ${plantedIds.size} ô đất! 🌱`, 'success');
                }
                this.closeCropPicker();
              } else {
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
      const count = state.inventory.seeds[cropId] || 0;

      if (count <= 0) {
        if (state.coins >= crop.seedCost) {
          state.addCoins(-crop.seedCost);
          state.inventory.seeds[cropId] = 1;
          this.showFloatingText(this.activePlotEl, `-${crop.seedCost} 💰`, 'cost');
        } else {
          sound.playClick();
          this.showToast(`Không đủ vàng mua hạt ${crop.name} (${crop.seedCost} 💰)!`, 'warning');
          return;
        }
      }

      state.selectedSeed = cropId;
      if (farmInteractions) farmInteractions.quickSeedId = cropId;
      const res = state.plantSeed(plotId, cropId);
      if (res && res.success) {
        sound.playPlant();
        this.showFloatingText(this.activePlotEl, res.autoWatered ? '🌱+💧' : '-1 🌱', 'seed');
        if (this.activeRenderer) this.activeRenderer.updatePlotElement(plot);
      }

      this.updateHUD();

      const plantablePlots = state.plots.filter(p => p.status !== 'LOCKED' && (p.status === 'TILLED' || p.status === 'RAW'));
      const nextPlot = plantablePlots.find(p => p.id > plotId) || plantablePlots[0];
      if (nextPlot) {
        const nextPlotEl = document.querySelector(`.farm-plot[data-plot-id="${nextPlot.id}"]`);
        if (nextPlotEl) {
          this.activePlotId = nextPlot.id;
          this.activePlotEl = nextPlotEl;
          document.querySelectorAll('.farm-plot.plot-target-active').forEach(el => el.classList.remove('plot-target-active'));
          nextPlotEl.classList.add('plot-target-active');
          this.renderCropPicker(nextPlot.id);
          return;
        }
      }

      this.closeCropPicker();
      this.showToast('Đã gieo kín cánh đồng! Chạm 1 lần lên cây hoặc bấm Tưới Tất Cả 💧', 'success');
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

  // 9.5 RAIN WEATHER CANVAS RENDERER (60fps zero-allocation)
  class RainWeatherRenderer {
    constructor(canvas) {
      this.canvas = canvas || null;
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.active = false;
      this.rafId = 0;
      this.lastTs = 0;
      this.width = 1280;
      this.height = 720;
      this.dpr = 1;

      const maxDrops = (typeof window !== 'undefined' && window.innerWidth >= 768) ? 76 : 42;
      this.drops = Array.from({ length: maxDrops }, () => ({
        x: 0,
        y: 0,
        len: 14,
        speed: 620,
        depth: 0.8,
        drift: 0,
        alpha: 0.35,
        width: 1.1,
        landY: 500
      }));

      this.splashes = Array.from({ length: 20 }, () => ({
        active: false,
        x: 0,
        y: 0,
        life: 0,
        maxLife: 0.36,
        maxRx: 8
      }));

      this._onResize = () => this.resize();
      this._onFrame = (ts) => this.frame(ts);

      if (typeof window !== 'undefined' && this.canvas) {
        this.resize();
        this.seedAllDrops(true);
        window.addEventListener('resize', this._onResize);
      }
    }

    resize() {
      if (!this.canvas || typeof window === 'undefined') return;
      this.width = Math.max(320, window.innerWidth || 1280);
      this.height = Math.max(320, window.innerHeight || 720);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      if (this.ctx) {
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
    }

    resetDrop(drop, randomY = false) {
      const depth = 0.45 + Math.random() * 0.8;
      drop.depth = depth;
      drop.x = Math.random() * (this.width + 260) - 80;
      drop.y = randomY ? Math.random() * this.height : -30 - Math.random() * 140;
      drop.len = 10 + depth * 13 + Math.random() * 5;
      drop.speed = 460 + depth * 360 + Math.random() * 90;
      drop.drift = (Math.random() - 0.5) * 0.08;
      drop.alpha = 0.14 + depth * 0.22;
      drop.width = 0.7 + depth * 0.65;
      drop.landY = this.height * (0.45 + Math.random() * 0.5);
    }

    seedAllDrops(randomY) {
      for (let i = 0; i < this.drops.length; i++) {
        this.resetDrop(this.drops[i], randomY);
      }
    }

    spawnSplash(x, y, depth) {
      for (let i = 0; i < this.splashes.length; i++) {
        const s = this.splashes[i];
        if (!s.active) {
          s.active = true;
          s.x = x;
          s.y = y;
          s.life = 0;
          s.maxLife = 0.28 + Math.random() * 0.14;
          s.maxRx = 4.5 + depth * 4.5;
          return;
        }
      }
    }

    setActive(shouldRun) {
      if (typeof window === 'undefined' || !this.canvas || !this.ctx) return;
      const reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const nextActive = Boolean(shouldRun) && !reduced;

      if (nextActive === this.active) return;
      this.active = nextActive;

      if (this.active) {
        this.resize();
        this.seedAllDrops(true);
        this.lastTs = performance.now();
        this.rafId = window.requestAnimationFrame(this._onFrame);
      } else {
        if (this.rafId) {
          window.cancelAnimationFrame(this.rafId);
          this.rafId = 0;
        }
        for (let i = 0; i < this.splashes.length; i++) {
          this.splashes[i].active = false;
        }
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }

    frame(now) {
      if (!this.active || !this.ctx) return;
      const dt = Math.min(0.05, Math.max(0.008, (now - this.lastTs) / 1000));
      this.lastTs = now;

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      const baseWind = -0.22 - Math.sin(now * 0.0007) * 0.06;

      ctx.lineCap = 'round';
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        const slope = baseWind + d.drift;
        const dy = d.speed * dt;
        const dx = dy * slope;
        d.x += dx;
        d.y += dy;

        ctx.strokeStyle = `rgba(219, 242, 255, ${d.alpha.toFixed(2)})`;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * slope, d.y - d.len);
        ctx.stroke();

        if (d.depth > 0.82 && d.y >= d.landY) {
          this.spawnSplash(d.x, d.landY, d.depth);
          this.resetDrop(d, false);
        } else if (d.y > this.height + 40 || d.x < -120) {
          this.resetDrop(d, false);
        }
      }

      for (let i = 0; i < this.splashes.length; i++) {
        const s = this.splashes[i];
        if (!s.active) continue;
        s.life += dt;
        if (s.life >= s.maxLife) {
          s.active = false;
          continue;
        }
        const t = s.life / s.maxLife;
        const rx = s.maxRx * (0.3 + t * 0.7);
        const ry = rx * 0.42;
        const alpha = (1 - t) * 0.42;

        ctx.strokeStyle = `rgba(219, 242, 255, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();

        const hop = Math.sin(t * Math.PI) * 5;
        ctx.fillStyle = `rgba(224, 242, 254, ${(alpha * 1.15).toFixed(2)})`;
        ctx.fillRect(s.x - rx * 0.45, s.y - hop - 1.5, 1.8, 1.8);
        ctx.fillRect(s.x + rx * 0.45, s.y - hop * 0.75 - 1.5, 1.8, 1.8);
      }

      this.rafId = window.requestAnimationFrame(this._onFrame);
    }

    destroy() {
      this.setActive(false);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this._onResize);
      }
    }
  }

  globalThis.__ANIME_FARM_API__ = {
    CROPS,
    LEVELS,
    WEATHER_TYPES,
    getLevelInfo,
    getRemainingRealSeconds,
    GameState,
    OrderSystem,
    getPlantSvg,
    state,
    orderSystem
  };

  // 10. KHỞI CHẠY GAME
  document.addEventListener('DOMContentLoaded', () => {
    const loadInfo = state.load();
    ui = new UIManager();
    const rainRenderer = new RainWeatherRenderer(document.getElementById('weather-rain-canvas'));
    ui.rainRenderer = rainRenderer;
    ui.updateWeatherHUD();

    const gridEl = document.getElementById('farm-grid');
    const renderer = new FarmRenderer(gridEl);
    renderer.renderInitial();
    ui.activeRenderer = renderer;
    window.farmRenderer = renderer;

    farmInteractions = new FarmInteractions(gridEl, renderer);
    window.farmInteractions = farmInteractions;

    window.addEventListener('beforeunload', () => {
      rainRenderer.destroy();
    });

    if (loadInfo.loaded && loadInfo.maturedCount > 0) {
      ui.showToast(`Chào mừng trở lại! Có ${loadInfo.maturedCount} cây đã chín sẵn trong lúc bạn vắng mặt 🌾✨`, 'success');
    }

    state.subscribe((eventType, data) => {
      if (['COINS_CHANGED', 'EXP_CHANGED', 'ENERGY_CHANGED', 'SEEDS_BOUGHT', 'CROPS_SOLD', 'ALL_CROPS_SOLD', 'BARN_UPGRADED', 'PLOT_UNLOCKED'].includes(eventType)) {
        ui.updateHUD();
        renderer.updateAll();
      } else if (eventType === 'LEVEL_UP') {
        ui.showLevelUpModal(data.newLevel, data.rewardCoins, data.unlockNote);
        ui.updateHUD();
        renderer.updateAll();
      } else if (eventType === 'CROP_MATURED') {
        renderer.updatePlotElement(data.plot);
        ui.updateHUD();
      } else if (eventType === 'PLOT_WATERED' || eventType === 'PLOT_PLANTED' || eventType === 'PLOT_HARVESTED') {
        ui.updateHUD();
      } else if (eventType === 'WEATHER_CHANGED') {
        ui.updateWeatherHUD();
        ui.showToast(`${data.weather.icon} Thời tiết đổi sang ${data.weather.label}! ${data.weather.desc}`, 'info');
      } else if (eventType === 'RAIN_AUTO_WATERED') {
        data.plots.forEach(p => {
          const el = document.querySelector(`.farm-plot[data-plot-id="${p.id}"]`);
          if (el) ui.createWaterSplashes(el);
          renderer.updatePlotElement(p);
        });
        ui.showToast(`🌦️ Mưa rào tự động tưới mát ${data.count} cây trồng!`, 'success');
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
