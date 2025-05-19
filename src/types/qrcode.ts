export type QRCodeStatus = 'pending' | 'connected' | 'disconnected' | 'error';

export interface QRCodeData {
  qrCode: string;
  status: QRCodeStatus;
} 