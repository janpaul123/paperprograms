export default async function evaluateProgram() {
  const you = this.program.number;

  /* eslint-disable no-unused-vars*/
  let Claim = this.namespace.__getClaimTagFunction({ source: you, isDynamic: false });
  let Wish = this.namespace.__getWishTagFunction({ source: you, isDynamic: false });
  let When = this.namespace.__getWhenTagFunction({
    source: you,
    isDynamic: false,
    groupMatches: false,
  });
  let WithAll = this.namespace.__getWhenTagFunction({
    source: you,
    isDynamic: false,
    groupMatches: true,
  });
  /* eslint-enable no-unused-vars*/

  try {
    const code = `(function (global) {
     ${this.program.currentCode ||
       (await fetch(this.program.currentCodeUrl).then(res => res.text()))}
}).call(null, this.namespace)`;
    eval(code);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`program ${this.program.number} failed:`, err);
  }

  Claim = this.namespace.__getClaimTagFunction({ source: you, isDynamic: true });
  Wish = this.namespace.__getWishTagFunction({ source: you, isDynamic: true });
  When = this.namespace.__getWhenTagFunction({
    source: you,
    isDynamic: true,
    groupMatches: true,
  });
  WithAll = this.namespace.__getWhenTagFunction({
    source: you,
    isDynamic: true,
    groupMatches: true,
  });
}
