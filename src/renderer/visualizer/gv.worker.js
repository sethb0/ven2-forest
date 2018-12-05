import makeGv from './make-gv';

onmessage = (evt) => {
  const { type, group, charms, options } = evt.data;
  if (type) {
    let title;
    switch (type) {
    case 'Infernal':
      if (group === 'Heretical') {
        title = 'Heretical Charms';
      } else if (group === 'Martial Arts') {
        title = 'Infernal Martial Arts Charms';
      } else {
        title = `Charms of ${group === 'Ebon Dragon' ? 'the ' : ''}${group}`;
      }
      break;
    case 'Knacks':
      title = 'Lunar Knacks';
      break;
    case 'Jadeborn':
      title = `Jadeborn ${group} Pattern`;
      break;
    case 'Terrestrial Martial Arts':
    case 'Celestial Martial Arts':
    case 'Sidereal Martial Arts':
      title = group.includes(' Style') ? group : `${group} Charms`;
      break;
    default:
      title = `${type} ${group}${group.includes(' Charms') ? '' : ' Charms'}`;
    }
    try {
      postMessage({
        type, group, title, gv: makeGv(charms, { title, ...options || {} }),
      });
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
    }
  }
};
