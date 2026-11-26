/* eslint-disable */
/**
 * dev-tools.js - Công cụ phát triển & thử nghiệm luật chơi nội bộ
 * File này chỉ nằm ở môi trường Local Dev và được .gitignore bỏ qua khi push lên GitHub.
 */

import { TestPanelModal } from './TestPanelModal.js';
import { SAIGON_BOARD_DATA } from '../../../shared/data/board-data.js';

export function setupDevTools(ctx) {
  const {
    getEngine,
    hud,
    boardRenderer,
    tokenRenderer,
    sound,
    showToast,
    addGameLog,
    autoSaveGame,
    resolveLanding,
    showJailOptions,
    showGameOverModal,
    auctionModal
  } = ctx;

  const testPanelModal = new TestPanelModal();

  // 1. Tự động chèn nút '⚡ Test Luật' vào Header trước nút '📖 Luật Chơi' (nếu chưa có)
  let btnQuickTest = document.getElementById('btn-quick-test');
  if (!btnQuickTest) {
    const btnRulebook = document.getElementById('btn-open-rulebook');
    btnQuickTest = document.createElement('button');
    btnQuickTest.id = 'btn-quick-test';
    btnQuickTest.className = 'btn-tool btn-test-amber';
    btnQuickTest.innerHTML = `<span class="btn-tool-icon">⚡</span> <span class="btn-tool-label">Test Luật</span>`;

    if (btnRulebook && btnRulebook.parentNode) {
      btnRulebook.parentNode.insertBefore(btnQuickTest, btnRulebook);
    }
  }

  // Kết nối mục Thử Nghiệm Luật trong Popover More Menu trên mobile (nếu có)
  const menuItemDev = document.getElementById('menu-item-dev-tools');
  if (menuItemDev) {
    menuItemDev.style.display = 'flex';
    menuItemDev.onclick = () => {
      const popover = document.getElementById('more-menu-popover');
      if (popover) popover.classList.remove('open');
      btnQuickTest.click();
    };
  }

  // 2. Gắn sự kiện click mở modal
  btnQuickTest.onclick = () => {
    const engine = getEngine();
    if (!engine) return;

    testPanelModal.show({
      jail: () => window.test.vaoTu(),
      money50: () => window.test.choTien(50),
      setAllProperties: () => window.test.choTatCaDat(),
      brown: () => window.test.choBoDat('brown'),
      setOrange: () => window.test.choBoDat('orange'),
      setRailroad: () => {
        const p = engine.getCurrentPlayer();
        const rrTiles = SAIGON_BOARD_DATA.filter((t) => t.type === 'railroad');
        rrTiles.forEach((t) => {
          engine.state.properties[t.id] = { owner: p.id, houses: 0, isMortgaged: false };
        });
        boardRenderer.updateOwners(engine.state.properties, engine.state.players);
        hud.update(engine.state);
        showToast(`🚆 Đã cấp 4 Bến Xe cho ${p.name}`);
        autoSaveGame();
      },
      go: () => window.test.nhay(0),
      tax: () => window.test.nhay(4),
      jackpot: () => window.test.nhay(20),
      utility: () => window.test.nhay(12),
      gotojail: () => window.test.nhay(30),
      auction: () => window.test.dauGia(),
      trade: () => window.test.giaoDich(),
      chance: () => window.test.rutThe('chance'),
      chest: () => window.test.rutThe('chest'),
      bankruptP2: () => window.test.phaSanP2(),
      winGame: () => window.test.thangNgay(),
      emoteTears: () => window.test.emote('😭'),
      emoteMoney: () => window.test.emote('🤑'),
      emoteAngry: () => window.test.emote('😡'),
      emoteCool: () => window.test.emote('😎')
    });
  };

  // 3. Đăng ký đối tượng window.test phục vụ debug qua F12 Console
  window.test = {
    nhay: async (tileId) => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      await resolveLanding(p, Number(tileId), false);
    },
    teleport: async (tileId) => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      await resolveLanding(p, Number(tileId), false);
    },
    choTien: (amountM = 20) => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      p.money += amountM * 1_000_000;
      hud.update(engine.state);
      showToast(`💰 Đã cộng ${amountM}M cho ${p.name}`);
      autoSaveGame();
    },
    choTatCaDat: () => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      const buyableTiles = SAIGON_BOARD_DATA.filter((t) => ['property', 'railroad', 'utility'].includes(t.type));
      buyableTiles.forEach((t) => {
        engine.state.properties[t.id] = { owner: p.id, houses: 0, isMortgaged: false };
      });
      boardRenderer.updateOwners(engine.state.properties, engine.state.players);
      hud.update(engine.state);
      sound.playSuccess();
      addGameLog(`🏰 ${p.name} đã sở hữu TOÀN BỘ 28 BĐS trên bàn cờ!`);
      showToast(`🏰 Đã cấp toàn bộ 28 BĐS trên bàn cờ cho ${p.name}!`);
      autoSaveGame();
    },
    choBoDat: (group = 'brown') => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      const groupTiles = SAIGON_BOARD_DATA.filter((t) => t.group === group);
      groupTiles.forEach((t) => {
        engine.state.properties[t.id] = { owner: p.id, houses: 0, isMortgaged: false };
      });
      boardRenderer.updateOwners(engine.state.properties, engine.state.players);
      hud.update(engine.state);
      showToast(`🏘️ Đã cấp trọn bộ màu [${group}] cho ${p.name}`);
      autoSaveGame();
    },
    vaoTu: () => {
      const engine = getEngine();
      if (!engine) return;
      const p = engine.getCurrentPlayer();
      engine.sendToJail(p);
      tokenRenderer.render(engine.state.players);
      hud.update(engine.state);
      showJailOptions(p);
      showToast(`🚔 Đã đưa ${p.name} vào tù!`);
      autoSaveGame();
    },
    dauGia: (tileId) => {
      const engine = getEngine();
      if (!engine) return;
      const tid = tileId !== undefined ? tileId : engine.getCurrentPlayer().position;
      const t = SAIGON_BOARD_DATA[tid];
      if (!t || !t.price) {
        showToast("Ô này không phải bất động sản để đấu giá!");
        return;
      }
      engine.applyAction({ type: "START_AUCTION", tileId: t.id });
      if (engine.state.auction) {
        auctionModal.render(
          engine,
          (res) => {
            showToast(res?.message || "Đấu giá hoàn tất");
            hud.update(engine.state);
            autoSaveGame();
          },
          () => {
            auctionModal.render(engine);
          }
        );
      }
    },
    giaoDich: () => {
      const engine = getEngine();
      if (!engine) return;
      const btnTrade = document.getElementById('btn-action-trade');
      if (btnTrade) btnTrade.click();
    },
    rutThe: (type = 'chance') => {
      const engine = getEngine();
      if (!engine) return;
      const card = engine.drawCard(type);
      const res = engine.executeCard(engine.getCurrentPlayer(), card);
      sound.playCardDraw();
      showToast(`🎴 [${type === 'chance' ? 'Cơ Hội' : 'Khí Vận'}] ${card.title}`);
      addGameLog(`🎴 Test rút ${type}: ${card.title} - ${res.message || ''}`);
    },
    phaSanP2: () => {
      const engine = getEngine();
      if (!engine) return;
      const p1 = engine.state.players[0];
      const p2 = engine.state.players[1];
      if (p2 && !p2.isBankrupt) {
        const bRes = engine.declareBankruptcy(p2, p1);
        boardRenderer.updateOwners(engine.state.properties, engine.state.players);
        tokenRenderer.render(engine.state.players);
        hud.update(engine.state);
        sound.playJail();
        addGameLog(bRes.message);
        showToast(bRes.message);
        if (bRes.isGameOver) {
          showGameOverModal(bRes.winner);
        } else {
          autoSaveGame();
        }
      } else {
        showToast('Tất cả đối thủ đều đã phá sản!');
      }
    },
    thangNgay: () => {
      const engine = getEngine();
      if (!engine) return;
      const p1 = engine.state.players[0];
      engine.state.players.slice(1).forEach((bot) => {
        if (!bot.isBankrupt) {
          engine.declareBankruptcy(bot, p1);
        }
      });
      boardRenderer.updateOwners(engine.state.properties, engine.state.players);
      tokenRenderer.render(engine.state.players);
      hud.update(engine.state);
      sound.playSuccess();
      showGameOverModal(p1);
    },
    emote: (emoji = '🤑', playerId = null) => {
      const engine = getEngine();
      if (!engine) return;
      const pid = playerId || engine.getCurrentPlayer().id;
      if (ctx.triggerPlayerEmote) {
        ctx.triggerPlayerEmote(pid, emoji, 3000);
      }
    }
  };

  console.log('⚡ [Monopoly Saigon] Chế độ DEV LOCAL: Đã nạp bảng test luật (window.test)');
}

