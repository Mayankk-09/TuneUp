export interface SongLyricsData {
  title: string;
  artist: string;
  defaultSheet: string;
}

export const SONG_LYRICS_DB: Record<string, SongLyricsData> = {
  'Happy Together': {
    title: 'Happy Together',
    artist: 'The Turtles',
    defaultSheet: `[Em] Imagine me loving nobody but [D] you\nFor all my [C] life\nWhen you're with me, baby, the skies will be [B] blue\nFor all my [Em] life`
  },
  'Get Lucky': {
    title: 'Get Lucky',
    artist: 'Daft Punk',
    defaultSheet: `[Bm] Like the legend of the [D] phoenix\nAll ends with [F#m] beginnings\nWhat keeps the planet [E] spinning\nThe force from the [Bm] beginning`
  },
  'Zombie': {
    title: 'Zombie',
    artist: 'The Cranberries',
    defaultSheet: `[Em] Another head hangs [C] lowly\nChild is slowly [G] taken\nAnd the violence caused [D] silence\nWho are we [Em] mistaken?`
  },
  'Stand By Me': {
    title: 'Stand By Me',
    artist: 'Ben E. King',
    defaultSheet: `[G] When the night has come\n[Em] And the land is dark\nAnd the [C] moon is the [D] only light we'll [G] see`
  },
  'La Bamba': {
    title: 'La Bamba',
    artist: 'Richie Valens',
    defaultSheet: `[C] Para bailar la [F] bamba\n[G] Para bailar la [C] bamba se [F] necesita\nUna [G] poca de gracia y [C] otra cosita [F] [G]`
  },
  'Imagine': {
    title: 'Imagine',
    artist: 'John Lennon',
    defaultSheet: `[C] Imagine there's [F] no heaven\n[C] It's easy if you [F] try\n[C] No hell be[F]low us\n[C] Above us only [F] sky`
  },
  'Riptide': {
    title: 'Riptide',
    artist: 'Vance Joy',
    defaultSheet: `[Am] I was scared of [G] dentists and the [C] dark\n[Am] I was scared of [G] pretty girls and [C] starting conversations`
  }
};
