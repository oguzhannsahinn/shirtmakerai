import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [designs, setDesigns] = useState([]);
  const [selectedColors, setSelectedColors] = useState({
    shirt: '#FFFFFF',
    horizontal: '#000000',
    vertical: '#000000'
  });
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [favoriteDesigns, setFavoriteDesigns] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const [showFavoriteAnimation, setShowFavoriteAnimation] = useState(false);

  // Benzersiz tasarımları kontrol eden yardımcı fonksiyon
  const isUniqueDesign = (newDesign, existingDesigns) => {
    return !existingDesigns.some(design => 
      design.baseColor === newDesign.baseColor &&
      design.horizontalStyle.color === newDesign.horizontalStyle.color &&
      design.verticalStyle.color === newDesign.verticalStyle.color &&
      design.horizontalLines === newDesign.horizontalLines &&
      design.verticalPairsCount === newDesign.verticalPairsCount
    );
  };

  // Seçilen renge yakın renkler üret
  const generateSimilarColors = (baseColor) => {
    // Geçerli bir hex renk kodu kontrolü
    if (!baseColor || !/^#[0-9A-F]{6}$/i.test(baseColor)) {
      return Array(5).fill('#FFFFFF');
    }

    const hexToHSL = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [h * 360, s * 100, l * 100];
    };

    const HSLToHex = (h, s, l) => {
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const [hue, saturation, lightness] = hexToHSL(baseColor);

    return Array(5).fill(null).map((_, index) => {
      if (index === 0) return baseColor;

      const hueChange = (Math.random() - 0.5) * 30;
      const saturationChange = (Math.random() - 0.5) * 20;
      const lightnessChange = (Math.random() - 0.5) * 15;

      const newHue = (hue + hueChange + 360) % 360;
      const newSaturation = Math.max(20, Math.min(95, 
        saturation + saturationChange
      ));
      const newLightness = Math.max(20, Math.min(85, 
        lightness + lightnessChange
      ));

      return HSLToHex(newHue, newSaturation, newLightness);
    });
  };

  // Rastgele renk üretme fonksiyonu
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Düğme sırası için pozisyonları hesapla
  const generateButtonPositions = () => {
    const buttonCount = 6; // Sabit 6 düğme
    const startPosition = 20; // Başlangıç pozisyonunu yukarı çekelim
    const endPosition = 80; // Bitiş pozisyonunu aşağı indirelim
    const spacing = (endPosition - startPosition) / (buttonCount - 1);
    
    return Array(buttonCount).fill(null).map((_, index) => ({
      top: `${startPosition + (spacing * index)}%`
    }));
  };

  const generateShirtDesign = (useSelectedColors = false) => {
    const horizontalLines = Math.floor(Math.random() * 3) + 3;
    const verticalPairsCount = Math.floor(Math.random() * 2) + 1;
    const buttons = generateButtonPositions();

    let baseColor, horizontalColor, verticalColor;

    if (useSelectedColors && selectedColors) {
      // Renk varyasyonlarını oluştur
      const shirtColors = generateSimilarColors(selectedColors.shirt, true);
      const horizontalColors = generateSimilarColors(selectedColors.horizontal, false);
      const verticalColors = generateSimilarColors(selectedColors.vertical, false);

      // Renkleri seç
      baseColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      horizontalColor = horizontalColors[Math.floor(Math.random() * horizontalColors.length)];
      verticalColor = verticalColors[Math.floor(Math.random() * verticalColors.length)];
    } else {
      baseColor = generateRandomColor();
      horizontalColor = generateRandomColor();
      verticalColor = generateRandomColor();
    }

    return {
      horizontalLines,
      verticalPairsCount,
      baseColor,
      horizontalStyle: {
        color: horizontalColor,
        width: `${Math.random() * 2 + 2}px`
      },
      verticalStyle: {
        color: verticalColor,
        width: `${Math.random() * 2 + 2}px`
      },
      buttons,
      id: Math.random().toString(36).substr(2, 9)
    };
  };

  const generateDesigns = (useSelectedColors = false) => {
    const newDesigns = [];
    while (newDesigns.length < 10) {
      const design = generateShirtDesign(useSelectedColors);
      if (isUniqueDesign(design, [...newDesigns, ...favoriteDesigns])) {
        newDesigns.push(design);
      }
    }
    setDesigns(newDesigns);
  };

  const addToFavorites = (design) => {
    if (!isUniqueDesign(design, favoriteDesigns)) return;
    // Tasarımın derin kopyasını oluştur
    const designCopy = {
      ...design,
      horizontalStyle: { ...design.horizontalStyle },
      verticalStyle: { ...design.verticalStyle },
      buttons: [...design.buttons]
    };
    setFavoriteDesigns(prev => [...prev, designCopy]);
    // Favori animasyonunu göster
    setShowFavoriteAnimation(true);
    // 1.5 saniye sonra animasyonu kaldır
    setTimeout(() => setShowFavoriteAnimation(false), 1500);
  };

  const removeFromFavorites = (index) => {
    setFavoriteDesigns(prev => prev.filter((_, i) => i !== index));
  };

  const handleColorChange = (type, color) => {
    setSelectedColors(prev => ({
      ...prev,
      [type]: color
    }));
  };

  const handleUseDesign = async () => {
    if (!selectedDesign) return;
    
    setIsLoading(true);
    
    try {
      // Seçilen tasarımın renklerini kullan
      const baseColors = {
        shirt: selectedDesign.baseColor,
        horizontal: selectedDesign.horizontalStyle.color,
        vertical: selectedDesign.verticalStyle.color
      };

      // Yeni tasarımları oluştur
      const newDesigns = [
        {...selectedDesign} // İlk tasarım olarak seçili gömleği ekle
      ];

      // Yapay gecikme ekle
      await new Promise(resolve => setTimeout(resolve, 800));

      // Geri kalan tasarımları oluştur
      while (newDesigns.length < 10) {
        const shirtColors = generateSimilarColors(baseColors.shirt);
        const horizontalColors = generateSimilarColors(baseColors.horizontal);
        const verticalColors = generateSimilarColors(baseColors.vertical);

        const design = {
          horizontalLines: Math.floor(Math.random() * 3) + 3,
          verticalPairsCount: Math.floor(Math.random() * 2) + 1,
          baseColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
          horizontalStyle: {
            color: horizontalColors[Math.floor(Math.random() * horizontalColors.length)],
            width: `${Math.random() * 2 + 2}px`
          },
          verticalStyle: {
            color: verticalColors[Math.floor(Math.random() * verticalColors.length)],
            width: `${Math.random() * 2 + 2}px`
          },
          buttons: generateButtonPositions(),
          id: Math.random().toString(36).substr(2, 9)
        };

        if (isUniqueDesign(design, newDesigns)) {
          newDesigns.push(design);
        }
      }

      setDesigns(newDesigns);
      setShowModal(false);
    } catch (error) {
      console.error('Tasarım oluşturma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Örnek gömlek tasarımı
  const exampleShirt = {
    horizontalLines: 3,
    verticalPairsCount: 2,
    baseColor: '#4ecdc4',
    horizontalStyle: {
      color: '#2c3e50',
      width: '2.5px'
    },
    verticalStyle: {
      color: '#34495e',
      width: '2.5px'
    },
    additionalHorizontalStyle: {
      color: '#95a5a6',
      width: '1.5px'
    },
    additionalVerticalStyle: {
      color: '#7f8c8d',
      width: '1.5px'
    },
    buttons: [30, 45, 60],
    id: 'example'
  };

  // Örnek gömlek için CSS güncellemesi
  const exampleShirtStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 100px)', // navbar yüksekliğini çıkardık
    padding: '20px'
  };

  // Başlangıçta örnek gömleği göster
  useEffect(() => {
    setDesigns([exampleShirt]);
  }, []); // Boş dependency array ile sadece bir kere çalışacak

  const handleDesignClick = (design) => {
    setSelectedDesign(design);
    setShowModal(true);
  };

  return (
    <div className="app">
       {showFavoriteAnimation && (
        <div className="favorite-animation">
          <span className="heart">❤️</span>
          <p>Favorilere Eklendi!</p>
        </div>
      )}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">shirtmaker</span>
          <span className="logo-ai">ai</span>
        </div>
        <button 
          className={`favorites-toggle ${showFavorites ? 'active' : ''}`}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <span className="favorites-icon">❤️</span>
          Favoriler {favoriteDesigns.length > 0 && `(${favoriteDesigns.length})`}
        </button>
      </nav>

      {showWelcome && (
        <div className="welcome-container">
          <div className="welcome-content">
            <h2>AI Gömlek Tasarımcısına Hoş Geldiniz! 👕</h2>
            <div className="welcome-grid">
              <div className="welcome-text">
                <p>Bu platform ile:</p>
                <ul>
                  <li>✨ Benzersiz gömlek tasarımları oluşturabilir</li>
                  <li>🎨 Renk kombinasyonlarını keşfedebilir</li>
                  <li>💡 Seçtiğiniz gömleğe benzer tasarımlar üretebilir</li>
                  <li>❤️ Favori tasarımlarınızı kaydedebilirsiniz</li>
                </ul>
                <p>Hemen denemeye başlayın!</p>
              </div>
            </div>
            <button 
              className="welcome-close" 
              onClick={() => setShowWelcome(false)}
            >
              Anladım, Başlayalım!
            </button>
          </div>
        </div>
      )}

      <div className="main-content">

      <div className="color-selectors">
          <div className="color-picker-container">
            <label>Gömlek Rengi</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={selectedColors.shirt}
                onChange={(e) => handleColorChange('shirt', e.target.value)}
              />
              <span className="color-value">{selectedColors.shirt}</span>
            </div>
          </div>
          <div className="color-picker-container">
            <label>Yatay Çizgi Rengi</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={selectedColors.horizontal}
                onChange={(e) => handleColorChange('horizontal', e.target.value)}
              />
              <span className="color-value">{selectedColors.horizontal}</span>
            </div>
          </div>
          <div className="color-picker-container">
            <label>Dikey Çizgi Rengi</label>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                value={selectedColors.vertical}
                onChange={(e) => handleColorChange('vertical', e.target.value)}
              />
              <span className="color-value">{selectedColors.vertical}</span>
            </div>
          </div>
        </div>
        
        <div className="buttons">
          <button onClick={() => generateDesigns(false)} className="button-random">
            Rastgele Tasarla
          </button>
          <button onClick={() => generateDesigns(true)} className="button-similar">
            Seçili Renklerle Tasarla
          </button>
        </div>
      
        {designs?.length === 1 ? (
          <div className="initial-design-container">
            <div className="welcome-message">
              <h2>Hoş Geldiniz! 👕</h2>
              <p>Başlamak için aşağıdaki gömleğe tıklayın veya yukarıdaki alandan kendi tasarımınızı oluşturun.</p>
            </div>
            <div 
              className="initial-shirt-container"
              onClick={() => handleDesignClick(designs[0])}
            >
              <ShirtDesign {...designs[0]} />
            </div>
          </div>
        ) : (
          <div className="designs-grid">
            {designs?.map((design) => (
              <div
                key={design.id}
                className="design-item"
                onClick={() => handleDesignClick(design)}
              >
                <ShirtDesign {...design} />
              </div>
            ))}
          </div>
        )}

        {showFavorites && (
          <div className="favorites-panel">
            <div className="favorites-header">
              <h3>Favori Tasarımlar</h3>
              <button 
                className="close-favorites"
                onClick={() => setShowFavorites(false)}
              >
                ×
              </button>
            </div>
            <div className="favorites-list">
              {favoriteDesigns.map((design, index) => (
                <div key={index} className="favorite-item">
                  <div className="favorite-shirt-mini">
                    <ShirtDesign {...design} />
                  </div>
                  <div className="favorite-colors">
                    <div className="color-info">
                      <span className="color-label">Gömlek:</span>
                      <span className="color-value">{design.baseColor}</span>
                    </div>
                    <div className="color-info">
                      <span className="color-label">Yatay:</span>
                      <span className="color-value">{design.horizontalStyle.color}</span>
                    </div>
                    <div className="color-info">
                      <span className="color-label">Dikey:</span>
                      <span className="color-value">{design.verticalStyle.color}</span>
                    </div>
                  </div>
                  <button 
                    className="remove-favorite"
                    onClick={() => removeFromFavorites(index)}
                  >
                    Kaldır
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <div className="modal-shirt-container">
              <ShirtDesign {...selectedDesign} />
            </div>
            <div className="modal-buttons">
              <button 
                className="use-design-button"
                onClick={handleUseDesign}
              >
                Bu Tasarıma Benzer Gömlekler Oluştur
              </button>
              <button 
                className="add-favorite-button"
                onClick={() => {
                  addToFavorites(selectedDesign);
                  setShowModal(false);
                }}
              >
                Favorilere Ekle
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Tasarımlar Oluşturuluyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShirtDesign({ horizontalLines, verticalPairsCount, baseColor, horizontalStyle, verticalStyle, buttons }) {
  // Renk değerlerini kontrol et
  const safeBaseColor = baseColor || '#FFFFFF';
  const safeHorizontalColor = horizontalStyle?.color || '#000000';
  const safeVerticalColor = verticalStyle?.color || '#000000';

  // Dikey çizgilerin pozisyonlarını hesapla
  const verticalPositions = [];
  const spacing = 20; // İki çizgi arası minimum mesafe
  
  for (let i = 0; i < verticalPairsCount; i++) {
    const position = 25 + (spacing * i); // Sol taraf için pozisyon
    verticalPositions.push(
      { left: `${position}%` },      // Sol çizgi
      { left: `${100 - position}%` } // Sağ çizgi (simetrik)
    );
  }

  return (
    <div className="shirt-design" style={{ backgroundColor: safeBaseColor }}>
      {/* Düğmeler */}
      {buttons.map((button, index) => (
        <div
          key={`button-${index}`}
          className="button"
          style={{
            top: button.top,
            left: '50%',
            transform: 'translateX(-50%)',
            position: 'absolute'
          }}
        />
      ))}

      {/* Yatay çizgiler */}
      {Array(horizontalLines).fill(null).map((_, i) => (
        <div
          key={`h-${i}`}
          className="horizontal-line"
          style={{
            '--stripe-color': safeHorizontalColor,
            '--stripe-width': horizontalStyle.width,
            top: `${25 + (i * (65 / (horizontalLines - 1)))}%`
          }}
        />
      ))}

      {/* Dikey çizgiler - simetrik yerleşim */}
      {verticalPositions.map((position, index) => (
        <div
          key={`v-${index}`}
          className="vertical-line"
          style={{
            '--stripe-color': safeVerticalColor,
            '--stripe-width': verticalStyle.width,
            left: position.left
          }}
        />
      ))}
    </div>
  );
}

export default App; 