const element = (overrides = {}) => ({ id: 'scribble_test', type: 'rectangle', x: 0, y: 0, width: 100, height: 100,
  strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'none', strokeWidth: 2, strokeStyle: 'solid',
  roughness: 1, opacity: 100, fontFamily: 'sans', fontSize: 'M', textAlign: 'left', seed: 1, ...overrides });
module.exports = { element };
