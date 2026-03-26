type LegacyAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

export function useMonopolyAudio() {
  let audioCtx: AudioContext | null = null

  const initAudio = () => {
    if (typeof window === 'undefined') return
    if (!audioCtx) {
      const audioWindow = window as LegacyAudioWindow
      const AudioContextCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
      if (!AudioContextCtor) return

      audioCtx = new AudioContextCtor()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
  }

  const playStep = () => {
    if (!audioCtx) return
    const t = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1)
    
    gain.gain.setValueAtTime(0.5, t)
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.start(t)
    osc.stop(t + 0.1)
  }

  const playShake = () => {
    if (!audioCtx) return
    const t = audioCtx.currentTime
    const bufferSize = audioCtx.sampleRate * 0.8 // 0.8 giây
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
    }
    
    const noise = audioCtx.createBufferSource()
    noise.buffer = buffer

    // Lọc dải cao để vỡ âm thanh nhựa lách cách
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1000

    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(1, t)
    
    // Rung lắc tremolo bằng cách modulate gain (vụt vụt)
    const tremolo = audioCtx.createGain()
    tremolo.gain.value = 0
    const tremoloOsc = audioCtx.createOscillator()
    tremoloOsc.type = 'sawtooth'
    tremoloOsc.frequency.value = 14 // tốc độ rung của xúc xắc
    tremoloOsc.connect(tremolo.gain)
    tremoloOsc.start(t)
    tremoloOsc.stop(t + 0.8)

    // Làm mờ nhanh dần đều âm lượng
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8)

    noise.connect(filter)
    filter.connect(tremolo)
    tremolo.connect(gain)
    gain.connect(audioCtx.destination)
    
    noise.start(t)
    noise.stop(t + 0.8)
  }

  const playMoney = () => {
    if (!audioCtx) return
    const t = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, t)
    osc.frequency.setValueAtTime(1200, t + 0.1)
    
    gain.gain.setValueAtTime(0.3, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.3)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + 0.3)
  }

  const playBad = () => {
    if (!audioCtx) return
    const t = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.linearRampToValueAtTime(50, t + 0.4)
    
    gain.gain.setValueAtTime(0.5, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.4)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  }

  return { initAudio, playStep, playShake, playMoney, playBad }
}
