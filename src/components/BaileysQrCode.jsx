import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

/**
 * Componente especial otimizado para exibir QR codes do formato Baileys
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.value - Texto do QR code (formato Baileys)
 * @param {number} props.size - Tamanho do QR code (padrão: 256)
 * @param {string} props.bgColor - Cor de fundo (padrão: "#ffffff")
 * @param {string} props.fgColor - Cor do QR code (padrão: "#000000")
 * @param {Function} props.onLoad - Callback quando o QR code é carregado com sucesso
 * @param {Function} props.onError - Callback quando há erro na renderização
 */
const BaileysQrCode = ({ 
  value, 
  size = 256, 
  bgColor = "#ffffff", 
  fgColor = "#000000", 
  onLoad,
  onError
}) => {
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  
  // Limpar estados quando o QR code muda
  useEffect(() => {
    setFallbackUrl(null);
    setHasError(false);
  }, [value]);
  
  // Se o componente interno falhar, use a API externa como fallback
  const handleError = () => {
    console.error("Falha na renderização do QR code, tentando abordagem alternativa...");
    setHasError(true);
    if (onError) onError();
    
    // Usar Google Charts como backup
    setFallbackUrl(`https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chld=L|0&chl=${encodeURIComponent(value)}`);
  };
  
  const handleLoad = () => {
    if (onLoad) onLoad();
  };
  
  // Se já tivemos um erro e temos um URL de fallback, use-o
  if (hasError && fallbackUrl) {
    return (
      <img 
        src={fallbackUrl} 
        width={size} 
        height={size} 
        alt="QR Code (fallback)"
        onLoad={handleLoad}
        style={{ borderRadius: '4px' }}
      />
    );
  }
  
  // Renderize o QR code com a biblioteca react-qrcode
  return (
    <div style={{ width: size, height: size, background: bgColor, borderRadius: '4px', padding: '0' }}>
      <QRCode
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="M" // Nível de correção de erros médio 
        renderAs="svg" // SVG é melhor para a precisão
        includeMargin={true}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default BaileysQrCode; 