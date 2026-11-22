import { Injectable } from '@angular/core';

declare let gtag: (...args: unknown[]) => void;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  /**
   * Substitua pelo seu Conversion ID e Conversion Label gerados no Google Ads
   * (ação de conversão "Inscrever-se" / Teste Grátis 7 dias).
   */
  private readonly DEFAULT_SIGNUP_CONVERSION_TAG = 'AW-18589881165/x51KCP6Ssr0dEM2mrKBF';

  /**
   * Dispara a conversão de cadastro concluído (Teste Grátis 7 dias) no Google Ads.
   * @param sendTo String no formato 'AW-CONVERSION_ID/CONVERSION_LABEL'
   * @param transactionId Identificador opcional (ex: slug ou id do tenant) para evitar duplicidade
   */
  trackSignUpConversion(
    sendTo: string = this.DEFAULT_SIGNUP_CONVERSION_TAG,
    transactionId?: string
  ): void {
    if (typeof window !== 'undefined' && typeof gtag === 'function') {
      const payload: Record<string, unknown> = {
        send_to: sendTo
      };
      if (transactionId) {
        payload['transaction_id'] = transactionId;
      }
      gtag('event', 'conversion', payload);
    } else {
      console.warn('Google Ads gtag.js não inicializado no DOM.');
    }
  }
}
