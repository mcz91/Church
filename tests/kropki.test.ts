import { describe, expect, it } from 'vitest';
import { kropki } from '../src/lib/kropki';

describe('kropki oceny z ułamkowym wypełnieniem', () => {
  it('dzieli ocenę na kropki pełne, częściową i puste', () => {
    expect(kropki(4.6)).toEqual({ pelne: 4, czesc: 60, puste: 0 });
    expect(kropki(3.5)).toEqual({ pelne: 3, czesc: 50, puste: 1 });
  });

  it('ocena całkowita nie ma kropki częściowej', () => {
    expect(kropki(5)).toEqual({ pelne: 5, czesc: 0, puste: 0 });
    expect(kropki(4)).toEqual({ pelne: 4, czesc: 0, puste: 1 });
    expect(kropki(1)).toEqual({ pelne: 1, czesc: 0, puste: 4 });
  });

  it('suma kropek zawsze wynosi pięć', () => {
    for (const ocena of [1, 2.3, 3.7, 4.1, 4.9, 5]) {
      const { pelne, czesc, puste } = kropki(ocena);
      expect(pelne + (czesc > 0 ? 1 : 0) + puste).toBe(5);
    }
  });
});
