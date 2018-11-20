import makeGv from './make-gv';

const COLOR_SETS = {
  Abyssal: { charmColor: 'darkgray', clusterColor: 'gainsboro' },
  Alchemical: { charmColor: 'darkorange', clusterColor: 'navajowhite' },
  'Dragon-Blooded': { charmColor: 'indianred', clusterColor: 'rosybrown' },
  Infernal: { charmColor: 'lightgreen', clusterColor: 'darkseagreen' },
  Jadeborn: { charmColor: 'peru', clusterColor: 'burlywood' },
  Lunar: { charmColor: 'lightskyblue', clusterColor: 'dodgerblue' },
  Raksha: { charmColor: 'forestgreen', clusterColor: 'yellowgreen' },
  Sidereal: { charmColor: 'plum', clusterColor: 'mediumpurple' },
  Solar: { charmColor: 'gold', clusterColor: 'goldenrod' },
  'Terrestrial Martial Arts': { charmColor: 'indianred', clusterColor: 'rosybrown' },
  'Celestial Martial Arts': { charmColor: 'lightsteelblue', clusterColor: 'thistle' },
  'Sidereal Martial Arts': { charmColor: 'plum', clusterColor: 'mediumpurple' },
};

onmessage = (evt) => {
  const { type, group, charms } = evt.data;
  let title;
  switch (type) {
  case 'Infernal':
    if (group === 'General Charms') {
      title = `${type} ${group}`;
    } else if (group === 'Heretical') {
      title = `${type} Heretical Charms`;
    } else if (group === 'Martial Arts') {
      title = `${type} ${group} Charms`;
    } else {
      title = `Charms of ${group === 'Ebon Dragon' ? 'the ' : ''}${group}`;
    }
    break;
  case 'Jadeborn':
    title = `Jadeborn ${group} Pattern`;
    break;
  case 'Terrestrial Martial Arts':
  case 'Celestial Martial Arts':
  case 'Sidereal Martial Arts':
    title = group === 'Enlightening' ? 'Enlightening Charms' : group;
    break;
  default:
    title = `${type} ${group}${group.endsWith(' Charms') ? '' : ' Charms'}`;
  }
  try {
    postMessage({
      type, group, title, svg: makeGv(charms, { title, ...COLOR_SETS[type] }),
    });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }
};
