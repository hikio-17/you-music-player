import { useState, useEffect } from 'react';
import { Howl } from 'howler';
import './App.css';

function App() {
  // Daftar musik
  const [musicList] = useState([
    { title: 'Lose Yourself', src: '/songs/loseyourself.mp3', lrc: '/lrc/loseyourself.lrc' },
    { title: 'Mockingbird', src: '/songs/mockingbird.mp3', lrc: '/lrc/mockingbird.lrc' },
  ]);

  // State untuk menyimpan musik yang sedang diputar
  const [currentSound, setCurrentSound] = useState<Howl | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]); // State untuk menyimpan lirik dengan waktu
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0); // State untuk menyimpan indeks lirik yang sedang ditampilkan

  // Fungsi untuk memutar musik
  const playSound = async (src: string, lrc?: string) => {
    setCurrentSrc(src);
    if (lrc) {
      await fetchLyrics(lrc); // Ambil lirik jika ada
    } else {
      setLyrics([]); // Kosongkan lirik jika tidak ada
    }
  };

  // Fungsi untuk mengambil lirik dari file .lrc
  const fetchLyrics = async (lrc: string) => {
    try {
      const response = await fetch(lrc);
      const data = await response.text();
      const lines = data.split('\n').filter(line => line); // Ambil setiap baris lirik
      const parsedLyrics = lines.map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = parseInt(match[3], 10);
          const time = minutes * 60 + seconds + milliseconds / 100; // Hitung waktu dalam detik
          return { time, text: match[4].trim() };
        }
        return null;
      }).filter(Boolean) as { time: number; text: string }[]; // Hanya ambil lirik yang valid
      setLyrics(parsedLyrics); // Simpan lirik ke state
    } catch (error) {
      console.error('Error fetching lyrics:', error);
    }
  };

  // Effect untuk memutar musik saat src berubah
  useEffect(() => {
    if (currentSrc) {
      if (currentSound) {
        currentSound.stop(); // Hentikan musik sebelumnya jika ada
      }

      // Buat Howl baru untuk lagu yang dipilih
      const newSound = new Howl({
        src: [currentSrc],
        onload: function () {
          newSound.play();
          setIsPlaying(true);
        },
        onloaderror: function (id, error) {
          console.error('Error loading sound:', error);
        },
        onend: function () {
          setIsPlaying(false);
          setCurrentLyricIndex(0); // Reset indeks lirik saat musik selesai
        },
        onplay: function () {
          const updateLyrics = () => {
            const currentTime = newSound.seek(); // Ambil waktu sekarang
            const index = lyrics.findIndex(lyric => lyric.time > currentTime); // Cari indeks lirik yang sesuai
            // Jika indeks tidak ditemukan, gunakan indeks sebelumnya
            if (index !== -1) {
              setCurrentLyricIndex(index - 1); // Set indeks ke lirik sebelumnya
            } else if (currentTime >= lyrics[lyrics.length - 1].time) {
              setCurrentLyricIndex(lyrics.length - 1); // Jika sudah lewat lirik terakhir
            }
            requestAnimationFrame(updateLyrics); // Update lagi pada frame berikutnya
          };
          requestAnimationFrame(updateLyrics); // Mulai memperbarui lirik saat musik diputar
        }
      });

      setCurrentSound(newSound); // Simpan Howl yang baru diputar
    }
  }, [currentSrc, lyrics]);
  // Fungsi untuk menghentikan musik
  const stopSound = () => {
    if (currentSound) {
      currentSound.stop(); // Hentikan musik
      setIsPlaying(false); // Update status pemutaran
      setCurrentSound(null);
      setCurrentSrc(null);
      setLyrics([]); // Kosongkan lirik saat berhenti
      setCurrentLyricIndex(0); // Reset indeks lirik
    }
  };

  return (
    <div>
      <h1 className='title-apps'>You Music Player</h1>
    <div className='container'>
      <div className='container-music'>
        <ul>
          {/* Loop melalui daftar musik dan tampilkan judulnya */}
          {musicList.map((music, index) => (
            <li key={index}>
              <button onClick={() => playSound(music.src, music.lrc)}>
                {music.title}
              </button>
            </li>
          ))}
        </ul>
        {isPlaying && (
          <button onClick={stopSound}>
            Stop
          </button>
        )}
      </div>
      <div className='container-lyric'>
        {/* Tampilkan lirik lagu */}
        {lyrics.length > 0 && (
          <div className="lyrics">
            {lyrics.map((lyric, index) => (
              <p key={index} className={index === currentLyricIndex ? 'highlight' : ''}>
                {lyric.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default App;
