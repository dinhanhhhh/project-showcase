export interface OracleCard {
  id: string
  name: string
  message: string
  image: string // URL giả lập hoặc icon
  advice: string
}

export const ORACLE_CARDS: OracleCard[] = [
  {
    id: 'balance',
    name: 'Tìm lại sự Cân bằng',
    message: 'Cuộc sống là một điệu nhảy giữa nỗ lực và buông bỏ.',
    advice: 'Hôm nay, hãy dành 5 phút để thở sâu. Đừng ép bản thân phải hoàn hảo.',
    image: '⚖️'
  },
  {
    id: 'growth',
    name: 'Sự Phát triển Phía sau',
    message: 'Ngay cả khi bạn không thấy, hạt mầm vẫn đang nảy nở dưới lòng đất.',
    advice: 'Kiên nhẫn là chìa khóa. Những gì bạn gieo trồng đang sắp đến ngày hái quả.',
    image: '🌱'
  },
  {
    id: 'clarity',
    name: 'Ánh sáng Minh triết',
    message: 'Sương mù sẽ tan biến khi bạn ngừng chạy trốn chính mình.',
    advice: 'Hãy đối mặt với sự thật mà bạn đang lẩn tránh. Câu trả lời nằm ở đó.',
    image: '✨'
  },
  {
    id: 'courage',
    name: 'Ngọn lửa Can đảm',
    message: 'Nỗi sợ chỉ là một ảo ảnh ngăn cản bạn bước tới vinh quang.',
    advice: 'Làm điều mà bạn sợ nhất ngay hôm nay. Vũ trụ sẽ hỗ trợ bạn.',
    image: '🔥'
  },
  {
    id: 'harmony',
    name: 'Giai điệu Hòa hợp',
    message: 'Mọi mối quan hệ đều là tấm gương phản chiếu chính tâm hồn bạn.',
    advice: 'Gửi một lời cảm ơn đến một người đã từng giúp đỡ bạn.',
    image: '🎶'
  }
]
