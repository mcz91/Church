import { defineConfig } from 'vitest/config';

// Dwa testy integracyjne uruchamiają `astro build` w katalogu
// repozytorium i dzielą jego cache (`.astro`) oraz katalog `public/`.
// Równoległe pliki testowe przeplatały te buildy, co kończyło się
// brakującym chunkiem i pustymi stronami. Pliki idą więc po kolei —
// testy wewnątrz pliku nadal równolegle.
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
