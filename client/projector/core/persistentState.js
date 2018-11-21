/* globals When, Claim*/

module.exports = () => {
  const store = {};

  When`{someone} has persistent state {key} with initial value {initialValue}`(
    ({ someone, key, initialValue }) => {
      if (!store[someone]) {
        store[someone] = {};
      }

      if (!store[someone][key]) {
        store[someone][key] = initialValue;
      }

      const value = store[someone][key];

      Claim`${someone} has persistent state ${key} with value ${value}`;
    }
  );

  When`{_} wishes {someone} sets persistent state {key} to {value}`(({ someone, key, value }) => {
    if (!store[someone]) {
      store[someone] = {};
    }

    store[someone][key] = value;
  });
};
