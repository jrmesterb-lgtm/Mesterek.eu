import { CATEGORIES } from '@/lib/constants'

/** Accent-insensitive, case-insensitive normalisation so "Csöpög" matches "csopog". */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('hu-HU')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Symptom phrases keyed by approved category name. These describe the *problem*
 * a visitor types ("csopog a bojler"), which the existing CATEGORY_ALIASES map
 * does not cover — that one only resolves trade names during CSV import.
 */
const SYMPTOM_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  'Bojler szerelő': ['bojler', 'boyler', 'vizmelegito', 'villanybojler'],
  'Víz-, gáz-, fűtésszerelés': ['csotores', 'csopog', 'csepeg', 'szivarog', 'folyik a viz', 'csap', 'vizvezetek', 'radiator', 'futes', 'kazan', 'gazkeszulek', 'gazszerelo', 'vizszerelo', 'wc tartaly', 'szifon', 'vizora', 'nincs melegviz', 'nem melegit'],
  'Duguláselhárítás': ['dugulas', 'eldugult', 'lefolyo', 'csatorna', 'szennyviz', 'visszafolyik', 'nem folyik le'],
  'Villanyszerelés': ['aram', 'villany', 'konnektor', 'biztositek', 'kismegszakito', 'rovidzarlat', 'zarlat', 'vilagitas', 'lampa', 'elektromos', 'lekapcsol a biztositek', 'nincs aram', 'vezeteket'],
  'Klímatechnika / Klímaszerelés': ['klima', 'legkondi', 'legkondicionalo', 'hoszivattyu'],
  'Zárszerelő': ['zar', 'kulcs', 'bezarult', 'kizartam', 'zarcsere', 'nem nyilik az ajto', 'beragadt a zar'],
  'Lakatos': ['lakatos', 'vasszerkezet', 'korlat', 'hegesztes'],
  'Üveges': ['uveg', 'ablakuveg', 'betort', 'tukor', 'uvegezes'],
  'Szobafestő': ['festes', 'kifestes', 'meszeles', 'tapeta', 'glettelés', 'szobafesto', 'falfestes'],
  'Kőműves': ['komuves', 'falazas', 'vakolat', 'beton', 'aljzat', 'atepites'],
  'Asztalos': ['asztalos', 'butor', 'konyhabutor', 'polc', 'faajto', 'beepitett szekreny'],
  'Tetőszerkezet & Bádogozás': ['teto', 'cserep', 'beszivarog', 'eresz', 'esocsatorna', 'badogos', 'tetofedo', 'beazik', 'beazas'],
  'Kéményseprő': ['kemeny', 'kemenysepro', 'kemenytisztitas'],
  'Redőnyös / Árnyékolástechnika': ['redony', 'arnyekolas', 'szunyoghalo', 'zsaluzia', 'reluxa', 'napellenzo'],
  'Nyílászáró beépítő': ['nyilaszaro', 'ablakcsere', 'ajtocsere', 'ablakbeepites', 'uj ablak'],
  'Garázskapu szerelő': ['garazskapu', 'kapumotor'],
  'Kaputelefon szerelő': ['kaputelefon', 'csengo', 'videokaputelefon'],
  'Kamerarendszer & Riasztótelepítés': ['kamera', 'riaszto', 'megfigyelo', 'biztonsagi rendszer'],
  'Napelem szerelő': ['napelem', 'szolar', 'inverter'],
  'Háztartásigép-szerelő': ['mosogep', 'mosogatogep', 'huto', 'fagyaszto', 'szarito', 'tuzhely', 'suto', 'haztartasi gep'],
  'Számítógép szerviz': ['szamitogep', 'laptop', 'notebook', 'nyomtato', 'wifi', 'router'],
  'Kertész': ['kert', 'funyiras', 'gyep', 'soveny', 'kertrendezes', 'kertepites'],
  'Favágó (Alpintechnika)': ['favagas', 'fakivagas', 'gallyazas', 'faapolas', 'kivagni a fat'],
  'Költöztető': ['koltozes', 'koltoztetes', 'butorszallitas'],
  'Lomtalanító': ['lomtalanitas', 'lomeltakaritas', 'sitt', 'szemetszallitas'],
  'Takarítócég': ['takaritas', 'nagytakaritas', 'iroda tisztitas'],
  'Kárpittisztító': ['karpittisztitas', 'szonyegtisztitas', 'kanape tisztitas'],
  'Kárpitos': ['karpitos', 'karpitozas', 'butorkarpit'],
  'Darázsirtó (Kártevőirtó)': ['darazs', 'rovarirtas', 'kartevo', 'csotany', 'agyi poloska', 'eger', 'rago', 'meh'],
  'Hidegburkolás / Melegburkolás': ['csempe', 'jarolap', 'burkolas', 'parketta', 'laminalt', 'padlo', 'padlo lerakas'],
  'Gipszkartonszerelő': ['gipszkarton', 'alfodem', 'valaszfal'],
  'Hő- és vízszigetelés': ['szigetelés', 'hoszigetelés', 'vizszigetelés', 'penesz', 'homlokzat', 'szigetel'],
  'Térkövező': ['terko', 'jarda', 'kocsibehajto', 'terkovezes'],
  'Kerítésépítő': ['kerites', 'keritesepites'],
  'Medenceépítő': ['medence', 'uszoda', 'jakuzzi'],
  'Kútfúró': ['kutfuras', 'furt kut', 'kutat'],
  'Öntözőrendszer telepítő': ['ontozorendszer', 'ontozes', 'automata ontozo'],
  'Cserépkályha építő': ['cserepkalyha', 'kandallo', 'kalyha'],
  'Gépész / Gépi földmunkás': ['foldmunka', 'bontas', 'markolo', 'gepi foldmunka'],
  'Autószerelő': ['autoszerelo', 'autoszerviz', 'motorhiba', 'fekbetet', 'olajcsere', 'nem indul az auto'],
  'Autóklíma-szerelő': ['autoklima', 'auto klima'],
  'Gumiszerviz': ['defekt', 'gumicsere', 'abroncs', 'gumiszerviz'],
  'Állatorvos': ['allatorvos', 'oltas', 'beteg a kutya', 'beteg a macska'],
  'Kutyakozmetikus': ['kutyakozmetika', 'kutyanyiras'],
}

