/* eslint-disable */
/**
 * TestPanelModal.js - Bảng Công Cụ Thử Nghiệm Nhanh Các Luật Chơi (Chỉ lưu ở local dev)
 */

export class TestPanelModal {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    let overlay = document.getElementById('test-panel-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'test-panel-modal';
      overlay.className = 'modal-backdrop';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
    }
    this.overlay = overlay;
  }

  show(actions = {}) {
    this.overlay.innerHTML = `
      <div class="test-panel-card" style="
        width: 100%;
        max-width: 480px;
        background: #FFFDF8;
        border-radius: 20px;
        border: 3px solid #E67E22;
        box-shadow: 0 25px 60px rgba(230, 126, 34, 0.35);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: var(--font-ui, sans-serif);
      ">
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #E67E22, #D35400);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #FFF;
          border-bottom: 2px solid #BA4A00;
        ">
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; color: #FFE066; letter-spacing: 1px;">CHẾ ĐỘ THỬ NGHIỆM</div>
            <h2 style="font-family: var(--font-retro, sans-serif); font-size: 1.3rem; font-weight: 900; margin: 2px 0 0; color: #FFF;">⚡ BẢNG TEST NHANH LUẬT CHƠI</h2>
          </div>
          <button id="btn-close-test-panel" style="
            background: rgba(0,0,0,0.2);
            border: none;
            color: #FFF;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          ">&times;</button>
        </div>

        <!-- Body -->
        <div style="padding: 18px; max-height: 70vh; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Nhóm 1: Vào tù & Ra tù -->
          <div style="background: #FDEDEC; border: 1.5px solid #F5B7B1; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #78281F; margin-bottom: 8px;">🚔 1. VÀO TÙ & RA TÙ (MỚI)</div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
              <button class="test-act-btn" data-act="jail" style="background: #C0392B; color: #FFF;">
                🚨 Bắt Vào Tù Ngay (Thử Lắc Đôi / Trả 500K)
              </button>
            </div>
          </div>

          <!-- Nhóm 2: Tài chính & Độc quyền bộ màu -->
          <div style="background: #FEF9E7; border: 1.5px solid #F9E79F; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #7D6608; margin-bottom: 8px;">💰 2. BƠM TIỀN & NHẬN BỘ MÀU (XÂY NHÀ / x2 THUÊ)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="test-act-btn" data-act="money50" style="background: #27AE60; color: #FFF;">
                💵 +50 Triệu Tiền Mặt
              </button>
              <button class="test-act-btn" data-act="setAllProperties" style="background: #8D6E63; color: #FFF;">
                🏰 Sở Hữu Tất Cả BĐS (28 Ô)
              </button>
              <button class="test-act-btn" data-act="setOrange" style="background: #E67E22; color: #FFF;">
                🏙️ Cấp Bộ Cam (3 Ô)
              </button>
              <button class="test-act-btn" data-act="setRailroad" style="background: #34495E; color: #FFF;">
                🚆 Cấp 4 Bến Xe
              </button>
            </div>
          </div>

          <!-- Nhóm 3: Nhảy thẳng đến ô quy tắc -->
          <div style="background: #E8F8F5; border: 1.5px solid #A3E4D7; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #117864; margin-bottom: 8px;">📍 3. DỊCH CHUYỂN TỨC THỜI (TELEPORT)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="test-act-btn" data-act="go" style="background: #16A085; color: #FFF;">
                🚩 Nhảy Đến Ô GO (#0)
              </button>
              <button class="test-act-btn" data-act="tax" style="background: #D35400; color: #FFF;">
                💸 Ô Thuế Thu Nhập (#4)
              </button>
              <button class="test-act-btn" data-act="jackpot" style="background: #F39C12; color: #FFF;">
                🎰 Ô Hũ Jackpot (#20)
              </button>
              <button class="test-act-btn" data-act="gotojail" style="background: #C0392B; color: #FFF;">
                🚨 Ô Vào Tù Ngay (#30)
              </button>
              <button class="test-act-btn" data-act="utility" style="background: #2980B9; color: #FFF;">
                💡 Ô Cấp Điện (#12)
              </button>
              <button class="test-act-btn" data-act="brown" style="background: #795548; color: #FFF;">
                🟤 Cấp Bộ Nâu (#1 & #3)
              </button>
            </div>
          </div>

          <!-- Nhóm 4: Tính năng nâng cao -->
          <div style="background: #EBF5FB; border: 1.5px solid #AED6F1; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #1B4F72; margin-bottom: 8px;">🎯 4. THỬ NGHIỆM ĐẤU GIÁ & RÚT BÀI</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="test-act-btn" data-act="auction" style="background: #8E44AD; color: #FFF;">
                🔨 Mở Đấu Giá Đất
              </button>
              <button class="test-act-btn" data-act="trade" style="background: #2E4053; color: #FFF;">
                🤝 Mở Giao Dịch
              </button>
              <button class="test-act-btn" data-act="chance" style="background: #E67E22; color: #FFF;">
                ❓ Rút Thẻ Cơ Hội
              </button>
              <button class="test-act-btn" data-act="chest" style="background: #2980B9; color: #FFF;">
                📦 Rút Thẻ Khí Vận
              </button>
            </div>
          </div>

          <!-- Nhóm 5: Thử nghiệm kết thúc ván đấu -->
          <div style="background: #FADBD8; border: 1.5px solid #F1948A; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #78281F; margin-bottom: 8px;">🏆 5. THỬ NGHIỆM PHÁ SẢN & THẮNG CUỘC</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="test-act-btn" data-act="bankruptP2" style="background: #E74C3C; color: #FFF;">
                💥 Cho Bot 2 Phá Sản
              </button>
              <button class="test-act-btn" data-act="winGame" style="background: #27AE60; color: #FFF;">
                👑 Thắng Game Ngay
              </button>
            </div>
          </div>

          <!-- Nhóm 6: Thử nghiệm bong bóng cảm xúc (Emotes) -->
          <div style="background: #FFF3E0; border: 1.5px solid #FFE0B2; border-radius: 12px; padding: 12px;">
            <div style="font-weight: 800; font-size: 0.85rem; color: #E65100; margin-bottom: 8px;">🎭 6. BONG BÓNG BIỂU CẢM (EMOTES)</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <button class="test-act-btn" data-act="emoteTears" style="background: #3498DB; color: #FFF; font-size: 0.85rem;">
                😭 Khóc
              </button>
              <button class="test-act-btn" data-act="emoteMoney" style="background: #2ECC71; color: #FFF; font-size: 0.85rem;">
                🤑 Tiền
              </button>
              <button class="test-act-btn" data-act="emoteAngry" style="background: #E74C3C; color: #FFF; font-size: 0.85rem;">
                😡 Quạu
              </button>
              <button class="test-act-btn" data-act="emoteCool" style="background: #9B59B6; color: #FFF; font-size: 0.85rem;">
                😎 Ngầu
              </button>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="
          padding: 12px 20px;
          background: #FAF7F0;
          border-top: 1.5px solid #E8DFCA;
          display: flex;
          justify-content: flex-end;
        ">
          <button id="btn-done-test-panel" style="
            background: #E67E22;
            color: #FFF;
            border: none;
            padding: 8px 20px;
            border-radius: 8px;
            font-weight: 800;
            cursor: pointer;
          ">ĐÓNG</button>
        </div>
      </div>
    `;

    this.overlay.style.display = 'flex';
    this.overlay.classList.add('active');

    // CSS cho nút test
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .test-act-btn {
        border: none;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .test-act-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      .test-act-btn:active {
        transform: translateY(1px);
      }
    `;
    this.overlay.appendChild(styleEl);

    // Bắt sự kiện click đóng
    const close = () => this.close();
    document.getElementById('btn-close-test-panel')?.addEventListener('click', close);
    document.getElementById('btn-done-test-panel')?.addEventListener('click', close);

    // Gắn handler cho các nút hành động
    this.overlay.querySelectorAll('.test-act-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.getAttribute('data-act');
        if (actions[act] && typeof actions[act] === 'function') {
          actions[act]();
          this.close();
        }
      });
    });
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      this.overlay.style.display = 'none';
    }
  }
}

