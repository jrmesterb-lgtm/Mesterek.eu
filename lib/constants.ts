import {
  Armchair,
  Blinds,
  Blocks,
  BrickWall,
  BrushCleaning,
  Bug,
  CarFront,
  CircuitBoard,
  Construction,
  Drill,
  Droplets,
  Fence,
  Flame,
  FlameKindling,
  GlassWater,
  Grid3X3,
  Hammer,
  HardHat,
  House,
  KeyRound,
  LampCeiling,
  Leaf,
  PaintRoller,
  PanelsTopLeft,
  Pickaxe,
  PlugZap,
  Refrigerator,
  Ruler,
  ShieldCheck,
  ShowerHead,
  Snowflake,
  SolarPanel,
  Sprout,
  Tractor,
  TreePine,
  Truck,
  Tv,
  Warehouse,
  WashingMachine,
  Waves,
  Wrench,
} from 'lucide-react'

const CATEGORY_LIST = [
  { key: 'allatorvos', name: 'Állatorvos', icon: ShieldCheck, description: 'Kisállatok vizsgálata, kezelése és egészségügyi ellátása' },
  { key: 'asztalos', name: 'Asztalos', icon: Hammer, description: 'Egyedi bútorok és fa szerkezetek készítése, javítása' },
  { key: 'autoklima-szerelo', name: 'Autóklíma-szerelő', icon: Snowflake, description: 'Gépjármű-klímák töltése, javítása és karbantartása' },
  { key: 'autoszerelo', name: 'Autószerelő', icon: CarFront, description: 'Gépjárművek javítása és karbantartása' },
  { key: 'gumiszerviz', name: 'Gumiszerviz', icon: CarFront, description: 'Gumiabroncs-szerelés, javítás és kerékcsere' },
  { key: 'tetoszerkezet-badogozas', name: 'Tetőszerkezet & Bádogozás', icon: House, description: 'Tetőszerkezet, tetőfedés, bádogozás és ereszcsatorna' },
  { key: 'bojler-szerelo', name: 'Bojler szerelő', icon: Droplets, description: 'Villany- és gázbojlerek javítása' },
  { key: 'cserepkalyha-epito', name: 'Cserépkályha építő', icon: FlameKindling, description: 'Cserépkályhák építése és felújítása' },
  { key: 'darazsirto-kartevo-irto', name: 'Darázsirtó (Kártevőirtó)', icon: Bug, description: 'Darazsak és más kártevők szakszerű irtása' },
  { key: 'dugulaselharitas', name: 'Duguláselhárítás', icon: Drill, description: 'Lefolyók és csatornák sürgős tisztítása' },
  { key: 'favago-alpintechnika', name: 'Favágó (Alpintechnika)', icon: TreePine, description: 'Veszélyes fák alpintechnikai kivágása' },
  { key: 'garazskapu-szerelo', name: 'Garázskapu szerelő', icon: Fence, description: 'Garázskapuk és automatikák szerelése' },
  { key: 'gepesz-gepi-foldmunkas', name: 'Gépész / Gépi földmunkás', icon: Tractor, description: 'Gépi földmunka és tereprendezés' },
  { key: 'gipszkartonszerelo', name: 'Gipszkartonszerelő', icon: PanelsTopLeft, description: 'Falak és álmennyezetek kivitelezése' },
  { key: 'haztartasigep-szerelo', name: 'Háztartásigép-szerelő', icon: WashingMachine, description: 'Háztartási gépek javítása és karbantartása' },
  { key: 'hideg-melegburkolas', name: 'Hidegburkolás / Melegburkolás', icon: Grid3X3, description: 'Csempék, járólapok, parketták és padlók kivitelezése' },
  { key: 'ho-vizszigeteles', name: 'Hő- és vízszigetelés', icon: ShieldCheck, description: 'Épületek szakszerű hő- és vízszigetelése' },
  { key: 'kaputelefon-szerelo', name: 'Kaputelefon szerelő', icon: CircuitBoard, description: 'Kaputelefonok és beléptetők javítása' },
  { key: 'karpitos', name: 'Kárpitos', icon: Armchair, description: 'Bútorok javítása és újrakárpitozása' },
  { key: 'karpittisztito', name: 'Kárpittisztító', icon: Armchair, description: 'Kárpitok és szőnyegek mélytisztítása' },
  { key: 'kemenysepro', name: 'Kéményseprő', icon: Warehouse, description: 'Kémények ellenőrzése és tisztítása' },
  { key: 'keritesepito', name: 'Kerítésépítő', icon: Fence, description: 'Kerítések építése és javítása' },
  { key: 'kertepito', name: 'Kertész', icon: Sprout, description: 'Kertek tervezése, kialakítása és gondozása' },
  { key: 'klimatechnika-klimaszereles', name: 'Klímatechnika / Klímaszerelés', icon: Snowflake, description: 'Klímák telepítése, tisztítása és javítása' },
  { key: 'koltozteto', name: 'Költöztető', icon: Truck, description: 'Lakások és irodák költöztetése' },
  { key: 'komuves', name: 'Kőműves', icon: BrickWall, description: 'Falazás, vakolás és javítási munkák' },
  { key: 'kutfuro', name: 'Kútfúró', icon: Pickaxe, description: 'Kutak fúrása és kiépítése' },
  { key: 'kutyakozmetikus', name: 'Kutyakozmetikus', icon: BrushCleaning, description: 'Kutyák szakszerű kozmetikája és ápolása' },
  { key: 'lakatos', name: 'Lakatos', icon: Wrench, description: 'Fémszerkezetek készítése, szerelése és javítása' },
  { key: 'lomtalanito', name: 'Lomtalanító', icon: Truck, description: 'Lomok elszállítása és területek kiürítése' },
  { key: 'medenceepito', name: 'Medenceépítő', icon: Waves, description: 'Medencék építése és gépészete' },
  { key: 'napelem-szerelo', name: 'Napelem szerelő', icon: SolarPanel, description: 'Napelemes rendszerek telepítése' },
  { key: 'nyilaszaro-beepito', name: 'Nyílászáró beépítő', icon: PanelsTopLeft, description: 'Ablakok és ajtók beépítése, cseréje és beállítása' },
  { key: 'ontozorendszer-telepito', name: 'Öntözőrendszer telepítő', icon: Sprout, description: 'Automata öntözőrendszerek telepítése' },
  { key: 'redony-arnyekolastechnika', name: 'Redőnyös / Árnyékolástechnika', icon: Blinds, description: 'Redőnyök, napellenzők és árnyékolók szerelése' },
  { key: 'kamerarendszer-riasztotelepites', name: 'Kamerarendszer & Riasztótelepítés', icon: Tv, description: 'Kamerák, riasztók és biztonsági rendszerek telepítése' },
  { key: 'szamitogep-szerviz', name: 'Számítógép szerviz', icon: CircuitBoard, description: 'Számítógépek javítása és karbantartása' },
  { key: 'szobafesto', name: 'Szobafestő', icon: PaintRoller, description: 'Beltéri és kültéri festési munkák' },
  { key: 'takaritoceg', name: 'Takarítócég', icon: BrushCleaning, description: 'Otthonok és üzleti terek takarítása' },
  { key: 'terkovezo', name: 'Térkövező', icon: Blocks, description: 'Udvarok, járdák és kocsibeállók térkövezése' },
  { key: 'uveges', name: 'Üveges', icon: GlassWater, description: 'Üvegezés, tükör és ablakjavítás' },
  { key: 'villanyszereles', name: 'Villanyszerelés', icon: PlugZap, description: 'Elektromos hálózatok kiépítése, javítása és felülvizsgálata' },
  { key: 'viz-gaz-futesszereles', name: 'Víz-, gáz-, fűtésszerelés', icon: Wrench, description: 'Víz-, gáz- és fűtési rendszerek szerelése és javítása' },
  { key: 'zarszerelo', name: 'Zárszerelő', icon: KeyRound, description: 'Zárnyitás, zárcsere és biztonsági zárak' },
] as const

