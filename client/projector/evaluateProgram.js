export default async function evaluateProgram() {
  const you = this.program.number;
  let Claim = this.namespace.__getClaimTagFunction(you, false);
  let Wish = this.namespace.__getWishTagFunction(you, false);
  let When = this.namespace.__getWhenTagFunction(you, false);

  console.log('switch static');

  try {

    const code = `(function (global) {
     ${await fetch(this.program.currentCodeUrl).then(res => res.text())}
}).call(null, this.namespace)`

    console.log('run', code)

    eval(code);
  } catch (err) {
    console.err(`program ${this.program.number} failed:`, err);
  }

  console.log('switch dynamic')

  Claim = this.namespace.__getClaimTagFunction(you, true);
  Wish = this.namespace.__getWishTagFunction(you, true);
  When = this.namespace.__getWhenTagFunction(you, true);
}
