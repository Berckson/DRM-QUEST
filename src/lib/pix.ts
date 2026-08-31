/**
 * Gerador de Pix Copia e Cola (BR Code estático — padrão EMV do Banco Central).
 */

export const DEFAULT_PIX_KEY = '965a1162-2e88-4085-b8e1-badc9a46907c';
export const PRO_PRICE = 24.99;
export const PRO_DESCRIPTION = 'DRM Quest Pro';

function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

/** CRC16-CCITT (0x1021), polinômio exigido pelo BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Remove acentos e caracteres não permitidos pelo padrão. */
function normalize(text: string, max: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .-]/g, '')
    .trim()
    .slice(0, max)
    .toUpperCase();
}

export interface PixParams {
  key: string;
  amount?: number;
  merchantName?: string;
  merchantCity?: string;
  description?: string;
  txid?: string;
}

export function buildPixPayload({
  key,
  amount = PRO_PRICE,
  merchantName = 'DRM QUEST',
  merchantCity = 'FORTALEZA',
  description = PRO_DESCRIPTION,
  txid = '***',
}: PixParams): string {
  const merchantAccount =
    tlv('00', 'br.gov.bcb.pix') + tlv('01', key.trim()) + (description ? tlv('02', normalize(description, 40)) : '');

  let payload =
    tlv('00', '01') +
    tlv('01', '11') +
    tlv('26', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', normalize(merchantName, 25) || 'DRM QUEST') +
    tlv('60', normalize(merchantCity, 15) || 'FORTALEZA') +
    tlv('62', tlv('05', normalize(txid, 25) || '***'));

  payload += '6304';
  return payload + crc16(payload);
}
