// 1. Tu arreglo original con los tiempos exactos de la canción (en segundos)
const lyricsTimeline = [
  { time: 0, text: "La-la, la-la, la-la, la-la, la-la-la" },
  { time: 4, text: "La-la, la-la, la-la, la-la, la-la-la" },
  { time: 8, text: "La-la, la-la, la-la, la-la, la-la-la" },
  { time: 12, text: "Laaaaaa" },
  { time: 14, text: "..." },
  { time: 46, text: "Todo tiene el color" },
  { time: 54, text: "De tus ojos, como ves" },
  { time: 62, text: "Todo cambia, no así tu voz" },
  { time: 69, text: "Cuando me hablas en francés limón" },
  { time: 75, text: "En un barco de papel yo volveré" },
  { time: 83, text: "Por ti mi amor" },
  { time: 87, text: "francés limón" },
  { time: 90, text: "Las luces de la ciudad" },
  { time: 94, text: "Se apagarán" },
  { time: 98, text: "Te besaré" },
  { time: 102, text: "Me besaras" },
  { time: 108, text: "Me encanta tu actitud" },
  { time: 115, text: "Dios conserve tu salud" },
  { time: 123, text: "Solo por mirarte, comprendi" },
  { time: 131, text: "Para que yo vine aqui" },
  { time: 136, text: "En un barco de papel" },
  { time: 140, text: "Yo volvere" },
  { time: 144, text: "Por ti mi amor" },
  { time: 148, text: "Francés limón" },
  { time: 151, text: "Las luces de la ciudad" },
  { time: 155, text: "Se apagarán" },
  { time: 159, text: "Te besaré" },
  { time: 163, text: "Me besaras" },
  { time: 167, text: "..." }
];

const SONG_DURATION = Math.max(180, ...lyricsTimeline.map((item) => item.time + 10));

// 2. Elementos de la interfaz vinculados correctamente
const audio = document.getElementById('audio-track');
const lyricsScroll = document.getElementById('lyrics-scroll');
const progressBar = document.getElementById('progress');
const progressBarClick = document.getElementById('progress-bar-click');
const currentTimeLabel = document.getElementById('current-time');
const durationLabel = document.getElementById('duration');

const btnPlay = document.getElementById('play');
const btnPrev = document.getElementById('previous');
const btnNext = document.getElementById('next');
const btnMute = document.getElementById('mute');
const btnRepeat = document.getElementById('repeat');
const btnShuffle = document.getElementById('shuffle');
const volumeSlider = document.getElementById('volume');
const speedSlider = document.getElementById('speed');
const speedLabel = document.getElementById('speed-label');
const btnUp = document.getElementById('scroll-up');
const btnDown = document.getElementById('scroll-down');
const statusLabel = document.getElementById('status');

const playIcon = '<i class="fa-solid fa-play"></i>';
const pauseIcon = '<i class="fa-solid fa-pause"></i>';

let currentIndex = -1;
let isPlaying = false;
let simulatedTime = 0;
let simulationInterval = null;
let useSimulation = false;
let isMuted = false;
let isRepeat = false;
let isShuffle = false;

audio.preload = 'auto';
audio.muted = false;
audio.volume = Number(volumeSlider.value || 0.8);

volumeSlider.addEventListener('input', (event) => {
  const volume = Number(event.target.value);
  audio.volume = volume;
  isMuted = volume === 0;
  const muteIcon = btnMute.querySelector('i');
  if (muteIcon) {
    muteIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  }
});

btnMute.addEventListener('click', () => {
  isMuted = !isMuted;
  audio.muted = isMuted;

  const muteIcon = btnMute.querySelector('i');
  if (muteIcon) {
    muteIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  }

  volumeSlider.value = isMuted ? '0' : '0.8';
  audio.volume = Number(volumeSlider.value);
});

btnRepeat.addEventListener('click', () => {
  isRepeat = !isRepeat;
  btnRepeat.style.color = isRepeat ? '#c5b3ff' : 'rgba(255,255,255,0.8)';
  btnRepeat.style.opacity = isRepeat ? '1' : '0.8';
});

btnShuffle.addEventListener('click', () => {
  isShuffle = !isShuffle;
  btnShuffle.style.color = isShuffle ? '#c5b3ff' : 'rgba(255,255,255,0.8)';
  btnShuffle.style.opacity = isShuffle ? '1' : '0.8';
});

speedSlider.addEventListener('input', (event) => {
  const speed = Number(event.target.value);
  if (audio && typeof audio.playbackRate !== 'undefined') {
    audio.playbackRate = speed;
  }
  speedLabel.textContent = `${speed.toFixed(2)}x`;
});

audio.addEventListener('loadeddata', () => {
  useSimulation = false;
  statusLabel.textContent = 'Audio listo';
});