const HUNGARIAN_ALPHABET = [
  'a', 'á', 'b', 'c', 'cs', 'd', 'dz', 'dzs', 'e', 'é', 'f', 'g', 'gy', 'h', 'i', 'í',
  'j', 'k', 'l', 'ly', 'm', 'n', 'ny', 'o', 'ó', 'ö', 'ő', 'p', 'q', 'r', 's', 'sz', 't',
  'ty', 'u', 'ú', 'ü', 'ű', 'v', 'w', 'x', 'y', 'z', 'zs',
] as const

const HUNGARIAN_LETTER_RANK = new Map<string, number>(HUNGARIAN_ALPHABET.map((letter, index) => [letter, index]))
const HUNGARIAN_MULTI_LETTERS = ['dzs', 'cs', 'dz', 'gy', 'ly', 'ny', 'sz', 'ty', 'zs'] as const
const HUNGARIAN_FALLBACK_COLLATOR = new Intl.Collator('hu-HU', { sensitivity: 'variant' })

function tokenizeHungarian(value: string) {
  const normalized = value.trim().toLocaleLowerCase('hu-HU')
  const letters: string[] = []
  for (let index = 0; index < normalized.length;) {
    const multiLetter = HUNGARIAN_MULTI_LETTERS.find((letter) => normalized.startsWith(letter, index))
    const letter = multiLetter ?? normalized[index]
    if (HUNGARIAN_LETTER_RANK.has(letter)) letters.push(letter)
    index += letter.length
  }
  return letters
}

