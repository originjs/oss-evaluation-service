export enum RadarRing {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3,
}

export const radarRingNames = {
  [RadarRing.Adopt]: '优选',
  [RadarRing.Trial]: '可选',
  [RadarRing.Assess]: '慎选',
  [RadarRing.Hold]: '禁选',
};

export const radarRingColors = {
  [RadarRing.Adopt]: '#5ba300',
  [RadarRing.Trial]: '#009eb0',
  [RadarRing.Assess]: '#c7ba00',
  [RadarRing.Hold]: '#e09b96',
};