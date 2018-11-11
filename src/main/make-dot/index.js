import { parse } from './parser';
import { render } from './renderer';
import { MemoryLibrary } from './memory-library';

const COLOR_SETS = {
  Abyssal: { charmColor: '/svg/darkgray', clusterColor: '/svg/gainsboro' },
  'Dragon-Blooded': { charmColor: '/svg/indianred', clusterColor: '/svg/rosybrown' },
  Infernal: { charmColor: '/svg/lightgreen', clusterColor: '/svg/darkseagreen' },
  Jadeborn: { charmColor: '/svg/peru', clusterColor: '/svg/burlywood' },
  Lunar: { charmColor: '/svg/lightskyblue', clusterColor: '/svg/dodgerblue' },
  Raksha: { charmColor: '/svg/forestgreen', clusterColor: '/svg/yellowgreen' },
  Sidereal: { charmColor: '/svg/plum', clusterColor: '/svg/mediumpurple' },
  Solar: { charmColor: '/svg/gold', clusterColor: '/svg/goldenrod' },
};

export function makeDefaults (title, exalt) {
  return {
    title,
    ...COLOR_SETS[exalt],
    pageColor: '#ffffffc0',
    fontFamily: 'Pterra',
    dummyShape: 'ellipse',
    realShape: 'octagon',
    groupShape: 'circle',
  };
}

export function convert (data, params) {
  return render(parse(data, new MemoryLibrary()), params);
}