export function compareHungarianAlphabet(a: string, b: string) {
  const left = tokenizeHungarian(a)
  const right = tokenizeHungarian(b)
  const sharedLength = Math.min(left.length, right.length)

  for (let index = 0; index < sharedLength; index += 1) {
    const difference = HUNGARIAN_LETTER_RANK.get(left[index])! - HUNGARIAN_LETTER_RANK.get(right[index])!
    if (difference !== 0) return difference
  }

  return left.length - right.length || HUNGARIAN_FALLBACK_COLLATOR.compare(a, b)
}

export const CATEGORIES = [...CATEGORY_LIST].sort((a, b) => compareHungarianAlphabet(a.name, b.name))

function normalizeCategory(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('hu-HU')
}

const CATEGORY_ALIASES: Readonly<Record<string, string>> = {
  'air conditioning contractor': 'Klímatechnika / Klímaszerelés',
  'kertépítő': 'Kertész',
  'klímaszerelő': 'Klímatechnika / Klímaszerelés',
  'duguláselhárító': 'Duguláselhárítás',
  'villanyszerelő': 'Villanyszerelés',
  'vízszerelő': 'Víz-, gáz-, fűtésszerelés',
  'gázkészülék-szerelő': 'Víz-, gáz-, fűtésszerelés',
  'fűtésszerelő': 'Víz-, gáz-, fűtésszerelés',
  'hidegburkoló': 'Hidegburkolás / Melegburkolás',
  'melegburkoló': 'Hidegburkolás / Melegburkolás',
  'parkettázó': 'Hidegburkolás / Melegburkolás',
  'redőnyszerelő': 'Redőnyös / Árnyékolástechnika',
  'riasztószerelő / kamerarendszer telepítő': 'Kamerarendszer & Riasztótelepítés',
  'ács': 'Tetőszerkezet & Bádogozás',
  'bádogos': 'Tetőszerkezet & Bádogozás',
  'tetőfedő': 'Tetőszerkezet & Bádogozás',
  'hőszigetelő': 'Hő- és vízszigetelés',
  'szigetelő / vízszigetelő': 'Hő- és vízszigetelés',
  'drain cleaning service': 'Duguláselhárítás',
  'electrician': 'Villanyszerelés',
  'plumber': 'Víz-, gáz-, fűtésszerelés',
  'flooring contractor': 'Hidegburkolás / Melegburkolás',
  'tile contractor': 'Hidegburkolás / Melegburkolás',
  'window shade installer': 'Redőnyös / Árnyékolástechnika',
  'ablak- és ajtóbeépítő': 'Nyílászáró beépítő',
  'ablak és ajtó beépítő': 'Nyílászáró beépítő',
  'ablakbeépítő': 'Nyílászáró beépítő',
  'ajtóbeépítő': 'Nyílászáró beépítő',
  'window installation service': 'Nyílászáró beépítő',
  'security system installer': 'Kamerarendszer & Riasztótelepítés',
  'roofing contractor': 'Tetőszerkezet & Bádogozás',
  'insulation contractor': 'Hő- és vízszigetelés',
  'waterproofing contractor': 'Hő- és vízszigetelés',
  'appliance repair service': 'Háztartásigép-szerelő',
  'automotive air conditioning service': 'Autóklíma-szerelő',
  'autóklíma': 'Autóklíma-szerelő',
  'autóklíma szerelő': 'Autóklíma-szerelő',
  'auto repair shop': 'Autószerelő',
  'autószerviz': 'Autószerelő',
  'car repair and maintenance service': 'Autószerelő',
  'tire shop': 'Gumiszerviz',
  'gumiabroncs szerviz': 'Gumiszerviz',
  'gumis': 'Gumiszerviz',
  'bojlerszerelő': 'Bojler szerelő',
  'cserépkályha-építő': 'Cserépkályha építő',
  'darázsirtó': 'Darázsirtó (Kártevőirtó)',
  'favágó': 'Favágó (Alpintechnika)',
  'garázskapu-szerelő': 'Garázskapu szerelő',
  'kaputelefon-szerelő': 'Kaputelefon szerelő',
  'napelem-szerelő': 'Napelem szerelő',
  'öntözőrendszer-telepítő': 'Öntözőrendszer telepítő',
  'számítógép-szerviz': 'Számítógép szerviz',
}