audio.addEventListener('error', () => {
  useSimulation = false;
  statusLabel.textContent = 'No se pudo cargar el audio';
  console.error('No se pudo cargar el archivo de audio:', audio.src || 'musica.mp3');
});

// Formatear segundos al estándar MM:SS
function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

// 3. Renderizar inicialmente la estructura de la letra
function renderLyrics() {
  lyricsScroll.innerHTML = '';
  lyricsTimeline.forEach((item, index) => {
    const div = document.createElement('div');
    div.classList.add('lyric-line');
    div.textContent = item.text;
    div.addEventListener('click', () => { seekToTime(item.time); });
    lyricsScroll.appendChild(div);
  });
  durationLabel.textContent = formatTime(SONG_DURATION);
}

// 4. Sincronizador de Letras (Efecto Spotify: resalta la activa y desplaza el contenedor)
function updateLyricsSync(currentTime) {
  currentTimeLabel.textContent = formatTime(currentTime);
  
  let activeIndex = -1;
  for (let i = 0; i < lyricsTimeline.length; i++) {
    if (currentTime >= lyricsTimeline[i].time) {
      activeIndex = i;
    }
  }
  
  if (activeIndex === -1) activeIndex = 0;

  if (activeIndex !== currentIndex) {
    currentIndex = activeIndex;
    const lines = document.querySelectorAll('.lyric-line');
    
    lines.forEach((line, idx) => {
      if (idx === currentIndex) {
        line.classList.add('active'); // Iluminación intensa en blanco
        
        // Mover el panel calculando la altura exacta del visor para centrar la línea de forma fluida
        const containerHeight = document.querySelector('.lyrics-window').clientHeight;
        const lineOffset = line.offsetTop;
        const lineHeight = line.clientHeight;
        const scrollPosition = lineOffset - (containerHeight / 2) + (lineHeight / 2);
        
        lyricsScroll.style.transform = `translateY(-${scrollPosition}px)`;
      } else {
        line.classList.remove('active'); // Mantener opacas las demás líneas
      }
    });
  }

  const duration = useSimulation ? SONG_DURATION : audio.duration;
  if (duration) {
    durationLabel.textContent = formatTime(duration);
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${Math.min(progressPercent, 100)}%`;
  }

  if (currentTime >= duration) {
    pauseTrack();
    seekToTime(0);
  }
}

// Escuchador de tiempo nativo del elemento de audio
audio.addEventListener('timeupdate', () => {
  if (!useSimulation) updateLyricsSync(audio.currentTime);
});

// 5. Controles del simulador inteligente (por si pruebas sin el .mp3 puesto)
function startSimulation() {
  simulationInterval = setInterval(() => {
    simulatedTime += 0.25;
    updateLyricsSync(simulatedTime);
  }, 250);
}

function stopSimulation() {
  clearInterval(simulationInterval);
}

function seekToTime(targetTime) {
  if (!useSimulation) {
    audio.currentTime = targetTime;
  } else {
    simulatedTime = targetTime;
    updateLyricsSync(simulatedTime);
  }
}

function playTrack() {
  isPlaying = true;
  btnPlay.innerHTML = pauseIcon;
  statusLabel.textContent = "Reproduciendo";

  audio.play()
    .then(() => {
      statusLabel.textContent = 'Reproduciendo';
    })
    .catch((error) => {
      isPlaying = false;
      btnPlay.innerHTML = playIcon;
      statusLabel.textContent = 'Abre la página en http://localhost:8000';
      console.warn('La reproducción del audio fue bloqueada por el navegador:', error);
    });
}

function pauseTrack() {
  isPlaying = false;
  btnPlay.innerHTML = playIcon;
  statusLabel.textContent = "Pausa";
  audio.pause();
}

// 6. Listeners para interactuar con los botones
btnPlay.addEventListener('click', () => {
  if (isPlaying) pauseTrack(); else playTrack();
});

btnNext.addEventListener('click', () => {
  if (currentIndex < lyricsTimeline.length - 1) seekToTime(lyricsTimeline[currentIndex + 1].time);
});

btnPrev.addEventListener('click', () => {
  if (currentIndex > 0) seekToTime(lyricsTimeline[currentIndex - 1].time);
});

btnDown.addEventListener('click', () => {
  if (currentIndex < lyricsTimeline.length - 1) seekToTime(lyricsTimeline[currentIndex + 1].time);
});
btnUp.addEventListener('click', () => {
  if (currentIndex > 0) seekToTime(lyricsTimeline[currentIndex - 1].time);
});

// Permitir hacer clic directo en la barra para adelantar o atrasar
progressBarClick.addEventListener('click', (e) => {
  const rect = progressBarClick.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const duration = useSimulation ? SONG_DURATION : audio.duration;
  seekToTime((clickX / rect.width) * duration);
});

// Inicializar la aplicación
renderLyrics();
updateLyricsSync(0);
