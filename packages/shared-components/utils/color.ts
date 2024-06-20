export function getLevelColor(level?: string) {
  if (!level) {
    return '#61a6fa';
  }

  const levelColorMap: { [key: string]: string } = {
    A: '#21c45d',
    B: '#bbf7d0',
    C: '#fef08b',
    D: '#fcd44f',
    E: '#fca6a6',
  };

  return levelColorMap[level] || '#61a6fa';
}

export function getTagType(idx: number) {
  const remainder = idx % 4;
  switch (remainder) {
    case 0:
      return 'primary';
    case 1:
      return 'success';
    case 2:
      return 'warning';
    case 3:
      return 'danger';
  }
}

export function scorecardProgressColor(score: number) {
  if (score < 2) {
    return '#f43146';
  } else if (score < 5) {
    return '#ec6f1a';
  } else if (score < 8) {
    return '#eeba18';
  } else {
    return '#2da769';
  }
}
