export enum RadarRing {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3,
}

export const radarRingNames = {
  [RadarRing.Adopt]: '采纳',
  [RadarRing.Trial]: '试验',
  [RadarRing.Assess]: '评估',
  [RadarRing.Hold]: '暂缓',
};

export const radarRingColors = {
  [RadarRing.Adopt]: '#5ba300',
  [RadarRing.Trial]: '#009eb0',
  [RadarRing.Assess]: '#c7ba00',
  [RadarRing.Hold]: '#e09b96',
};