const APPROVED_CATEGORY_NAMES = new Set<string>(CATEGORIES.map((category) => category.name))

/** Longer phrases win over short ones so "autoklima" beats a bare "klima". */
const MATCHERS = Object.entries(SYMPTOM_KEYWORDS)
  .filter(([category]) => APPROVED_CATEGORY_NAMES.has(category))
  .flatMap(([category, phrases]) => phrases.map((phrase) => ({ category, phrase: normalize(phrase), weight: normalize(phrase).length })))
  .sort((a, b) => b.weight - a.weight)

export type SmartSearchMatch = {
  /** Approved category name, or null when nothing recognisable was found. */
  category: string | null
  /** The phrase that triggered the match, for showing the user why. */
  matchedPhrase: string | null
}

/**
 * Maps a free-text problem description onto one approved category.
 * Scores every category by the total length of its matched phrases so a
 * description hitting several related words wins over an incidental mention.
 */
export function matchCategoryFromText(text: string): SmartSearchMatch {
  const haystack = normalize(text)
  if (haystack.length < 3) return { category: null, matchedPhrase: null }

  const scores = new Map<string, { score: number; phrase: string }>()
  for (const matcher of MATCHERS) {
    if (!haystack.includes(matcher.phrase)) continue
    const current = scores.get(matcher.category)
    if (current) current.score += matcher.weight
    else scores.set(matcher.category, { score: matcher.weight, phrase: matcher.phrase })
  }

  let best: { category: string; score: number; phrase: string } | null = null
  for (const [category, value] of scores) {
    if (!best || value.score > best.score) best = { category, score: value.score, phrase: value.phrase }
  }

  return best ? { category: best.category, matchedPhrase: best.phrase } : { category: null, matchedPhrase: null }
}
