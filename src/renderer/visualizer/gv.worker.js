import makeGv from './make-gv';

onmessage = (evt) => {
  const { type, group, charms, options } = evt.data;
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
      type, group, title, gv: makeGv(charms, { title, ...options || {} }),
    });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }
};
