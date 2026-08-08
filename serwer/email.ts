// Dostawca e-mail jest nierozstrzygnięty (BRAK w dokumencie 04) —
// serwis zna wyłącznie ten interfejs; implementacja produkcyjna wejdzie
// osobno po decyzji operatora.
export interface DostawcaEmail {
  wyslij(adres: string, temat: string, tresc: string): Promise<void>;
}

export class DostawcaKonsolowy implements DostawcaEmail {
  wyslij(adres: string, temat: string, tresc: string): Promise<void> {
    console.log(`[e-mail deweloperski] do: ${adres} | ${temat}\n${tresc}`);
    return Promise.resolve();
  }
}
