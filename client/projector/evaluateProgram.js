export default async function evaluateProgram() {
  const you = this.program.number;
  let Claim = this.namespace.__getClaimTagFunction(you, false);
  let Wish = this.namespace.__getWishTagFunction(you, false);
  let When = this.namespace.__getWhenTagFunction(you, false);

  try {
    const code = `(function (global) {
     ${this.program.currentCode ||
       (await fetch(this.program.currentCodeUrl).then(res => res.text()))}
}).call(null, this.namespace)`;
    eval(code);
  } catch (err) {
    console.log(`program ${this.program.number} failed:`, err);
  }

  Claim = this.namespace.__getClaimTagFunction(you, true);
  Wish = this.namespace.__getWishTagFunction(you, true);
  When = this.namespace.__getWhenTagFunction(you, true);
}