const CATEGORY_BY_INPUT = new Map<string, string>([
  ...CATEGORIES.flatMap((category) => [
    [normalizeCategory(category.name), category.name],
    [normalizeCategory(category.key), category.name],
  ] as const),
  ...Object.entries(CATEGORY_ALIASES).map(([alias, name]) => [normalizeCategory(alias), name] as const),
])

const UNRELATED_BUSINESS_TERMS = [
  'hús', 'hus', 'húskombinát', 'huskombinat', 'élelmiszer', 'elelmiszer', 'étterem', 'etterem',
  'vendéglő', 'vendeglo', 'cukrász', 'cukrasz', 'pékség', 'pekseg', 'pizzéria', 'pizzeria',
  'gyros', 'burger', 'büfé', 'bufe', 'hotel', 'panzió', 'panzio', 'szálloda', 'szalloda',
  'áruház', 'aruhaz', 'webáruház', 'webaruhaz', 'márkabolt', 'markabolt', 'szaküzlet', 'szakuzlet',
  'szerelvénybolt', 'szerelvenybolt', 'alkatrészbolt', 'alkatreszbolt', 'élelmiszerbolt', 'elelmiszerbolt',
  'gyár', 'gyar', 'üzem', 'uzem', 'kombinát', 'kombinat',
] as const

const AUTOMOTIVE_TERMS = ['autó', 'auto', 'gépjármű', 'gepjarmu', 'jármű', 'jarmu', 'gumi', 'abroncs', 'karosszéria', 'karosszeria', 'hengerfej', 'futómű', 'futomu', 'autóvillamosság', 'autovillamossag'] as const
const POSITIVE_EVIDENCE: Readonly<Record<string, readonly string[]>> = {
  'Bojler szerelő': ['bojler', 'vízmelegítő', 'vizmelegito'],
  'Víz-, gáz-, fűtésszerelés': ['vízszerelő', 'vizszerelo', 'vízvezeték', 'vizvezetek', 'gázszerelő', 'gazszerelo', 'gázszerviz', 'gazszerviz', 'fűtésszerelő', 'futesszerelo'],
  'Kéményseprő': ['kéményseprő', 'kemenysepro', 'kéménytisztítás', 'kemenytisztitas'],
  'Klímatechnika / Klímaszerelés': ['klímaszerelő', 'klimaszerelo', 'klíma telepítés', 'klima telepites', 'hőszivattyú', 'hoszivattyu'],
  'Autóklíma-szerelő': ['autóklíma', 'autoklima', 'gépjárműklíma', 'gepjarmuklima'],
  'Gumiszerviz': ['gumiszerviz', 'gumiszervíz', 'gumiabroncs', 'gumis'],
  'Autószerelő': ['autószerelő', 'autoszerelo', 'autószerviz', 'autoszerviz', 'autószervíz', 'autoszerviz', 'gépjármű szerviz', 'gepjarmu szerviz'],
}

const GUARDED_TECHNICAL_CATEGORIES = new Set([
  'Kéményseprő', 'Klímatechnika / Klímaszerelés', 'Víz-, gáz-, fűtésszerelés', 'Bojler szerelő',
  'Háztartásigép-szerelő',
])

function includesTerm(text: string, terms: readonly string[]) {
  const normalized = normalizeCategory(text)
  return terms.some((term) => normalized.includes(normalizeCategory(term)))
}

export function resolveImportCategory(raw: string) {
  const sourceCategory = raw.split(',')[0]?.trim() ?? raw
  return CATEGORY_BY_INPUT.get(normalizeCategory(sourceCategory)) ?? null
}

export function isClearlyUnrelatedBusiness(businessText: string) {
  return includesTerm(businessText, UNRELATED_BUSINESS_TERMS)
}

export function hasRequiredCategoryEvidence(category: string, businessText: string) {
  const terms = POSITIVE_EVIDENCE[category]
  return !terms || includesTerm(businessText, terms)
}

export function hasCategoryBusinessConflict(category: string, businessName: string) {
  if (isClearlyUnrelatedBusiness(businessName)) return true
  if (GUARDED_TECHNICAL_CATEGORIES.has(category) && includesTerm(businessName, AUTOMOTIVE_TERMS)) return true
  return !hasRequiredCategoryEvidence(category, businessName)
}

export const MUNICIPALITIES = [
  ['Almáskamarás','5747'],['Battonya','5830'],['Békés','5630'],['Békéscsaba','5600'],['Békéssámson','5946'],['Békésszentandrás','5561'],['Bélmegyer','5643'],['Biharugra','5538'],['Bucsa','5527'],['Csanádapáca','5662'],['Csabacsűd','5551'],['Csabaszabadi','5609'],['Csárdaszállás','5621'],['Csorvás','5920'],['Dévaványa','5510'],['Doboz','5624'],['Dombegyház','5836'],['Dombiratos','5745'],['Ecsegfalva','5515'],['Elek','5742'],['Füzesgyarmat','5525'],['Gádoros','5932'],['Gerendás','5925'],['Geszt','5734'],['Gyomaendrőd','5500'],['Gyula','5700'],['Hunya','5555'],['Kamut','5673'],['Kardos','5552'],['Kardoskút','5945'],['Kaszaper','5948'],['Kertészsziget','5526'],['Kétegyháza','5741'],['Kétsoprony','5674'],['Kevermes','5744'],['Kisdombegyház','5837'],['Kondoros','5553'],['Körösladány','5516'],['Körösnagyharsány','5539'],['Köröstarcsa','5622'],['Körösújfalu','5536'],['Kötegyán','5725'],['Kunágota','5746'],['Lőkösháza','5743'],['Magyarbánhegyes','5667'],['Magyardombegyház','5838'],['Medgyesbodzás','5663'],['Medgyesegyháza','5666'],['Méhkerék','5726'],['Mezőberény','5650'],['Mezőgyán','5732'],['Mezőhegyes','5820'],['Mezőkovácsháza','5800'],['Murony','5672'],['Nagybánhegyes','5668'],['Nagykamarás','5751'],['Nagyszénás','5931'],['Okány','5534'],['Orosháza','5900'],['Örménykút','5556'],['Pusztaföldvár','5919'],['Pusztaottlaka','5665'],['Sarkad','5720'],['Sarkadkeresztúr','5731'],['Szabadkígyós','5712'],['Szarvas','5540'],['Szeghalom','5520'],['Tarhos','5641'],['Telekgerendás','5675'],['Tótkomlós','5940'],['Újkígyós','5661'],['Újszalonta','5727'],['Végegyháza','5811'],['Vésztő','5530'],['Zsadány','5537'],
].map(([name, zipCode]) => ({ name, zipCode }))

export const CITIES = MUNICIPALITIES.map(({ name }) => name)
export const NET_PRICE = 4990
